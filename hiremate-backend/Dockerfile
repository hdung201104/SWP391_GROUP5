# ========================================================
# HIREMATE AI BACKEND - DOCKERFILE FOR RENDER CLOUD (FREE TIER)
# Multi-stage build with Eclipse Temurin 21 JRE & 512MB RAM Guard
# ========================================================

# Stage 1: Build stage with Maven and JDK 21
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy backend source code and build executable jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lean runtime stage with JRE 21
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# JVM memory management strictly optimized for Render Free Tier (512MB RAM limit)
# -XX:+UseContainerSupport: Detect cgroups container memory limits
# -XX:MaxRAMPercentage=75.0: Allocate max 384MB heap out of 512MB, leaving 128MB for metaspace & OS threads
# -Xss512k: Reduce thread stack size to conserve memory
# -XX:+ExitOnOutOfMemoryError: Fail-fast and trigger immediate restart instead of freezing
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Xss512k -XX:+ExitOnOutOfMemoryError"
ENV PORT=8088

EXPOSE ${PORT}

# Run Spring Boot application
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
