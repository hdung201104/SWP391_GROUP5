package com.hiremate.controller;

import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.FileUploadResponse;
import com.hiremate.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "general") String folder
    ) {
        log.info(">> [FileController] Nhận yêu cầu upload file: {}, size: {} bytes, folder: {}", 
                file.getOriginalFilename(), file.getSize(), folder);

        String fileUrl = fileStorageService.storeFile(file, folder);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String fileType = "unknown";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            fileType = originalName.substring(dotIndex + 1).toLowerCase();
        }

        FileUploadResponse response = FileUploadResponse.builder()
                .fileUrl(fileUrl)
                .fileName(originalName)
                .fileSizeBytes(file.getSize())
                .fileType(fileType)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Tải file lên thành công", response));
    }
}
