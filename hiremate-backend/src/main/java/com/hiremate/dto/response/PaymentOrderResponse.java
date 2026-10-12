package com.hiremate.dto.response;

import com.hiremate.enums.PaymentOrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderResponse {
    private Long orderId;
    private String orderCode;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userRole;
    private Long planId;
    private String planName;
    private BigDecimal amount;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private String voucherCode;
    private PaymentOrderStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;

    // VietQR / PayOS transfer payload
    private String qrCodeUrl;
    private String checkoutUrl;
    private String bankName;
    private String bankAccount;
    private String accountHolder;
    private String transferContent;
}
