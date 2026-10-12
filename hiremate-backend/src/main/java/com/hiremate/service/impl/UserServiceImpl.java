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

import com.hiremate.dto.request.AddCandidateSkillRequest;
import com.hiremate.dto.response.CandidateSkillResponse;
import com.hiremate.entity.CandidateSkill;
import com.hiremate.entity.Skill;
import com.hiremate.repository.CandidateSkillRepository;
import com.hiremate.repository.SkillRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;   // Thay thế CandidateProfileRepository
    private final RecruiterRepository recruiterRepository;   // Thay thế CompanyRepository (cho lookup)
    private final CandidateSkillRepository candidateSkillRepository;
    private final SkillRepository skillRepository;
    private final com.hiremate.service.FileStorageService fileStorageService;

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

    @Override
    @Transactional
    public UserProfileResponse uploadAvatar(Long userId, org.springframework.web.multipart.MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        // Tải ảnh đại diện lên thư mục 'avatars' trên Cloudinary CDN
        String avatarUrl = fileStorageService.storeFile(file, "avatars");

        // Xóa avatar cũ nếu có để giải phóng dung lượng đám mây
        if (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank()) {
            fileStorageService.deleteFile(user.getAvatarUrl());
        }

        user.setAvatarUrl(avatarUrl);
        User savedUser = userRepository.save(user);

        log.info(">> [UserService] Ảnh đại diện userId: {} đã được tải lên trực tiếp và cập nhật: {}", userId, avatarUrl);
        return buildProfileResponse(savedUser);
    }

    @Override
    public List<CandidateSkillResponse> getCandidateSkills(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getRole() != UserRole.CANDIDATE) {
            throw new IllegalArgumentException("Chỉ tài khoản Ứng viên mới có danh sách kỹ năng");
        }

        return loadCandidateSkills(userId);
    }

    @Override
    @Transactional
    public CandidateSkillResponse addOrUpdateCandidateSkill(Long userId, AddCandidateSkillRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getRole() != UserRole.CANDIDATE) {
            throw new IllegalArgumentException("Chỉ tài khoản Ứng viên mới có thể quản lý kỹ năng");
        }

        // Tìm hoặc tạo Skill theo skillId / skillName
        Skill skill;
        if (request.getSkillId() != null) {
            skill = skillRepository.findById(request.getSkillId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kỹ năng hệ thống với ID: " + request.getSkillId()));
        } else if (request.getSkillName() != null && !request.getSkillName().isBlank()) {
            String trimmedName = request.getSkillName().trim();
            skill = skillRepository.findBySkillName(trimmedName)
                    .orElseGet(() -> skillRepository.save(Skill.builder()
                            .skillName(trimmedName)
                            .category("General")
                            .build()));
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp skillId hoặc skillName");
        }

        // Kiểm tra xem kỹ năng đã tồn tại trong profile ứng viên chưa (Upsert)
        Optional<CandidateSkill> existingOpt = candidateSkillRepository.findByProfileIdAndSkillId(userId, skill.getSkillId());
        CandidateSkill candidateSkill;

        if (existingOpt.isPresent()) {
            candidateSkill = existingOpt.get();
            if (request.getProficiencyLevel() != null) {
                candidateSkill.setProficiencyLevel(request.getProficiencyLevel());
            }
            if (request.getYearsOfExperience() != null) {
                candidateSkill.setYearsOfExperience(request.getYearsOfExperience());
            }
        } else {
            candidateSkill = CandidateSkill.builder()
                    .profileId(userId)
                    .skillId(skill.getSkillId())
                    .proficiencyLevel(request.getProficiencyLevel() != null ? request.getProficiencyLevel() : com.hiremate.enums.SkillProficiency.INTERMEDIATE)
                    .yearsOfExperience(request.getYearsOfExperience() != null ? request.getYearsOfExperience() : 1.0f)
                    .aiDetected(false)
                    .build();
        }

        CandidateSkill saved = candidateSkillRepository.save(candidateSkill);

        return CandidateSkillResponse.builder()
                .candidateSkillId(saved.getCandidateSkillId())
                .profileId(saved.getProfileId())
                .skillId(saved.getSkillId())
                .skillName(skill.getSkillName())
                .category(skill.getCategory())
                .proficiencyLevel(saved.getProficiencyLevel())
                .yearsOfExperience(saved.getYearsOfExperience())
                .aiDetected(saved.getAiDetected())
                .build();
    }

    @Override
    @Transactional
    public void deleteCandidateSkill(Long userId, Long skillId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getRole() != UserRole.CANDIDATE) {
            throw new IllegalArgumentException("Chỉ tài khoản Ứng viên mới có thể xóa kỹ năng");
        }

        // 1. Thử tìm theo skillId trước
        Optional<CandidateSkill> bySkillId = candidateSkillRepository.findByProfileIdAndSkillId(userId, skillId);
        if (bySkillId.isPresent()) {
            candidateSkillRepository.delete(bySkillId.get());
            log.info(">> [UserService] Đã xóa skillId {} khỏi candidateId {}", skillId, userId);
            return;
        }

        // 2. Fallback: Nếu tham số skillId thực chất là candidateSkillId (ID dòng bản ghi)
        Optional<CandidateSkill> byRowId = candidateSkillRepository.findById(skillId);
        if (byRowId.isPresent() && byRowId.get().getProfileId().equals(userId)) {
            candidateSkillRepository.delete(byRowId.get());
            log.info(">> [UserService] Đã xóa candidateSkillId {} khỏi candidateId {}", skillId, userId);
            return;
        }

        throw new IllegalArgumentException("Không tìm thấy kỹ năng với ID: " + skillId + " trong hồ sơ của bạn");
    }

    private List<CandidateSkillResponse> loadCandidateSkills(Long profileId) {
        List<CandidateSkill> list = candidateSkillRepository.findByProfileId(profileId);
        if (list.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> skillIds = list.stream()
                .map(CandidateSkill::getSkillId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Skill> skillMap = skillRepository.findAllById(skillIds).stream()
                .collect(Collectors.toMap(Skill::getSkillId, s -> s));

        List<CandidateSkillResponse> responses = new ArrayList<>();
        for (CandidateSkill cs : list) {
            Skill s = skillMap.get(cs.getSkillId());
            responses.add(CandidateSkillResponse.builder()
                    .candidateSkillId(cs.getCandidateSkillId())
                    .profileId(cs.getProfileId())
                    .skillId(cs.getSkillId())
                    .skillName(s != null ? s.getSkillName() : "Skill #" + cs.getSkillId())
                    .category(s != null ? s.getCategory() : null)
                    .proficiencyLevel(cs.getProficiencyLevel())
                    .yearsOfExperience(cs.getYearsOfExperience())
                    .aiDetected(cs.getAiDetected() != null ? cs.getAiDetected() : false)
                    .build());
        }
        return responses;
    }

    /**
     * Build UserProfileResponse bằng cách tra cứu subclass record.
     * - CANDIDATE: lấy headline, location, experienceYears từ Candidate entity + skills list
     * - RECRUITER: lấy companyId, companyName, companyWebsite từ Recruiter.company
     */
    private UserProfileResponse buildProfileResponse(User user) {
        // Candidate-specific fields
        Long profileId = null;
        String headline = null;
        String location = null;
        Integer experienceYears = null;
        List<CandidateSkillResponse> skills = null;

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
            skills = loadCandidateSkills(user.getUserId());
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
                .skills(skills)
                .companyId(companyId)
                .companyName(companyName)
                .companyWebsite(companyWebsite)
                .build();
    }
}
