package com.hiremate.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherValidationResponse {
    private Boolean valid;
    private Long voucherId;
    private String code;
    private Integer discountPercent;
    private BigDecimal maxDiscountAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
}
