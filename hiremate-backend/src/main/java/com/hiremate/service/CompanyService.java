package com.hiremate.service;

import com.hiremate.dto.request.CompanyUpdateRequest;
import com.hiremate.dto.response.CompanyResponse;
import com.hiremate.entity.User;

public interface CompanyService {
    CompanyResponse getMyCompany(User recruiterUser);
    CompanyResponse updateMyCompany(CompanyUpdateRequest request, User recruiterUser);
    CompanyResponse uploadLogo(org.springframework.web.multipart.MultipartFile file, User recruiterUser);
    CompanyResponse getCompanyById(Long companyId);
}
