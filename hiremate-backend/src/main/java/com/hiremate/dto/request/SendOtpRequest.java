package com.hiremate.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendOtpRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Email phải đúng định dạng hợp lệ (Ví dụ: name@example.com)")
    private String email;

    private String purpose = "REGISTER";

    public String getPurpose() {
        return purpose != null && !purpose.isBlank() ? purpose : "REGISTER";
    }
}
