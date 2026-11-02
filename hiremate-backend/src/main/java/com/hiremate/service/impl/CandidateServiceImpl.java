package com.hiremate.service.impl;

import com.hiremate.dto.response.CandidateProfileResponse;
import com.hiremate.dto.response.CvResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.CandidateSkill;
import com.hiremate.entity.Cv;
import com.hiremate.entity.Skill;
import com.hiremate.entity.User;
import com.hiremate.entity.Recruiter;
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
    private final RecruiterRepository recruiterRepository;
    private final ApplicationRepository applicationRepository;

    @Override
    @Transactional(readOnly = true)
    public CandidateProfileResponse getCandidateProfile(Long candidateId, User currentUser) {
        if (candidateId == null) {
            throw new IllegalArgumentException("candidateId không được để trống");
        }

        // Kiểm tra quyền hạn: RECRUITER, ADMIN hoặc chính ứng viên đó
        boolean maskSensitiveInfo = true;
        if (currentUser != null && currentUser.getRole() == UserRole.ADMIN) {
            maskSensitiveInfo = false;
        } else if (currentUser != null && currentUser.getRole() == UserRole.CANDIDATE) {
            if (!currentUser.getUserId().equals(candidateId)) {
                throw new SecurityException("Ứng viên không có quyền xem hồ sơ của ứng viên khác");
            }
            maskSensitiveInfo = false;
        } else if (currentUser != null && currentUser.getRole() == UserRole.RECRUITER) {
            // Kiểm tra: Công ty của Recruiter đã được duyệt và ứng viên có nộp đơn hợp lệ (chưa rút) vào công ty
            Recruiter rec = recruiterRepository.findById(currentUser.getUserId()).orElse(null);
            boolean isVerifiedCompany = rec != null && rec.getCompany() != null
                    && (rec.getCompany().getStatus() == com.hiremate.enums.CompanyStatus.VERIFIED
                        || rec.getCompany().getStatus() == com.hiremate.enums.CompanyStatus.ACTIVE);
            Long companyId = (rec != null && rec.getCompany() != null) ? rec.getCompany().getCompanyId() : null;

            boolean hasAppliedToCompany = false;
            if (companyId != null) {
                hasAppliedToCompany = applicationRepository.findByCandidate_CandidateId(candidateId).stream()
                        .anyMatch(a -> a.getJob() != null && a.getJob().getCompany() != null
                                && companyId.equals(a.getJob().getCompany().getCompanyId())
                                && !(a.getStatus() == com.hiremate.enums.ApplicationStatus.REJECTED
                                        && a.getRejectionReason() != null
                                        && a.getRejectionReason().contains("WITHDRAWN_BY_CANDIDATE")));
            }

            if (isVerifiedCompany && hasAppliedToCompany) {
                maskSensitiveInfo = false;
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
        Cv primaryCv = null;
        for (Cv cv : cvList) {
            if (primaryCv == null || Boolean.TRUE.equals(cv.getIsDefault())) {
                primaryCv = cv;
            }
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
                    .parsedJson(cv.getParsedJson())
                    .parsedText(cv.getParsedText())
                    .createdAt(cv.getCreatedAt())
                    .build());
        }

        String experiencesJson = candidate != null ? candidate.getExperiencesJson() : null;
        String educationsJson = candidate != null ? candidate.getEducationsJson() : null;
        String projectsJson = candidate != null ? candidate.getProjectsJson() : null;
        String headline = candidate != null ? candidate.getHeadline() : null;
        String bio = candidate != null && candidate.getBio() != null ? candidate.getBio() : user.getBio();
        if ((bio == null || bio.isBlank()) && primaryCv != null && primaryCv.getSummary() != null) {
            bio = primaryCv.getSummary();
        }

        String rawEmail = user.getEmail();
        String rawPhone = user.getPhone();
        String effectiveEmail = rawEmail;
        String effectivePhone = rawPhone;

        if (maskSensitiveInfo) {
            if (rawEmail != null && rawEmail.contains("@")) {
                int atIdx = rawEmail.indexOf('@');
                effectiveEmail = (atIdx > 2 ? rawEmail.substring(0, 2) : rawEmail.substring(0, 1))
                        + "***" + rawEmail.substring(atIdx);
            }
            if (rawPhone != null && rawPhone.length() >= 4) {
                effectivePhone = "(+84) *** *** " + rawPhone.substring(rawPhone.length() - 4);
            } else {
                effectivePhone = "(+84) *** *** ****";
            }
        }

        return CandidateProfileResponse.builder()
                .candidateId(candidateId)
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(effectiveEmail)
                .phone(effectivePhone)
                .avatarUrl(user.getAvatarUrl())

                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress())
                .githubUrl(user.getGithubUrl())
                .headline(headline)
                .location(candidate != null ? candidate.getLocation() : user.getAddress())
                .bio(bio)
                .experienceYears(candidate != null ? candidate.getExperienceYears() : 0)
                .desiredSalaryMin(candidate != null ? candidate.getDesiredSalaryMin() : null)
                .desiredSalaryMax(candidate != null ? candidate.getDesiredSalaryMax() : null)
                .careerGoals(candidate != null ? candidate.getCareerGoals() : null)
                .educationsJson(educationsJson)
                .experiencesJson(experiencesJson)
                .projectsJson(projectsJson)
                .skills(skillResponses)
                .cvs(cvResponses)
                .createdAt(user.getCreatedAt())
                .updatedAt(candidate != null ? candidate.getUpdatedAt() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public String getSavedJobs(Long candidateId) {
        if (candidateId == null) {
            return "[]";
        }
        Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
        if (candidate == null || candidate.getCareerGoals() == null || candidate.getCareerGoals().isBlank()) {
            return "[]";
        }
        String goals = candidate.getCareerGoals().trim();
        if (goals.startsWith("[") && goals.endsWith("]")) {
            return goals;
        }
        if (goals.startsWith("{") && goals.contains("\"savedJobs\"")) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(goals);
                if (node.has("savedJobs")) {
                    return node.get("savedJobs").toString();
                }
            } catch (Exception ignored) {}
        }
        return "[]";
    }

    @Override
    @Transactional
    public void updateSavedJobs(Long candidateId, String savedJobsJson) {
        if (candidateId == null) {
            throw new IllegalArgumentException("candidateId không được để trống");
        }
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseGet(() -> {
                    User user = userRepository.findById(candidateId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found: " + candidateId));
                    Candidate newCand = Candidate.builder()
                            .candidateId(candidateId)
                            .user(user)
                            .isNewEntity(true)
                            .build();
                    return candidateRepository.save(newCand);
                });
        candidate.setCareerGoals(savedJobsJson != null && !savedJobsJson.isBlank() ? savedJobsJson : "[]");
        candidateRepository.save(candidate);
        log.info(">> [CandidateService] Đã đồng bộ danh sách việc làm đã lưu cho candidate #{}", candidateId);
    }
}
