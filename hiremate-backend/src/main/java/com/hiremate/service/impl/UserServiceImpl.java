package com.hiremate.service.impl;

import com.hiremate.dto.request.UpdateProfileRequest;
import com.hiremate.dto.response.UserProfileResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Company;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.User;
import com.hiremate.enums.UserRole;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.UserRepository;
import com.hiremate.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;   // Thay thế CandidateProfileRepository
    private final RecruiterRepository recruiterRepository;   // Thay thế CompanyRepository (cho lookup)

    @Override
    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        return buildProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        // Cập nhật các trường trên bảng users (base class)
        user.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) user.setPhone(request.getPhone().trim());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth().trim());
        if (request.getAddress() != null) user.setAddress(request.getAddress().trim());
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        if (request.getGithubUrl() != null) user.setGithubUrl(request.getGithubUrl().trim());

        User savedUser = userRepository.save(user);

        // Cập nhật subclass-specific fields nếu là CANDIDATE
        // Candidate.candidateId = user.userId (Shared PK)
        if (savedUser.getRole() == UserRole.CANDIDATE) {
            Optional<Candidate> candidateOpt = candidateRepository.findById(userId);
            if (candidateOpt.isPresent()) {
                Candidate candidate = candidateOpt.get();
                if (request.getHeadline() != null) candidate.setHeadline(request.getHeadline());
                if (request.getAddress() != null) candidate.setLocation(request.getAddress());
                if (request.getBio() != null) candidate.setBio(request.getBio());
                candidateRepository.save(candidate);
            }
        }

        log.info(">> [UserService] Profile updated successfully for userId: {}", userId);
        return buildProfileResponse(savedUser);
    }

    @Override
    @Transactional
    public UserProfileResponse updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        user.setAvatarUrl(avatarUrl != null ? avatarUrl.trim() : null);
        User savedUser = userRepository.save(user);

        log.info(">> [UserService] Avatar updated successfully for userId: {}", userId);
        return buildProfileResponse(savedUser);
    }

    /**
     * Build UserProfileResponse bằng cách tra cứu subclass record.
     * - CANDIDATE: lấy headline, location, experienceYears từ Candidate entity
     * - RECRUITER: lấy companyId, companyName, companyWebsite từ Recruiter.company
     */
    private UserProfileResponse buildProfileResponse(User user) {
        // Candidate-specific fields
        Long profileId = null;
        String headline = null;
        String location = null;
        Integer experienceYears = null;

        // Recruiter / Company-specific fields
        Long companyId = null;
        String companyName = null;
        String companyWebsite = null;

        if (user.getRole() == UserRole.CANDIDATE) {
            // Candidate.candidateId = user.userId (Shared PK – lookup by same ID)
            Optional<Candidate> candidateOpt = candidateRepository.findById(user.getUserId());
            if (candidateOpt.isPresent()) {
                Candidate c = candidateOpt.get();
                // candidateId dùng làm profileId cho API response (backward compat)
                profileId = c.getCandidateId();
                headline = c.getHeadline();
                location = c.getLocation();
                experienceYears = c.getExperienceYears();
            }
        } else if (user.getRole() == UserRole.RECRUITER) {
            // Recruiter.recruiterId = user.userId (Shared PK – lookup by same ID)
            Optional<Recruiter> recruiterOpt = recruiterRepository.findById(user.getUserId());
            if (recruiterOpt.isPresent()) {
                Company company = recruiterOpt.get().getCompany();
                if (company != null) {
                    companyId = company.getCompanyId();
                    companyName = company.getCompanyName();
                    companyWebsite = company.getWebsite();
                }
            }
        }

        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .isEmailVerified(user.getIsEmailVerified() != null ? user.getIsEmailVerified() : true)
                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress())
                .bio(user.getBio())
                .githubUrl(user.getGithubUrl())
                .createdAt(user.getCreatedAt())
                .profileId(profileId)
                .headline(headline)
                .location(location)
                .experienceYears(experienceYears)
                .companyId(companyId)
                .companyName(companyName)
                .companyWebsite(companyWebsite)
                .build();
    }
}
