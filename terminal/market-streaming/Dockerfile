FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY . .
RUN mvn clean package -DskipTests -pl market-streaming -am

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/market-streaming/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
