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
     * Tự động quét và tính toán điểm tương thích hàng loạt bất đồng bộ (Asynchronous Batch Processing)
     * cho toàn bộ ứng viên đối với một Job, giúp xử lý quy mô lớn mà không làm nghẽn luồng HTTP.
     */
    java.util.concurrent.CompletableFuture<Integer> recalculateMatchesForJobAsync(Long jobId, User recruiterUser);
}
