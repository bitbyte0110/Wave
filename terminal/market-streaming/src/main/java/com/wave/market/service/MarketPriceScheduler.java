package com.wave.market.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wave.market.controller.dto.MarketOverview;
import com.wave.market.controller.dto.PriceTick;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketPriceScheduler {

    public static final String REDIS_KEY_TICK     = "market:price:tick";
    public static final String REDIS_KEY_OVERVIEW = "market:overview";
    public static final String STOMP_TOPIC_PRICES = "/topic/prices";

    private static final String COINGECKO_PRICE_URL =
            "https://api.coingecko.com/api/v3/simple/price" +
            "?ids=bitcoin,usd-coin&vs_currencies=usd&include_24hr_change=true";

    private static final String COINGECKO_GLOBAL_URL =
            "https://api.coingecko.com/api/v3/global";

    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Scheduled(fixedDelay = 5000)
    public void fetchAndBroadcastPriceTick() {
        try {
            String json = get(COINGECKO_PRICE_URL);
            JsonNode root = objectMapper.readTree(json);

            BigDecimal btcUsd    = safeDecimal(root, "bitcoin",  "usd");
            BigDecimal usdcUsd   = safeDecimal(root, "usd-coin", "usd");
            BigDecimal btc24hPct = safeDecimal(root, "bitcoin",  "usd_24h_change");

            PriceTick tick = new PriceTick(btcUsd, usdcUsd, btc24hPct, System.currentTimeMillis());

            redisTemplate.opsForValue().set(REDIS_KEY_TICK, objectMapper.writeValueAsString(tick));
            messagingTemplate.convertAndSend(STOMP_TOPIC_PRICES, tick);

            log.debug("PRICE TICK ▶ BTC={} USDC={} 24h={}%", btcUsd, usdcUsd, btc24hPct);

        } catch (Exception ex) {
            log.warn("MarketPriceScheduler tick failed: {}", ex.getMessage());
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void fetchAndCacheMarketOverview() {
        try {
            String json = get(COINGECKO_GLOBAL_URL);
            JsonNode data = objectMapper.readTree(json).path("data");

            BigDecimal globalCap    = bigDecimalFromNode(data.path("total_market_cap").path("usd"));
            BigDecimal totalVolume  = bigDecimalFromNode(data.path("total_volume").path("usd"));
            BigDecimal btcDominance = bigDecimalFromNode(data.path("market_cap_percentage").path("btc"));

            BigDecimal btcUsd    = BigDecimal.ZERO;
            BigDecimal btc24hPct = BigDecimal.ZERO;
            String cachedTick = redisTemplate.opsForValue().get(REDIS_KEY_TICK);
            if (cachedTick != null) {
                PriceTick tick = objectMapper.readValue(cachedTick, PriceTick.class);
                btcUsd    = tick.btcUsd();
                btc24hPct = tick.btc24hPct();
            }

            MarketOverview overview = new MarketOverview(
                    globalCap, totalVolume, btcDominance,
                    btcUsd, btc24hPct, System.currentTimeMillis());

            redisTemplate.opsForValue().set(REDIS_KEY_OVERVIEW, objectMapper.writeValueAsString(overview));
            log.debug("OVERVIEW CACHED ▶ cap={} vol={} btcDom={}%", globalCap, totalVolume, btcDominance);

        } catch (Exception ex) {
            log.warn("MarketPriceScheduler overview failed: {}", ex.getMessage());
        }
    }

    private String get(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("CoinGecko API returned HTTP " + response.statusCode());
        }
        return response.body();
    }

    private BigDecimal safeDecimal(JsonNode root, String coin, String field) {
        JsonNode node = root.path(coin).path(field);
        return bigDecimalFromNode(node);
    }

    private BigDecimal bigDecimalFromNode(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) return BigDecimal.ZERO;
        return new BigDecimal(node.asText());
    }
}
