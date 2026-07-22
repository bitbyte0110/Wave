# 02 — Scaffold swap-engine child module

**What to build:** A standalone Spring Boot child module `terminal/swap-engine/` containing all wallet and transaction concerns — entities, repositories, services, controllers, the `handler/` strategy registry, and a trimmed `SecurityConfig` that secures wallet endpoints via JWT. Running `mvn spring-boot:run -pl swap-engine` starts the app and all wallet API endpoints (`/deposit`, `/withdraw`, `/swap`, `/balance/{userId}`) respond correctly.

**Blocked by:** 01 (parent POM and wave-common must exist first; swap-engine depends on `wave-common` for `BalanceResponse`).

**Status:** done

- [ ] `terminal/swap-engine/pom.xml` created as Spring Boot child module with Web, JPA, AMQP, Redis, Security, MySQL, Lombok, JJWT, and `wave-common` dependencies
- [ ] `terminal/pom.xml` `<modules>` updated to include `swap-engine`
- [ ] `SwapEngineApplication.java` created in `com.wave.swap` with `@SpringBootApplication` scanning `com.wave.swap`
- [ ] `application.properties` created with MySQL, Redis, RabbitMQ, and JWT config (no Gemini key)
- [ ] Entities migrated to `com.wave.swap.entity`: `User`, `Wallet`, `Transaction`, `TransactionType`
- [ ] Repositories migrated to `com.wave.swap.repository`: `UserRepository`, `WalletRepository`, `TransactionRepository`
- [ ] Security classes migrated to `com.wave.swap.security`: `JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl` (temporary — moves to gateway in Step 5)
- [ ] `SecurityConfig` created in `com.wave.swap.config` securing wallet mutation endpoints; `GET /balance/**` is public
- [ ] `RabbitMQConfig` created in `com.wave.swap.config` declaring only `swap.events` FanoutExchange and `swap.audit.queue` binding
- [ ] `WalletService` migrated to `com.wave.swap.service` with `AssetPairRegistry` injection
- [ ] `IdempotencyService` migrated to `com.wave.swap.service`
- [ ] `handler/` package migrated to `com.wave.swap.handler`: `AssetPairHandler`, `UsdcToBtcHandler`, `BtcToUsdcHandler`, `AssetPairRegistry`
- [ ] `WalletController` migrated to `com.wave.swap.controller`, importing `BalanceResponse` from `com.wave.common`
- [ ] Request DTOs migrated to `com.wave.swap.controller.dto`: `DepositRequest`, `WithdrawRequest`, `SwapRequest`
- [ ] `GlobalExceptionHandler` copied into `com.wave.swap.exception`
- [ ] `mvn package -pl swap-engine --also-make` completes with BUILD SUCCESS
- [ ] Wallet deposit, withdraw, swap, and balance endpoints verified responding on `swap-engine`
