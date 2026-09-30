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

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobResponse>>> getJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location
    ) {
        List<JobResponse> jobs = jobService.getPublishedJobs(keyword, location);
        return ResponseEntity.ok(ApiResponse.ok(jobs));
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
}
