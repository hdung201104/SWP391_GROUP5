package com.hiremate.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyUpdateRequest {

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
    private com.hiremate.enums.CompanyStatus status;
}

