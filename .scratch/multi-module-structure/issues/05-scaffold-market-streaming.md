# 05 — Scaffold market-streaming child module

**What to build:** A standalone Spring Boot child module `terminal/market-streaming/` containing `MarketPriceScheduler`, `MarketController`, `WebSocketConfig`, and their DTOs — zero JPA entities, zero Spring Data JPA. Running `mvn spring-boot:run -pl market-streaming` starts the app and `GET /api/v1/market/overview`, `GET /api/v1/market/price/tick`, and the STOMP WebSocket price broadcast all work correctly.

**Blocked by:** 01 (parent POM must exist; market-streaming is a peer module with no dependency on wave-common records).

**Status:** done

- [ ] `terminal/market-streaming/pom.xml` created as Spring Boot child module with Web, WebSocket, Redis, Jackson, Lombok dependencies — **no** JPA, **no** AMQP, **no** MySQL
- [ ] `terminal/pom.xml` `<modules>` updated to include `market-streaming`
- [ ] `MarketStreamingApplication.java` created in `com.wave.market` with `@SpringBootApplication` and `@EnableScheduling` scanning `com.wave.market`
- [ ] `application.properties` created with Redis config and server port only (no MySQL, no RabbitMQ, no JWT, no Gemini)
- [ ] `WebSocketConfig` migrated to `com.wave.market.config`
- [ ] `MarketPriceScheduler` migrated to `com.wave.market.service`
- [ ] `MarketController` migrated to `com.wave.market.controller` (reads from Redis only)
- [ ] DTOs `PriceTick` and `MarketOverview` migrated to `com.wave.market.controller.dto`
- [ ] `GlobalExceptionHandler` copied into `com.wave.market.exception`
- [ ] `mvn package -pl market-streaming --also-make` completes with BUILD SUCCESS
- [ ] Market overview REST endpoint, price tick REST endpoint, and STOMP `/topic/prices` broadcast verified working
