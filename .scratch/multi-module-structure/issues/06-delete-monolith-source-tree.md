# 06 — Delete old monolith source tree

**What to build:** Remove all source files from the original `terminal/src/` directory tree. After this ticket, `mvn package` on the parent POM produces four independently executable Spring Boot JARs — `swap-engine`, `auth-service`, `risk-audit-worker`, `market-streaming` — with no leftover monolith sources. The build stays green.

**Blocked by:** 02, 03, 04, 05 — all four service modules must be fully scaffolded and passing their own builds before the monolith source tree is deleted.

**Status:** done

- [ ] All files under `terminal/src/main/java/com/wave/terminal/` deleted
- [ ] `terminal/src/main/resources/application.properties` deleted (each service module has its own)
- [ ] `terminal/src/test/` deleted (each service module owns its own tests)
- [ ] `terminal/src/` directory itself removed (now empty)
- [ ] Parent `terminal/pom.xml` verified to have no `<dependencies>` or `<build><plugins>` referencing the old monolith sources
- [ ] `mvn package` from `terminal/` completes with BUILD SUCCESS, producing JARs for all four service modules
- [ ] Reactor summary shows all four modules: `[INFO] wave-common ... SUCCESS`, `[INFO] swap-engine ... SUCCESS`, `[INFO] auth-service ... SUCCESS`, `[INFO] risk-audit-worker ... SUCCESS`, `[INFO] market-streaming ... SUCCESS`
