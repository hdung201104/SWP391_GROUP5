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
            @AuthenticationPrincipal User user
    ) {
        List<ApplicationResponse> apps = applicationService.getJobApplications(jobId, user);
        return ResponseEntity.ok(ApiResponse.ok(apps));
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
}
