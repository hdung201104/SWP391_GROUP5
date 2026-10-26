package com.hiremate.service;

import com.hiremate.dto.ai.AiCvAnalysis;
import com.hiremate.dto.ai.AiInterviewEvaluation;
import com.hiremate.dto.ai.AiSessionSummary;
import com.hiremate.entity.InterviewDetail;

import java.util.List;

public interface GeminiAiService {

    /**
     * Kiểm tra xem cấu hình Gemini API key có hợp lệ và sẵn sàng hay không.
     */
    boolean isAvailable();

    /**
     * Đánh giá câu trả lời phỏng vấn theo vị trí tuyển dụng.
     * Tự động fallback sang thuật toán rule-based nếu API key chưa cấu hình hoặc bị giới hạn (429/timeout).
     */
    AiInterviewEvaluation evaluateInterviewAnswer(String question, String candidateAnswer, String targetPosition);

    /**
     * Đánh giá câu trả lời phỏng vấn trực tiếp từ file ghi âm âm thanh (Multimodal Audio & Intonation Analysis).
     * Bóc tách lời nói (STT), phân tích ngữ điệu, tốc độ nói, khoảng ngập ngừng, độ tự tin và chấm điểm tổng hợp.
     */
    AiInterviewEvaluation evaluateInterviewAnswerWithAudio(String question, String candidateAnswer, byte[] audioBytes, String mimeType, String targetPosition);

    /**
     * Tổng hợp kết quả toàn bộ phiên phỏng vấn và đưa ra nhận xét, điểm yếu, nhiệm vụ rèn luyện.
     */
    AiSessionSummary summarizeInterviewSession(String targetPosition, List<InterviewDetail> details);

    /**
     * Bóc tách và phân tích CV chuyên sâu theo yêu cầu (On-Demand).
     */
    AiCvAnalysis analyzeCv(String cvText);

    /**
     * Bóc tách và phân tích CV trực tiếp từ hình ảnh (Multimodal Vision OCR).
     */
    AiCvAnalysis analyzeCvImage(byte[] imageBytes, String mimeType);

    /**
     * Tự động sinh danh sách câu hỏi phỏng vấn theo vị trí và cấp bậc (Junior, Middle, Senior).
     */
    List<String> generateInterviewQuestions(String targetPosition, String level, int count);

    /**
     * Sinh nhận xét chuyên sâu về độ tương thích giữa ứng viên và công việc cho Nhà tuyển dụng.
     */
    String generateMatchReasoning(String jobTitle, List<String> matchedMandatory, List<String> missingMandatory, Float score);

    /**
     * AI Agent suy luận ngữ cảnh nhiều lượt (Hoàng - Technical Lead 10 năm kinh nghiệm):
     * Phản hồi 1 câu tự nhiên và đào sâu 1 câu hỏi thực chiến dựa trên vị trí, CV và lịch sử hội thoại.
     */
    String generateAdaptiveFollowUpQuestion(String targetPosition, String candidateSkills, List<InterviewDetail> previousDetails, int nextQuestionNumber);

    default String generateAdaptiveFollowUpQuestion(String targetPosition, List<InterviewDetail> previousDetails, int nextQuestionNumber) {
        return generateAdaptiveFollowUpQuestion(targetPosition, "Kỹ năng chuyên môn theo vị trí", previousDetails, nextQuestionNumber);
    }

    /**
     * Phân tích đối sánh ngữ nghĩa chuyên sâu (Semantic Skill Reasoning):
     * Phân tích văn bản CV/Profile để phát hiện các kỹ năng hoặc kinh nghiệm tương đương về mặt ngữ nghĩa
     * ngay cả khi ứng viên không dùng chính xác từ khóa trong JD.
     * Trả về Map chứa: Kỹ năng -> Bằng chứng ngữ nghĩa thực tế trích từ CV.
     */
    java.util.Map<String, String> evaluateSemanticSkillMatches(String jobTitle, String candidateProfileText, List<String> potentialMissingSkills);

    /**
     * Chấm điểm và xếp hạng hàng loạt công việc cho ứng viên (Batch AI Job Matching).
     * BƯỚC 2: Gửi thông tin Hồ sơ Ứng viên và Danh sách Jobs, ép Gemini trả về JSON format chuẩn xác:
     * job_id, matching_score, matched_skills, missing_skills, ai_reasoning.
     */
    List<com.hiremate.dto.ai.AiBatchJobMatchResult> matchJobsBatch(
            String candidateProfileInfo,
            List<com.hiremate.dto.ai.JobBriefForMatching> jobsToScore
    );

    /**
     * Bóc tách và phân tích bản mô tả công việc (JD) tự động bằng AI từ tài liệu Word/PDF/Text:
     * Trích xuất: title, domain, employmentType, salaryMin, salaryMax, salaryText, location,
     * vacanciesCount, deadlineDate, description, requirements, benefits, mandatorySkills, preferredSkills.
     */
    java.util.Map<String, Object> parseJobDescription(String jdText);

    /**
     * Bóc tách và phân tích bản mô tả công việc (JD) tự động từ ảnh chụp màn hình / ảnh chụp văn bản (Multimodal Vision OCR).
     */
    java.util.Map<String, Object> parseJobDescriptionImage(byte[] imageBytes, String mimeType);

    /**
     * Đối soát chuyên sâu bằng Gemini AI giữa Hồ sơ CV thực tế của Ứng viên và Bài tuyển dụng (JD).
     * Phân tích rõ: Điểm tương thích, Năng lực phù hợp (kèm bằng chứng CV), Điểm yếu chưa phù hợp (lỗ hổng),
     * Nhận định chuyên gia và Bộ câu hỏi phỏng vấn thực tế.
     */
    com.hiremate.dto.response.AiDetailedEvaluationReport evaluateCandidateCvAgainstJob(
            String jobTitle,
            String jobRequirements,
            String jobDescription,
            String candidateName,
            String cvText,
            String candidateProfileInfo
    );
}

