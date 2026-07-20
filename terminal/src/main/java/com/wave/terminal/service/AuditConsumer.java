package com.wave.terminal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wave.terminal.repository.TransactionRepository;
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
 * AI Async Risk Audit Consumer — Wave Terminal (PRD §3 Service 3)
 *
 * Isolation design
 * ────────────────
 * This consumer runs on a separate RabbitMQ listener thread, completely
 * decoupled from the HTTP request/response cycle. The Gemini API call
 * (1–3 s network latency) never blocks a wallet transaction endpoint.
 *
 * Processing pipeline per swap event
 * ───────────────────────────────────
 *  1. Deserialise the event payload from RabbitMQ.
 *  2. Build a concise audit prompt from the transaction context.
 *  3. POST to the Gemini generateContent API (1–3 s round-trip).
 *  4. Extract the response text from the Gemini JSON response.
 *  5. Soft-update {@code transactions.ai_audit_remark} via repository.
 *  6. Publish an {@code audit.done.queue} event via {@link NotificationPublisher}.
 *
 * Failure handling
 * ────────────────
 * Any exception is caught and logged. On failure the remark is set to a
 * descriptive error string so the row is never left null for a processed event.
 * RabbitMQ will NOT re-queue the message (no DLQ configured at this stage).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditConsumer {

    private final TransactionRepository transactionRepository;
    private final NotificationPublisher notificationPublisher;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    @Value("${app.gemini.api-url}")
    private String geminiApiUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // ── RabbitMQ listener ─────────────────────────────────────────────────────

    /**
     * Triggered whenever WalletService publishes to the {@code swap.events} exchange.
     * The {@code JacksonJsonMessageConverter} in RabbitMQConfig deserialises the
     * AMQP message body into a {@code Map<String, Object>} automatically.
     *
     * @param payload  deserialized swap event: transactionId, userId, type, assetTraded, amount
     */
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

        // Soft update — only writes ai_audit_remark, leaves all other columns untouched
        int updated = transactionRepository.updateAiRemark(transactionId, remark);
        log.info("AUDIT CONSUMER ▶ remark written — txId={} rows={}", transactionId, updated);

        // Signal Stage 11 (NotificationConsumer) to push the result via WebSocket
        notificationPublisher.publishAuditComplete(transactionId, userId, remark);
    }

    // ── Gemini API call ───────────────────────────────────────────────────────

    /**
     * Calls the Gemini generateContent API with a compact audit prompt.
     * Returns the first text candidate from the response.
     *
     * Gemini request body shape:
     * <pre>
     * { "contents": [{ "parts": [{ "text": "<prompt>" }] }] }
     * </pre>
     */
    private String callGemini(Long txId, Long userId, String asset, String amount)
            throws Exception {

        String prompt = buildPrompt(txId, userId, asset, amount);

        // Build JSON request body
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
            throw new RuntimeException("Gemini API returned HTTP " + response.statusCode()
                    + ": " + response.body());
        }

        return extractGeminiText(response.body());
    }

    /**
     * Builds a concise, structured audit prompt for Gemini.
     * Kept under 100 tokens to minimise latency and API cost.
     */
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

    /**
     * Extracts the first text candidate from a Gemini generateContent JSON response.
     *
     * Expected response path:
     * candidates[0].content.parts[0].text
     */
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

    // ── Private helpers ───────────────────────────────────────────────────────

    private Long extractLong(Map<String, Object> payload, String key) {
        Object val = payload.get(key);
        if (val instanceof Number) return ((Number) val).longValue();
        if (val instanceof String) return Long.parseLong((String) val);
        throw new IllegalArgumentException("Missing or invalid field '" + key + "' in swap event payload");
    }
}
