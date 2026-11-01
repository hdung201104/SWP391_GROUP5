package com.hiremate.dto.request;

import com.hiremate.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
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

    // Mật khẩu người dùng tự thiết lập để có thể đăng nhập bằng Email + Password
    private String password;

    // Mã OTP xác thực gửi về email
    private String otp;

    // Trường bổ sung cho Ứng viên (CANDIDATE)
    private String headline;
    private String dateOfBirth;
    private String address;
    private String bio;
    private String githubUrl;

    // Trường bổ sung cho Nhà tuyển dụng (RECRUITER)
    private Long companyId;
    private String companyName;
    private String position;
    private String department;
    private String branchName;
    private String branchAddress;
    private String companyAddress;
    private String taxCode;
    private String website;
    private String companySize;
    private String licenseNumber;
    private String licenseDocUrl;
    private String licenseDocName;
    private String legalRepresentative;
}
