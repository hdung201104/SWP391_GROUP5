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
import com.hiremate.service.FileStorageService;

@RestController
@RequestMapping("/api/v1/cvs")
@RequiredArgsConstructor
public class CvController {

    private final CvService cvService;
    private final FileStorageService fileStorageService;

    @GetMapping("/{id}/preview")
    public ResponseEntity<byte[]> previewCv(@PathVariable Long id) {
        CvResponse cv = cvService.getCvById(id);
        byte[] bytes = fileStorageService.loadFileAsBytes(cv.getFileUrl());
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.notFound().build();
        }
        String fn = cv.getFileName() != null ? cv.getFileName() : "cv.pdf";
        if (cv.getFileUrl() != null && cv.getFileUrl().toLowerCase().endsWith(".docx") && !fn.toLowerCase().endsWith(".docx")) {
            fn = fn + ".docx";
        } else if (cv.getFileUrl() != null && cv.getFileUrl().toLowerCase().endsWith(".pdf") && !fn.toLowerCase().endsWith(".pdf")) {
            fn = fn + ".pdf";
        }
        String contentType = "application/pdf";
        if (fn.toLowerCase().endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (fn.toLowerCase().endsWith(".doc")) {
            contentType = "application/msword";
        }
        String contentDisposition = org.springframework.http.ContentDisposition.inline()
                .filename(fn, java.nio.charset.StandardCharsets.UTF_8)
                .build().toString();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .contentType(MediaType.parseMediaType(contentType))
                .body(bytes);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadCv(@PathVariable Long id) {
        CvResponse cv = cvService.getCvById(id);
        byte[] bytes = fileStorageService.loadFileAsBytes(cv.getFileUrl());
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.notFound().build();
        }
        String fn = cv.getFileName() != null ? cv.getFileName() : "cv.pdf";
        if (cv.getFileUrl() != null && cv.getFileUrl().toLowerCase().endsWith(".docx") && !fn.toLowerCase().endsWith(".docx")) {
            fn = fn + ".docx";
        } else if (cv.getFileUrl() != null && cv.getFileUrl().toLowerCase().endsWith(".pdf") && !fn.toLowerCase().endsWith(".pdf")) {
            fn = fn + ".pdf";
        }
        String contentType = "application/octet-stream";
        if (fn.toLowerCase().endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (fn.toLowerCase().endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else if (fn.toLowerCase().endsWith(".doc")) {
            contentType = "application/msword";
        }
        String contentDisposition = org.springframework.http.ContentDisposition.attachment()
                .filename(fn, java.nio.charset.StandardCharsets.UTF_8)
                .build().toString();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .contentType(MediaType.parseMediaType(contentType))
                .body(bytes);
    }

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

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<CvResponse>> updateCv(
            @PathVariable Long id,
            @RequestBody com.hiremate.dto.response.CvParsedDTO updateDto,
            @AuthenticationPrincipal User user
    ) {
        CvResponse response = cvService.updateCv(id, updateDto, user);
        return ResponseEntity.ok(ApiResponse.ok("CV updated successfully", response));
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

    @PostMapping("/{id}/analyze")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<CvResponse>> analyzeCv(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        CvResponse response = cvService.analyzeCv(id, user);
        return ResponseEntity.ok(ApiResponse.ok("CV analyzed successfully by AI", response));
    }

    @PutMapping("/{id}/rename")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<CvResponse>> renameCv(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        String newName = request.get("fileName");
        if (newName == null || newName.isBlank()) {
            newName = request.get("name");
        }
        CvResponse response = cvService.renameCv(id, newName, user);
        return ResponseEntity.ok(ApiResponse.ok("CV renamed successfully", response));
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
