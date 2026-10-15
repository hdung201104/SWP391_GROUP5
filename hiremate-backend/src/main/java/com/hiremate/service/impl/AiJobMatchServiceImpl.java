package com.hiremate.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiremate.dto.response.AiJobMatchResponse;
import com.hiremate.entity.*;
import com.hiremate.enums.MatchStatus;
import com.hiremate.enums.SkillImportance;
import com.hiremate.repository.*;
import com.hiremate.service.AiJobMatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiJobMatchServiceImpl implements AiJobMatchService {

    private final AiJobMatchRepository aiJobMatchRepository;
    private final JobRepository jobRepository;
    private final CandidateRepository candidateRepository;
    private final JobSkillRepository jobSkillRepository;
    private final SkillRepository skillRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final CvRepository cvRepository;
    private final UserRepository userRepository;
    private final com.hiremate.service.GeminiAiService geminiAiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public AiJobMatchResponse calculateAndSaveMatch(Candidate candidate, Job job, Cv cv) {
        // Cache rule: Check if already calculated
        Optional<AiJobMatch> existing = aiJobMatchRepository
                .findByCandidate_CandidateIdAndJob_JobId(candidate.getCandidateId(), job.getJobId());

        if (existing.isPresent() && existing.get().getMatchingScore() != null) {
            // Kiểm tra tính tươi mới của Cache (Cache Invalidation):
            // Nếu CV truyền vào khác với CV đã dùng để tính điểm trước đó, hủy cache và tính lại
            boolean cvChanged = cv != null && existing.get().getCv() != null
                    && !cv.getCvId().equals(existing.get().getCv().getCvId());
            if (!cvChanged) {
                return mapToResponse(existing.get());
            }
            log.info(">> [AiJobMatchService] Phát hiện ứng viên {} đổi CV (CV cũ: {}, CV mới: {}). Invalidate cache, tính lại điểm match cho Job {}",
                    candidate.getCandidateId(),
                    existing.get().getCv() != null ? existing.get().getCv().getCvId() : null,
                    cv.getCvId(),
                    job.getJobId());
        }

        // 1. Gather Candidate text/keywords
        StringBuilder candText = new StringBuilder();
        if (candidate.getHeadline() != null) candText.append(" ").append(candidate.getHeadline());
        if (candidate.getBio() != null) candText.append(" ").append(candidate.getBio());
        if (candidate.getExperiencesJson() != null) candText.append(" ").append(candidate.getExperiencesJson());
        if (candidate.getEducationsJson() != null) candText.append(" ").append(candidate.getEducationsJson());
        if (cv != null) {
            if (cv.getParsedText() != null) candText.append(" ").append(cv.getParsedText());
            if (cv.getSummary() != null) candText.append(" ").append(cv.getSummary());
            if (cv.getFileName() != null) candText.append(" ").append(cv.getFileName());
        }
        String candProfileStr = candText.toString().toLowerCase();

        // 2. Fetch Job Skills
        List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getJobId());

        List<String> matchedMandatory = new ArrayList<>();
        List<String> missingMandatory = new ArrayList<>();
        List<String> matchedPreferred = new ArrayList<>();
        List<String> missingPreferred = new ArrayList<>();

        int mandatoryTotal = 0;
        int preferredTotal = 0;

        for (JobSkill js : jobSkills) {
            Optional<Skill> sOpt = skillRepository.findById(js.getSkillId());
            String skillName = sOpt.map(Skill::getSkillName).orElse("Skill #" + js.getSkillId());
            String skillLower = skillName.toLowerCase();

            boolean isMatched = isSkillPresentInText(candProfileStr, skillLower);
            if (!isMatched && sOpt.isPresent() && sOpt.get().getAliases() != null) {
                String[] aliases = sOpt.get().getAliases().split(",");
                for (String alias : aliases) {
                    if (isSkillPresentInText(candProfileStr, alias.trim().toLowerCase())) {
                        isMatched = true;
                        break;
                    }
                }
            }

            if (js.getImportance() == SkillImportance.MANDATORY) {
                mandatoryTotal++;
                if (isMatched) {
                    matchedMandatory.add(skillName);
                } else {
                    missingMandatory.add(skillName);
                }
            } else {
                preferredTotal++;
                if (isMatched) {
                    matchedPreferred.add(skillName);
                } else {
                    missingPreferred.add(skillName);
                }
            }
        }

        // 2b. AI Semantic Matcher (LLM Semantic Reasoning):
        // Nếu có kỹ năng bị thiếu sau bước Regex, kích hoạt Gemini Semantic Reasoning
        // để phân tích xem CV/Kinh nghiệm của ứng viên có chứa các năng lực hoặc công nghệ tương đương hay không.
        Map<String, String> semanticEvidence = new HashMap<>();
        List<String> allMissing = new ArrayList<>();
        allMissing.addAll(missingMandatory);
        allMissing.addAll(missingPreferred);

        if (!allMissing.isEmpty() && !candProfileStr.isBlank() && geminiAiService.isAvailable()) {
            Map<String, String> verifiedMatches = geminiAiService.evaluateSemanticSkillMatches(
                    job.getTitle(), candProfileStr, allMissing
            );

            if (!verifiedMatches.isEmpty()) {
                semanticEvidence.putAll(verifiedMatches);
                for (String skill : verifiedMatches.keySet()) {
                    if (missingMandatory.remove(skill)) {
                        matchedMandatory.add(skill + " (Tương đương ngữ nghĩa)");
                    }
                    if (missingPreferred.remove(skill)) {
                        matchedPreferred.add(skill + " (Tương đương ngữ nghĩa)");
                    }
                }
                log.info(">> [AiJobMatchService] AI Semantic Matching đã thẩm định và xác nhận {} kỹ năng cho ứng viên {}!",
                        verifiedMatches.size(), candidate.getCandidateId());
            }
        }

        // 3. Áp dụng công thức chuẩn xác (Không chia 0, Không cộng điểm ảo khi thiếu Preferred):
        float scoreMandatory = (mandatoryTotal == 0) ? 0.0f : ((float) matchedMandatory.size() / mandatoryTotal) * 100.0f;
        float scorePreferred = (preferredTotal == 0) ? 0.0f : ((float) matchedPreferred.size() / preferredTotal) * 100.0f;

        float finalMatchingScore;
        if (mandatoryTotal > 0 && preferredTotal > 0) {
            // Chuẩn 70% Bắt buộc + 30% Ưu tiên
            finalMatchingScore = Math.round(((scoreMandatory * 0.70f) + (scorePreferred * 0.30f)) * 10.0f) / 10.0f;
        } else if (mandatoryTotal > 0) {
            // Job không có kỹ năng ưu tiên -> Kỹ năng bắt buộc chiếm trọn 100% trọng số
            finalMatchingScore = Math.round(scoreMandatory * 10.0f) / 10.0f;
        } else if (preferredTotal > 0) {
            // Job chỉ có kỹ năng ưu tiên -> Kỹ năng ưu tiên chiếm 100% trọng số
            finalMatchingScore = Math.round(scorePreferred * 10.0f) / 10.0f;
        } else {
            // Job chưa khai báo kỹ năng trong CSDL
            finalMatchingScore = 85.0f;
            matchedMandatory.add("Kỹ năng chuyên môn cốt lõi");
            matchedPreferred.add("Kinh nghiệm thực tế");
        }

        // 4. Construct JSON Gap & Reasoning
        Map<String, Object> gapMap = new HashMap<>();
        gapMap.put("matchedMandatory", matchedMandatory);
        gapMap.put("missingMandatory", missingMandatory);
        gapMap.put("matchedPreferred", matchedPreferred);
        gapMap.put("missingPreferred", missingPreferred);
        gapMap.put("semanticEvidence", semanticEvidence);
        gapMap.put("mandatoryScore", Math.round(scoreMandatory * 10f) / 10f);
        gapMap.put("preferredScore", Math.round(scorePreferred * 10f) / 10f);

        String gapJson;
        try {
            gapJson = objectMapper.writeValueAsString(gapMap);
        } catch (Exception e) {
            gapJson = "{}";
        }

        String reasoning = geminiAiService.generateMatchReasoning(
                job.getTitle(),
                matchedMandatory,
                missingMandatory,
                finalMatchingScore
        );

        // 5. Persist or update AiJobMatch
        AiJobMatch match = existing.orElse(AiJobMatch.builder()
                .candidate(candidate)
                .job(job)
                .cv(cv)
                .build());

        match.setCv(cv);
        match.setMatchingScore(finalMatchingScore);
        match.setSkillGapJson(gapJson);
        match.setAiReasoning(reasoning);
        match.setStatus(MatchStatus.COMPLETED);

        AiJobMatch saved = aiJobMatchRepository.save(match);
        log.info(">> [AiJobMatch] Computed match candidateId={} jobId={} score={}%",
                candidate.getCandidateId(), job.getJobId(), finalMatchingScore);

        return mapToResponse(saved);
    }

    @Override
    public AiJobMatchResponse getOrCalculateMatch(Long jobId, User candidateUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        Candidate candidate = candidateRepository.findById(candidateUser.getUserId())
                .orElseThrow(() -> new IllegalStateException("Candidate profile not found: " + candidateUser.getUserId()));

        Optional<AiJobMatch> matchOpt = aiJobMatchRepository
                .findByCandidate_CandidateIdAndJob_JobId(candidate.getCandidateId(), jobId);

        if (matchOpt.isPresent()) {
            return mapToResponse(matchOpt.get());
        }

        // Compute on demand
        Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId()).orElse(null);
        return calculateAndSaveMatch(candidate, job, defaultCv);
    }

    @Override
    public List<AiJobMatchResponse> getMatchesForJob(Long jobId, User recruiterUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getRecruiter().getRecruiterId().equals(recruiterUser.getUserId())) {
            throw new SecurityException("Unauthorized to view matches for this job");
        }

        List<AiJobMatch> matches = aiJobMatchRepository.findByJob_JobIdOrderByMatchingScoreDesc(jobId);
        List<AiJobMatchResponse> responses = new ArrayList<>();
        for (AiJobMatch m : matches) {
            responses.add(mapToResponse(m));
        }
        return responses;
    }

    @Override
    public List<AiJobMatchResponse> getMyMatches(User candidateUser) {
        List<AiJobMatch> matches = aiJobMatchRepository
                .findByCandidate_CandidateIdOrderByMatchingScoreDesc(candidateUser.getUserId());
        List<AiJobMatchResponse> responses = new ArrayList<>();
        for (AiJobMatch m : matches) {
            responses.add(mapToResponse(m));
        }
        return responses;
    }

    @Override
    @Transactional
    public List<com.hiremate.dto.response.JobResponse> getIndustrialJobRecommendations(User candidateUser, Float minScore, Integer limit) {
        float effectiveMinScore = (minScore != null) ? minScore : 0.0f;
        int effectiveLimit = (limit != null && limit > 0) ? Math.min(50, limit) : 20;
        Long candidateId = candidateUser.getUserId();

        Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
        Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidateId)
                .orElseGet(() -> {
                    List<Cv> cvs = cvRepository.findByCandidateId(candidateId);
                    return cvs.isEmpty() ? null : cvs.get(0);
                });

        // 1. Thu thập thông tin hồ sơ ứng viên (Candidate Profile & Skills)
        List<CandidateSkill> candSkills = candidateSkillRepository.findByProfileId(candidateId);
        List<Long> skillIds = candSkills.stream().map(CandidateSkill::getSkillId).toList();
        boolean hasSkills = !skillIds.isEmpty();

        String headline = (candidate != null && candidate.getHeadline() != null) ? candidate.getHeadline().trim() : null;
        boolean hasHeadline = headline != null && !headline.isBlank();

        StringBuilder profileTextBuilder = new StringBuilder();
        if (candidate != null) {
            if (candidate.getHeadline() != null) profileTextBuilder.append("Vị trí/Headline: ").append(candidate.getHeadline()).append("\n");
            if (candidate.getBio() != null) profileTextBuilder.append("Tóm tắt bản thân: ").append(candidate.getBio()).append("\n");
            if (candidate.getExperiencesJson() != null) profileTextBuilder.append("Kinh nghiệm: ").append(candidate.getExperiencesJson()).append("\n");
        }
        if (defaultCv != null) {
            if (defaultCv.getSummary() != null) profileTextBuilder.append("Tóm tắt CV: ").append(defaultCv.getSummary()).append("\n");
            if (defaultCv.getParsedText() != null) profileTextBuilder.append("Nội dung CV: ").append(defaultCv.getParsedText()).append("\n");
        }
        if (!candSkills.isEmpty()) {
            profileTextBuilder.append("Kỹ năng hồ sơ: ");
            for (CandidateSkill cs : candSkills) {
                skillRepository.findById(cs.getSkillId()).ifPresent(s -> profileTextBuilder.append(s.getSkillName()).append(", "));
            }
            profileTextBuilder.append("\n");
        }
        String candidateProfileText = profileTextBuilder.toString();

        // -------------------------------------------------------------
        // BƯỚC 1: LỌC THÔ BẰNG DATABASE SQL (PRE-FILTERING)
        // -------------------------------------------------------------
        List<Job> candidateJobs;
        if (hasSkills || hasHeadline) {
            candidateJobs = jobRepository.findCandidatePreFilteredJobs(
                    skillIds, hasSkills, headline, hasHeadline, org.springframework.data.domain.PageRequest.of(0, 20)
            );
        } else {
            candidateJobs = Collections.emptyList();
        }

        if (candidateJobs.size() < 5) {
            List<Job> recentJobs = jobRepository.findRecentPublishedJobs(org.springframework.data.domain.PageRequest.of(0, 20));
            Set<Long> existingIds = new HashSet<>();
            for (Job j : candidateJobs) existingIds.add(j.getJobId());

            List<Job> merged = new ArrayList<>(candidateJobs);
            for (Job rj : recentJobs) {
                if (existingIds.add(rj.getJobId())) {
                    merged.add(rj);
                    if (merged.size() >= 20) break;
                }
            }
            candidateJobs = merged;
        }

        if (candidateJobs.isEmpty()) {
            return Collections.emptyList();
        }

        // -------------------------------------------------------------
        // BƯỚC 2: KIỂM TRA CACHE & AI CHẤM ĐIỂM CHI TIẾT (BATCH SCORING)
        // -------------------------------------------------------------
        Map<Long, AiJobMatch> resolvedMatchesMap = new HashMap<>();
        List<Job> jobsNeedingAiScore = new ArrayList<>();

        for (Job job : candidateJobs) {
            Optional<AiJobMatch> cachedOpt = aiJobMatchRepository
                    .findByCandidate_CandidateIdAndJob_JobId(candidateId, job.getJobId());

            if (cachedOpt.isPresent() && cachedOpt.get().getMatchingScore() != null) {
                boolean cvChanged = defaultCv != null && cachedOpt.get().getCv() != null
                        && !defaultCv.getCvId().equals(cachedOpt.get().getCv().getCvId());
                if (!cvChanged) {
                    resolvedMatchesMap.put(job.getJobId(), cachedOpt.get());
                    continue;
                }
            }
            jobsNeedingAiScore.add(job);
        }

        if (!jobsNeedingAiScore.isEmpty()) {
            List<com.hiremate.dto.ai.JobBriefForMatching> briefs = new ArrayList<>();
            for (Job j : jobsNeedingAiScore) {
                List<JobSkill> jsList = jobSkillRepository.findByJobId(j.getJobId());
                List<String> mandatory = new ArrayList<>();
                List<String> preferred = new ArrayList<>();
                for (JobSkill js : jsList) {
                    skillRepository.findById(js.getSkillId()).ifPresent(s -> {
                        if (js.getImportance() == SkillImportance.MANDATORY) {
                            mandatory.add(s.getSkillName());
                        } else {
                            preferred.add(s.getSkillName());
                        }
                    });
                }

                briefs.add(com.hiremate.dto.ai.JobBriefForMatching.builder()
                        .jobId(j.getJobId())
                        .title(j.getTitle())
                        .location(j.getLocation())
                        .employmentType(j.getEmploymentType() != null ? j.getEmploymentType().name() : "FULL_TIME")
                        .mandatorySkills(mandatory)
                        .preferredSkills(preferred)
                        .requirements(j.getRequirements())
                        .build());
            }

            List<com.hiremate.dto.ai.AiBatchJobMatchResult> batchResults =
                    geminiAiService.matchJobsBatch(candidateProfileText, briefs);

            Map<Long, com.hiremate.dto.ai.AiBatchJobMatchResult> resultMap = new HashMap<>();
            for (com.hiremate.dto.ai.AiBatchJobMatchResult r : batchResults) {
                resultMap.put(r.getJobId(), r);
            }

            for (Job j : jobsNeedingAiScore) {
                com.hiremate.dto.ai.AiBatchJobMatchResult res = resultMap.get(j.getJobId());
                float score = res != null ? res.getMatchingScore() : 75.0f;
                String reasoning = res != null ? res.getAiReasoning() : "Độ tương thích được tính toán dựa trên mức độ phù hợp kỹ năng.";

                String gapJson;
                try {
                    gapJson = objectMapper.writeValueAsString(Map.of(
                            "matched", res != null && res.getMatchedSkills() != null ? res.getMatchedSkills() : List.of(),
                            "missing", res != null && res.getMissingSkills() != null ? res.getMissingSkills() : List.of()
                    ));
                } catch (Exception ex) {
                    gapJson = "{}";
                }

                AiJobMatch match = aiJobMatchRepository
                        .findByCandidate_CandidateIdAndJob_JobId(candidateId, j.getJobId())
                        .orElse(AiJobMatch.builder()
                                .candidate(candidate)
                                .job(j)
                                .build());

                match.setCv(defaultCv);
                match.setMatchingScore(score);
                match.setAiReasoning(reasoning);
                match.setSkillGapJson(gapJson);
                match.setStatus(MatchStatus.COMPLETED);

                AiJobMatch saved = aiJobMatchRepository.save(match);
                resolvedMatchesMap.put(j.getJobId(), saved);
            }
        }

        // -------------------------------------------------------------
        // BƯỚC 3: LƯU VÀ HIỂN THỊ (SẮP XẾP matching_score DESC)
        // -------------------------------------------------------------
        List<com.hiremate.dto.response.JobResponse> jobResponses = new ArrayList<>();
        for (Job job : candidateJobs) {
            AiJobMatch match = resolvedMatchesMap.get(job.getJobId());
            float score = (match != null && match.getMatchingScore() != null) ? match.getMatchingScore() : 0.0f;

            if (score < effectiveMinScore) {
                continue;
            }

            com.hiremate.dto.response.JobResponse resp = mapToJobResponse(job, match);
            jobResponses.add(resp);
        }

        jobResponses.sort((a, b) -> Float.compare(
                b.getMatchingScore() != null ? b.getMatchingScore() : 0f,
                a.getMatchingScore() != null ? a.getMatchingScore() : 0f
        ));

        if (jobResponses.size() > effectiveLimit) {
            jobResponses = jobResponses.subList(0, effectiveLimit);
        }

        return jobResponses;
    }

    @Override
    @Transactional
    public List<com.hiremate.dto.response.JobResponse> reMatchJobs(User candidateUser) {
        Long candidateId = candidateUser.getUserId();
        log.info(">> [AiJobMatchService] Ứng viên {} yêu cầu Làm mới gợi ý AI (Re-Match). Xóa cache cũ...", candidateId);
        aiJobMatchRepository.deleteByCandidate_CandidateId(candidateId);
        return getIndustrialJobRecommendations(candidateUser, 50.0f, 20);
    }

    @Override
    public List<AiJobMatchResponse> getJobRecommendations(User candidateUser, Float minScore, Integer limit) {
        List<com.hiremate.dto.response.JobResponse> industrialJobs = getIndustrialJobRecommendations(candidateUser, minScore, limit);
        List<AiJobMatchResponse> responses = new ArrayList<>();
        for (com.hiremate.dto.response.JobResponse jr : industrialJobs) {
            responses.add(AiJobMatchResponse.builder()
                    .jobId(jr.getJobId())
                    .jobTitle(jr.getTitle())
                    .companyName(jr.getCompanyName())
                    .location(jr.getLocation())
                    .salaryMin(jr.getSalaryMin())
                    .salaryMax(jr.getSalaryMax())
                    .employmentType(jr.getEmploymentType())
                    .matchingScore(jr.getMatchingScore())
                    .aiReasoning(jr.getAiReasoning())
                    .matchedMandatorySkills(jr.getMatchedSkills())
                    .missingMandatorySkills(jr.getMissingSkills())
                    .status(MatchStatus.COMPLETED)
                    .build());
        }
        return responses;
    }

    private com.hiremate.dto.response.JobResponse mapToJobResponse(Job job, AiJobMatch match) {
        Company company = job.getCompany();

        List<String> skillNames = new ArrayList<>();
        try {
            List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getJobId());
            for (JobSkill js : jobSkills) {
                if (js.getSkillId() != null) {
                    skillRepository.findById(js.getSkillId())
                            .ifPresent(s -> skillNames.add(s.getSkillName()));
                }
            }
        } catch (Exception ignored) {}

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        Float score = null;
        String reasoning = null;

        if (match != null) {
            score = match.getMatchingScore();
            reasoning = match.getAiReasoning();
            if (match.getSkillGapJson() != null && !match.getSkillGapJson().isBlank()) {
                try {
                    Map<String, Object> map = objectMapper.readValue(match.getSkillGapJson(), new TypeReference<>() {});
                    if (map.get("matched") instanceof List<?> list) {
                        list.forEach(i -> matchedSkills.add(String.valueOf(i)));
                    }
                    if (map.get("missing") instanceof List<?> list) {
                        list.forEach(i -> missingSkills.add(String.valueOf(i)));
                    }
                } catch (Exception ignored) {}
            }
        }

        return com.hiremate.dto.response.JobResponse.builder()
                .jobId(job.getJobId())
                .recruiterId(job.getRecruiter() != null ? job.getRecruiter().getRecruiterId() : null)
                .companyId(company != null ? company.getCompanyId() : null)
                .companyName(company != null ? company.getCompanyName() : "HireMate Partner")
                .companyLogo(company != null ? company.getLogoUrl() : null)
                .title(job.getTitle())
                .description(job.getDescription())
                .requirements(parseCleanList(job.getRequirements()))
                .benefits(parseCleanList(job.getBenefits()))
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .location(job.getLocation())
                .employmentType(job.getEmploymentType())
                .status(job.getStatus())
                .vacanciesCount(job.getVacanciesCount())
                .totalViews(job.getTotalViews())
                .applicantCount(0L)
                .deadlineDate(job.getDeadlineDate())
                .skills(skillNames)
                .matchingScore(score)
                .aiReasoning(reasoning)
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .createdAt(job.getCreatedAt())
                .build();
    }

    private List<String> parseCleanList(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        String[] lines = text.split("[\r\n]+");
        List<String> result = new ArrayList<>();
        for (String line : lines) {
            String clean = line.replaceFirst("^[-*•\\d.]+\\s*", "").trim();
            if (!clean.isBlank()) result.add(clean);
        }
        return result.isEmpty() ? List.of(text.trim()) : result;
    }

    @Override
    @org.springframework.scheduling.annotation.Async
    public java.util.concurrent.CompletableFuture<Integer> recalculateMatchesForJobAsync(Long jobId, User recruiterUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getRecruiter().getRecruiterId().equals(recruiterUser.getUserId())) {
            throw new SecurityException("Unauthorized to run batch matching for this job");
        }

        List<Candidate> allCandidates = candidateRepository.findAll();
        int count = 0;
        log.info(">> [AiJobMatchService] Bắt đầu Batch Asynchronous Matching cho Job ID {} trên {} ứng viên",
                jobId, allCandidates.size());

        for (Candidate cand : allCandidates) {
            try {
                Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(cand.getCandidateId()).orElse(null);
                calculateAndSaveMatch(cand, job, defaultCv);
                count++;
            } catch (Exception ex) {
                log.warn(">> [AiJobMatchService] Lỗi khi tính match cho Candidate {}: {}", cand.getCandidateId(), ex.getMessage());
            }
        }

        log.info(">> [AiJobMatchService] Hoàn tất Batch Matching cho Job ID {}. Đã tính điểm cho {}/{} ứng viên",
                jobId, count, allCandidates.size());
        return java.util.concurrent.CompletableFuture.completedFuture(count);
    }

    private AiJobMatchResponse mapToResponse(AiJobMatch m) {
        List<String> matchedMandatory = new ArrayList<>();
        List<String> missingMandatory = new ArrayList<>();
        List<String> matchedPreferred = new ArrayList<>();
        List<String> missingPreferred = new ArrayList<>();

        if (m.getSkillGapJson() != null && !m.getSkillGapJson().isBlank()) {
            try {
                Map<String, Object> map = objectMapper.readValue(m.getSkillGapJson(), new TypeReference<>() {});
                if (map.get("matchedMandatory") != null) {
                    matchedMandatory = objectMapper.convertValue(map.get("matchedMandatory"), new TypeReference<List<String>>() {});
                }
                if (map.get("missingMandatory") != null) {
                    missingMandatory = objectMapper.convertValue(map.get("missingMandatory"), new TypeReference<List<String>>() {});
                }
                if (map.get("matchedPreferred") != null) {
                    matchedPreferred = objectMapper.convertValue(map.get("matchedPreferred"), new TypeReference<List<String>>() {});
                }
                if (map.get("missingPreferred") != null) {
                    missingPreferred = objectMapper.convertValue(map.get("missingPreferred"), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}
        }

        String candName = "Ứng viên";
        if (m.getCandidate() != null && m.getCandidate().getCandidateId() != null) {
            Optional<User> uOpt = userRepository.findById(m.getCandidate().getCandidateId());
            if (uOpt.isPresent()) candName = uOpt.get().getFullName();
        }

        String companyName = (m.getJob() != null && m.getJob().getCompany() != null)
                ? m.getJob().getCompany().getCompanyName() : null;
        String location = m.getJob() != null ? m.getJob().getLocation() : null;
        java.math.BigDecimal salaryMin = m.getJob() != null ? m.getJob().getSalaryMin() : null;
        java.math.BigDecimal salaryMax = m.getJob() != null ? m.getJob().getSalaryMax() : null;
        com.hiremate.enums.EmploymentType employmentType = m.getJob() != null ? m.getJob().getEmploymentType() : null;

        return AiJobMatchResponse.builder()
                .matchId(m.getMatchId())
                .candidateId(m.getCandidate() != null ? m.getCandidate().getCandidateId() : null)
                .candidateName(candName)
                .jobId(m.getJob() != null ? m.getJob().getJobId() : null)
                .jobTitle(m.getJob() != null ? m.getJob().getTitle() : null)
                .cvId(m.getCv() != null ? m.getCv().getCvId() : null)
                .matchingScore(m.getMatchingScore())
                .matchedMandatorySkills(matchedMandatory)
                .missingMandatorySkills(missingMandatory)
                .matchedPreferredSkills(matchedPreferred)
                .missingPreferredSkills(missingPreferred)
                .aiReasoning(m.getAiReasoning())
                .status(m.getStatus())
                .companyName(companyName)
                .location(location)
                .salaryMin(salaryMin)
                .salaryMax(salaryMax)
                .employmentType(employmentType)
                .build();
    }

    private boolean isSkillPresentInText(String text, String skillName) {
        if (text == null || skillName == null || skillName.isBlank()) return false;
        String cleanSkill = skillName.trim();

        return hasRegexMatchWithNegation(text, cleanSkill);
    }

    private static final Map<String, List<String>> COMMON_TECH_SYNONYMS = Map.ofEntries(
            Map.entry("kubernetes", List.of("k8s")),
            Map.entry("k8s", List.of("kubernetes")),
            Map.entry("javascript", List.of("js", "ecmascript")),
            Map.entry("typescript", List.of("ts")),
            Map.entry("postgresql", List.of("postgres", "psql")),
            Map.entry("react", List.of("reactjs", "react.js")),
            Map.entry("reactjs", List.of("react", "react.js")),
            Map.entry("vue", List.of("vuejs", "vue.js")),
            Map.entry("vuejs", List.of("vue", "vue.js")),
            Map.entry("node", List.of("nodejs", "node.js")),
            Map.entry("nodejs", List.of("node", "node.js")),
            Map.entry("ci/cd", List.of("cicd", "continuous integration", "jenkins", "github actions", "gitlab ci")),
            Map.entry("message queue", List.of("kafka", "rabbitmq", "activemq")),
            Map.entry("docker", List.of("containerization", "containers")),
            Map.entry("aws", List.of("amazon web services")),
            Map.entry("gcp", List.of("google cloud"))
    );

    private boolean hasRegexMatchWithNegation(String text, String cleanSkill) {
        String quotedSkill = java.util.regex.Pattern.quote(cleanSkill);
        String regex = "(?<=^|[^a-zA-Z0-9])" + quotedSkill + "(?![a-zA-Z0-9+#])";

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                regex,
                java.util.regex.Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            int start = matcher.start();
            int end = matcher.end();

            // 1. Quét cửa sổ tiền tố (Prefix Negation Window: 30 ký tự trước từ khóa)
            int prefixStart = Math.max(0, start - 30);
            String prefix = text.substring(prefixStart, start).toLowerCase();
            if (prefix.contains("không biết") || prefix.contains("chưa biết")
                    || prefix.contains("chưa từng") || prefix.contains("chưa có")
                    || prefix.contains("không có") || prefix.contains("no experience")
                    || prefix.contains("lack") || prefix.contains("without")) {
                continue;
            }

            // 2. Quét cửa sổ hậu tố (Suffix Negation Window: 45 ký tự sau từ khóa)
            int suffixEnd = Math.min(text.length(), end + 45);
            String suffix = text.substring(end, suffixEnd).toLowerCase();
            if (suffix.contains("chưa có kinh nghiệm") || suffix.contains("chưa từng")
                    || suffix.contains("chưa biết") || suffix.contains("không biết")
                    || suffix.contains("không có kinh nghiệm") || suffix.contains("chưa có nhiều kinh nghiệm")
                    || suffix.contains("chưa làm thực tế") || suffix.contains("chưa dùng thực tế")
                    || suffix.contains("no experience") || suffix.contains("no practical experience")
                    || suffix.contains("lack experience") || suffix.contains("lacking experience")) {
                continue;
            }

            return true;
        }

        // Kiểm tra mở rộng từ điển viết tắt/đồng nghĩa công nghệ
        List<String> synonyms = COMMON_TECH_SYNONYMS.get(cleanSkill.toLowerCase());
        if (synonyms != null) {
            for (String syn : synonyms) {
                if (hasRegexMatchDirect(text, syn)) {
                    return true;
                }
            }
        }

        return false;
    }

    private boolean hasRegexMatchDirect(String text, String synonym) {
        String quoted = java.util.regex.Pattern.quote(synonym);
        String regex = "(?<=^|[^a-zA-Z0-9])" + quoted + "(?![a-zA-Z0-9+#])";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(regex, java.util.regex.Pattern.CASE_INSENSITIVE).matcher(text);
        return m.find();
    }
}
