package com.wave.audit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * AI Async Risk Audit Consumer — Wave Terminal Risk-Audit-Worker
 *
 * Consumes swap events from RabbitMQ, calls Gemini AI API for risk analysis,
 * sends the remark to Swap-Engine via HTTP internal PATCH endpoint, and publishes audit completion.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditConsumer {

    private final NotificationPublisher notificationPublisher;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.api-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String geminiApiUrl;

    @Value("${app.swap-engine.base-url:http://localhost:8080}")
    private String swapEngineBaseUrl;

    @Value("${app.swap-engine.internal-api-key:wave-internal-secret-2026}")
    private String internalApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @RabbitListener(queues = "swap.audit.queue")
    public void onSwapEvent(Map<String, Object> payload) {
        Long transactionId = extractLong(payload, "transactionId");
        Long userId        = extractLong(payload, "userId");
        String asset       = (String) payload.getOrDefault("assetTraded", "UNKNOWN");
        String amount      = (String) payload.getOrDefault("amount", "0");

        log.info("AUDIT CONSUMER ▶ received swap event — txId={} userId={} asset={} amount={}",
                transactionId, userId, asset, amount);

        String remark;
        try {
            remark = callGemini(transactionId, userId, asset, amount);
        } catch (Exception ex) {
            log.error("AUDIT CONSUMER — Gemini call failed for txId={}: {}", transactionId, ex.getMessage());
            remark = "AI audit unavailable: " + ex.getMessage();
        }

        // Send remark to Swap-Engine via HTTP internal endpoint
        try {
            updateRemarkInSwapEngine(transactionId, remark);
            log.info("AUDIT CONSUMER ▶ remark updated via HTTP — txId={}", transactionId);
        } catch (Exception ex) {
            log.error("AUDIT CONSUMER — Failed to update remark in Swap-Engine for txId={}: {}", transactionId, ex.getMessage());
        }

        // Signal Notification Consumer to push the result via WebSocket
        notificationPublisher.publishAuditComplete(transactionId, userId, remark);
    }

    private void updateRemarkInSwapEngine(Long transactionId, String remark) throws Exception {
        String endpoint = swapEngineBaseUrl + "/api/v1/internal/transactions/" + transactionId + "/remark";
        String requestBody = objectMapper.writeValueAsString(Map.of("remark", remark));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("X-Internal-Api-Key", internalApiKey)
                .method("PATCH", HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Swap-Engine returned HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private String callGemini(Long txId, Long userId, String asset, String amount) throws Exception {
        String prompt = buildPrompt(txId, userId, asset, amount);

        String requestBody = objectMapper.writeValueAsString(Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(geminiApiUrl + "?key=" + geminiApiKey))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned HTTP " + response.statusCode() + ": " + response.body());
        }

        return extractGeminiText(response.body());
    }

    private String buildPrompt(Long txId, Long userId, String asset, String amount) {
        return String.format(
                "You are a cryptocurrency transaction risk auditor. " +
                "Analyse the following swap transaction and provide a concise 1-2 sentence risk assessment. " +
                "Mention the risk level (Low/Medium/High) and any notable observations. " +
                "Transaction details — ID: %d | User: %d | Asset pair: %s | Amount: %s USD equivalent. " +
                "Respond with only the risk assessment text, no preamble.",
                txId, userId, asset, amount
        );
    }

    private String extractGeminiText(String responseJson) throws Exception {
        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode text = root
                .path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text");

        if (text.isMissingNode() || text.isNull()) {
            throw new RuntimeException("Unexpected Gemini response structure — no text found.");
        }
        return text.asText().trim();
    }

    private Long extractLong(Map<String, Object> payload, String key) {
        Object val = payload.get(key);
        if (val instanceof Number) return ((Number) val).longValue();
        if (val instanceof String) return Long.parseLong((String) val);
        throw new IllegalArgumentException("Missing or invalid field '" + key + "' in swap event payload");
    }
}
