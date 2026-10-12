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
     * AI Agent suy luận ngữ cảnh nhiều lượt (Multi-Turn Adaptive Agent Reasoning):
     * Phân tích các câu hỏi và câu trả lời trước đó trong phiên để tự động sinh câu hỏi tiếp theo
     * xoáy sâu vào các công nghệ và giải pháp mà ứng viên vừa trình bày.
     */
    String generateAdaptiveFollowUpQuestion(String targetPosition, List<InterviewDetail> previousDetails, int nextQuestionNumber);

    /**
     * Phân tích đối sánh ngữ nghĩa chuyên sâu (Semantic Skill Reasoning):
     * Phân tích văn bản CV/Profile để phát hiện các kỹ năng hoặc kinh nghiệm tương đương về mặt ngữ nghĩa
     * ngay cả khi ứng viên không dùng chính xác từ khóa trong JD.
     * Trả về Map chứa: Kỹ năng -> Bằng chứng ngữ nghĩa thực tế trích từ CV.
     */
    java.util.Map<String, String> evaluateSemanticSkillMatches(String jobTitle, String candidateProfileText, List<String> potentialMissingSkills);
}
