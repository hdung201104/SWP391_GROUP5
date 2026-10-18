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
    
    // Năng lực và kinh nghiệm trong CV phù hợp với yêu cầu tuyển dụng
    private List<MatchedItem> matchedCompetencies;
    
    // Điểm yếu & Yêu cầu của bài tuyển dụng mà CV chưa đáp ứng
    private List<GapItem> missingCompetencies;
    
    // Gợi ý bộ câu hỏi phỏng vấn thực tế cho HR / Tech Lead
    private List<String> suggestedInterviewQuestions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchedItem {
        private String skill;
        private String cvEvidence;
        private String jobRequirement;
        private String level;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GapItem {
        private String requirement;
        private String cvGap;
        private String risk;
        private String interviewPrompt;
    }
}
