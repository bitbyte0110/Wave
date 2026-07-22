Status: ready-for-agent

# Spec: Maven Multi-Module Structure for Wave Terminal Backend

## Problem Statement

The Wave Terminal backend currently lives as a single Spring Boot JAR (`terminal/`) containing four logically distinct services — Auth, Swap-Execution, Risk-Audit, and Market-Streaming — all sharing the same compile-time classpath. This means:

- `AuditConsumer` can (and does) directly import and call `TransactionRepository` — a JPA interface owned by the Swap-Execution domain.
- `AuthService` can (and does) directly write `Wallet` rows — a persistence concern owned by the Swap-Execution domain.
- `MarketPriceScheduler` runs in the same thread pool as the pessimistic-lock transaction engine.
- All secrets (MySQL credentials, Gemini API key, JWT secret) live in a single flat `application.properties`.

There is no structural boundary preventing these couplings from proliferating. Adding a new developer, a new asset type, or a new consumer will further entrench them unless the classpath boundary is enforced by the build tool.

## Solution

Introduce a Maven multi-module parent POM at `terminal/` (or at the repo root `backend/` if a rename is desired). Each logical service becomes a child Maven module with its own `pom.xml`, own `src/main/java` source tree, and its own `application.properties`. A shared `wave-common` module holds plain Java records (event payload shapes, shared DTOs) with no Spring beans and no JPA annotations.

The key structural constraint: each module's `<dependencies>` block in its `pom.xml` declares only what that service legitimately owns. Attempting to import a class from another service's module will cause a compile-time error — enforcing the bounded context at build time rather than relying on code-review discipline.

## User Stories

1. As a developer, I want the Maven build to fail at compile time if `risk-audit-worker` imports a JPA entity owned by `swap-engine`, so that cross-domain coupling is caught before it reaches the main branch.
2. As a developer, I want to run `mvn package` on the parent POM and receive four independently executable Spring Boot JARs (auth-service, swap-engine, risk-audit-worker, market-streaming), so that each service can be deployed independently.
3. As a developer, I want a `wave-common` module containing only plain Java records for shared event payloads and DTOs, so that services can share a message contract without sharing JPA entities or Spring beans.
4. As a developer, I want each child module to have its own `application.properties` containing only the configuration keys relevant to that service, so that the Gemini API key is never present in the auth-service deployment.
5. As a developer, I want the existing `mvn spring-boot:run` workflow on the `swap-engine` module to continue working identically to the current `terminal/` workflow, so that local development is not disrupted.
6. As a developer, I want the parent POM to declare `spring-boot-starter-parent` as its BOM parent and inherit consistent dependency versions across all child modules, so that version skew between modules is impossible.
7. As a developer, I want `wave-common` to be a plain `jar` packaging module (not a Spring Boot repackaged fat-jar), so that it can be listed as a `<dependency>` in other modules and resolved correctly from the local Maven repository.
8. As a developer, I want each Spring Boot child module to be annotated with its own `@SpringBootApplication` entry point in its own package root, so that component scanning is isolated to that module's package subtree only.
9. As a developer, I want the `swap-engine` module to own the `User`, `Wallet`, `Transaction`, and `TransactionType` JPA entities and all three JPA repositories, since it is the service responsible for the ledger write path.
10. As a developer, I want the `auth-service` module to own only the `User` JPA entity and `UserRepository`, and to reference `Wallet` and `WalletRepository` through a RabbitMQ event rather than a direct class import.
11. As a developer, I want the `risk-audit-worker` module to contain zero JPA entities and zero Spring Data repositories, since after the multi-module split it will communicate with `swap-engine` via an internal REST endpoint (the `PATCH /internal/transactions/{id}/remark` endpoint defined in Step 4 of the roadmap).
12. As a developer, I want the `market-streaming` module to contain zero JPA entities and zero Spring Data JPA dependencies, since it reads only from Redis and broadcasts to STOMP.
13. As a developer, I want the `AssetPairHandler` strategy interface and its implementations (`UsdcToBtcHandler`, `BtcToUsdcHandler`, `AssetPairRegistry`) — created in Step 1b — to reside in the `swap-engine` module, since they exclusively operate on `Wallet` entities.
14. As a developer, I want the `GlobalExceptionHandler` — created in Step 1c — to be copied into each service module that exposes REST endpoints (`auth-service`, `swap-engine`, `market-streaming`), rather than living in `wave-common`, so that each service can customise its own error mapping.
15. As a developer, I want the `security/` package (`JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl`, `SecurityConfig`) to reside in `auth-service` initially, so that the JWT logic is co-located with the service that issues tokens.
16. As a developer, I want the parent POM to define `<modules>` listing all child modules in dependency order (`wave-common` first, then service modules), so that a top-level `mvn package` resolves module dependencies correctly.
17. As a developer, I want the JJWT dependency (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`) declared in `auth-service`'s `pom.xml` only, since no other service needs to mint or validate JWTs after Step 5 (JWT validation at Gateway) is implemented.
18. As a developer, I want the `RabbitMQ` AMQP dependency declared in `swap-engine`, `risk-audit-worker`, and (eventually) `notification-service`, but **not** in `auth-service` until a `user.registered` event publisher is added in Step 3.

## Implementation Decisions

- **Module layout (relative to current `terminal/` directory):**
  The parent POM lives at `terminal/pom.xml`. Child module directories are created as siblings inside `terminal/`:
  ```
  terminal/
  ├── pom.xml                    (parent, packaging = pom)
  ├── wave-common/               (plain DTOs, event payload records)
  ├── auth-service/              (User entity, UserRepository, JWT stack, AuthController)
  ├── swap-engine/               (Wallet/Transaction entities, WalletService, WalletController, handler/)
  ├── risk-audit-worker/         (AuditConsumer, NotificationPublisher — zero JPA)
  └── market-streaming/          (MarketPriceScheduler, MarketController — zero JPA)
  ```
  The `gateway/` module is deferred to Step 5 (Spring Cloud Gateway) and is **out of scope** for this spec.

- **Parent POM responsibility:** Declare `<packaging>pom</packaging>`, list all `<modules>`, inherit from `spring-boot-starter-parent` as `<parent>`, and define a `<dependencyManagement>` block for shared third-party versions (JJWT, Lombok, Jackson). Child modules do **not** need to re-declare versions for managed dependencies.

- **`wave-common` packaging:** `<packaging>jar</packaging>` with no `spring-boot-maven-plugin` repackage goal. It contains:
  - `SwapEventPayload` record — the shape of the message published to `swap.events`.
  - `AuditDonePayload` record — the shape of the message published to `audit.done.queue`.
  - `UserRegisteredPayload` record — the shape of the future `user.registered` event (stubbed now, consumed in Step 3).
  - `BalanceResponse` record — the API response shape shared between `swap-engine` (produces it) and future consumers.
  - `AuthResponse` record — the API response shape from `auth-service`.
  - No `@Entity`, no `@Repository`, no Spring `@Bean` or `@Component` annotations anywhere in this module.

- **Class migration mapping:** Each existing class moves exactly once. The migration table (source → destination module) is:

  | Class | → Module |
  |---|---|
  | `entity/User.java` | `auth-service` AND `swap-engine` (both need it initially; Step 3 will remove it from auth-service after the event model is introduced) |
  | `entity/Wallet.java` | `swap-engine` |
  | `entity/Transaction.java` | `swap-engine` |
  | `entity/TransactionType.java` | `swap-engine` |
  | `repository/UserRepository.java` | `auth-service` AND `swap-engine` (same caveat as User entity) |
  | `repository/WalletRepository.java` | `swap-engine` |
  | `repository/TransactionRepository.java` | `swap-engine` |
  | `security/JwtUtil.java` | `auth-service` |
  | `security/JwtAuthFilter.java` | `auth-service` |
  | `security/UserDetailsServiceImpl.java` | `auth-service` |
  | `config/SecurityConfig.java` | `auth-service` |
  | `config/RabbitMQConfig.java` | split — each service gets its own version |
  | `config/WebSocketConfig.java` | `market-streaming` |
  | `service/AuthService.java` | `auth-service` |
  | `service/WalletService.java` | `swap-engine` |
  | `service/IdempotencyService.java` | `swap-engine` |
  | `service/AuditConsumer.java` | `risk-audit-worker` |
  | `service/NotificationPublisher.java` | `risk-audit-worker` |
  | `service/MarketPriceScheduler.java` | `market-streaming` |
  | `controller/AuthController.java` | `auth-service` |
  | `controller/WalletController.java` | `swap-engine` |
  | `controller/MarketController.java` | `market-streaming` |
  | `controller/dto/AuthResponse.java` | `wave-common` |
  | `controller/dto/BalanceResponse.java` | `wave-common` |
  | `controller/dto/DepositRequest.java` | `swap-engine` |
  | `controller/dto/WithdrawRequest.java` | `swap-engine` |
  | `controller/dto/SwapRequest.java` | `swap-engine` |
  | `controller/dto/LoginRequest.java` | `auth-service` |
  | `controller/dto/RegisterRequest.java` | `auth-service` |
  | `controller/dto/PriceTick.java` | `market-streaming` |
  | `controller/dto/MarketOverview.java` | `market-streaming` |
  | `handler/AssetPairHandler.java` | `swap-engine` |
  | `handler/UsdcToBtcHandler.java` | `swap-engine` |
  | `handler/BtcToUsdcHandler.java` | `swap-engine` |
  | `handler/AssetPairRegistry.java` | `swap-engine` |
  | `exception/GlobalExceptionHandler.java` | copied into `auth-service`, `swap-engine`, `market-streaming` |

- **`@SpringBootApplication` entry points:** Each service module gets a new `*Application.java` in its own root package (e.g., `com.wave.auth`, `com.wave.swap`, `com.wave.audit`, `com.wave.market`). The existing `TerminalApplication.java` in `swap-engine` is renamed to `SwapEngineApplication.java` and its `@SpringBootApplication` `scanBasePackages` is set to `com.wave.swap`.

- **`application.properties` split:** Each module gets `src/main/resources/application.properties` containing only the configuration it needs. The `.env` file and Gemini API key remain in `risk-audit-worker` only.

- **Interim state: `User` entity duplication is permitted for this step.** The `auth-service` and `swap-engine` both carry a `User.java` entity mapping to the same `users` table during Steps 2–3. This is a known temporary state; Step 3 eliminates `auth-service`'s direct `users`-table write path by introducing the `user.registered` RabbitMQ event.

- **The current `mvn spring-boot:run` entry point** must continue to work on `swap-engine` after the refactor, so local developers do not need to change their workflow.

## Testing Decisions

- **What makes a good test here:** Tests should verify the *structural boundary* (classpath isolation), not re-test swap or auth logic that already works. The correct test is: "does the `swap-engine` module's compile-time classpath contain any class from `risk-audit-worker` or `auth-service`?" — which Maven enforces structurally, not through a JUnit assertion.

- **Primary verification seam:** Run `mvn package -pl swap-engine,auth-service,risk-audit-worker,market-streaming --also-make` from the parent POM. Build success confirms correct module boundaries. A compile error on a cross-module import is a pass (it surfaces a boundary violation).

- **Secondary regression seam:** After restructuring, `mvn spring-boot:run -pl swap-engine` (with the Docker infrastructure running) must start the application and accept a `POST /api/v1/auth/register` → `POST /api/v1/wallet/deposit` → `GET /api/v1/wallet/balance/{userId}` sequence without errors, confirming no runtime wiring was broken during the class migration.

- **No new JUnit tests are required for this step.** The structural boundary is enforced by Maven's dependency resolution — not by application-level unit tests.

## Out of Scope

- Spring Cloud Gateway module (`gateway/`) — deferred to Step 5.
- Decoupling `AuthService` from `WalletRepository` via the `user.registered` event — deferred to Step 3.
- Replacing `AuditConsumer`'s direct `transactionRepository.updateAiRemark()` call with an internal REST call — deferred to Step 4.
- Per-service RabbitMQ topology ownership (splitting `RabbitMQConfig`) — Step 6.
- Kubernetes Secrets injection and per-service Docker images — Step 7 / Stage 15.
- The Notification Push Service (Stage 11 `NotificationConsumer.java`) — not yet implemented; no migration needed.
- Any frontend (Next.js) changes.
- Any database schema changes.

## Further Notes

- Spring Boot 4.1.0 (the current version in `pom.xml`) supports Java 17 multi-module Maven projects natively. No version upgrade is required.
- Lombok's annotation processor must be declared in each child module's `maven-compiler-plugin` `annotationProcessorPaths` block, as it is currently configured in the monolith `pom.xml`.
- The `.env` file approach for Gemini API key loading (`spring.config.import=optional:file:.env[.properties]`) should be retained in `risk-audit-worker`'s `application.properties` only.
- Developers using the IntelliJ IDEA Maven integration should re-import the project from the **parent** `pom.xml` after this restructure to get correct module-aware IDE support.
