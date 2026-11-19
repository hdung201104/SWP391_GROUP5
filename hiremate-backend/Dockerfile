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
# -Xmx300m: Capping maximum heap at 300MB
# -Xms128m: Initial heap at 128MB
# -Xss256k: Reduced thread stack size to 256KB
# -XX:MaxMetaspaceSize=120m: Guard metaspace from expanding indefinitely
# -XX:+UseSerialGC: Serial GC saves ~40MB RAM overhead compared to G1GC
ENV JAVA_OPTS="-Xmx300m -Xms128m -Xss256k -XX:MaxMetaspaceSize=120m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"
ENV PORT=8088

EXPOSE ${PORT}

# Run Spring Boot application
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
