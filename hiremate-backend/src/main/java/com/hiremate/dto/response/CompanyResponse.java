package com.hiremate.dto.response;

import com.hiremate.enums.CompanyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    private Boolean hasLicenseDoc;
    private String legalRepresentative;
    private String rejectionReason;
    private LocalDateTime verifiedAt;
    private CompanyStatus status;
    private Integer activeJobsCount;
    private Long totalJobs;
    private Long totalViews;
    private Long totalHires;
    private List<String> locations;
    private String branchesJson;
    private List<Object> branches;
    private String benefitsJson;
    private List<Object> benefits;
    private LocalDateTime createdAt;
    private List<RecruiterTeamMember> hrTeam;
    private List<RecruiterTeamMember> teamMembers;

    public List<RecruiterTeamMember> getTeamMembers() {
        if (teamMembers != null) return teamMembers;
        return hrTeam;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecruiterTeamMember {
        private Long recruiterId;
        private String fullName;
        private String email;
        private String phone;
        private String position;
        private String department;
        private String branchName;
        private String branchAddress;
        private String avatarUrl;
        private boolean representative;
        private Boolean isRepresentative;
        private Integer activeJobsCount;
        private LocalDateTime joinedAt;

        public Boolean getIsRepresentative() {
            return isRepresentative != null ? isRepresentative : representative;
        }
    }
}
