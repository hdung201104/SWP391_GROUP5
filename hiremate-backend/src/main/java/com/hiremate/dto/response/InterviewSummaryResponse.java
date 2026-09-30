package com.hiremate.dto.response;

import com.hiremate.enums.InterviewSessionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về thông tin tổng hợp của một phiên phỏng vấn AI.
 * THAY ĐỔI KIẾN TRÚC V2:
 * - candidateId: vẫn giữ nhưng lấy từ candidate.getCandidateId()
 * - jobId: lấy từ job.getJobId()
 * - createdAt -> startedAt: phản ánh đúng semantic của timestamp
 * - THÊM completedAt
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSummaryResponse {
    private Long sessionId;
    /** candidate_id = user_id của ứng viên (Shared PK pattern) */
    private Long candidateId;
    /** job_id nullable – null nếu là phiên luyện tập tự do */
    private Long jobId;
    private String targetPosition;
    private InterviewSessionType sessionType;
    private Float overallScore;
    private String overallFeedback;
    private String weaknessSummary;
    private String recommendedTasks;
    /** Điểm cải thiện so với phiên gốc (chỉ có khi sessionType = PRACTICE_RETRY) */
    private Float improvementDelta;
    private List<InterviewDetailResponse> details;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
