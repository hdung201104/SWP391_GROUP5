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
    private String taxCode;
    private String licenseNumber;
    private String licenseDocUrl;
    private String licenseDocName;
    private String legalRepresentative;
    private String rejectionReason;
    private LocalDateTime verifiedAt;
    private CompanyStatus status;
    private Integer activeJobsCount;
    private java.util.List<String> locations;
    private LocalDateTime createdAt;
}

