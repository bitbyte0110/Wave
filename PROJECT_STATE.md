# Wave Terminal - Project State

## 1. Infrastructure (Completed)
* **Docker Compose (`docker-compose.yml`):** Deployed MySQL 8.0 (Port 3307), Redis 7.0 (Port 6379), and RabbitMQ (Ports 5672/15672).
* **Network Status:** All containers running successfully on the local environment without port conflicts.

##  2. Backend Base Setup (Completed)
* **Framework:** Spring Boot 3.3.x (Java 17, Maven).
* **Location:** `E:\Development\Wave\terminal\`
* **Dependencies:** Spring Web, Spring Data JPA, MySQL Driver, Spring for RabbitMQ, Lombok.
* **Configuration:** `application.properties` configured for Docker port 3307 mapping, JPA `update` DDL, and RabbitMQ defaults.

## 3. Data Entities (Completed)
* **Package:** `com.wave.terminal.entity`
* **Models Built:**
  * `TransactionType.java`: Enum (`DEPOSIT`, `WITHDRAW`, `SWAP`).
  * `User.java`: Base user metadata and credentials.
  * `Wallet.java`: Holds `usdcBalance` (18,4 precision) and `btcBalance` (18,8 precision).
  * `Transaction.java`: Immutable ledger for financial audit history.

## 4. Repository Layer (Completed)
* **Package:** `com.wave.terminal.repository`
* **Interfaces Built:**
  * `UserRepository.java`
  * `TransactionRepository.java`
  * `WalletRepository.java`: Implemented crucial pessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on `findByUserIdForUpdate` to prevent concurrent double-spending.

## 5. Service & Messaging Layer (Completed)
* **Packages:** `com.wave.terminal.service`, `com.wave.terminal.config`
* **Classes Built:**
  * `RabbitMQConfig.java`: Configured `swap.events` FanoutExchange using `JacksonJsonMessageConverter`.
  * `WalletService.java`: Implemented `@Transactional` logic for `simulateDeposit`, `executeWithdraw`, and `executeSwap`. Includes strict post-lock balance validations and RabbitMQ async event publishing.

## 6. REST Controller Layer (Completed)
* **Packages:** `com.wave.terminal.controller`, `com.wave.terminal.controller.dto`
* **Classes Built:**
  * `DepositRequest.java` (record): Request body for `POST /api/v1/wallet/deposit`.
  * `WithdrawRequest.java` (record): Request body for `POST /api/v1/wallet/withdraw`.
  * `SwapRequest.java` (record): Request body for `POST /api/v1/wallet/swap`.
  * `BalanceResponse.java` (record): Lightweight read projection for `GET /api/v1/wallet/balance/{userId}`. Decoupled from the JPA entity to avoid lazy-loading the `User` association during JSON serialisation.
  * `WalletController.java`: Exposes all four endpoints under `/api/v1/wallet` with `@CrossOrigin(origins = "*")` for the Next.js dev server.
* **Key Design Decisions:**
  * `X-Idempotency-Key` header validated as a proper UUIDv4 before the service is called; malformed keys return HTTP 400 immediately.
  * Error responses always use a uniform `{ "error": "..." }` JSON envelope so the frontend has a predictable error shape.
  * `GET /balance/{userId}` uses the non-locking `findByUserId` to avoid competing for the `FOR UPDATE` row lock during read-only queries.

## 7. Authentication Layer (Completed)
* **Packages:** `com.wave.terminal.security`, `com.wave.terminal.config`, `com.wave.terminal.service`, `com.wave.terminal.controller`, `com.wave.terminal.controller.dto`
* **Dependencies Added (`pom.xml`):** `spring-boot-starter-security`, `jjwt-api:0.12.6`, `jjwt-impl:0.12.6`, `jjwt-jackson:0.12.6`.
* **Classes Built:**
  * `JwtUtil.java`: Generates and validates HS256 JWTs. Embeds `userId` as a custom claim. Secret loaded from `application.properties` as Base64.
  * `UserDetailsServiceImpl.java`: Implements `UserDetailsService`. Maps `User.email` → Spring Security principal, `User.passwordHash` → credential.
  * `JwtAuthFilter.java`: `OncePerRequestFilter`. Reads `Authorization: Bearer`, validates JWT, populates `SecurityContextHolder`.
  * `SecurityConfig.java`: Stateless `SecurityFilterChain`. Public: `/api/v1/auth/**`, `GET /api/v1/wallet/balance/**`. Secured: all other routes. Exposes `AuthenticationManager` + `BCryptPasswordEncoder` beans.
  * `AuthService.java`: `register()` hashes password, persists `User`, provisions zero-balance `Wallet`, issues JWT. `login()` delegates to `AuthenticationManager`, issues JWT.
  * `AuthController.java`: `POST /api/v1/auth/register` and `POST /api/v1/auth/login`. Public routes, uniform `{ "error": "..." }` envelope on 4xx.
  * DTOs: `RegisterRequest`, `LoginRequest`, `AuthResponse` (includes `token`, `userId`, `username`, `email`).
* **Key Design Decisions:**
  * `AuthService.register()` is `@Transactional` — `User` and `Wallet` rows are created atomically.
  * `AuthResponse` includes `userId` so the frontend never needs a separate `/me` call.
  * CORS handled at the `SecurityFilterChain` level (not just `@CrossOrigin`) to correctly pre-flight secured routes.

---

## Staged Roadmap to Project Completion

### Stage 7 — Authentication Layer (Spring Security + JWT)
* **Goal:** Secure all mutation endpoints behind stateless JWT authentication.
* **Tasks:**
  * Add `spring-boot-starter-security` and `jjwt` (e.g., `io.jsonwebtoken:jjwt-api`) to `pom.xml`.
  * Create `AuthController.java` with `POST /api/v1/auth/register` and `POST /api/v1/auth/login` endpoints.
  * Implement `UserDetailsServiceImpl.java` loading users from `UserRepository`.
  * Create `JwtUtil.java` (token generation, validation, claim extraction).
  * Create `JwtAuthFilter.java` (`OncePerRequestFilter`) to validate Bearer tokens on every request.
  * Configure `SecurityFilterChain` in `SecurityConfig.java`: permit `/api/v1/auth/**` and `/api/v1/wallet/balance/**`; require authentication for all other wallet mutations.
  * Hash passwords with `BCryptPasswordEncoder`.

## 8. Redis Idempotency Cache (Completed)
* **Packages:** `com.wave.terminal.service`
* **Dependencies Added (`pom.xml`):** `spring-boot-starter-data-redis`, `jackson-databind`.
* **Classes Built:**
  * `IdempotencyService.java`: Backed by `StringRedisTemplate`. Stores response JSON under key `idempotency:<uuid>` with a configurable TTL (default 24 h via `app.idempotency.ttl-seconds`).
* **Controller Changes (`WalletController.java`):**
  * `POST /withdraw` — checks cache before executing; writes result to cache on success.
  * `POST /swap` — same pattern.
  * `POST /deposit` — intentionally **not** cached (credit operation is safe to replay).
* **Key Design Decisions:**
  * `StringRedisTemplate` used over generic `RedisTemplate` — values stored as human-readable JSON, no JDK serialisation coupling.
  * Deserialisation errors on cache-read are treated as misses (non-fatal) so a corrupted Redis entry never permanently blocks a legitimate retry.
  * Failed cache-writes (after a successful DB operation) are logged as warnings but do not surface to the client — the operation already succeeded.

## 9. Market Streaming Service (Completed)
* **Packages:** `com.wave.terminal.config`, `com.wave.terminal.service`, `com.wave.terminal.controller`, `com.wave.terminal.controller.dto`
* **Classes Built:**
  * `WebSocketConfig.java`: Configures STOMP broker — endpoint `/ws` with SockJS fallback, in-memory broker on `/topic` and `/queue`, app prefix `/app`.
  * `MarketPriceScheduler.java`: Dual-frequency scheduler (PRD §3 isolation pattern):
    * `fetchAndBroadcastPriceTick()` — every 5 s: polls CoinGecko `/simple/price`, caches `PriceTick` in Redis under `market:price:tick`, broadcasts to STOMP `/topic/prices`.
    * `fetchAndCacheMarketOverview()` — every 60 s: polls CoinGecko `/global`, writes `MarketOverview` to Redis under `market:overview`.
  * `MarketController.java`: `GET /api/v1/market/overview` and `GET /api/v1/market/price/tick` — read from Redis cache only (zero live API calls on GET).
  * DTOs: `PriceTick` and `MarketOverview`.
* **Config Changes:**
  * `TerminalApplication.java` — added `@EnableScheduling`.
  * `SecurityConfig.java` — added `/api/v1/market/**`, `/ws/**`, `/topic/**` to public permit list.
* **Key Design Decisions:**
  * Java built-in `HttpClient` used — no additional dependency required.
  * `GET /api/v1/market/price/tick` bonus endpoint lets the frontend seed initial data before the WebSocket subscribes.
  * 5 s polling = 12 req/min — safely within CoinGecko's free-tier rate limit of ~30 req/min.
  * All scheduler failures are caught and logged — a single CoinGecko timeout never kills the scheduler thread.

## 10. AI Async Risk Audit Service (Completed)
* **Packages:** `com.wave.terminal.service`, `com.wave.terminal.config`, `com.wave.terminal.repository`
* **Classes Built / Modified:**
  * `RabbitMQConfig.java` *(modified)*: Declared `swap.audit.queue` and `audit.done.queue` as durable beans; bound `swap.audit.queue` to `swap.events` FanoutExchange.
  * `TransactionRepository.java` *(modified)*: Added `@Modifying @Query` method `updateAiRemark(id, remark)` for targeted soft-update of `ai_audit_remark` column.
  * `AuditConsumer.java` *(new)*: `@RabbitListener(queues = "swap.audit.queue")`. Builds audit prompt → calls Gemini `generateContent` API → soft-updates DB row → triggers `NotificationPublisher`.
  * `NotificationPublisher.java` *(new)*: Publishes `{ transactionId, userId, remark }` JSON to `audit.done.queue` via default direct exchange.
* **Config Changes (`application.properties`):** Added `app.gemini.api-key`, `app.gemini.model`, `app.gemini.api-url`.
* **Key Design Decisions:**
  * Consumer thread is fully isolated from the HTTP layer — Gemini's 1–3 s latency never blocks a wallet endpoint.
  * Gemini model: `gemini-2.0-flash` (low-latency, cost-efficient for short audit prompts).
  * Failures write `"AI audit unavailable: <reason>"` to the remark column — the row is never left `null` for a processed event.
  * `extractLong()` helper handles both `Integer` and `String` types from the deserialized RabbitMQ map (Jackson deserialises JSON numbers as `Integer` by default).
  * Stored Key: Saved the Gemini API key in E:\Development\Wave\terminal\.env. Updated Config: Set app.gemini.api-key=${GEMINI_API_KEY} in application.properties with .env auto-import.

### Stage 11 — Notification Push Service (WebSocket to Frontend)
* **Goal:** Push the AI audit result down the active WebSocket connection to the correct user's notification bell.
* **Tasks:**
  * Create `NotificationConsumer.java` listening to `audit.done` queue.
  * On event receipt: resolve the STOMP session for the target `userId` and send a formatted Markdown summary to `/queue/notifications/{userId}`.
  * Frontend subscribes to this personal queue on mount and updates the notification bell counter + toast.

### Stage 12 — Frontend: Auth Gateway (Next.js)
* **Goal:** Build `register` and `login` pages wired to the Spring Boot auth endpoints.
* **Tasks:**
  * Create `app/register/page.tsx` and `app/login/page.tsx` with Shadcn UI form components.
  * On successful login: store JWT in `localStorage`; inject into `Authorization: Bearer` headers for all subsequent API calls.
  * Auto-redirect authenticated users to the dashboard.

### Stage 13 — Frontend: Market Console & WebSocket Integration
* **Goal:** Module B — Live price tickers with green/red micro-flash animations.
* **Tasks:**
  * Connect to `/ws` STOMP endpoint on mount; subscribe to `/topic/prices`.
  * Use `useRef` + partial updates to prevent global re-renders on tick.
  * Display Global Cap and 24h Volume via `GET /api/v1/market/overview` (polled every 30s).

### Stage 14 — Frontend: Wallet Modules (Deposit, Withdraw, Swap, Ledger)
* **Goal:** Modules C, D, E — wire to all `WalletController` endpoints.
* **Tasks:**
  * Module E (Deposit): 2s mock spinner → `POST /deposit` → balance update.
  * Module E (Withdraw): client-side pre-check → `POST /withdraw` with `X-Idempotency-Key` → balance update.
  * Module D (Swap): 5s countdown rate-lock wheel → `POST /swap` with `X-Idempotency-Key` → balance update → subscribe to `/queue/notifications/{userId}` for AI audit toast.
  * Module C (Ledger): `GET /api/v1/wallet/transactions/{userId}` (add this endpoint) → Recharts donut chart + immutable table.

### Stage 15 — Docker & Kubernetes Packaging
* **Goal:** Package the full application for local Kubernetes deployment with Minikube.
* **Tasks:**
  * Write `Dockerfile` for the Spring Boot backend (multi-stage build with Maven + JRE 17 slim).
  * Write `Dockerfile` for the Next.js frontend.
  * Create Kubernetes manifests: `Deployment`, `Service`, `ConfigMap`, `Secret` for each service.
  * Update `docker-compose.yml` to include the Spring Boot and Next.js containers alongside the existing infrastructure.
  * Validate end-to-end with `minikube start` + `kubectl apply -f k8s/`.

### Stage 16 — Final Polish & Testing
* **Goal:** Production-readiness hardening.
* **Tasks:**
  * Write `WalletControllerTest.java` (MockMvc slice tests for all four endpoints).
  * Write `WalletServiceTest.java` (unit tests with `@MockBean` for concurrent edge cases).
  * Add global exception handler `GlobalExceptionHandler.java` (`@RestControllerAdvice`) to centralise error mapping.
  * Add `actuator` endpoints for health checks (`/actuator/health`).
  * Review CORS policy: tighten `@CrossOrigin` to the deployed frontend origin before production.