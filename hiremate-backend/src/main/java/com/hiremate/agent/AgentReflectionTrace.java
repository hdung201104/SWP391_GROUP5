package com.hiremate.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Lưu vết quá trình Suy luận & Tự phản biện (ReAct / Reflection Loop) của AI Agent.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentReflectionTrace {

    /** Giai đoạn 1: Suy luận và phác thảo đánh giá ban đầu */
    private String initialThought;

    /** Giai đoạn 2: Tự phản biện (Kiểm tra ảo giác, bám sát barem, kiểm tra prompt injection) */
    private String selfCritique;

    /** Điểm số đã qua hiệu chỉnh sau khi phản biện */
    private Float calibratedScore;

    /** Danh sách công cụ hệ thống mà Agent đã tự động gọi để kiểm chứng dữ liệu */
    @Builder.Default
    private List<String> toolsInvoked = new ArrayList<>();

    /** Nhận xét và quyết định cuối cùng */
    private String finalDecision;

    /** Mức độ tin cậy của đánh giá: HIGH, MEDIUM, LOW */
    @Builder.Default
    private String confidenceLevel = "HIGH";

    /** Cờ cảnh báo: true nếu câu trả lời nghi vấn gian lận hoặc thiếu căn cứ chuyên môn */
    @Builder.Default
    private Boolean requiresHumanReview = false;

    /** Lý giải chi tiết về mức độ tin cậy của Agent */
    private String confidenceReason;
}
