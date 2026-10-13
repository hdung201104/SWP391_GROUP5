package com.hiremate.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Component
@Slf4j
public class PayOSClient {

    @Value("${payos.client-id:}")
    private String clientId;

    @Value("${payos.api-key:}")
    private String apiKey;

    @Value("${payos.checksum-key:}")
    private String checksumKey;

    @Value("${payos.return-url:http://localhost:3000/#/payment/success}")
    private String returnUrl;

    @Value("${payos.cancel-url:http://localhost:3000/#/payment/cancel}")
    private String cancelUrl;

    private static final String PAYOS_ENDPOINT = "https://api-merchant.payos.vn/v2/payment-requests";
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && checksumKey != null && !checksumKey.isBlank();
    }

    @Data
    @Builder
    public static class PayOSLinkResult {
        private Long orderCode;
        private Integer amount;
        private String description;
        private String accountNumber;
        private String accountName;
        private String bin;
        private String qrCode;
        private String checkoutUrl;
        private String status;
    }

    /**
     * Tạo liên kết và mã QR thanh toán Napas247 chính thức qua PayOS
     */
    public PayOSLinkResult createPaymentLink(Long orderCode, int amount, String description, String buyerName, String buyerEmail) {
        if (!isConfigured()) {
            log.warn("PayOS credentials chưa được cấu hình trong application.yml hoặc .env");
            return null;
        }

        try {
            // Chuẩn hóa mô tả (PayOS yêu cầu tối đa 25 ký tự)
            String safeDescription = description != null ? description.trim() : "HM" + orderCode;
            if (safeDescription.length() > 25) {
                safeDescription = safeDescription.substring(0, 25);
            }

            // Tạo chữ ký HMAC-SHA256 theo chuẩn PayOS
            Map<String, Object> dataToSort = new TreeMap<>();
            dataToSort.put("amount", amount);
            dataToSort.put("cancelUrl", cancelUrl);
            dataToSort.put("description", safeDescription);
            dataToSort.put("orderCode", orderCode);
            dataToSort.put("returnUrl", returnUrl);

            StringBuilder dataToSign = new StringBuilder();
            for (Map.Entry<String, Object> entry : dataToSort.entrySet()) {
                if (dataToSign.length() > 0) {
                    dataToSign.append("&");
                }
                dataToSign.append(entry.getKey()).append("=").append(entry.getValue());
            }

            String signature = hmacSha256(dataToSign.toString(), checksumKey);

            Map<String, Object> bodyMap = new HashMap<>(dataToSort);
            bodyMap.put("signature", signature);
            if (buyerName != null && !buyerName.isBlank()) {
                bodyMap.put("buyerName", buyerName);
            }
            if (buyerEmail != null && !buyerEmail.isBlank()) {
                bodyMap.put("buyerEmail", buyerEmail);
            }

            String requestJson = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PAYOS_ENDPOINT))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId.trim())
                    .header("x-api-key", apiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String code = root.path("code").asText();
                if ("00".equals(code)) {
                    JsonNode data = root.path("data");
                    return PayOSLinkResult.builder()
                            .orderCode(data.path("orderCode").asLong())
                            .amount(data.path("amount").asInt())
                            .description(data.path("description").asText())
                            .accountNumber(data.path("accountNumber").asText())
                            .accountName(data.path("accountName").asText())
                            .bin(data.path("bin").asText())
                            .qrCode(data.path("qrCode").asText())
                            .checkoutUrl(data.path("checkoutUrl").asText())
                            .status(data.path("status").asText())
                            .build();
                } else {
                    log.error("PayOS API error code: {}, desc: {}", code, root.path("desc").asText());
                }
            } else {
                log.error("PayOS HTTP error: status={}, body={}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Lỗi khi gọi PayOS createPaymentLink: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * Lấy thông tin thanh toán trực tiếp từ PayOS API theo orderCode
     */
    public PayOSLinkResult getPaymentLinkInformation(Long orderCode) {
        if (!isConfigured() || orderCode == null) {
            return null;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PAYOS_ENDPOINT + "/" + orderCode))
                    .timeout(Duration.ofSeconds(10))
                    .header("x-client-id", clientId.trim())
                    .header("x-api-key", apiKey.trim())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String code = root.path("code").asText();
                if ("00".equals(code)) {
                    JsonNode data = root.path("data");
                    return PayOSLinkResult.builder()
                            .orderCode(data.path("orderCode").asLong())
                            .amount(data.path("amount").asInt())
                            .description(data.path("description").asText())
                            .accountNumber(data.path("accountNumber").asText())
                            .accountName(data.path("accountName").asText())
                            .bin(data.path("bin").asText())
                            .status(data.path("status").asText())
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("Không thể kiểm tra PayOS status cho order {}: {}", orderCode, e.getMessage());
        }
        return null;
    }

    /**
     * Xác thực chữ ký webhook từ PayOS
     */
    public boolean verifyWebhookSignature(Map<String, Object> data, String signature) {
        if (checksumKey == null || checksumKey.isBlank()) {
            return true; // Nếu chưa cài checksum key trong dev thì bỏ qua kiểm tra nghiêm ngặt
        }
        if (signature == null || signature.isBlank()) {
            return false;
        }
        try {
            Map<String, Object> sorted = new TreeMap<>(data);
            StringBuilder dataToSign = new StringBuilder();
            for (Map.Entry<String, Object> entry : sorted.entrySet()) {
                if (dataToSign.length() > 0) {
                    dataToSign.append("&");
                }
                dataToSign.append(entry.getKey()).append("=").append(entry.getValue());
            }
            String computed = hmacSha256(dataToSign.toString(), checksumKey);
            return computed.equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Lỗi khi xác thực chữ ký PayOS webhook: {}", e.getMessage());
            return false;
        }
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hmacBytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tính toán HmacSHA256: " + e.getMessage(), e);
        }
    }
}
