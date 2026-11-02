package com.hiremate.dto.response;

import com.hiremate.enums.CompanyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyLookupResponse {
    private Long companyId;
    private String companyName;
    private String taxCode;
    private String logoUrl;
    private String website;
    private String address;
    private String companySize;
    private CompanyStatus status;
    private String branchesJson;
    private List<Map<String, Object>> branches;
}
