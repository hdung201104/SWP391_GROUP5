package com.hiremate.service;

import com.hiremate.dto.response.AiJobMatchResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Cv;
import com.hiremate.entity.Job;
import com.hiremate.entity.User;

import java.util.List;

public interface AiJobMatchService {
    AiJobMatchResponse calculateAndSaveMatch(Candidate candidate, Job job, Cv cv);
    AiJobMatchResponse getOrCalculateMatch(Long jobId, User candidateUser);
    List<AiJobMatchResponse> getMatchesForJob(Long jobId, User recruiterUser);
    List<AiJobMatchResponse> getMyMatches(User candidateUser);

    /**
     * Gợi ý việc làm cá nhân hóa (Personalized Job Recommendations - UC-14):
     * Trả về danh sách các công việc phù hợp nhất với Ứng viên (matchingScore >= minScore, mặc định >= 50%),
     * được sắp xếp giảm dần theo độ tương thích do AI phân tích.
     */
    List<AiJobMatchResponse> getJobRecommendations(User candidateUser, Float minScore, Integer limit);

    /**
     * Quy trình 2 bước chuẩn công nghiệp (Lọc thô SQL -> Batch AI Scoring -> DB Caching).
     * Trả về danh sách JobResponse hoàn chỉnh kèm điểm matchingScore và aiReasoning đã sắp xếp giảm dần.
     */
    List<com.hiremate.dto.response.JobResponse> getIndustrialJobRecommendations(User candidateUser, Float minScore, Integer limit);

    /**
     * Làm mới gợi ý AI (Re-Match): Xóa cache cũ và chạy lại luồng lọc thô + Batch AI Scoring.
     */
    List<com.hiremate.dto.response.JobResponse> reMatchJobs(User candidateUser);

    /**
     * Tự động quét và tính toán điểm tương thích hàng loạt bất đồng bộ (Asynchronous Batch Processing)
     * cho toàn bộ ứng viên đối với một Job, giúp xử lý quy mô lớn mà không làm nghẽn luồng HTTP.
     */
    java.util.concurrent.CompletableFuture<Integer> recalculateMatchesForJobAsync(Long jobId, User recruiterUser);

    /**
     * Chuyển đổi Entity AiJobMatch sang DTO response kèm đầy đủ dữ liệu 4 trụ cột ATS
     */
    AiJobMatchResponse mapToResponse(com.hiremate.entity.AiJobMatch match);

    /**
     * Báo cáo đánh giá chuyên sâu độc lập giữa Hồ sơ CV của Ứng viên và Bài tuyển dụng (JD).
     */
    com.hiremate.dto.response.AiDetailedEvaluationReport getDetailedCandidateEvaluation(Long jobId, Long candidateId);

    /**
     * Báo cáo đánh giá chuyên sâu độc lập giữa Hồ sơ CV của Ứng viên và Bài tuyển dụng (JD).
     * Hỗ trợ cờ forceRefresh: nếu false thì đọc từ Cache DB (0 token, tức thì); nếu true thì chạy lại AI và lưu mới.
     */
    com.hiremate.dto.response.AiDetailedEvaluationReport getDetailedCandidateEvaluation(Long jobId, Long candidateId, boolean forceRefresh);

    /**
     * Báo cáo đánh giá chuyên sâu độc lập có kiểm tra quyền sở hữu (Chống lỗ hổng IDOR).
     */
    com.hiremate.dto.response.AiDetailedEvaluationReport getDetailedCandidateEvaluation(Long jobId, Long candidateId, boolean forceRefresh, User currentUser);
}
