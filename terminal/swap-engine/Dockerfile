FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY . .
RUN mvn clean package -DskipTests -pl swap-engine -am

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/swap-engine/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
