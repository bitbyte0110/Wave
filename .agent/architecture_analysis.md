# Wave Terminal — Architecture Gap Analysis
## Current Monolith vs. Target Microservices

---

## 1. Current Architecture Map

Everything lives in a single Spring Boot application (`com.wave.terminal`) deployed as one JAR on port 8080.

```
terminal/src/main/java/com/wave/terminal/
├── config/
│   ├── RabbitMQConfig.java       — all queues + exchanges in one place
│   ├── SecurityConfig.java       — global JWT filter for the entire app
│   └── WebSocketConfig.java      — STOMP broker config
├── controller/
│   ├── AuthController.java       — /api/v1/auth/**
│   ├── MarketController.java     — /api/v1/market/**
│   └── WalletController.java     — /api/v1/wallet/**
│       └── dto/ (all DTOs flat)
├── entity/
│   ├── Transaction.java          — shared by Auth, Wallet, Audit workers
│   ├── User.java
│   ├── Wallet.java
│   └── TransactionType.java
├── repository/
│   ├── TransactionRepository.java — used by WalletService AND AuditConsumer
│   ├── UserRepository.java        — used by AuthService AND WalletService
│   └── WalletRepository.java      — used by AuthService AND WalletService
├── security/
│   ├── JwtAuthFilter.java
│   ├── JwtUtil.java
│   └── UserDetailsServiceImpl.java
└── service/
    ├── AuditConsumer.java         — RabbitMQ consumer + Gemini HTTP + DB write
    ├── AuthService.java           — creates User + Wallet atomically
    ├── IdempotencyService.java    — Redis key-value cache
    ├── MarketPriceScheduler.java  — scheduler + CoinGecko HTTP + Redis + STOMP
    ├── NotificationPublisher.java — publishes to audit.done.queue
    └── WalletService.java         — core swap/deposit/withdraw + RabbitMQ publish
```

---

## 2. Target Microservices Design

| Service | Responsibility | Own DB? | Communicates via |
|---|---|---|---|
| **Auth-Service** | Register, Login, JWT issuance | `users` table | REST (sync) |
| **Swap-Execution-Engine** | Wallet CRUD, Swap/Deposit/Withdraw, idempotency | `wallets`, `transactions` tables | REST in + RabbitMQ out |
| **Risk-Audit-Worker** | Consume `swap.events`, call Gemini, write remark | same `transactions` table (soft-update only) | RabbitMQ in + RabbitMQ out |
| **Market-Streaming-Service** | CoinGecko polling, Redis cache, STOMP broadcast | none (Redis only) | REST out + WebSocket |
| **Spring Cloud Gateway** | Routing, JWT validation at edge, CORS | none | proxies all above |

---

## 3. Tight Coupling Inventory

### 3.1 — `WalletController` reaches directly into `WalletRepository`

**File:** [`WalletController.java#L38-L39`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/controller/WalletController.java#L38-L39)

```java
private final WalletService walletService;
private final WalletRepository walletRepository;   // ← controller bypasses service layer
```

The `GET /balance/{userId}` handler calls `walletRepository.findByUserId()` directly from the controller instead of delegating to a service. This means the controller is tightly bound to a JPA repository — a persistence-layer concern. In a microservices split, the repository would not exist in the same process.

**Fix:** Move the `findByUserId` call into `WalletService.getBalance(userId)` and inject only `WalletService` into the controller.

---

### 3.2 — `AuthService` creates a `Wallet` — cross-domain write

**File:** [`AuthService.java#L67-L72`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/service/AuthService.java#L67-L72)

```java
Wallet wallet = new Wallet();
wallet.setUser(savedUser);
wallet.setUsdcBalance(BigDecimal.ZERO);
wallet.setBtcBalance(BigDecimal.ZERO);
walletRepository.save(wallet);
```

`AuthService` (which will become Auth-Service) directly writes a `wallets` row — a record owned by the Swap-Execution-Engine domain. This creates a cross-domain transaction: Auth-Service and Swap-Execution-Engine share a database write path under one `@Transactional` boundary.

**Fix:** After Auth-Service persists `User`, publish a `user.registered` event to RabbitMQ. Swap-Execution-Engine consumes this event and provisions the zero-balance wallet asynchronously.

---

### 3.3 — `AuditConsumer` writes directly to `TransactionRepository`

**File:** [`AuditConsumer.java#L48`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/service/AuditConsumer.java#L48) and [`AuditConsumer.java#L90`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/service/AuditConsumer.java#L90)

```java
private final TransactionRepository transactionRepository;
// ...
int updated = transactionRepository.updateAiRemark(transactionId, remark);
```

The Risk-Audit-Worker calls a JPA repository (`TransactionRepository`) on the same shared MySQL schema. In a microservices world this is an **anti-pattern**: Risk-Audit-Worker must not hold a JPA context into Swap-Execution-Engine's database.

**Fix (Option A — preferred):** Expose a `PATCH /api/v1/internal/transactions/{id}/remark` endpoint on Swap-Execution-Engine. Risk-Audit-Worker calls it over HTTP after Gemini completes.

**Fix (Option B):** Risk-Audit-Worker publishes an `audit.remark.ready` event; Swap-Execution-Engine consumes it and updates its own DB row.

---

### 3.4 — All JPA entities are shared across all "services"

**Files:** `entity/Transaction.java`, `entity/Wallet.java`, `entity/User.java`

All four logical services share the same `@Entity` classes and `@Repository` interfaces in a single package tree. The `Transaction` entity contains `aiAuditRemark` (owned by Risk-Audit-Worker's domain) alongside `amount`/`type` (owned by Swap-Execution-Engine), conflating two bounded contexts into one table mapping.

**Fix:** After splitting into modules/services, each service owns its own entity package. Risk-Audit-Worker should model only the `AuditRemark` payload as a lightweight POJO, not a full JPA entity with `@ManyToOne User`.

---

### 3.5 — Single `SecurityConfig` guards all routes with one JWT filter

**File:** [`SecurityConfig.java`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/config/SecurityConfig.java)

The monolith validates JWTs for wallet mutations inside the same Spring Security filter chain that also protects market and auth routes. In a microservices setup, internal service-to-service calls (e.g., Risk-Audit-Worker calling Swap-Execution-Engine's `PATCH /remark` endpoint) would also hit this filter with no valid user JWT.

**Fix:** Move JWT validation to Spring Cloud Gateway. Internal services communicate over a trusted network using a shared service-to-service secret header (e.g., `X-Internal-Api-Key`) rather than user JWTs.

---

### 3.6 — `WalletService.executeSwap()` hard-codes asset pair logic

**File:** [`WalletService.java#L92-L106`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/service/WalletService.java#L92-L106)

```java
if (fromAsset.equalsIgnoreCase("USDC") && toAsset.equalsIgnoreCase("BTC")) { ... }
else if (fromAsset.equalsIgnoreCase("BTC") && toAsset.equalsIgnoreCase("USDC")) { ... }
else { throw new IllegalArgumentException(...); }
```

The swap routing logic is a hard-coded if/else chain. Adding a new asset (ETH, USDT) requires modifying the core service. The Swap-Execution-Engine should use a strategy/registry pattern keyed by `AssetPair`.

**Fix:** Create an `AssetPairHandler` interface with `canHandle(String from, String to)` and `execute(Wallet, BigDecimal, BigDecimal)`. Register handlers in a `Map<AssetPair, AssetPairHandler>` bean and look them up dynamically.

---

### 3.7 — `RabbitMQConfig` declares all queues/exchanges for every "service" in one class

**File:** [`RabbitMQConfig.java`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/config/RabbitMQConfig.java)

Both `swap.audit.queue` (consumed by Risk-Audit-Worker) and `audit.done.queue` (consumed by Stage-11 NotificationConsumer) are declared in the same `@Configuration` class alongside the exchange binding for Swap-Execution-Engine. In a true microservices setup, each service declares only the queues it owns.

**Fix:** Each service declares its own queues in its own `RabbitMQConfig`. Use RabbitMQ's passive-declare pattern on the consumer side to avoid topology conflicts between services.

---

### 3.8 — `MarketPriceScheduler` is bundled with transaction processing

**File:** [`MarketPriceScheduler.java`](file:///e:/Development/Wave/terminal/src/main/java/com/wave/terminal/service/MarketPriceScheduler.java)

The market data scheduler (CoinGecko → Redis → STOMP) runs in the same JVM as the pessimistic-lock transaction engine. A CoinGecko API slowdown could starve the same thread pool used by wallet operations.

**Fix:** Market-Streaming-Service is already logically separate (no shared entities or repositories). Extract it into its own Spring Boot module with its own `@EnableScheduling`, its own Redis connection pool, and its own STOMP broker configuration.

---

### 3.9 — `application.properties` holds all secrets in one flat file

**File:** [`application.properties`](file:///e:/Development/Wave/terminal/src/main/resources/application.properties)

One flat properties file holds MySQL credentials, RabbitMQ credentials, JWT secret, Redis host, and Gemini API key. In a Kubernetes microservices deployment, each service should receive only its own secrets as K8s `Secret` objects mounted as env vars.

**Fix:** Split into per-service `application.properties`. Use Spring Cloud Config Server or Kubernetes Secrets to inject credentials at runtime. Never have the Risk-Audit-Worker hold MySQL connection strings — it should not talk to MySQL directly.

---

## 4. Refactoring Roadmap (Ordered by Dependency)

### Step 1 — Internal boundary hardening (in the current monolith, pre-split)
These can be done now to prepare for extraction without breaking anything:

| # | Change | File(s) Touched |
|---|---|---|
| 1a | Move `walletRepository.findByUserId()` out of `WalletController` into `WalletService.getBalance()` | `WalletController.java`, `WalletService.java` |
| 1b | Add `AssetPairHandler` strategy registry to replace the `if/else` asset chain | `WalletService.java` + new `handler/` package |
| 1c | Add `GlobalExceptionHandler` (`@RestControllerAdvice`) to centralise error mapping (Stage 16 backport) | new `GlobalExceptionHandler.java` |

---

### Step 2 — Introduce Maven multi-module structure

```
wave-terminal/
├── pom.xml                  (parent)
├── wave-common/             (shared DTOs, event payloads, no Spring beans)
├── auth-service/
├── swap-engine/
├── risk-audit-worker/
├── market-streaming/
└── gateway/                 (Spring Cloud Gateway)
```

Move `entity/`, `repository/`, and `security/` classes into the service that owns them. `wave-common` holds only plain Java records (no JPA annotations).

---

### Step 3 — Decouple Auth-Service from Wallet provisioning

| Action | Detail |
|---|---|
| Auth-Service publishes `user.registered` event | `{ userId, email, username }` → RabbitMQ topic exchange `user.events` |
| Swap-Engine consumes `user.registered` | Creates zero-balance `Wallet` row in its own transaction |
| Remove `WalletRepository` from `AuthService` | AuthService no longer imports any wallet class |

---

### Step 4 — Replace AuditConsumer's direct DB write with an internal REST call

| Action | Detail |
|---|---|
| Add `PATCH /internal/transactions/{id}/remark` on Swap-Engine | Secured by `X-Internal-Api-Key` header, not user JWT |
| Risk-Audit-Worker calls this endpoint after Gemini completes | Uses `HttpClient` (already present in `AuditConsumer`) |
| Remove `TransactionRepository` from `AuditConsumer` | Risk-Audit-Worker no longer imports any JPA code |

---

### Step 5 — Move JWT validation to Spring Cloud Gateway

| Action | Detail |
|---|---|
| Add `spring-cloud-gateway` + `spring-cloud-starter-security` | New `gateway/` module |
| Implement `JwtAuthenticationFilter` (reactive) at gateway level | Validates JWT before routing to any downstream service |
| Remove `SecurityConfig` + `JwtAuthFilter` from Swap-Engine | Internal services trust the gateway; use `X-User-Id` forwarded header |
| Auth-Service remains stateless — exposes `/auth/**` as public routes through gateway | — |

---

### Step 6 — Per-service RabbitMQ topology ownership

| Service | Declares | Consumes |
|---|---|---|
| Swap-Engine | `swap.events` FanoutExchange, `swap.audit.queue` (passive) | nothing |
| Risk-Audit-Worker | `swap.audit.queue` | `swap.audit.queue` → publishes to `audit.done.queue` |
| Notification-Service (Stage 11) | `audit.done.queue` | `audit.done.queue` → STOMP push |

---

### Step 7 — Kubernetes Secrets injection

Replace flat `application.properties` secrets with K8s `Secret` → `envFrom`:

```yaml
# risk-audit-worker deployment
envFrom:
  - secretRef:
      name: gemini-secret     # GEMINI_API_KEY
  - secretRef:
      name: rabbitmq-secret   # RABBITMQ_USERNAME, RABBITMQ_PASSWORD
# NO MySQL secret — Risk-Audit-Worker never touches MySQL directly
```

---

## 5. Summary Severity Table

| Coupling | Severity | Blocks Split? | Quick Win? |
|---|---|---|---|
| `WalletController` → `WalletRepository` (bypass) | Medium | No | ✅ Yes |
| `AuthService` → `WalletRepository` (cross-domain write) | **High** | Yes | No |
| `AuditConsumer` → `TransactionRepository` (cross-DB write) | **High** | Yes | No |
| Shared JPA entities across all "services" | **High** | Yes | No |
| Single `SecurityConfig` covering all routes | **High** | Yes | No |
| Hard-coded asset-pair if/else in `WalletService` | Medium | No | ✅ Yes |
| Monolithic `RabbitMQConfig` | Low | No | ✅ Yes |
| `MarketPriceScheduler` co-located with transaction engine | Medium | No | No |
| Flat `application.properties` with all secrets | Low | No | ✅ Yes |
