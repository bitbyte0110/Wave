# Wave Terminal

## 1. Core Stack
- **Frontend:** React, Next.js (TypeScript), Tailwind CSS, Shadcn UI
- **Backend:** Java 17+, Spring Boot (Web REST, Data JPA, WebSockets)
- **Data/Cache:** MySQL 8.0 (Ledger), Redis (Market State Cache)
- **Messaging:** RabbitMQ (Async Event Broker)
- **DevOps:** Docker Desktop, Local Kubernetes (Minikube)

---

## 2. Frontend Modules (SPA Layout)
- **Module A: Auth Gateway**
  - **Files:** `E:\Development\Wave\app\register\page.tsx`, `E:\Development\Wave\app\login\page.tsx`
  - **Logic:** JWT token generation on success -> persistence via `localStorage`/Cookie -> auto-injected into HTTP Header & WebSocket handshakes.
- **Module B: Market Console (Dashboard)**
  - **Macro:** Global Cap & 24h Volume polled via Spring Boot REST from Redis cache.
  - **Micro Tickers:** WebSocket stream targets `Price` and `24h %`. Triggers green/red UI element micro-flashes on change. Prevents global re-renders.
- **Module C: Audit Ledger (Wallet)**
  - **UI:** SVG/Recharts asset donut chart + table visualization.
  - **Data:** Renders immutable MySQL historical ledger (`DEPOSIT`, `WITHDRAW`, `SWAP`).
- **Module D: Instant Swap Panel**
  - **UI:** Horizontal flow layout with dropdown token selectors (`USDC`, `USDT`, `BTC`, `ETH`). Locks guaranteed rate for 5s with countdown progress wheel.
  - **Event:** On click, deducts balance via backend API -> publishes event -> fires async AI Audit Notification Bell (UI toast pop-up).
- **Module E: Asset Simulation Hub**
  - **Simulated Deposit:** Production-grade address/QR box + "Simulate Network Deposit" button. Click triggers frontend 2s mock spinner (*"Waiting for 2 network confirmations..."*) -> POST to backend -> updates balance -> appends `DEPOSIT` row.
  - **Simulated Withdraw:** Address input + token/amount input + "Withdraw Now" button. Front checks `amount > balance` to intercept early. Valid requests execute Spring REST call -> immediate balance reduction -> appends `WITHDRAW` row.
- **Module F: Settings Mock:** Static UI view for profiles & API Keys.

---

## 3. Backend Architecture & Concurrency Isolation
- **Service 1: Transaction & Ledger Service (Spring Boot REST Engine)**
  - **Scope:** Auth, Deposit Simulation endpoints, Swap logic execution.
  - **Concurrency Control:** Wraps write paths in `@Transactional`. Employs MySQL pessimistic locking strategy via `SELECT * FROM wallets WHERE user_id = ? FOR UPDATE`. Forces parallel requests into a linear queue to maintain strong consistency (zero double-spending/negative balances).
  - **Strict Balance Validation:** Verification checks must execute strictly *after* the Jpa Repository acquires the explicit `FOR UPDATE` lock. Throws `InsufficientFundsException` early if balance condition fails.
  - **Idempotency Protection:** Enforces mandatory `X-Idempotency-Key` (UUIDv4 format) requirement in mutation request headers. Process validation state maps through temporary keys stored in Redis to catch network retries.
  - **Precision Guardrail:** Java math runtime utilizes `BigDecimal` calculations exclusively. Avoids standard primitive types `float` or `double` to protect arithmetic precision matches with DB types.
  - **Performance:** Post-database update, emits lightweight JSON payload to RabbitMQ `swap.events` exchange. Instantly resolves HTTP 200 response to client in under 50ms.
- **Service 2: Market Streaming Service**
  - **Logic:** High/Low Frequency Isolation. External market pricing data maps to low-frequency Redis keys (polled via REST) and high-frequency WebSocket streams routed directly to users.
- **Service 3: AI Async Risk Audit Service (RabbitMQ Consumer)**
  - **Isolation:** Decouples 1-3s external LLM network latency from transactional API paths.
  - **Process:** Consumer thread polls RabbitMQ -> pulls transaction background context -> queries Gemini/OpenRouter -> performs Soft Update appending review text to MySQL `ai_audit_remark` text column.
- **Service 4: Notification Push Service**
  - **Logic:** Consumes completion events from the AI Risk Auditor -> pushes Markdown summary down an active WebSocket connection matching the targeted `userId` to update the notification bell interface.

---

## 4. Database Schema (MySQL DDL)
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    usdc_balance DECIMAL(18, 4) DEFAULT 0.0000,
    btc_balance DECIMAL(18, 8) DEFAULT 0.00000000,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_wallet (user_id)
);

CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type ENUM('DEPOSIT', 'WITHDRAW', 'SWAP') NOT NULL,
    asset_traded VARCHAR(20) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    ai_audit_remark TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_tx (user_id)
);