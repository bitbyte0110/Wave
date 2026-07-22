# 01 — Create parent POM and wave-common module

**What to build:** A buildable Maven parent POM at `terminal/pom.xml` and a `wave-common` child module containing all shared plain-Java records (API response shapes and RabbitMQ event payload contracts). `mvn package -pl wave-common` produces a plain JAR with no Spring beans and no JPA annotations.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `terminal/pom.xml` converted to `<packaging>pom</packaging>` parent aggregator inheriting from `spring-boot-starter-parent` 4.1.0
- [x] `<dependencyManagement>` pins JJWT `0.12.6` and `wave-common` so child modules omit version tags
- [x] `<pluginManagement>` declares Lombok annotation processor once for all child modules to inherit
- [x] `terminal/wave-common/pom.xml` created as plain `<packaging>jar</packaging>` with no `spring-boot-maven-plugin`
- [x] `AuthResponse` record in `com.wave.common`
- [x] `BalanceResponse` record in `com.wave.common`
- [x] `SwapEventPayload` record in `com.wave.common`
- [x] `AuditDonePayload` record in `com.wave.common`
- [x] `UserRegisteredPayload` record in `com.wave.common` (stubbed for Step 3)
- [x] `mvn package -pl wave-common --also-make` completes with BUILD SUCCESS
