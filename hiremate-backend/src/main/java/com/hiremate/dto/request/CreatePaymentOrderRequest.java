package com.hiremate.dto.request;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentOrderRequest {
    private Long userId;
    private String userEmail;
    private Long planId;
    private String planName;
    private String targetRole; // CANDIDATE or RECRUITER
    private String billingCycle; // MONTHLY or YEARLY
    private String paymentMethod; // VIETQR, MOMO, CARD
    private String voucherCode;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal amount;
    private String orderNote;
}
