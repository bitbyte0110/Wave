# Wave | High-Throughput Crypto Asset & Execution Engine

Wave is an event-driven, microservices-based digital asset platform built for low-latency market data streaming, atomic balance ledger execution, and real-time AI risk auditing.

The system decouples high-frequency market data ingestion from transactional database paths using asynchronous message queues, optimistic/pessimistic lock strategies, and an isolated LLM processing pipeline.

---

## Key Architecture & Features

### 1. High-Concurrency Transaction Engine
* **Atomic Financial Operations:** Prevents double-spending and race conditions under heavy load using explicit MySQL pessimistic locking (`SELECT ... FOR UPDATE`).
* **Strict Balance Validation:** Financial assertions are calculated after acquiring database locks within `@Transactional` boundaries.
* **Idempotency Safeguards:** All balance-mutating endpoints enforce an `X-Idempotency-Key` (UUIDv4) header mapped through Redis key-value stores to safely intercept network retries.
* **Arbitrary-Precision Arithmetic:** Implements Java `BigDecimal` end-to-end to eliminate floating-point precision loss in ledger calculations.

### 2. Distributed Asynchronous Pipeline
* **Decoupled AI Risk Auditing:** Sub-50ms execution responses are achieved by offloading external LLM analysis to background consumers via **RabbitMQ**.
* **Real-time Push Notifications:** Audit reports and execution receipts are pushed down targeted WebSocket channels upon completion without blocking the primary transactional path.

### 3. Low-Latency Market Data Architecture
* **Frequency Isolation:** Segregates static macro data polling (Redis-cached) from high-frequency ticker updates (WebSocket streaming).
* **Targeted UI Rendering:** Differential state triggers localized UI re-renders on rate flashes, maintaining low CPU consumption on the client.

---

## System Architecture

```
                       +------------------------+
                       |   Next.js 14 Frontend  |
                       |  (TypeScript / React)  |
                       +-----------+------------+
                                   |
                         HTTP / WebSocket
                                   |
                                   v
                       +------------------------+
                       |   Spring Boot Engine   |
                       |  (Transaction / Auth)  |
                       +---+----------------+---+
                           |                |
             Pessimistic   |                | Async Event
               Locking     v                v
                     +----------+    +--------------+
                     |  MySQL   |    |   RabbitMQ   |
                     |  Ledger  |    | Event Broker |
                     +----------+    +-------+------+
                                             |
                                     Consume |
                                             v
                                     +---------------+
                                     | AI Risk Audit |
                                     |   Service     |
                                     +---------------+
```

---

## Tech Stack

### Core Runtime & Frameworks
* **Frontend:** React, Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI
* **Backend:** Java 17+, Spring Boot (Web REST, Data JPA, WebSockets)
* **Data Stores:** MySQL 8.0 (Immutable Financial Ledger), Redis (Market State Cache & Idempotency)
* **Messaging Broker:** RabbitMQ
* **Infrastructure & Containerization:** Docker, Docker Compose, Kubernetes (Minikube)

---

## Module Overview

| Module | Core Responsibility | Technical Implementation |
| :--- | :--- | :--- |
| **Auth Gateway** | JWT Authentication | Generates secure tokens, persisted via HTTP-only cookies/headers for REST & WS handshakes. |
| **Market Console** | Live Ticker & Macro Stream | Combines REST polling (Redis cache) with high-frequency WebSocket streams. |
| **Audit Ledger** | Balance & Asset Analytics | Visualizes immutable transaction logs (`DEPOSIT`, `WITHDRAW`, `SWAP`) with Recharts. |
| **Instant Swap Panel** | Rate Locking & Execution | Guarantees 5s rate quotes before emitting async balance-swap directives to the backend. |
| **Asset Network Gateway** | On-Chain / Ingress Testing | Handles multi-stage confirmation flows and strict client-side balance assertions prior to execution. |

---

## Getting Started

### Prerequisites
* Docker Desktop & Kubernetes (`minikube`) enabled
* Java 17 or higher
* Node.js 18+

### Quick Start (Local Containerized Environment)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bitbyte0110/Wave.git
   cd wave
   ```

2. **Start Infrastructure Services (MySQL, Redis, RabbitMQ):**
   ```bash
   docker-compose up -d
   ```

3. **Run Backend Service:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Run Frontend Application:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access Application:**
   Navigate to `http://localhost:3000` in your web browser.
