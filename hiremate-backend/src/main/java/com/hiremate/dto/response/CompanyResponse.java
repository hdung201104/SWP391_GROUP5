package com.hiremate.dto.response;

import com.hiremate.enums.CompanyStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private List<String> locations;
    private LocalDateTime createdAt;

    public static CompanyResponseBuilder builder() {
        return new CompanyResponseBuilder();
    }

    public static class CompanyResponseBuilder {
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
        private List<String> locations;
        private LocalDateTime createdAt;

        public CompanyResponseBuilder() {}

        public CompanyResponseBuilder companyId(Long companyId) { this.companyId = companyId; return this; }
        public CompanyResponseBuilder recruiterId(Long recruiterId) { this.recruiterId = recruiterId; return this; }
        public CompanyResponseBuilder recruiterName(String recruiterName) { this.recruiterName = recruiterName; return this; }
        public CompanyResponseBuilder companyName(String companyName) { this.companyName = companyName; return this; }
        public CompanyResponseBuilder logoUrl(String logoUrl) { this.logoUrl = logoUrl; return this; }
        public CompanyResponseBuilder website(String website) { this.website = website; return this; }
        public CompanyResponseBuilder address(String address) { this.address = address; return this; }
        public CompanyResponseBuilder companySize(String companySize) { this.companySize = companySize; return this; }
        public CompanyResponseBuilder description(String description) { this.description = description; return this; }
        public CompanyResponseBuilder industry(String industry) { this.industry = industry; return this; }
        public CompanyResponseBuilder taxCode(String taxCode) { this.taxCode = taxCode; return this; }
        public CompanyResponseBuilder licenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; return this; }
        public CompanyResponseBuilder licenseDocUrl(String licenseDocUrl) { this.licenseDocUrl = licenseDocUrl; return this; }
        public CompanyResponseBuilder licenseDocName(String licenseDocName) { this.licenseDocName = licenseDocName; return this; }
        public CompanyResponseBuilder legalRepresentative(String legalRepresentative) { this.legalRepresentative = legalRepresentative; return this; }
        public CompanyResponseBuilder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public CompanyResponseBuilder verifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; return this; }
        public CompanyResponseBuilder status(CompanyStatus status) { this.status = status; return this; }
        public CompanyResponseBuilder activeJobsCount(Integer activeJobsCount) { this.activeJobsCount = activeJobsCount; return this; }
        public CompanyResponseBuilder locations(List<String> locations) { this.locations = locations; return this; }
        public CompanyResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public CompanyResponse build() {
            return new CompanyResponse(
                companyId, recruiterId, recruiterName, companyName, logoUrl, website,
                address, companySize, description, industry, taxCode, licenseNumber,
                licenseDocUrl, licenseDocName, legalRepresentative, rejectionReason,
                verifiedAt, status, activeJobsCount, locations, createdAt
            );
        }
    }
}
