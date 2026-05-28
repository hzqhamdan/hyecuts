# Stage 1: Build the Spring Boot application
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy gradle wrapper and configuration files first to cache dependencies
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Fix Windows CRLF line endings and grant execution rights to the wrapper
RUN sed -i 's/\r$//' gradlew
RUN chmod +x gradlew

# Download dependencies (this step is cached unless build.gradle changes)
# We run a simple task to trigger dependency download
RUN ./gradlew dependencies --no-daemon || true

# Copy the actual source code
COPY src src

# Build the executable JAR
RUN ./gradlew bootJar --no-daemon

# Stage 2: Create the minimal production runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the built JAR from the builder stage
# We use a pattern that matches the fat JAR but excludes the -plain.jar
COPY --from=builder /app/build/libs/*[!plain].jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
