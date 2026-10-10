package com.hiremate.controller;

import com.hiremate.dto.request.ApplyRequest;
import com.hiremate.dto.request.UpdateApplicationStatusRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.ApplicationResponse;
import com.hiremate.entity.User;
import com.hiremate.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final com.hiremate.service.CandidateService candidateService;

    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.CandidateProfileResponse>> getCandidateProfile(
            @PathVariable Long candidateId,
            @AuthenticationPrincipal User user
    ) {
        com.hiremate.dto.response.CandidateProfileResponse response = candidateService.getCandidateProfile(candidateId, user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy hồ sơ chi tiết ứng viên thành công", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> applyToJob(
            @Valid @RequestBody ApplyRequest request,
            @AuthenticationPrincipal User user
    ) {
        ApplicationResponse response = applicationService.applyToJob(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Application submitted successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getMyApplications(@AuthenticationPrincipal User user) {
        List<ApplicationResponse> apps = applicationService.getCandidateApplications(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(apps));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getJobApplications(
            @PathVariable Long jobId,
            @RequestParam(required = false) com.hiremate.enums.ApplicationStatus status,
            @AuthenticationPrincipal User user
    ) {
        List<ApplicationResponse> apps = applicationService.getJobApplications(jobId, status, user);
        return ResponseEntity.ok(ApiResponse.ok(apps));
    }

    @PutMapping("/batch-status")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> batchUpdateStatus(
            @Valid @RequestBody com.hiremate.dto.request.BatchUpdateStatusRequest request,
            @AuthenticationPrincipal User user
    ) {
        List<ApplicationResponse> responses = applicationService.batchUpdateApplicationStatus(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái hàng loạt thành công (" + responses.size() + " hồ sơ)", responses));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest request,
            @AuthenticationPrincipal User user
    ) {
        ApplicationResponse response = applicationService.updateApplicationStatus(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Application stage updated", response));
    }

    @GetMapping({ "/{id}/timeline", "/{id}/pipeline-logs" })
    public ResponseEntity<ApiResponse<List<com.hiremate.dto.response.PipelineLogResponse>>> getApplicationTimeline(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem tiến trình ứng tuyển"));
        }
        List<com.hiremate.dto.response.PipelineLogResponse> timeline = applicationService.getApplicationTimeline(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử tiến trình ứng tuyển thành công", timeline));
    }

    @PutMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> withdrawApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        ApplicationResponse response = applicationService.withdrawApplication(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Rút đơn ứng tuyển thành công", response));
    }

    @GetMapping("/job/{jobId}/export")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<byte[]> exportCandidates(
            @PathVariable Long jobId,
            @AuthenticationPrincipal User user
    ) {
        byte[] csvData = applicationService.exportJobApplicationsCsv(jobId, user);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"candidates_job_" + jobId + ".csv\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
