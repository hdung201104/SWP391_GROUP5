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

# JVM + Linux native memory strictly tuned for Render Free Tier (512MB hard RAM limit)
# - MALLOC_ARENA_MAX=2: Prevents glibc multi-arena RSS bloat (~40-80MB saved in Docker)
# - -Xmx220m: Hard heap cap at 220MB (leaving ~290MB headroom for Metaspace/CodeCache/OS/PDFBox)
# - -Xms96m: Lean initial heap so container boots fast under low RAM
# - -XX:MaxMetaspaceSize=105m: Cap Metaspace strictly
# - -XX:ReservedCodeCacheSize=36m: Cap JIT CodeCache (saves ~40MB vs default)
# - -XX:MaxDirectMemorySize=32m: Cap NIO direct buffers
# - -XX:+UseSerialGC -XX:MinHeapFreeRatio=15 -XX:MaxHeapFreeRatio=35: Aggressively return free heap to OS
ENV MALLOC_ARENA_MAX=2
ENV JAVA_OPTS="-Xmx220m -Xms96m -Xss256k -XX:MaxMetaspaceSize=105m -XX:ReservedCodeCacheSize=36m -XX:MaxDirectMemorySize=32m -XX:+UseSerialGC -XX:MinHeapFreeRatio=15 -XX:MaxHeapFreeRatio=35 -XX:+ExitOnOutOfMemoryError"
ENV PORT=8088

EXPOSE ${PORT}

# Run Spring Boot application
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
