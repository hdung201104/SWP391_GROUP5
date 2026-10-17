package com.hiremate.dto.response;

import com.hiremate.enums.CompanyStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCompanyResponse {
    private Long id;
    private String name;
    private String shortName;
    private String taxCode;
    private Long recruiterId;
    private String recruiterName;
    private String recruiterEmail;
    private String recruiterPhone;
    private String industry;
    private String scale;
    private String headquarters;
    private String website;
    private String logoUrl;
    private CompanyStatus status;
    private LocalDateTime createdAt;
    private String docUrl;
    private String docName;
    private String licenseNumber;
    private String legalRepresentative;
    private LocalDateTime verifiedAt;
    private String notes;
}

