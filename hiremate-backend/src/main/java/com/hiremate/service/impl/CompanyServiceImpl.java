package com.hiremate.service.impl;

import com.hiremate.dto.request.CompanyUpdateRequest;
import com.hiremate.dto.response.CompanyResponse;
import com.hiremate.entity.Company;
import com.hiremate.entity.Job;
import com.hiremate.entity.Application;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.User;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.service.CompanyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final RecruiterRepository recruiterRepository;
    private final com.hiremate.repository.JobRepository jobRepository;
    private final com.hiremate.repository.ApplicationRepository applicationRepository;
    private final com.hiremate.service.FileStorageService fileStorageService;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.repository.UserRepository userRepository;

    private Recruiter getOrCreateRecruiter(User recruiterUser) {
        return recruiterRepository.findById(recruiterUser.getUserId()).orElseGet(() -> {
            Recruiter newRecruiter = Recruiter.builder()
                    .recruiterId(recruiterUser.getUserId())
                    .user(recruiterUser)
                    .position("HR Recruiter")
                    .build();
            return recruiterRepository.save(newRecruiter);
        });
    }

    @Override
    @Transactional
    public CompanyResponse getMyCompany(User recruiterUser) {
        Recruiter recruiter = getOrCreateRecruiter(recruiterUser);

        Company company = recruiter.getCompany();
        if (company == null) {
            // Check by recruiter_id column fallback
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId()).orElse(null);
        }

        if (company == null) {
            // Tự động khởi tạo hồ sơ doanh nghiệp mặc định nếu chưa có
            company = Company.builder()
                    .recruiterId(recruiter.getRecruiterId())
                    .companyName(recruiterUser.getFullName() + "'s Company")
                    .status(CompanyStatus.PENDING)
                    .build();
            company = companyRepository.save(company);
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);
        } else if (recruiter.getCompany() == null) {
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);
        }

        return mapToResponse(company, recruiterUser.getFullName());
    }

    public static boolean isValidLicenseDocUrl(String url) {
        return url != null && !url.isBlank() && !url.startsWith("blob:") && !url.contains("images.unsplash.com");
    }

    @Override
    @Transactional
    public CompanyResponse updateMyCompany(CompanyUpdateRequest request, User recruiterUser) {
        Recruiter recruiter = getOrCreateRecruiter(recruiterUser);

        Company company = recruiter.getCompany();
        if (company == null) {
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId())
                    .orElse(null);
        }

        String finalName = request.getCompanyName() != null && !request.getCompanyName().isBlank()
                ? request.getCompanyName().trim()
                : (company != null ? company.getCompanyName() : (recruiterUser.getFullName() + "'s Company"));
        String finalTaxCode = request.getTaxCode() != null && !request.getTaxCode().isBlank()
                ? request.getTaxCode().trim()
                : null;

        // 1. Kiểm tra xem taxCode hoặc companyName có trùng với một Company khác đã tồn tại trong DB không
        Company existingOtherCompany = null;
        if (finalTaxCode != null) {
            existingOtherCompany = companyRepository.findFirstByTaxCodeIgnoreCase(finalTaxCode).orElse(null);
        }
        if (existingOtherCompany == null && finalName != null && !finalName.endsWith("'s Company")) {
            existingOtherCompany = companyRepository.findFirstByCompanyNameIgnoreCase(finalName).orElse(null);
        }

        if (existingOtherCompany != null && (company == null || !existingOtherCompany.getCompanyId().equals(company.getCompanyId()))) {
            // Có một công ty đã tồn tại khác với công ty hiện tại
            Company oldDraftCompany = company;
            company = existingOtherCompany;
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);

            // Nếu công ty cũ của HR chỉ là công ty nháp mới tạo ("...'s Company" hoặc chưa có GPKD), xóa đi để tránh trùng lặp
            if (oldDraftCompany != null && (oldDraftCompany.getCompanyName().endsWith("'s Company") || oldDraftCompany.getLicenseDocUrl() == null)) {
                List<Recruiter> otherRecruitersInOld = recruiterRepository.findAllByCompany_CompanyId(oldDraftCompany.getCompanyId());
                if (otherRecruitersInOld.isEmpty()) {
                    try {
                        companyRepository.delete(oldDraftCompany);
                    } catch (Exception ex) {
                        log.warn("Không thể xóa công ty nháp cũ ID {}: {}", oldDraftCompany.getCompanyId(), ex.getMessage());
                    }
                }
            }
        }

        boolean isNewRealDocUploaded = false;
        String newDocUrl = request.getLicenseDocUrl();
        boolean hasValidNewDoc = isValidLicenseDocUrl(newDocUrl);

        // Multi-Branch Permission Check:
        boolean isHeadOrOwner = (company != null && company.getRecruiterId() != null && company.getRecruiterId().equals(recruiterUser.getUserId()))
                || Boolean.TRUE.equals(recruiter.getIsHeadRecruiter())
                || (recruiterUser.getRole() != null && "ADMIN".equalsIgnoreCase(recruiterUser.getRole().name()));

        String effectiveBenefitsJson = request.getBenefitsJson();
        if (effectiveBenefitsJson == null && request.getBenefits() != null) {
            try {
                effectiveBenefitsJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(request.getBenefits());
            } catch (Exception ignored) {}
        }

        if (company == null) {
            // Create company if not already existing
            company = Company.builder()
                    .recruiterId(recruiter.getRecruiterId())
                    .companyName(finalName)
                    .logoUrl(request.getLogoUrl())
                    .website(request.getWebsite())
                    .address(request.getAddress())
                    .companySize(request.getCompanySize())
                    .description(request.getDescription())
                    .industry(request.getIndustry())
                    .taxCode(finalTaxCode)
                    .licenseNumber(request.getLicenseNumber() != null ? request.getLicenseNumber() : (finalTaxCode != null ? finalTaxCode + "-GPKD" : null))
                    .licenseDocUrl(hasValidNewDoc ? newDocUrl : null)
                    .licenseDocName(hasValidNewDoc ? request.getLicenseDocName() : null)
                    .legalRepresentative(request.getLegalRepresentative() != null ? request.getLegalRepresentative() : recruiterUser.getFullName())
                    .branchesJson(request.getBranchesJson())
                    .benefitsJson(effectiveBenefitsJson)
                    .status(hasValidNewDoc ? CompanyStatus.PENDING : CompanyStatus.PENDING)
                    .build();
            company = companyRepository.save(company);
            recruiter.setCompany(company);
            recruiter.setIsHeadRecruiter(true);
            recruiterRepository.save(recruiter);
            if (hasValidNewDoc) isNewRealDocUploaded = true;
        } else {
            // Luôn cho phép cập nhật branchesJson và benefitsJson
            if (request.getBranchesJson() != null && !request.getBranchesJson().isBlank()) {
                company.setBranchesJson(request.getBranchesJson());
            }
            if (request.getBenefits() != null) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    company.setBenefitsJson(mapper.writeValueAsString(request.getBenefits()));
                } catch (Exception ex) {
                    log.warn("Error serializing benefits: {}", ex.getMessage());
                }
            } else if (request.getBenefitsJson() != null) {
                company.setBenefitsJson(request.getBenefitsJson());
            }

            // Chỉ Head Recruiter / Owner (hoặc khi công ty chưa có thông tin ban đầu) mới được cập nhật thông tin cấp toàn công ty
            if (isHeadOrOwner || company.getAddress() == null || company.getIndustry() == null) {
                if (request.getLogoUrl() != null) company.setLogoUrl(request.getLogoUrl());
                if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
                if (request.getAddress() != null) company.setAddress(request.getAddress());
                if (request.getCompanySize() != null) company.setCompanySize(request.getCompanySize());
                if (request.getDescription() != null) company.setDescription(request.getDescription());
                if (request.getIndustry() != null) company.setIndustry(request.getIndustry());
            }

            boolean wasVerified = (company.getStatus() == CompanyStatus.VERIFIED || company.getStatus() == CompanyStatus.ACTIVE);

            if (isHeadOrOwner) {
                // Head Recruiter có toàn quyền sửa Tên, MST, GPKD
                company.setCompanyName(finalName);
                boolean taxCodeChanged = finalTaxCode != null && company.getTaxCode() != null && !finalTaxCode.trim().equalsIgnoreCase(company.getTaxCode().trim());
                if (finalTaxCode != null) company.setTaxCode(finalTaxCode);
                if (request.getLicenseNumber() != null) company.setLicenseNumber(request.getLicenseNumber());

                if (hasValidNewDoc) {
                    if (!newDocUrl.equals(company.getLicenseDocUrl())) {
                        isNewRealDocUploaded = true;
                    }
                    company.setLicenseDocUrl(newDocUrl);
                    if (request.getLicenseDocName() != null) company.setLicenseDocName(request.getLicenseDocName());
                }

                if (request.getLegalRepresentative() != null) company.setLegalRepresentative(request.getLegalRepresentative());

                if (wasVerified) {
                    if (taxCodeChanged || isNewRealDocUploaded) {
                        log.info(">> [CompanyService] Doanh nghiệp đã VERIFIED vừa đổi Mã số thuế/GPKD mới, tự động chuyển về PENDING chờ Admin thẩm định lại.");
                        company.setStatus(CompanyStatus.PENDING);
                        company.setRejectionReason(null);
                        isNewRealDocUploaded = true;
                    }
                } else if (request.getStatus() == CompanyStatus.PENDING && isValidLicenseDocUrl(company.getLicenseDocUrl())) {
                    company.setStatus(CompanyStatus.PENDING);
                    company.setRejectionReason(null);
                    isNewRealDocUploaded = true;
                } else if (isNewRealDocUploaded) {
                    company.setStatus(CompanyStatus.PENDING);
                    company.setRejectionReason(null);
                } else if (request.getStatus() != null && request.getStatus() != CompanyStatus.VERIFIED) {
                    company.setStatus(request.getStatus());
                }
            } else {
                // HR Chi nhánh: KHÔNG được đổi Tên công ty gốc, MST hay GPKD khi công ty đã VERIFIED
                // Giữ nguyên trạng thái VERIFIED, không reset về PENDING
                log.info(">> [CompanyService] HR Chi nhánh '{}' cập nhật thông tin công ty/chi nhánh mà không thay đổi pháp lý công ty mẹ.", recruiterUser.getEmail());
            }

            company = companyRepository.save(company);
            if (recruiter.getCompany() == null) {
                recruiter.setCompany(company);
                recruiterRepository.save(recruiter);
            }
        }

        // Gửi thông báo cho Recruiter và Ban Quản Trị (Admin) nếu thực sự có file GPKD mới được tải lên và đang chờ duyệt
        if (company.getStatus() == CompanyStatus.PENDING && isNewRealDocUploaded && notificationService != null) {
            try {
                notificationService.createNotification(
                        recruiterUser.getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Hồ sơ xác thực GPKD đã được tiếp nhận",
                        "Hồ sơ Giấy phép kinh doanh của " + company.getCompanyName() + " đã được gửi đến Ban Quản Trị. Vui lòng đợi trong vòng 24h để được xét duyệt.",
                        company.getCompanyId(),
                        "companies"
                );
                String taxCodeInfo = company.getTaxCode() != null ? " (Mã số thuế: " + company.getTaxCode() + ")" : "";
                notificationService.notifyAdmins(
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Yêu cầu xét duyệt Giấy phép kinh doanh mới",
                        "Doanh nghiệp \"" + company.getCompanyName() + "\"" + taxCodeInfo + " vừa gửi hồ sơ pháp lý & GPKD. Vui lòng kiểm tra và xét duyệt.",
                        company.getCompanyId(),
                        "companies"
                );
            } catch (Exception ex) {
                log.warn("Lỗi gửi thông báo hồ sơ công ty: {}", ex.getMessage());
            }
        }

        log.info("Company profile updated for recruiter: {}, companyId: {}, status: {}", recruiterUser.getEmail(), company.getCompanyId(), company.getStatus());
        return mapToResponse(company, recruiterUser.getFullName());
    }

    @Override
    @Transactional
    public void saveLicenseDoc(User recruiterUser, String docUrl, String docName) {
        Recruiter recruiter = getOrCreateRecruiter(recruiterUser);
        Company company = recruiter.getCompany();
        if (company == null) {
            company = Company.builder()
                    .recruiterId(recruiter.getRecruiterId())
                    .companyName(recruiterUser.getFullName() + "'s Company")
                    .status(CompanyStatus.PENDING)
                    .build();
            company = companyRepository.save(company);
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);
        }
        if (isValidLicenseDocUrl(docUrl)) {
            company.setLicenseDocUrl(docUrl);
            company.setLicenseDocName(docName);
        }
        companyRepository.save(company);
        if (recruiter.getCompany() == null) {
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);
        }
        log.info("Attached license doc to company ID {}: {}. Waiting for explicit verification submission.", company.getCompanyId(), docName);
    }

    @Override
    @Transactional
    public CompanyResponse uploadLogo(org.springframework.web.multipart.MultipartFile file, User recruiterUser) {
        Recruiter recruiter = getOrCreateRecruiter(recruiterUser);

        Company company = recruiter.getCompany();
        if (company == null) {
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId())
                    .orElse(null);
        }

        if (company == null) {
            throw new IllegalArgumentException("Vui lòng tạo thông tin công ty trước khi tải logo!");
        }

        // Tải ảnh logo lên thư mục 'logos' trên Cloudinary CDN
        String logoUrl = fileStorageService.storeFile(file, "logos");

        // Xóa logo cũ nếu có
        if (company.getLogoUrl() != null && !company.getLogoUrl().isBlank()) {
            fileStorageService.deleteFile(company.getLogoUrl());
        }

        company.setLogoUrl(logoUrl);
        Company saved = companyRepository.save(company);

        log.info(">> [CompanyService] Logo công ty ID {} đã được cập nhật thành công: {}", company.getCompanyId(), logoUrl);
        return mapToResponse(saved, recruiterUser.getFullName());
    }

    @Override
    public CompanyResponse getCompanyById(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found with ID: " + companyId));
        return mapToResponse(company, null);
    }

    @Override
    public List<CompanyResponse> getAllCompanies() {
        List<Company> companies = companyRepository.findAll();
        if (companies.isEmpty()) {
            return Collections.emptyList();
        }

        List<com.hiremate.entity.Job> publishedJobs = jobRepository.findByStatus(com.hiremate.enums.JobStatus.PUBLISHED);

        Map<Long, List<com.hiremate.entity.Job>> companyJobsMap = publishedJobs.stream()
                .filter(j -> j.getCompany() != null && j.getCompany().getCompanyId() != null)
                .collect(Collectors.groupingBy(j -> j.getCompany().getCompanyId()));

        return companies.stream()
                .filter(c -> c.getStatus() == null || c.getStatus() == CompanyStatus.ACTIVE || c.getStatus() == CompanyStatus.VERIFIED)
                .map(c -> {
                    List<com.hiremate.entity.Job> cJobs = companyJobsMap.getOrDefault(c.getCompanyId(), Collections.emptyList());
                    List<String> locations = cJobs.stream()
                            .map(com.hiremate.entity.Job::getLocation)
                            .filter(Objects::nonNull)
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .distinct()
                            .collect(Collectors.toList());

                    boolean hasDoc = isValidLicenseDocUrl(c.getLicenseDocUrl());
                    return CompanyResponse.builder()
                            .companyId(c.getCompanyId())
                            .recruiterId(c.getRecruiterId())
                            .companyName(c.getCompanyName())
                            .logoUrl(c.getLogoUrl())
                            .website(c.getWebsite())
                            .address(c.getAddress())
                            .companySize(c.getCompanySize())
                            .description(c.getDescription())
                            .industry(c.getIndustry())
                            .status(c.getStatus())
                            .licenseDocUrl(hasDoc ? c.getLicenseDocUrl() : null)
                            .licenseDocName(hasDoc ? c.getLicenseDocName() : null)
                            .hasLicenseDoc(hasDoc)
                            .activeJobsCount(cJobs.size())
                            .locations(locations)
                            .createdAt(c.getCreatedAt())
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getActiveJobsCount() != null ? b.getActiveJobsCount() : 0,
                                                  a.getActiveJobsCount() != null ? a.getActiveJobsCount() : 0))
                .collect(Collectors.toList());
    }

    @Override
    public List<com.hiremate.dto.response.CompanyLookupResponse> lookupCompanies(String keyword, String taxCode) {
        String cleanKw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanTax = (taxCode != null && !taxCode.trim().isEmpty()) ? taxCode.trim() : null;

        if (cleanKw == null && cleanTax == null) {
            return Collections.emptyList();
        }

        List<Company> companies = companyRepository.lookupCompanies(cleanKw, cleanTax);
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        return companies.stream().map(c -> {
            List<Map<String, Object>> branchList = new java.util.ArrayList<>();
            if (c.getBranchesJson() != null && !c.getBranchesJson().trim().isEmpty()) {
                try {
                    branchList = mapper.readValue(c.getBranchesJson(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                } catch (Exception ex) {
                    log.warn("Error parsing branchesJson for company {}: {}", c.getCompanyId(), ex.getMessage());
                }
            }
            if (branchList.isEmpty()) {
                Map<String, Object> hq = new java.util.HashMap<>();
                hq.put("id", "hq-" + c.getCompanyId());
                hq.put("branchName", "Trụ sở chính");
                hq.put("address", c.getAddress() != null ? c.getAddress() : "");
                hq.put("scale", c.getCompanySize() != null ? c.getCompanySize() : "50-100");
                hq.put("hotline", "");
                hq.put("isHeadquarters", true);
                branchList.add(hq);
            }

            return com.hiremate.dto.response.CompanyLookupResponse.builder()
                    .companyId(c.getCompanyId())
                    .companyName(c.getCompanyName())
                    .taxCode(c.getTaxCode())
                    .logoUrl(c.getLogoUrl())
                    .website(c.getWebsite())
                    .address(c.getAddress())
                    .companySize(c.getCompanySize())
                    .status(c.getStatus())
                    .branchesJson(c.getBranchesJson())
                    .branches(branchList)
                    .build();
        }).collect(Collectors.toList());
    }

    private CompanyResponse mapToResponse(Company c, String recruiterName) {
        List<CompanyResponse.RecruiterTeamMember> teamMembers = Collections.emptyList();
        if (c.getCompanyId() != null) {
            List<Recruiter> recruiters = recruiterRepository.findAllByCompany_CompanyId(c.getCompanyId());
            teamMembers = recruiters.stream().map(r -> {
                User u = r.getUser();
                boolean isRep = Boolean.TRUE.equals(r.getIsHeadRecruiter()) || Objects.equals(r.getRecruiterId(), c.getRecruiterId());
                int activeJobs = 0;
                try {
                    activeJobs = (int) jobRepository.countActiveJobsByRecruiterId(r.getRecruiterId());
                } catch (Exception ignored) {}

                return CompanyResponse.RecruiterTeamMember.builder()
                        .recruiterId(r.getRecruiterId())
                        .fullName(u != null ? u.getFullName() : "Chuyên viên HR")
                        .email(u != null ? u.getEmail() : "")
                        .phone(u != null ? u.getPhone() : "")
                        .position(r.getPosition() != null ? r.getPosition() : "Talent Acquisition Specialist")
                        .department(r.getDepartment() != null ? r.getDepartment() : "Phòng Tuyển dụng & Nhân sự")
                        .branchName(r.getBranchName() != null ? r.getBranchName() : "Trụ sở chính")
                        .branchAddress(r.getBranchAddress() != null ? r.getBranchAddress() : c.getAddress())
                        .avatarUrl(u != null ? u.getAvatarUrl() : null)
                        .representative(isRep)
                        .isRepresentative(isRep)
                        .activeJobsCount(activeJobs)
                        .joinedAt(u != null ? u.getCreatedAt() : null)
                        .build();
            }).collect(Collectors.toList());
        }

        boolean hasValidLicense = isValidLicenseDocUrl(c.getLicenseDocUrl());
        String effectiveDocUrl = hasValidLicense ? c.getLicenseDocUrl() : null;
        String effectiveDocName = hasValidLicense ? (c.getLicenseDocName() != null ? c.getLicenseDocName() : "Giay_Phep_Kinh_Doanh.pdf") : null;

        long totalJobs = 0;
        long totalViews = 0;
        long totalHires = 0;
        if (c.getCompanyId() != null) {
            List<Job> companyJobs = jobRepository.findByCompany_CompanyIdOrderByCreatedAtDesc(c.getCompanyId());
            totalJobs = companyJobs != null ? companyJobs.size() : 0;
            if (companyJobs != null) {
                totalViews = companyJobs.stream().mapToLong(j -> j.getTotalViews() != null ? j.getTotalViews() : 0).sum();
            }
            if (applicationRepository != null) {
                List<Application> companyApps = applicationRepository.findByCompanyId(c.getCompanyId());
                if (companyApps != null) {
                    totalHires = companyApps.stream().filter(a -> a.getStatus() == com.hiremate.enums.ApplicationStatus.HIRED).count();
                }
            }
        }

        List<Object> parsedBenefits = Collections.emptyList();
        if (c.getBenefitsJson() != null && !c.getBenefitsJson().isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                parsedBenefits = mapper.readValue(c.getBenefitsJson(), new com.fasterxml.jackson.core.type.TypeReference<List<Object>>() {});
            } catch (Exception ex) {
                log.warn("Error parsing benefitsJson for company {}: {}", c.getCompanyId(), ex.getMessage());
            }
        }

        List<Object> parsedBranches = new java.util.ArrayList<>();
        if (c.getBranchesJson() != null && !c.getBranchesJson().isBlank()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                parsedBranches = mapper.readValue(c.getBranchesJson(), new com.fasterxml.jackson.core.type.TypeReference<List<Object>>() {});
            } catch (Exception ex) {
                log.warn("Error parsing branchesJson for company {}: {}", c.getCompanyId(), ex.getMessage());
            }
        }
        if (parsedBranches.isEmpty()) {
            Map<String, Object> defaultBranch = new HashMap<>();
            defaultBranch.put("branchId", "branch-main-" + (c.getCompanyId() != null ? c.getCompanyId() : "hq"));
            defaultBranch.put("branchName", "Trụ sở chính");
            defaultBranch.put("address", c.getAddress() != null && !c.getAddress().isBlank() ? c.getAddress() : "Việt Nam");
            defaultBranch.put("scale", c.getCompanySize() != null ? c.getCompanySize() : "50-100");
            defaultBranch.put("hotline", "");
            defaultBranch.put("isHeadquarters", true);
            defaultBranch.put("manager", recruiterName != null ? recruiterName : "Ban Giám Đốc");
            parsedBranches.add(defaultBranch);
        }

        return CompanyResponse.builder()
                .companyId(c.getCompanyId())
                .recruiterId(c.getRecruiterId())
                .recruiterName(recruiterName)
                .companyName(c.getCompanyName())
                .logoUrl(c.getLogoUrl())
                .website(c.getWebsite())
                .address(c.getAddress())
                .companySize(c.getCompanySize())
                .description(c.getDescription())
                .industry(c.getIndustry())
                .taxCode(c.getTaxCode())
                .licenseNumber(c.getLicenseNumber())
                .licenseDocUrl(effectiveDocUrl)
                .licenseDocName(effectiveDocName)
                .hasLicenseDoc(hasValidLicense)
                .legalRepresentative(c.getLegalRepresentative())
                .rejectionReason(c.getRejectionReason())
                .verifiedAt(c.getVerifiedAt())
                .status(c.getStatus())
                .branchesJson(c.getBranchesJson())
                .branches(parsedBranches)
                .benefitsJson(c.getBenefitsJson())
                .benefits(parsedBenefits)
                .totalJobs(totalJobs)
                .totalViews(totalViews)
                .totalHires(totalHires)
                .activeJobsCount((int) totalJobs)
                .createdAt(c.getCreatedAt())
                .hrTeam(teamMembers)
                .teamMembers(teamMembers)
                .build();
    }

    @Override
    @Transactional
    public void approveJoinRequest(String recruiterEmailOrId, User currentUser) {
        Recruiter currentRecruiter = getOrCreateRecruiter(currentUser);
        Company company = currentRecruiter.getCompany();
        if (company == null) {
            throw new IllegalArgumentException("Tài khoản của bạn chưa liên kết với doanh nghiệp nào để duyệt thành viên.");
        }

        Recruiter targetRecruiter = null;
        try {
            Long rId = Long.parseLong(recruiterEmailOrId.trim());
            targetRecruiter = recruiterRepository.findByRecruiterId(rId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (targetRecruiter == null) {
            targetRecruiter = recruiterRepository.findByUser_Email(recruiterEmailOrId.trim()).orElse(null);
        }

        if (targetRecruiter == null) {
            throw new com.hiremate.exception.ResourceNotFoundException("Không tìm thấy thông tin chuyên viên tuyển dụng: " + recruiterEmailOrId);
        }

        targetRecruiter.setCompany(company);
        recruiterRepository.save(targetRecruiter);
        removePendingJoinRequest(company, targetRecruiter.getRecruiterId(), targetRecruiter.getUser() != null ? targetRecruiter.getUser().getEmail() : recruiterEmailOrId);
        log.info(">> [CompanyService] HR {} đã phê duyệt thành viên {} gia nhập công ty {}",
                currentUser.getEmail(), targetRecruiter.getUser() != null ? targetRecruiter.getUser().getEmail() : recruiterEmailOrId, company.getCompanyName());

        if (notificationService != null && targetRecruiter.getUser() != null) {
            try {
                notificationService.createNotification(
                        targetRecruiter.getUser().getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Yêu cầu gia nhập công ty đã được phê duyệt!",
                        "Chúc mừng! Bạn đã chính thức được phê duyệt gia nhập đội ngũ tuyển dụng của " + company.getCompanyName() + ".",
                        company.getCompanyId(),
                        "companies"
                );
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo duyệt thành viên: {}", ex.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void rejectJoinRequest(String recruiterEmailOrId, User currentUser) {
        Recruiter currentRecruiter = getOrCreateRecruiter(currentUser);
        Company company = currentRecruiter.getCompany();
        String compName = company != null ? company.getCompanyName() : "doanh nghiệp";

        Recruiter targetRecruiter = null;
        try {
            Long rId = Long.parseLong(recruiterEmailOrId.trim());
            targetRecruiter = recruiterRepository.findByRecruiterId(rId).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (targetRecruiter == null) {
            targetRecruiter = recruiterRepository.findByUser_Email(recruiterEmailOrId.trim()).orElse(null);
        }

        if (company != null) {
            removePendingJoinRequest(company, targetRecruiter != null ? targetRecruiter.getRecruiterId() : null, recruiterEmailOrId);
        }

        if (targetRecruiter != null && notificationService != null && targetRecruiter.getUser() != null) {
            try {
                notificationService.createNotification(
                        targetRecruiter.getUser().getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Yêu cầu gia nhập công ty không được chấp thuận",
                        "Yêu cầu gia nhập đội ngũ tuyển dụng tại " + compName + " của bạn đã bị từ chối.",
                        company != null ? company.getCompanyId() : null,
                        "companies"
                );
            } catch (Exception ex) {
                log.warn("Không thể gửi thông báo từ chối thành viên: {}", ex.getMessage());
            }
        }
        log.info(">> [CompanyService] HR {} đã từ chối yêu cầu gia nhập của {}", currentUser.getEmail(), recruiterEmailOrId);
    }

    @Override
    public java.util.List<java.util.Map<String, Object>> getPendingJoinRequests(User currentUser) {
        Recruiter currentRecruiter = getOrCreateRecruiter(currentUser);
        Company company = currentRecruiter.getCompany();
        if (company == null || company.getBranchesJson() == null || company.getBranchesJson().isBlank()) {
            return java.util.Collections.emptyList();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String rawJson = company.getBranchesJson().trim();
            if (rawJson.startsWith("{")) {
                java.util.Map<String, Object> rootMap = mapper.readValue(rawJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                if (rootMap.containsKey("pendingJoinRequests") && rootMap.get("pendingJoinRequests") instanceof java.util.List) {
                    return (java.util.List<java.util.Map<String, Object>>) rootMap.get("pendingJoinRequests");
                }
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi lấy pendingJoinRequests: {}", ex.getMessage());
        }
        return java.util.Collections.emptyList();
    }

    private void removePendingJoinRequest(Company company, Long targetUserId, String email) {
        if (company == null || company.getBranchesJson() == null || company.getBranchesJson().isBlank()) {
            return;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String rawJson = company.getBranchesJson().trim();
            if (rawJson.startsWith("{")) {
                java.util.Map<String, Object> rootMap = mapper.readValue(rawJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                if (rootMap.containsKey("pendingJoinRequests") && rootMap.get("pendingJoinRequests") instanceof java.util.List) {
                    java.util.List<java.util.Map<String, Object>> pendingList = (java.util.List<java.util.Map<String, Object>>) rootMap.get("pendingJoinRequests");
                    pendingList.removeIf(p -> {
                        Object pEmail = p.get("email");
                        Object pId = p.get("id");
                        return (email != null && pEmail != null && pEmail.toString().equalsIgnoreCase(email.trim()))
                                || (targetUserId != null && pId != null && pId.toString().equals(String.valueOf(targetUserId)));
                    });
                    rootMap.put("pendingJoinRequests", pendingList);
                    company.setBranchesJson(mapper.writeValueAsString(rootMap));
                    companyRepository.save(company);
                }
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi loại bỏ pendingJoinRequest: {}", ex.getMessage());
        }
    }

    @Override
    public java.util.List<java.util.Map<String, Object>> getCompanyMembers(User currentUser) {
        Recruiter currentRecruiter = getOrCreateRecruiter(currentUser);
        Company company = currentRecruiter.getCompany();
        if (company == null) {
            return java.util.Collections.emptyList();
        }
        List<Recruiter> team = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
        if (team == null || team.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (Recruiter r : team) {
            if (r.getUser() == null) continue;
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getRecruiterId());
            map.put("name", r.getUser().getFullName());
            map.put("email", r.getUser().getEmail());
            map.put("phone", r.getUser().getPhone() != null ? r.getUser().getPhone() : "Chưa cập nhật");
            map.put("role", r.getPosition() != null ? r.getPosition() : "Talent Acquisition Specialist");
            map.put("department", r.getDepartment() != null ? r.getDepartment() : "Ban Tuyển Dụng & Thu Hút Nhân Tài");
            map.put("branchName", r.getBranchName() != null ? r.getBranchName() : "Trụ sở chính");
            map.put("isRepresentative", Boolean.TRUE.equals(r.getIsHeadRecruiter()) || (company.getRecruiterId() != null && company.getRecruiterId().equals(r.getRecruiterId())));
            map.put("joinedAt", r.getUser().getCreatedAt() != null ? r.getUser().getCreatedAt().toLocalDate().toString() : "2026-01-01");
            map.put("avatar", r.getUser().getAvatarUrl() != null ? r.getUser().getAvatarUrl() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80");
            map.put("activeJobs", jobRepository.countActiveJobsByRecruiterId(r.getRecruiterId()));
            result.add(map);
        }
        return result;
    }

    @Override
    @Transactional
    public void inviteMember(String email, String role, String branchName, User currentUser) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email đồng nghiệp không được để trống.");
        }
        Recruiter currentRecruiter = getOrCreateRecruiter(currentUser);
        Company company = currentRecruiter.getCompany();
        if (company == null) {
            throw new IllegalStateException("Bạn chưa thiết lập thông tin công ty.");
        }

        String cleanEmail = email.trim().toLowerCase();
        java.util.Optional<User> targetUserOpt = userRepository.findByEmail(cleanEmail);
        if (targetUserOpt.isPresent()) {
            User targetUser = targetUserOpt.get();
            Recruiter targetRecruiter = getOrCreateRecruiter(targetUser);
            targetRecruiter.setCompany(company);
            if (role != null && !role.isBlank()) targetRecruiter.setPosition(role.trim());
            if (branchName != null && !branchName.isBlank()) targetRecruiter.setBranchName(branchName.trim());
            recruiterRepository.save(targetRecruiter);

            if (notificationService != null) {
                notificationService.createNotification(
                        targetUser.getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Chào mừng bạn gia nhập " + company.getCompanyName() + "!",
                        "Bạn đã được thêm vào đội ngũ tuyển dụng của " + company.getCompanyName() + " với vai trò " + (targetRecruiter.getPosition() != null ? targetRecruiter.getPosition() : "HR Specialist"),
                        company.getCompanyId(),
                        "companies"
                );
            }
            log.info(">> [CompanyService] Đã liên kết đồng nghiệp {} vào công ty ID #{}", cleanEmail, company.getCompanyId());
        } else {
            // Lưu vào danh sách pending trong branchesJson để khi đăng ký xong sẽ tự động gia nhập
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            try {
                java.util.Map<String, Object> rootMap = new java.util.HashMap<>();
                java.util.List<java.util.Map<String, Object>> pendingList = new java.util.ArrayList<>();
                if (company.getBranchesJson() != null && company.getBranchesJson().trim().startsWith("{")) {
                    rootMap = mapper.readValue(company.getBranchesJson(), new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                    if (rootMap.containsKey("pendingJoinRequests") && rootMap.get("pendingJoinRequests") instanceof java.util.List) {
                        pendingList = (java.util.List<java.util.Map<String, Object>>) rootMap.get("pendingJoinRequests");
                    }
                }
                java.util.Map<String, Object> inv = new java.util.HashMap<>();
                inv.put("id", "invite_" + System.currentTimeMillis());
                inv.put("email", cleanEmail);
                inv.put("name", "Đồng nghiệp (" + cleanEmail + ")");
                inv.put("position", role != null ? role : "HR Specialist");
                inv.put("branchName", branchName != null ? branchName : "Trụ sở chính");
                inv.put("invitedBy", currentUser.getEmail());
                pendingList.add(inv);
                rootMap.put("pendingJoinRequests", pendingList);
                company.setBranchesJson(mapper.writeValueAsString(rootMap));
                companyRepository.save(company);
                log.info(">> [CompanyService] Đã lưu pending invitation cho email {}", cleanEmail);
            } catch (Exception ex) {
                log.warn("Lỗi lưu pending invitation: {}", ex.getMessage());
            }
        }
    }
}
