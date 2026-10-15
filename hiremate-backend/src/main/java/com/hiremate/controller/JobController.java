package com.hiremate.controller;

import com.hiremate.dto.request.JobCreateRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.JobResponse;
import com.hiremate.entity.User;
import com.hiremate.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final com.hiremate.service.AiJobMatchService aiJobMatchService;

    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getJobRecommendations(
            @RequestParam(required = false, defaultValue = "0.0") Float minMatch,
            @RequestParam(required = false, defaultValue = "20") Integer limit,
            @AuthenticationPrincipal User user
    ) {
        List<JobResponse> recommendations = aiJobMatchService.getIndustrialJobRecommendations(user, minMatch, limit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách việc làm gợi ý cá nhân hóa AI thành công", recommendations));
    }

    @PostMapping("/re-match")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<JobResponse>>> reMatchJobs(
            @AuthenticationPrincipal User user
    ) {
        List<JobResponse> recommendations = aiJobMatchService.reMatchJobs(user);
        return ResponseEntity.ok(ApiResponse.ok("Làm mới và tính toán lại gợi ý việc làm AI thành công", recommendations));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobResponse>>> getJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (page != null && size != null) {
            com.hiremate.dto.response.PageResponse<JobResponse> paged = jobService.getPublishedJobsPaged(keyword, location, page, size, "createdAt", "desc");
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(paged.getTotalItems()))
                    .header("X-Total-Pages", String.valueOf(paged.getTotalPages()))
                    .header("X-Current-Page", String.valueOf(paged.getPage()))
                    .body(ApiResponse.ok(paged.getItems()));
        }

        List<JobResponse> jobs = jobService.getPublishedJobs(keyword, location);
        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }

    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.PageResponse<JobResponse>>> getJobsPaged(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) com.hiremate.enums.EmploymentType employmentType,
            @RequestParam(required = false) java.math.BigDecimal minSalary,
            @RequestParam(required = false) java.math.BigDecimal maxSalary,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        com.hiremate.dto.response.PageResponse<JobResponse> result =
                jobService.getPublishedJobsPagedAdvanced(keyword, location, employmentType, minSalary, maxSalary, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách việc làm phân trang thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> getJobById(@PathVariable Long id) {
        JobResponse job = jobService.getJobById(id);
        return ResponseEntity.ok(ApiResponse.ok(job));
    }

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> createJob(
            @Valid @RequestBody JobCreateRequest request,
            @AuthenticationPrincipal User user
    ) {
        JobResponse job = jobService.createJob(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Job posted successfully", job));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody JobCreateRequest request,
            @AuthenticationPrincipal User user
    ) {
        JobResponse job = jobService.updateJob(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Job updated successfully", job));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<Void>> closeJob(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        jobService.closeJob(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Job closed successfully", null));
    }

    @GetMapping("/recruiter/my")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getMyPostedJobs(@AuthenticationPrincipal User user) {
        List<JobResponse> jobs = jobService.getRecruiterJobs(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }

    @GetMapping("/recruiter/my/paged")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.PageResponse<JobResponse>>> getMyPostedJobsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User user
    ) {
        com.hiremate.dto.response.PageResponse<JobResponse> result =
                jobService.getRecruiterJobsPaged(user.getUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách việc làm đã đăng phân trang thành công", result));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJobStatus(
            @PathVariable Long id,
            @RequestParam("status") com.hiremate.enums.JobStatus status,
            @AuthenticationPrincipal User user
    ) {
        JobResponse response = jobService.updateJobStatus(id, status, user);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái tin tuyển dụng thành công", response));
    }

    @PostMapping("/{id}/clone")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<JobResponse>> cloneJob(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        JobResponse cloned = jobService.cloneJob(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Sao chép tin tuyển dụng thành công", cloned));
    }
}
