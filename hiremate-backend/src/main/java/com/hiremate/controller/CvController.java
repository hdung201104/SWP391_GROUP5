package com.hiremate.controller;

import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.CvResponse;
import com.hiremate.entity.User;
import com.hiremate.service.CvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cvs")
@RequiredArgsConstructor
public class CvController {

    private final CvService cvService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<CvResponse>> uploadCv(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        CvResponse response = cvService.uploadCv(file, user);
        return ResponseEntity.ok(ApiResponse.ok("CV uploaded successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<CvResponse>>> getMyCvs(@AuthenticationPrincipal User user) {
        List<CvResponse> cvs = cvService.getCandidateCvs(user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(cvs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CvResponse>> getCvById(@PathVariable Long id) {
        CvResponse cv = cvService.getCvById(id);
        return ResponseEntity.ok(ApiResponse.ok(cv));
    }

    @PutMapping("/{id}/default")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<CvResponse>> setDefaultCv(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        CvResponse response = cvService.setDefaultCv(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Default CV updated", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<Void>> deleteCv(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        cvService.deleteCv(id, user);
        return ResponseEntity.ok(ApiResponse.ok("CV deleted successfully", null));
    }
}
