package com.hiremate.service.impl;

import com.hiremate.dto.response.CandidateProfileResponse;
import com.hiremate.dto.response.CvResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.CandidateSkill;
import com.hiremate.entity.Cv;
import com.hiremate.entity.Skill;
import com.hiremate.entity.User;
import com.hiremate.enums.UserRole;
import com.hiremate.repository.*;
import com.hiremate.service.CandidateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final SkillRepository skillRepository;
    private final CvRepository cvRepository;

    @Override
    @Transactional(readOnly = true)
    public CandidateProfileResponse getCandidateProfile(Long candidateId, User currentUser) {
        if (candidateId == null) {
            throw new IllegalArgumentException("candidateId không được để trống");
        }

        // Kiểm tra quyền hạn: RECRUITER, ADMIN hoặc chính ứng viên đó
        if (currentUser != null && currentUser.getRole() == UserRole.CANDIDATE) {
            if (!currentUser.getUserId().equals(candidateId)) {
                throw new SecurityException("Ứng viên không có quyền xem hồ sơ của ứng viên khác");
            }
        }

        // Lấy thông tin tài khoản người dùng
        User user = userRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + candidateId));

        if (user.getRole() != UserRole.CANDIDATE) {
            throw new IllegalArgumentException("Tài khoản này không phải là ứng viên (Role: " + user.getRole() + ")");
        }

        // Lấy thông tin mở rộng của Ứng viên (Subclass table candidates)
        Candidate candidate = candidateRepository.findById(candidateId).orElse(null);

        // Lấy danh sách kỹ năng của ứng viên
        List<CandidateSkill> candidateSkills = candidateSkillRepository.findByProfileId(candidateId);
        List<CandidateProfileResponse.CandidateSkillResponse> skillResponses = new ArrayList<>();

        if (!candidateSkills.isEmpty()) {
            List<Long> skillIds = candidateSkills.stream()
                    .map(CandidateSkill::getSkillId)
                    .filter(id -> id != null)
                    .distinct()
                    .collect(Collectors.toList());

            Map<Long, Skill> skillMap = skillRepository.findAllById(skillIds).stream()
                    .collect(Collectors.toMap(Skill::getSkillId, s -> s));

            for (CandidateSkill cs : candidateSkills) {
                Skill meta = skillMap.get(cs.getSkillId());
                skillResponses.add(CandidateProfileResponse.CandidateSkillResponse.builder()
                        .candidateSkillId(cs.getCandidateSkillId())
                        .skillId(cs.getSkillId())
                        .skillName(meta != null ? meta.getSkillName() : "Skill #" + cs.getSkillId())
                        .category(meta != null ? meta.getCategory() : null)
                        .proficiencyLevel(cs.getProficiencyLevel())
                        .yearsOfExperience(cs.getYearsOfExperience())
                        .aiDetected(cs.getAiDetected() != null ? cs.getAiDetected() : false)
                        .build());
            }
        }

        // Lấy danh sách CV của ứng viên
        List<Cv> cvList = cvRepository.findByCandidateId(candidateId);
        List<CvResponse> cvResponses = new ArrayList<>();
        for (Cv cv : cvList) {
            cvResponses.add(CvResponse.builder()
                    .cvId(cv.getCvId())
                    .candidateId(cv.getCandidateId())
                    .fileName(cv.getFileName())
                    .fileUrl(cv.getFileUrl())
                    .fileType(cv.getFileType())
                    .fileSizeBytes(cv.getFileSizeBytes())
                    .parseStatus(cv.getParseStatus())
                    .isDefault(cv.getIsDefault())
                    .summary(cv.getSummary())
                    .createdAt(cv.getCreatedAt())
                    .build());
        }

        return CandidateProfileResponse.builder()
                .candidateId(candidateId)
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress())
                .githubUrl(user.getGithubUrl())
                .headline(candidate != null ? candidate.getHeadline() : null)
                .location(candidate != null ? candidate.getLocation() : user.getAddress())
                .bio(candidate != null && candidate.getBio() != null ? candidate.getBio() : user.getBio())
                .experienceYears(candidate != null ? candidate.getExperienceYears() : 0)
                .desiredSalaryMin(candidate != null ? candidate.getDesiredSalaryMin() : null)
                .desiredSalaryMax(candidate != null ? candidate.getDesiredSalaryMax() : null)
                .careerGoals(candidate != null ? candidate.getCareerGoals() : null)
                .educationsJson(candidate != null ? candidate.getEducationsJson() : null)
                .experiencesJson(candidate != null ? candidate.getExperiencesJson() : null)
                .projectsJson(candidate != null ? candidate.getProjectsJson() : null)
                .skills(skillResponses)
                .cvs(cvResponses)
                .createdAt(user.getCreatedAt())
                .updatedAt(candidate != null ? candidate.getUpdatedAt() : null)
                .build();
    }
}
