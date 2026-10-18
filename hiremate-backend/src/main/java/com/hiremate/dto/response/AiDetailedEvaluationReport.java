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
    private String matchTier;
    private String overallVerdict;
    private String executiveRecommendation;
    
    // 1. Ưu điểm & Năng lực phù hợp (Kỹ năng, Bằng cấp, Chứng chỉ, Lợi thế từ CV so với JD)
    private List<AdvantageItem> advantages;
    
    // 2. Điểm yếu & Tiêu chí chưa đạt (Kỹ năng còn thiếu, Kinh nghiệm chưa đủ, Chứng chỉ/Bằng cấp chưa đạt chuẩn JD)
    private List<DisadvantageItem> disadvantages;

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
