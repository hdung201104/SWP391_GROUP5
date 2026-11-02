package com.hiremate.controller;

import com.hiremate.dto.request.CompanyUpdateRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.CompanyResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.User;
import com.hiremate.exception.BadRequestException;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.service.CompanyService;
import com.hiremate.service.FileStorageService;
import com.hiremate.service.impl.CompanyServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final FileStorageService fileStorageService;
    private final CompanyRepository companyRepository;

    private void validateLicenseFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Tệp Giấy phép kinh doanh không được để trống");
        }
        long maxBytes = 15 * 1024 * 1024L; // 15MB
        if (file.getSize() > maxBytes) {
            throw new BadRequestException("Dung lượng tệp Giấy phép kinh doanh vượt quá giới hạn 15MB");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Tên tệp không hợp lệ");
        }
        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".pdf") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png") && !lower.endsWith(".webp")) {
            throw new BadRequestException("Chỉ chấp nhận tệp định dạng .pdf, .jpg, .jpeg, .png, .webp");
        }
    }

    @PostMapping(value = "/public/license/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadPublicLicense(
            @RequestParam("file") MultipartFile file
    ) {
        validateLicenseFile(file);
        String uploadedUrl = fileStorageService.storeFile(file, "licenses");
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "business_license.pdf";
        return ResponseEntity.ok(ApiResponse.ok("Tải giấy phép kinh doanh lên hệ thống thành công", Map.of(
                "url", uploadedUrl,
                "fileName", fileName
        )));
    }

    private ResponseEntity<byte[]> renderLicense(String docUrl, String docName, boolean inline) {
        if (!CompanyServiceImpl.isValidLicenseDocUrl(docUrl)) {
            return ResponseEntity.notFound().build();
        }
        byte[] bytes = fileStorageService.loadFileAsBytes(docUrl);
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.notFound().build();
        }

        String fn = (docName != null && !docName.isBlank()) ? docName : "Giay_Phep_Kinh_Doanh.pdf";
        String lowerUrl = docUrl.toLowerCase();
        String lowerFn = fn.toLowerCase();

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (bytes.length >= 4 && bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46) {
            mediaType = MediaType.APPLICATION_PDF;
            if (!lowerFn.endsWith(".pdf")) fn += ".pdf";
        } else if (bytes.length >= 4 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
            mediaType = MediaType.IMAGE_PNG;
            if (!lowerFn.endsWith(".png")) fn += ".png";
        } else if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            mediaType = MediaType.IMAGE_JPEG;
            if (!lowerFn.endsWith(".jpg") && !lowerFn.endsWith(".jpeg")) fn += ".jpg";
        } else if (lowerUrl.endsWith(".webp") || lowerFn.endsWith(".webp") ||
                (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P')) {
            mediaType = MediaType.parseMediaType("image/webp");
            if (!lowerFn.endsWith(".webp")) fn += ".webp";
        } else if (lowerUrl.endsWith(".pdf") || lowerFn.endsWith(".pdf")) {
            mediaType = MediaType.APPLICATION_PDF;
            if (!lowerFn.endsWith(".pdf")) fn += ".pdf";
        } else if (lowerUrl.endsWith(".png") || lowerFn.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
            if (!lowerFn.endsWith(".png")) fn += ".png";
        } else if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerFn.endsWith(".jpg") || lowerFn.endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
            if (!lowerFn.endsWith(".jpg") && !lowerFn.endsWith(".jpeg")) fn += ".jpg";
        }

        ContentDisposition disposition = inline
                ? ContentDisposition.inline().filename(fn, StandardCharsets.UTF_8).build()
                : ContentDisposition.attachment().filename(fn, StandardCharsets.UTF_8).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(mediaType)
                .body(bytes);
    }

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

    @PostMapping(value = "/my/logo/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<CompanyResponse>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        CompanyResponse response = companyService.uploadLogo(file, user);
        return ResponseEntity.ok(ApiResponse.ok("Tải lên và cập nhật logo công ty thành công", response));
    }

    @PostMapping(value = "/my/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCompanyImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "workplace") String folder,
            @AuthenticationPrincipal User user
    ) {
        String uploadedUrl = fileStorageService.storeFile(file, folder);
        return ResponseEntity.ok(ApiResponse.ok("Tải ảnh lên Cloudinary thành công", Map.of("url", uploadedUrl)));
    }

    @PostMapping(value = "/my/license/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBusinessLicense(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        validateLicenseFile(file);
        String uploadedUrl = fileStorageService.storeFile(file, "licenses");
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "business_license.pdf";
        companyService.saveLicenseDoc(user, uploadedUrl, fileName);
        return ResponseEntity.ok(ApiResponse.ok("Tải giấy phép kinh doanh lên hệ thống thành công", Map.of(
                "url", uploadedUrl,
                "fileName", fileName
        )));
    }

    @GetMapping("/my/license/preview")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<byte[]> previewMyLicense(@AuthenticationPrincipal User user) {
        CompanyResponse myCompany = companyService.getMyCompany(user);
        if (myCompany == null) {
            return ResponseEntity.notFound().build();
        }
        return renderLicense(myCompany.getLicenseDocUrl(), myCompany.getLicenseDocName(), true);
    }

    @GetMapping("/my/license/download")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<byte[]> downloadMyLicense(@AuthenticationPrincipal User user) {
        CompanyResponse myCompany = companyService.getMyCompany(user);
        if (myCompany == null) {
            return ResponseEntity.notFound().build();
        }
        return renderLicense(myCompany.getLicenseDocUrl(), myCompany.getLicenseDocName(), false);
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.RecruiterRepository recruiterRepository;

    private void checkLicenseAccess(Company company, User user) {
        if (user == null) {
            throw new SecurityException("Vui lòng đăng nhập để truy cập tài liệu này");
        }
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return;
        }
        if (user.getRole() == com.hiremate.enums.UserRole.RECRUITER) {
            if (company.getRecruiterId() != null && company.getRecruiterId().equals(user.getUserId())) {
                return;
            }
            if (recruiterRepository != null) {
                var recruiterOpt = recruiterRepository.findById(user.getUserId());
                if (recruiterOpt.isPresent() && recruiterOpt.get().getCompany() != null
                        && recruiterOpt.get().getCompany().getCompanyId().equals(company.getCompanyId())) {
                    return;
                }
            }
        }
        throw new SecurityException("Bạn không có quyền truy cập Giấy phép kinh doanh của doanh nghiệp này.");
    }

    @GetMapping("/{id:[0-9]+}/license/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<byte[]> previewLicense(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Company company = companyRepository.findById(id).orElse(null);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        checkLicenseAccess(company, user);
        return renderLicense(company.getLicenseDocUrl(), company.getLicenseDocName(), true);
    }

    @GetMapping("/{id:[0-9]+}/license/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public ResponseEntity<byte[]> downloadLicense(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Company company = companyRepository.findById(id).orElse(null);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        checkLicenseAccess(company, user);
        return renderLicense(company.getLicenseDocUrl(), company.getLicenseDocName(), false);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getAllCompanies() {
        List<CompanyResponse> response = companyService.getAllCompanies();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<List<com.hiremate.dto.response.CompanyLookupResponse>>> lookupCompanies(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "taxCode", required = false) String taxCode
    ) {
        List<com.hiremate.dto.response.CompanyLookupResponse> result = companyService.lookupCompanies(keyword, taxCode);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyById(@PathVariable Long id) {
        CompanyResponse response = companyService.getCompanyById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/my/join-requests/{identifier}/approve")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<String>> approveJoinRequest(
            @PathVariable String identifier,
            @AuthenticationPrincipal User user
    ) {
        companyService.approveJoinRequest(identifier, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã phê duyệt thành viên gia nhập công ty thành công."));
    }

    @PostMapping("/my/join-requests/{identifier}/reject")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<String>> rejectJoinRequest(
            @PathVariable String identifier,
            @AuthenticationPrincipal User user
    ) {
        companyService.rejectJoinRequest(identifier, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối yêu cầu gia nhập công ty."));
    }

    @GetMapping("/my/pending-join-requests")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPendingJoinRequests(
            @AuthenticationPrincipal User user
    ) {
        List<Map<String, Object>> requests = companyService.getPendingJoinRequests(user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách yêu cầu gia nhập thành công", requests));
    }

    @GetMapping("/my/members")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCompanyMembers(@AuthenticationPrincipal User user) {
        List<Map<String, Object>> members = companyService.getCompanyMembers(user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách thành viên công ty thành công", members));
    }

    @PostMapping("/my/members/invite")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<ApiResponse<String>> inviteMember(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user
    ) {
        String email = body != null ? body.get("email") : null;
        String role = body != null ? body.get("role") : null;
        String branchName = body != null ? body.get("branchName") : null;
        companyService.inviteMember(email, role, branchName, user);
        return ResponseEntity.ok(ApiResponse.ok("Đã liên kết và mời thành viên vào đội ngũ công ty thành công."));
    }
}
