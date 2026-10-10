package com.hiremate.controller;

import com.hiremate.dto.response.AiJobMatchResponse;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.entity.User;
import com.hiremate.service.AiJobMatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai-matches")
@RequiredArgsConstructor
public class AiJobMatchController {

    private final AiJobMatchService aiJobMatchService;

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<AiJobMatchResponse>> getCandidateJobMatch(
            @PathVariable Long jobId,
            @AuthenticationPrincipal User user
    ) {
        AiJobMatchResponse response = aiJobMatchService.getOrCalculateMatch(jobId, user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<AiJobMatchResponse>>> getMyJobMatches(
            @AuthenticationPrincipal User user
    ) {
        List<AiJobMatchResponse> matches = aiJobMatchService.getMyMatches(user);
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<AiJobMatchResponse>>> getRecommendations(
            @RequestParam(required = false, defaultValue = "50.0") Float minScore,
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @AuthenticationPrincipal User user
    ) {
        List<AiJobMatchResponse> recommendations = aiJobMatchService.getJobRecommendations(user, minScore, limit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách việc làm gợi ý cá nhân hóa thành công", recommendations));
    }

    @GetMapping("/recruiter/job/{jobId}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<List<AiJobMatchResponse>>> getJobMatchesForRecruiter(
            @PathVariable Long jobId,
            @AuthenticationPrincipal User user
    ) {
        List<AiJobMatchResponse> matches = aiJobMatchService.getMatchesForJob(jobId, user);
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @PostMapping("/recruiter/job/{jobId}/recalculate-all")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<String>> recalculateAllMatchesForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal User user
    ) {
        aiJobMatchService.recalculateMatchesForJobAsync(jobId, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã kích hoạt tác vụ quét và tính toán điểm tương thích AI hàng loạt thành công"));
    }
}
