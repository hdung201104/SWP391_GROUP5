package com.hiremate.controller;

import com.hiremate.dto.request.CompanyUpdateRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.CompanyResponse;
import com.hiremate.entity.User;
import com.hiremate.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<CompanyResponse>> getMyCompany(@AuthenticationPrincipal User user) {
        CompanyResponse response = companyService.getMyCompany(user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/my")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<CompanyResponse>> updateMyCompany(
            @Valid @RequestBody CompanyUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        CompanyResponse response = companyService.updateMyCompany(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin công ty thành công", response));
    }

    @PostMapping(value = "/my/logo/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<CompanyResponse>> uploadLogo(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        CompanyResponse response = companyService.uploadLogo(file, user);
        return ResponseEntity.ok(ApiResponse.ok("Tải lên và cập nhật logo công ty thành công", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyById(@PathVariable Long id) {
        CompanyResponse response = companyService.getCompanyById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
