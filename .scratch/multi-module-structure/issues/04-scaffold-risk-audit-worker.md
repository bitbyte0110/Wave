# 04 — Scaffold risk-audit-worker child module

**What to build:** A standalone Spring Boot child module `terminal/risk-audit-worker/` containing only `AuditConsumer` and `NotificationPublisher` — zero JPA entities, zero Spring Data repositories. The worker consumes `swap.audit.queue`, calls the Gemini API, and writes the audit remark by calling `swap-engine`'s internal `PATCH /internal/transactions/{id}/remark` endpoint over HTTP (this HTTP call replaces the current direct `transactionRepository.updateAiRemark()` call, resolving coupling 3.3 from the architecture analysis). The full swap-to-audit flow works end-to-end.

**Blocked by:** 01 (wave-common for `AuditDonePayload`), 02 (`swap-engine` must expose the internal remark endpoint before risk-audit-worker can call it).

**Status:** done

- [ ] `terminal/risk-audit-worker/pom.xml` created as Spring Boot child module with AMQP, Jackson, and `wave-common` dependencies — **no** `spring-boot-starter-data-jpa`, **no** `mysql-connector-j`
- [ ] `terminal/pom.xml` `<modules>` updated to include `risk-audit-worker`
- [ ] `RiskAuditApplication.java` created in `com.wave.audit` with `@SpringBootApplication` scanning `com.wave.audit`
- [ ] `application.properties` created with RabbitMQ and Gemini API key config only (no MySQL, no Redis, no JWT)
- [ ] `RabbitMQConfig` created in `com.wave.audit.config` declaring only `swap.audit.queue` (durable) and `audit.done.queue` (durable) — no `swap.events` exchange declaration (passive binding)
- [ ] `swap-engine` exposes `PATCH /api/v1/internal/transactions/{id}/remark` secured by `X-Internal-Api-Key` header
- [ ] `AuditConsumer` migrated to `com.wave.audit.service`; direct `transactionRepository.updateAiRemark()` call replaced with `HttpClient` POST to swap-engine's internal endpoint
- [ ] `NotificationPublisher` migrated to `com.wave.audit.service`, publishing `AuditDonePayload` (from `wave-common`) to `audit.done.queue`
- [ ] `TransactionRepository` import removed from `risk-audit-worker` entirely — no JPA code remains
- [ ] `mvn package -pl risk-audit-worker --also-make` completes with BUILD SUCCESS
- [ ] End-to-end swap flow verified: swap API → RabbitMQ → audit worker → Gemini → internal PATCH → DB remark updated → `audit.done.queue` published
