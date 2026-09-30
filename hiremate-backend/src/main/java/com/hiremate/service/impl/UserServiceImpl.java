package com.hiremate.service.impl;

import com.hiremate.dto.request.UpdateProfileRequest;
import com.hiremate.dto.response.UserProfileResponse;
import com.hiremate.entity.CandidateProfile;
import com.hiremate.entity.Company;
import com.hiremate.entity.User;
import com.hiremate.enums.UserRole;
import com.hiremate.repository.CandidateProfileRepository;
import com.hiremate.repository.CompanyRepository;
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
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyRepository companyRepository;

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

        user.setFullName(request.getFullName().trim());
        if (request.getPhone() != null) user.setPhone(request.getPhone().trim());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth().trim());
        if (request.getAddress() != null) user.setAddress(request.getAddress().trim());
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        if (request.getGithubUrl() != null) user.setGithubUrl(request.getGithubUrl().trim());

        User savedUser = userRepository.save(user);

        // Update candidate headline or location if candidate
        if (savedUser.getRole() == UserRole.CANDIDATE) {
            Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUserId(userId);
            if (profileOpt.isPresent()) {
                CandidateProfile profile = profileOpt.get();
                if (request.getHeadline() != null) profile.setHeadline(request.getHeadline());
                if (request.getAddress() != null) profile.setLocation(request.getAddress());
                if (request.getBio() != null) profile.setBio(request.getBio());
                candidateProfileRepository.save(profile);
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

    private UserProfileResponse buildProfileResponse(User user) {
        Long profileId = null;
        String headline = null;
        String location = null;
        Integer experienceYears = null;

        Long companyId = null;
        String companyName = null;
        String companyWebsite = null;

        if (user.getRole() == UserRole.CANDIDATE) {
            Optional<CandidateProfile> candidateProfile = candidateProfileRepository.findByUserId(user.getUserId());
            if (candidateProfile.isPresent()) {
                CandidateProfile cp = candidateProfile.get();
                profileId = cp.getProfileId();
                headline = cp.getHeadline();
                location = cp.getLocation();
                experienceYears = cp.getExperienceYears();
            }
        } else if (user.getRole() == UserRole.RECRUITER) {
            Optional<Company> company = companyRepository.findByRecruiterId(user.getUserId());
            if (company.isPresent()) {
                Company c = company.get();
                companyId = c.getCompanyId();
                companyName = c.getCompanyName();
                companyWebsite = c.getWebsite();
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
