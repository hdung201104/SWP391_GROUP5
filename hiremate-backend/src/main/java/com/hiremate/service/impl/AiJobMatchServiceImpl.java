package com.hiremate.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.stream.Collectors;

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
    private final com.hiremate.service.SystemSettingsService systemSettingsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.JobService jobService;

    private final Map<Long, Skill> skillCache = new java.util.concurrent.ConcurrentHashMap<>();

    @jakarta.annotation.PostConstruct
    public void preloadSkillCache() {
        try {
            skillRepository.findAll().forEach(s -> {
                if (s.getSkillId() != null) {
                    skillCache.put(s.getSkillId(), s);
                }
            });
            log.info(">> [AiJobMatchService] Preloaded {} skills into cache", skillCache.size());
        } catch (Exception ignored) {}
    }

    @Override
    @Transactional
    public AiJobMatchResponse calculateAndSaveMatch(Candidate candidate, Job job, Cv cv) {
        return calculateAndSaveMatch(candidate, job, cv, false);
    }

    @Transactional
    public AiJobMatchResponse calculateAndSaveMatch(Candidate candidate, Job job, Cv cv, boolean enableGemini) {
        // Cache rule: Check if already calculated
        Optional<AiJobMatch> existing = aiJobMatchRepository
                .findByCandidate_CandidateIdAndJob_JobId(candidate.getCandidateId(), job.getJobId());

        if (existing.isPresent() && existing.get().getMatchingScore() != null) {
            // Kiểm tra tính tươi mới của Cache (Cache Invalidation):
            // Nếu ứng viên có CV mà bản ghi cũ chưa gắn CV, hoặc đổi sang CV khác: bắt buộc hủy cache tính lại
            boolean cvChanged = (cv != null && existing.get().getCv() == null)
                    || (cv != null && existing.get().getCv() != null && !cv.getCvId().equals(existing.get().getCv().getCvId()));
            // Ngoài ra: nếu bản ghi cũ bị kẹt điểm 70.0% phẳng, bắt buộc tính lại điểm thực tế
            boolean isStaleFlatScore = existing.get().getMatchingScore() == 70.0f;

            if (!cvChanged && !isStaleFlatScore) {
                return mapToResponse(existing.get());
            }
            log.info(">> [AiJobMatchService] Invalidate cache điểm cũ cho ứng viên {} và Job {} (cvChanged={}, isStaleFlat={})",
                    candidate.getCandidateId(), job.getJobId(), cvChanged, isStaleFlatScore);
        }

        // 1. Gather Candidate text/keywords from profile, skills, and CV
        StringBuilder candText = new StringBuilder();
        if (candidate.getHeadline() != null) candText.append(" ").append(candidate.getHeadline());
        if (candidate.getBio() != null) candText.append(" ").append(candidate.getBio());
        if (candidate.getExperiencesJson() != null) candText.append(" ").append(candidate.getExperiencesJson());
        if (candidate.getEducationsJson() != null) candText.append(" ").append(candidate.getEducationsJson());

        // Bổ sung kỹ năng từ bảng candidate_skills
        try {
            List<CandidateSkill> candSkills = candidateSkillRepository.findByProfileId(candidate.getCandidateId());
            for (CandidateSkill cs : candSkills) {
                Skill s = skillCache.computeIfAbsent(cs.getSkillId(), id -> skillRepository.findById(id).orElse(null));
                if (s != null && s.getSkillName() != null) {
                    candText.append(" ").append(s.getSkillName());
                }
            }
        } catch (Exception ignored) {}

        if (cv != null) {
            if (cv.getParsedText() != null) candText.append(" ").append(cv.getParsedText());
            if (cv.getSummary() != null) candText.append(" ").append(cv.getSummary());
            if (cv.getFileName() != null) candText.append(" ").append(cv.getFileName());
            if (cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
                try {
                    JsonNode node = objectMapper.readTree(cv.getParsedJson());
                    if (node.has("skills") && node.get("skills").isArray()) {
                        node.get("skills").forEach(sk -> candText.append(" ").append(sk.asText()));
                    }
                } catch (Exception ignored) {}
            }
        }
        String candProfileStr = candText.toString().toLowerCase().trim();

        // 2. Fetch Job Skills (ưu tiên bảng job_skills, nếu chưa có thì bóc tách từ requirements, benefits, title)
        List<JobSkill> jobSkills = jobSkillRepository.findByJobId(job.getJobId());
        List<String> mandatorySkillNames = new ArrayList<>();
        List<String> preferredSkillNames = new ArrayList<>();

        if (jobSkills != null && !jobSkills.isEmpty()) {
            for (JobSkill js : jobSkills) {
                Skill s = skillCache.computeIfAbsent(js.getSkillId(), id -> skillRepository.findById(id).orElse(null));
                String name = s != null ? s.getSkillName() : ("Skill #" + js.getSkillId());
                if (js.getImportance() == SkillImportance.MANDATORY) {
                    mandatorySkillNames.add(name);
                } else {
                    preferredSkillNames.add(name);
                }
            }
        } else {
            // Tự động phân tách từ requirements (Bắt buộc)
            if (job.getRequirements() != null && !job.getRequirements().isBlank()) {
                String[] reqItems = job.getRequirements().split("[,\\n]+");
                for (String item : reqItems) {
                    String clean = item.replaceFirst("^[-*•\\d.]+\\s*", "").trim();
                    if (!clean.isBlank() && clean.length() <= 35) {
                        mandatorySkillNames.add(clean);
                    }
                }
            }
            // Tự động phân tách từ benefits (Ưu tiên)
            if (job.getBenefits() != null && !job.getBenefits().isBlank()) {
                String[] benItems = job.getBenefits().split("[,\\n]+");
                for (String item : benItems) {
                    String clean = item.replaceFirst("^[-*•\\d.]+\\s*", "").trim();
                    String lower = clean.toLowerCase();
                    if (!clean.isBlank() && clean.length() <= 35 && !lower.contains("lương") && !lower.contains("bảo hiểm") && !lower.contains("thưởng") && !lower.contains("phép")) {
                        preferredSkillNames.add(clean);
                    }
                }
            }
            // Trích xuất bổ sung từ title và description dựa trên từ điển kỹ năng
            String combinedJobText = (job.getTitle() + " " + (job.getDescription() != null ? job.getDescription() : "")).toLowerCase();
            for (Skill s : skillCache.values()) {
                if (s.getSkillName() != null && isSkillPresentInText(combinedJobText, s.getSkillName().toLowerCase())) {
                    if (!mandatorySkillNames.contains(s.getSkillName()) && !preferredSkillNames.contains(s.getSkillName())) {
                        if (mandatorySkillNames.size() < 4) {
                            mandatorySkillNames.add(s.getSkillName());
                        } else if (preferredSkillNames.size() < 3) {
                            preferredSkillNames.add(s.getSkillName());
                        }
                    }
                }
            }
        }

        if (mandatorySkillNames.isEmpty() && preferredSkillNames.isEmpty()) {
            mandatorySkillNames.add("Kỹ năng chuyên môn cốt lõi");
            mandatorySkillNames.add("Tư duy kỹ thuật");
        }

        // 3. Đánh giá đối soát kỹ năng
        List<String> matchedMandatory = new ArrayList<>();
        List<String> missingMandatory = new ArrayList<>();
        for (String skillName : mandatorySkillNames) {
            if (candProfileStr.isBlank()) {
                missingMandatory.add(skillName);
                continue;
            }
            if (isSkillPresentInText(candProfileStr, skillName.toLowerCase())) {
                matchedMandatory.add(skillName);
            } else {
                missingMandatory.add(skillName);
            }
        }

        List<String> matchedPreferred = new ArrayList<>();
        List<String> missingPreferred = new ArrayList<>();
        for (String skillName : preferredSkillNames) {
            if (candProfileStr.isBlank()) {
                missingPreferred.add(skillName);
                continue;
            }
            if (isSkillPresentInText(candProfileStr, skillName.toLowerCase())) {
                matchedPreferred.add(skillName);
            } else {
                missingPreferred.add(skillName);
            }
        }

        // 4. Tính toán điểm matching chuẩn xác, tuân thủ đúng tỷ trọng và Guard chia cho 0
        float finalMatchingScore;
        if (candProfileStr.isBlank()) {
            finalMatchingScore = 0.0f;
        } else {
            float scoreMandatory = mandatorySkillNames.isEmpty() ? 0.0f : ((float) matchedMandatory.size() / mandatorySkillNames.size()) * 100.0f;
            float scorePreferred = preferredSkillNames.isEmpty() ? 0.0f : ((float) matchedPreferred.size() / preferredSkillNames.size()) * 100.0f;

            // Zero-division Guard & Trọng số động (Mặc định 70% Bắt buộc + 30% Ưu tiên)
            float mandatoryRatio = 0.70f;
            float preferredRatio = 0.30f;
            if (preferredSkillNames.isEmpty()) {
                mandatoryRatio = 1.0f;
                preferredRatio = 0.0f;
            } else if (mandatorySkillNames.isEmpty()) {
                mandatoryRatio = 0.0f;
                preferredRatio = 1.0f;
            } else if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
                com.hiremate.dto.response.AdminSettingsDTO settings = systemSettingsService.getSettings();
                if (settings.getMandatoryWeight() != null) {
                    mandatoryRatio = settings.getMandatoryWeight() / 100.0f;
                    preferredRatio = (100 - settings.getMandatoryWeight()) / 100.0f;
                }
            }

            float rawScore = (scoreMandatory * mandatoryRatio) + (scorePreferred * preferredRatio);

            if (scoreMandatory == 100.0f && (preferredSkillNames.isEmpty() || scorePreferred == 100.0f)) {
                rawScore = 100.0f;
            }

            finalMatchingScore = Math.round(Math.min(100.0f, Math.max(0.0f, rawScore)) * 10.0f) / 10.0f;
        }

        // 5. Construct JSON Gap & Reasoning
        Map<String, Object> gapMap = new HashMap<>();
        gapMap.put("matchedMandatory", matchedMandatory);
        gapMap.put("missingMandatory", missingMandatory);
        gapMap.put("matchedPreferred", matchedPreferred);
        gapMap.put("missingPreferred", missingPreferred);
        gapMap.put("mandatoryScore", Math.round((mandatorySkillNames.isEmpty() ? 0f : ((float) matchedMandatory.size() / mandatorySkillNames.size()) * 100f) * 10f) / 10f);
        gapMap.put("preferredScore", Math.round((preferredSkillNames.isEmpty() ? 0f : ((float) matchedPreferred.size() / preferredSkillNames.size()) * 100f) * 10f) / 10f);

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

        // 6. Persist or update AiJobMatch
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
    @Transactional
    public AiJobMatchResponse getOrCalculateMatch(Long jobId, User candidateUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        Candidate candidate = candidateRepository.findById(candidateUser.getUserId())
                .orElseThrow(() -> new IllegalStateException("Candidate profile not found: " + candidateUser.getUserId()));

        Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId())
                .orElseGet(() -> {
                    List<Cv> cvs = cvRepository.findByCandidateId(candidate.getCandidateId());
                    return cvs.isEmpty() ? null : cvs.get(0);
                });

        return calculateAndSaveMatch(candidate, job, defaultCv, false);
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
    @Transactional
    public List<AiJobMatchResponse> getMyMatches(User candidateUser) {
        return getJobRecommendations(candidateUser, 0.0f, 20);
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

        // 1. KIỂM TRA BẢNG LƯU SẴN (ai_job_matches):
        // Nếu đã có kết quả tính toán trước đó, đọc và trả về tức thì (0ms compute, không chặn request)
        List<AiJobMatch> cachedMatches = aiJobMatchRepository.findRecommendations(candidateId, effectiveMinScore);

        // Tự động kiểm tra phát hiện cache cũ phẳng 70.0% hoặc CV không khớp
        boolean hasStaleOrCvMismatch = !cachedMatches.isEmpty() && cachedMatches.stream().anyMatch(m ->
                (m.getMatchingScore() != null && m.getMatchingScore() == 70.0f)
                || (defaultCv != null && m.getCv() == null)
                || (defaultCv != null && m.getCv() != null && !defaultCv.getCvId().equals(m.getCv().getCvId()))
        );

        if (hasStaleOrCvMismatch) {
            log.info(">> [AiJobMatchService] Phát hiện cache gợi ý cũ cần làm mới (hasStaleOrCvMismatch) cho ứng viên {}, xóa cache để tính toán cá nhân hóa...", candidateId);
            aiJobMatchRepository.deleteByCandidate_CandidateId(candidateId);
            cachedMatches = Collections.emptyList();
        }

        if (!cachedMatches.isEmpty()) {
            List<Job> matchedJobs = cachedMatches.stream()
                    .map(AiJobMatch::getJob)
                    .filter(Objects::nonNull)
                    .toList();

            List<com.hiremate.dto.response.JobResponse> responses = (jobService != null)
                    ? jobService.mapToResponses(matchedJobs)
                    : new ArrayList<>();

            Map<Long, AiJobMatch> matchMap = cachedMatches.stream()
                    .filter(m -> m.getJob() != null && m.getJob().getJobId() != null)
                    .collect(Collectors.toMap(m -> m.getJob().getJobId(), m -> m, (a, b) -> a));

            for (com.hiremate.dto.response.JobResponse resp : responses) {
                AiJobMatch m = matchMap.get(resp.getJobId());
                if (m != null) {
                    resp.setMatchingScore(m.getMatchingScore());
                    resp.setAiReasoning(m.getAiReasoning());
                }
            }

            responses.sort((a, b) -> Float.compare(
                    b.getMatchingScore() != null ? b.getMatchingScore() : 0f,
                    a.getMatchingScore() != null ? a.getMatchingScore() : 0f
            ));

            if (responses.size() > effectiveLimit) {
                responses = responses.subList(0, effectiveLimit);
            }
            return responses;
        }

        // 2. NẾU CHƯA CÓ TRONG DB (Ứng viên mới đăng ký hoặc vừa xóa cache):


        List<CandidateSkill> candSkills = candidateSkillRepository.findByProfileId(candidateId);
        List<Long> skillIds = candSkills.stream().map(CandidateSkill::getSkillId).toList();
        boolean hasSkills = !skillIds.isEmpty();

        String headline = (candidate != null && candidate.getHeadline() != null) ? candidate.getHeadline().trim() : null;
        boolean hasHeadline = headline != null && !headline.isBlank();

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

        Map<Long, AiJobMatch> resolvedMatchesMap = new HashMap<>();
        for (Job j : candidateJobs) {
            try {
                calculateAndSaveMatch(candidate, j, defaultCv, false);
                aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(candidateId, j.getJobId())
                        .ifPresent(m -> resolvedMatchesMap.put(j.getJobId(), m));
            } catch (Exception ex) {
                log.warn(">> [AiJobMatchService] Fast compute match error for job {}: {}", j.getJobId(), ex.getMessage());
            }
        }

        List<com.hiremate.dto.response.JobResponse> jobResponses = (jobService != null)
                ? jobService.mapToResponses(candidateJobs)
                : new ArrayList<>();

        for (com.hiremate.dto.response.JobResponse resp : jobResponses) {
            AiJobMatch match = resolvedMatchesMap.get(resp.getJobId());
            if (match != null) {
                resp.setMatchingScore(match.getMatchingScore());
                resp.setAiReasoning(match.getAiReasoning());
            }
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
    @Transactional
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
        if (jobService != null) {
            com.hiremate.dto.response.JobResponse resp = jobService.mapToResponse(job);
            if (resp != null && match != null) {
                resp.setMatchingScore(match.getMatchingScore());
                resp.setAiReasoning(match.getAiReasoning());
            }
            return resp;
        }

        Company company = job.getCompany();

        List<String> skillNames = new ArrayList<>();

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
