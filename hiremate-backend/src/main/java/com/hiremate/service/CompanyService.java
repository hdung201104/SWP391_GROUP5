package com.hiremate.service;

import com.hiremate.dto.request.CompanyUpdateRequest;
import com.hiremate.dto.response.CompanyResponse;
import com.hiremate.entity.User;

public interface CompanyService {
    CompanyResponse getMyCompany(User recruiterUser);
    CompanyResponse updateMyCompany(CompanyUpdateRequest request, User recruiterUser);
    CompanyResponse uploadLogo(org.springframework.web.multipart.MultipartFile file, User recruiterUser);
    void saveLicenseDoc(User recruiterUser, String docUrl, String docName);
    CompanyResponse getCompanyById(Long companyId);
    java.util.List<CompanyResponse> getAllCompanies();
    java.util.List<com.hiremate.dto.response.CompanyLookupResponse> lookupCompanies(String keyword, String taxCode);
    void approveJoinRequest(String recruiterEmailOrId, User currentUser);
    void rejectJoinRequest(String recruiterEmailOrId, User currentUser);
    java.util.List<java.util.Map<String, Object>> getPendingJoinRequests(User currentUser);
    void inviteMember(String email, String role, String branchName, User currentUser);
    java.util.List<java.util.Map<String, Object>> getCompanyMembers(User currentUser);
}
