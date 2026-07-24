FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY . .
RUN mvn clean package -DskipTests -pl risk-audit-worker -am

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/risk-audit-worker/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
