package com.hiremate.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminSettingsDTO {
    @Builder.Default
    private Integer mandatoryWeight = 70;

    @Builder.Default
    private Integer preferredWeight = 30;

    @Builder.Default
    private Boolean autoPublishVerified = true;

    @Builder.Default
    private Boolean requireGpkdToPost = true;

    @Builder.Default
    private Boolean moderateNewJobs = true;

    @Builder.Default
    private String aiInterviewDifficulty = "STANDARD";

    @Builder.Default
    private Integer interviewMaxQuestions = 5;

    @Builder.Default
    private Integer interviewResponseSeconds = 120;

    @Builder.Default
    private String interviewerPersona = "TECH_LEAD";

    @Builder.Default
    private String aiModel = "gemini-1.5-flash";

    @Builder.Default
    private Integer candidateFreeInterviewsPerDay = 3;

    @Builder.Default
    private Integer recruiterFreeJobPostsPerMonth = 3;

    @Builder.Default
    private String vietqrBankName = "MBBank - Ngân hàng TMCP Quân Đội";

    @Builder.Default
    private String vietqrAccountNumber = "0988123456";

    @Builder.Default
    private String vietqrAccountHolder = "CONG TY CP HIREMATE AI";

    @Builder.Default
    private Boolean autoEmailNotify = true;

    @Builder.Default
    private Boolean maintenanceMode = false;
}
