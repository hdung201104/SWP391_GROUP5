package com.hiremate.dto.request;

import com.hiremate.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleCompleteRegistrationRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String avatarUrl;

    @NotNull(message = "Vui lòng chọn vai trò (Ứng viên hoặc Nhà tuyển dụng)")
    private UserRole role;

    private String phone;

    // Trường bổ sung cho Ứng viên (CANDIDATE)
    private String headline;

    // Trường bổ sung cho Nhà tuyển dụng (RECRUITER)
    private String companyName;
    private String position;
}
