package com.hiremate.dto.response;

import com.hiremate.enums.CompanyStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyResponse {
    private Long companyId;
    private Long recruiterId;
    private String recruiterName;
    private String companyName;
    private String logoUrl;
    private String website;
    private String address;
    private String companySize;
    private String description;
    private String industry;
    private CompanyStatus status;
    private LocalDateTime createdAt;
}
