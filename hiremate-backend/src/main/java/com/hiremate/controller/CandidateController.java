package com.hiremate.controller;

import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.CandidateProfileResponse;
import com.hiremate.entity.User;
import com.hiremate.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping("/{candidateId}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN', 'CANDIDATE')")
    public ResponseEntity<ApiResponse<CandidateProfileResponse>> getCandidateProfile(
            @PathVariable Long candidateId,
            @AuthenticationPrincipal User user
    ) {
        CandidateProfileResponse response = candidateService.getCandidateProfile(candidateId, user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy hồ sơ chi tiết ứng viên thành công", response));
    }
}
