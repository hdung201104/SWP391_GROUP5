package com.hiremate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * @deprecated LOẠI BỎ THEO QUYẾT ĐỊNH KIẾN TRÚC V2
 *
 * Bảng question_bank và Entity này đã bị XÓA khỏi hệ thống HireMate AI.
 * Lý do kiến trúc: Không thể xây dựng ngân hàng câu hỏi tĩnh đủ bao quát
 * cho tất cả ngành nghề, vị trí và công nghệ trên thị trường.
 *
 * Thay thế: Gemini AI Agent tự sinh câu hỏi động (real-time) theo ngữ cảnh
 * CV ứng viên + Job Description, lưu vào:
 *   interview_details.question_text (TEXT)
 *
 * File này được giữ lại chỉ để tham khảo lịch sử và KHÔNG được map vào DB.
 *
 * @see com.hiremate.entity.InterviewDetail
 */
@Deprecated(since = "2.0", forRemoval = true)
// @Entity  <-- INTENTIONALLY COMMENTED OUT – table đã bị xóa khỏi DB
// @Table(name = "question_bank")
public class QuestionBank {
    // INTENTIONALLY EMPTY – Entity này không còn được dùng
}
