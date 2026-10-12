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
    private BigDecimal amount;
}
