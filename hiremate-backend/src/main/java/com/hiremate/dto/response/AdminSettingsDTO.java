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
    private String vietqrAccountNumber = "VQRQAMWSJ4104";

    @Builder.Default
    private String vietqrAccountHolder = "HOANG NGOC DUNG";

    @Builder.Default
    private Boolean autoEmailNotify = true;

    @Builder.Default
    private Boolean maintenanceMode = false;

    @Builder.Default
    private String payosClientId = "e2d0f50b-68aa-4cd9-b83f-72c4b3293db4";

    @Builder.Default
    private String payosApiKey = "425f9314-c0b3-4373-a332-7855f1d9e9d4";

    @Builder.Default
    private String payosChecksumKey = "007567eb3a0cf7565f8c4dca7a780336db04c33ec2fc8e0b7d9312dbe5fa447e";

    @Builder.Default
    private String payosWebhookUrl = "http://localhost:8088/api/v1/payment/payos-webhook";

    @Builder.Default
    private Boolean payosAutoApproveEnabled = true;
}
