package com.hiremate.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDetailedEvaluationReport {
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private Long jobId;
    private String jobTitle;
    private Float matchingScore;
    private Float skillsScore;
    private Float experienceScore;
    private Float educationScore;
    private Float semanticScore;
    private List<String> matchedMandatorySkills;
    private List<String> missingMandatorySkills;
    private List<String> matchedPreferredSkills;
    private List<String> missingPreferredSkills;
    private String matchTier;
    private String overallVerdict;
    private String executiveRecommendation;
    
    // 1. Ưu điểm & Năng lực phù hợp (Kỹ năng, Bằng cấp, Chứng chỉ, Lợi thế từ CV so với JD)
    private List<AdvantageItem> advantages;
    
    // 2. Điểm yếu & Tiêu chí chưa đạt (Kỹ năng còn thiếu, Kinh nghiệm chưa đủ, Chứng chỉ/Bằng cấp chưa đạt chuẩn JD)
    private List<DisadvantageItem> disadvantages;

    // 3. Phân hạng người dùng & Quota báo cáo AI
    private String candidateTier;          // "FREE", "PLUS", "PRO", "ACE"
    private String candidateTierName;      // "Free Candidate", "Practice Plus", "Practice Pro", "Career Ace"
    private Integer reportsRemaining;      // Số lượt phân tích còn lại (-1 nếu không giới hạn)
    private Boolean isUnlimited;           // true nếu là gói trả phí (Plus/Pro/Ace)
    private Boolean isReportCached;        // true nếu báo cáo đọc từ database cache (0ms, 0 AI token)
    private List<String> interviewTips;    // Gợi ý chuẩn bị phỏng vấn trọng tâm dựa trên điểm yếu của CV
    private List<String> cvImprovementSuggestions; // Đề xuất từ khóa và chỉnh sửa CV chuẩn ATS

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdvantageItem {
        private String category;    // "Kỹ năng chuyên môn" | "Bằng cấp & Học vấn" | "Chứng chỉ chuyên môn" | "Lợi thế nổi bật từ CV"
        private String title;       // Tiêu đề ưu điểm
        private String cvEvidence;  // Minh chứng cụ thể trích từ CV
        private String jobMatch;    // Yêu cầu tương ứng trong bài tuyển dụng được đáp ứng
        private String assessment;  // Đánh giá: "Đạt chuẩn" | "Phù hợp tốt" | "Vượt trội"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisadvantageItem {
        private String category;       // "Kỹ năng còn thiếu" | "Kinh nghiệm chưa đủ" | "Chứng chỉ & Bằng cấp chưa đạt"
        private String title;          // Tiêu đề điểm yếu / lỗ hổng
        private String jobRequirement; // Mức yêu cầu của nhà tuyển dụng giao
        private String cvShortfall;    // Hiện trạng trong CV (chưa có, chưa đủ điểm hoặc chưa đạt điều kiện)
        private String severity;       // "Chưa đạt điều kiện" | "Cần lưu ý" | "Có thể đào tạo"
    }
}
