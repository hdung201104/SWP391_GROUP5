package com.hiremate.repository;

/**
 * @deprecated LOẠI BỎ THEO QUYẾT ĐỊNH KIẾN TRÚC V2
 *
 * Bảng question_bank đã bị XÓA hoàn toàn khỏi hệ thống HireMate AI.
 * Lý do: Câu hỏi phỏng vấn nay được sinh động (real-time) bởi Gemini AI Agent
 * dựa trên CV của ứng viên + JD của vị trí tuyển dụng.
 *
 * Câu hỏi AI-generated được lưu trực tiếp vào:
 *   interview_details.question_text (TEXT column)
 *
 * File này được giữ lại để tham khảo lịch sử. KHÔNG SỬ DỤNG trong code mới.
 *
 * @see com.hiremate.entity.InterviewDetail#questionText
 * @see com.hiremate.repository.InterviewDetailRepository
 */
@Deprecated(since = "2.0", forRemoval = true)
public interface QuestionBankRepository {
    // INTENTIONALLY EMPTY - repository đã bị loại bỏ
    // Migration: V2__refactor_inheritance_and_drop_question_bank.sql
}
