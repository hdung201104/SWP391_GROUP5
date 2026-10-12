package com.hiremate.service;

import com.hiremate.dto.request.AddCandidateSkillRequest;
import com.hiremate.dto.request.UpdateProfileRequest;
import com.hiremate.dto.response.CandidateSkillResponse;
import com.hiremate.dto.response.UserProfileResponse;

import java.util.List;

public interface UserService {
    UserProfileResponse getProfile(Long userId);
    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
    UserProfileResponse updateAvatar(Long userId, String avatarUrl);
    UserProfileResponse uploadAvatar(Long userId, org.springframework.web.multipart.MultipartFile file);
    List<CandidateSkillResponse> getCandidateSkills(Long userId);
    CandidateSkillResponse addOrUpdateCandidateSkill(Long userId, AddCandidateSkillRequest request);
    void deleteCandidateSkill(Long userId, Long skillId);
}
