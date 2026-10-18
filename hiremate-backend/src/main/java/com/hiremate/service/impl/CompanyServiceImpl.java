package com.hiremate.service.impl;

import com.hiremate.dto.request.CompanyUpdateRequest;
import com.hiremate.dto.response.CompanyResponse;
import com.hiremate.entity.Company;
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
    private final com.hiremate.service.FileStorageService fileStorageService;
    private final com.hiremate.service.NotificationService notificationService;

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

    @Override
    @Transactional
    public CompanyResponse updateMyCompany(CompanyUpdateRequest request, User recruiterUser) {
        Recruiter recruiter = getOrCreateRecruiter(recruiterUser);

        Company company = recruiter.getCompany();
        if (company == null) {
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId())
                    .orElse(null);
        }

        String finalName = request.getCompanyName();
        if (finalName == null || finalName.isBlank()) {
            finalName = company != null ? company.getCompanyName() : (recruiterUser.getFullName() + "'s Company");
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
                    .taxCode(request.getTaxCode())
                    .licenseNumber(request.getLicenseNumber())
                    .licenseDocUrl(request.getLicenseDocUrl())
                    .licenseDocName(request.getLicenseDocName())
                    .legalRepresentative(request.getLegalRepresentative())
                    .status(request.getStatus() != null ? request.getStatus() : CompanyStatus.PENDING)
                    .build();
            company = companyRepository.save(company);
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);
        } else {
            company.setCompanyName(finalName);
            if (request.getLogoUrl() != null) company.setLogoUrl(request.getLogoUrl());
            if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
            if (request.getAddress() != null) company.setAddress(request.getAddress());
            if (request.getCompanySize() != null) company.setCompanySize(request.getCompanySize());
            if (request.getDescription() != null) company.setDescription(request.getDescription());
            if (request.getIndustry() != null) company.setIndustry(request.getIndustry());
            if (request.getTaxCode() != null) company.setTaxCode(request.getTaxCode());
            if (request.getLicenseNumber() != null) company.setLicenseNumber(request.getLicenseNumber());
            if (request.getLicenseDocUrl() != null) company.setLicenseDocUrl(request.getLicenseDocUrl());
            if (request.getLicenseDocName() != null) company.setLicenseDocName(request.getLicenseDocName());
            if (request.getLegalRepresentative() != null) company.setLegalRepresentative(request.getLegalRepresentative());
            
            if (request.getStatus() != null) {
                company.setStatus(request.getStatus());
            } else if (request.getTaxCode() != null || request.getLicenseDocUrl() != null) {
                if (company.getStatus() == null || company.getStatus() != CompanyStatus.VERIFIED) {
                    company.setStatus(CompanyStatus.PENDING);
                }
            }
            company = companyRepository.save(company);
            if (recruiter.getCompany() == null) {
                recruiter.setCompany(company);
                recruiterRepository.save(recruiter);
            }
        }

        // Gửi thông báo cho Recruiter và Ban Quản Trị (Admin) nếu hồ sơ đang chờ duyệt
        if (company.getStatus() == CompanyStatus.PENDING && notificationService != null) {
            try {
                notificationService.createNotification(
                        recruiterUser.getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Hồ sơ xác thực GPKD đã được tiếp nhận",
                        "Hồ sơ Giấy phép kinh doanh của " + company.getCompanyName() + " đã được gửi đến Ban Quản Trị. Vui lòng đợi trong vòng 24h để được xét duyệt.",
                        company.getCompanyId(),
                        "companies"
                );
                notificationService.notifyAdmins(
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Yêu cầu xét duyệt Giấy phép kinh doanh mới",
                        "Doanh nghiệp \"" + company.getCompanyName() + "\" vừa cập nhật hồ sơ pháp lý & GPKD. Vui lòng kiểm tra và xét duyệt.",
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
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId()).orElse(null);
        }
        if (company != null) {
            company.setLicenseDocUrl(docUrl);
            company.setLicenseDocName(docName);
            if (company.getStatus() != CompanyStatus.VERIFIED) {
                company.setStatus(CompanyStatus.PENDING);
            }
            companyRepository.save(company);
            if (recruiter.getCompany() == null) {
                recruiter.setCompany(company);
                recruiterRepository.save(recruiter);
            }
            log.info("Attached license doc directly to company ID {}: {}", company.getCompanyId(), docName);

            if (notificationService != null) {
                try {
                    notificationService.createNotification(
                            recruiterUser.getUserId(),
                            com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                            "Đã tải lên Giấy phép kinh doanh thành công",
                            "Tài liệu " + docName + " đã được lưu và gửi đến Ban Quản Trị để thẩm định tính pháp lý.",
                            company.getCompanyId(),
                            "companies"
                    );
                    notificationService.notifyAdmins(
                            com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                            "Yêu cầu xét duyệt Giấy phép kinh doanh mới",
                            "Doanh nghiệp \"" + company.getCompanyName() + "\" vừa tải lên Giấy phép kinh doanh (" + docName + ") chờ duyệt.",
                            company.getCompanyId(),
                            "companies"
                    );
                } catch (Exception ex) {
                    log.warn("Lỗi gửi thông báo tải GPKD: {}", ex.getMessage());
                }
            }
        }
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
                            .activeJobsCount(cJobs.size())
                            .locations(locations)
                            .createdAt(c.getCreatedAt())
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getActiveJobsCount() != null ? b.getActiveJobsCount() : 0,
                                                  a.getActiveJobsCount() != null ? a.getActiveJobsCount() : 0))
                .collect(Collectors.toList());
    }

    private CompanyResponse mapToResponse(Company c, String recruiterName) {
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
                .licenseDocUrl(c.getLicenseDocUrl())
                .licenseDocName(c.getLicenseDocName())
                .legalRepresentative(c.getLegalRepresentative())
                .rejectionReason(c.getRejectionReason())
                .verifiedAt(c.getVerifiedAt())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
