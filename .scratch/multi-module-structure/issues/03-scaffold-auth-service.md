# 03 — Scaffold auth-service child module

**What to build:** A standalone Spring Boot child module `terminal/auth-service/` containing all authentication concerns — `AuthService`, the JWT issuance stack, `AuthController`, and the `User` entity + `UserRepository` (temporarily duplicated from `swap-engine` until Step 3). Running `mvn spring-boot:run -pl auth-service` starts the app and `POST /api/v1/auth/register` and `POST /api/v1/auth/login` respond correctly.

**Blocked by:** 01 (parent POM and wave-common must exist; auth-service depends on `wave-common` for `AuthResponse`).

**Status:** done

- [ ] `terminal/auth-service/pom.xml` created as Spring Boot child module with Web, JPA, Security, MySQL, Lombok, JJWT, and `wave-common` dependencies (no AMQP yet — added in Step 3 when `user.registered` event is introduced)
- [ ] `terminal/pom.xml` `<modules>` updated to include `auth-service`
- [ ] `AuthServiceApplication.java` created in `com.wave.auth` with `@SpringBootApplication` scanning `com.wave.auth`
- [ ] `application.properties` created with MySQL, and JWT config only (no Redis, no RabbitMQ, no Gemini key)
- [ ] `User` entity and `UserRepository` duplicated into `com.wave.auth.entity` / `com.wave.auth.repository` (temporary; Step 3 removes the direct DB write from auth-service)
- [ ] `JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl` migrated to `com.wave.auth.security`
- [ ] `SecurityConfig` created in `com.wave.auth.config` — all `/api/v1/auth/**` routes are public; everything else is authenticated (no wallet routes here)
- [ ] `AuthService` migrated to `com.wave.auth.service`, still provisioning `Wallet` row directly (cross-domain write resolved in Step 3)
- [ ] `AuthController` migrated to `com.wave.auth.controller`, importing `AuthResponse` from `com.wave.common`
- [ ] Request DTOs `RegisterRequest`, `LoginRequest` migrated to `com.wave.auth.controller.dto`
- [ ] `GlobalExceptionHandler` copied into `com.wave.auth.exception`
- [ ] `mvn package -pl auth-service --also-make` completes with BUILD SUCCESS
- [ ] Register and login endpoints verified responding on `auth-service`
