# Wave Terminal - Project State

## 🏗️ 1. Infrastructure (Completed)
* **Docker Compose (`docker-compose.yml`):** Deployed MySQL 8.0 (Port 3307), Redis 7.0 (Port 6379), and RabbitMQ (Ports 5672/15672).
* **Network Status:** All containers running successfully on the local environment without port conflicts.

## ⚙️ 2. Backend Base Setup (Completed)
* **Framework:** Spring Boot 3.3.x (Java 17, Maven).
* **Location:** `E:\Development\Wave\terminal\`
* **Dependencies:** Spring Web, Spring Data JPA, MySQL Driver, Spring for RabbitMQ, Lombok.
* **Configuration:** `application.properties` configured for Docker port 3307 mapping, JPA `update` DDL, and RabbitMQ defaults.

## 🗃️ 3. Data Entities (Completed)
* **Package:** `com.wave.terminal.entity`
* **Models Built:**
  * `TransactionType.java`: Enum (`DEPOSIT`, `WITHDRAW`, `SWAP`).
  * `User.java`: Base user metadata and credentials.
  * `Wallet.java`: Holds `usdcBalance` (18,4 precision) and `btcBalance` (18,8 precision).
  * `Transaction.java`: Immutable ledger for financial audit history.

## 🔒 4. Repository Layer (Completed)
* **Package:** `com.wave.terminal.repository`
* **Interfaces Built:**
  * `UserRepository.java`
  * `TransactionRepository.java`
  * `WalletRepository.java`: Implemented crucial pessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on `findByUserIdForUpdate` to prevent concurrent double-spending.

## 🧠 5. Service & Messaging Layer (Completed)
* **Packages:** `com.wave.terminal.service`, `com.wave.terminal.config`
* **Classes Built:**
  * `RabbitMQConfig.java`: Configured `swap.events` FanoutExchange using `JacksonJsonMessageConverter`.
  * `WalletService.java`: Implemented `@Transactional` logic for `simulateDeposit`, `executeWithdraw`, and `executeSwap`. Includes strict post-lock balance validations and RabbitMQ async event publishing.

## 🚀 6. Next Pending Task
* **Target:** Build the REST Controller Layer.
* **Action:** Create `WalletController.java` inside `com.wave.terminal.controller` to expose `/deposit`, `/withdraw`, `/swap`, and `/balance/{userId}` endpoints to the Next.js frontend.