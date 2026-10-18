package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateVoucherRequest {
    @NotBlank(message = "Mã voucher không được để trống")
    private String code;
    @com.fasterxml.jackson.annotation.JsonAlias({"orderAmount", "totalAmount"})
    private BigDecimal amount;
    private String userRole;
    private Long planId;
    private String planName;

    public ValidateVoucherRequest(String code, BigDecimal amount) {
        this.code = code;
        this.amount = amount;
    }
}
