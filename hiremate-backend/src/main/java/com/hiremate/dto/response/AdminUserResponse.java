package com.hiremate.dto.response;

import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private String company;
    private UserStatus status;
    private LocalDateTime joined;
    private Boolean isEmailVerified;
}
