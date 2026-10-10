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

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;
    private final RecruiterRepository recruiterRepository;
    private final com.hiremate.service.FileStorageService fileStorageService;

    @Override
    public CompanyResponse getMyCompany(User recruiterUser) {
        Recruiter recruiter = recruiterRepository.findById(recruiterUser.getUserId())
                .orElseThrow(() -> new IllegalStateException("Recruiter profile not found for user: " + recruiterUser.getUserId()));

        Company company = recruiter.getCompany();
        if (company == null) {
            // Check by recruiter_id column fallback
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("No company linked to this recruiter"));
        }

        return mapToResponse(company, recruiterUser.getFullName());
    }

    @Override
    @Transactional
    public CompanyResponse updateMyCompany(CompanyUpdateRequest request, User recruiterUser) {
        Recruiter recruiter = recruiterRepository.findById(recruiterUser.getUserId())
                .orElseThrow(() -> new IllegalStateException("Recruiter profile not found for user: " + recruiterUser.getUserId()));

        Company company = recruiter.getCompany();
        if (company == null) {
            company = companyRepository.findByRecruiterId(recruiterUser.getUserId())
                    .orElse(null);
        }

        if (company == null) {
            // Create company if not already existing
            company = Company.builder()
                    .recruiterId(recruiter.getRecruiterId())
                    .companyName(request.getCompanyName())
                    .logoUrl(request.getLogoUrl())
                    .website(request.getWebsite())
                    .address(request.getAddress())
                    .companySize(request.getCompanySize())
                    .status(CompanyStatus.ACTIVE)
                    .build();
            company = companyRepository.save(company);
            recruiter.setCompany(company);
            recruiterRepository.save(recruiter);
        } else {
            company.setCompanyName(request.getCompanyName());
            if (request.getLogoUrl() != null) company.setLogoUrl(request.getLogoUrl());
            if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
            if (request.getAddress() != null) company.setAddress(request.getAddress());
            if (request.getCompanySize() != null) company.setCompanySize(request.getCompanySize());
            company = companyRepository.save(company);
        }

        log.info("Company profile updated for recruiter: {}, companyId: {}", recruiterUser.getEmail(), company.getCompanyId());
        return mapToResponse(company, recruiterUser.getFullName());
    }

    @Override
    @Transactional
    public CompanyResponse uploadLogo(org.springframework.web.multipart.MultipartFile file, User recruiterUser) {
        Recruiter recruiter = recruiterRepository.findById(recruiterUser.getUserId())
                .orElseThrow(() -> new IllegalStateException("Recruiter profile not found for user: " + recruiterUser.getUserId()));

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
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
