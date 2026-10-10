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
    public List<AiJobMatchResponse> getJobRecommendations(User candidateUser, Float minScore, Integer limit) {
        float effectiveMinScore = (minScore != null && minScore > 0) ? minScore : 50.0f;
        int effectiveLimit = (limit != null && limit > 0) ? Math.min(50, limit) : 10;

        Long candidateId = candidateUser.getUserId();

        // 1. Tìm các recommendations đã có sẵn trong bảng cache ai_job_matches
        List<AiJobMatch> cachedMatches = aiJobMatchRepository.findRecommendations(candidateId, effectiveMinScore);

        // 2. Nếu số lượng recommendations đã cache ít hơn 5, chủ động tính toán thêm cho các Job đang tuyển chưa được match
        if (cachedMatches.size() < 5) {
            try {
                Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
                if (candidate != null) {
                    Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidateId).orElse(null);
                    // Lấy các Job đang PUBLISHED và còn hạn
                    List<Job> activeJobs = jobRepository.findByStatus(com.hiremate.enums.JobStatus.PUBLISHED);
                    int scanned = 0;
                    for (Job j : activeJobs) {
                        if (j.getDeadlineDate() != null && j.getDeadlineDate().isBefore(java.time.LocalDate.now())) {
                            continue;
                        }
                        // Nếu chưa từng tính match cho Job này
                        if (aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(candidateId, j.getJobId()).isEmpty()) {
                            calculateAndSaveMatch(candidate, j, defaultCv);
                            scanned++;
                            if (scanned >= 10) break; // Giới hạn on-demand 10 jobs để phản hồi nhanh
                        }
                    }
                    if (scanned > 0) {
                        cachedMatches = aiJobMatchRepository.findRecommendations(candidateId, effectiveMinScore);
                    }
                }
            } catch (Exception e) {
                log.warn(">> [AiJobMatchService] Lỗi khi chủ động tính match cho recommendations: {}", e.getMessage());
            }
        }

        List<AiJobMatchResponse> responses = new ArrayList<>();
        int count = 0;
        for (AiJobMatch m : cachedMatches) {
            responses.add(mapToResponse(m));
            count++;
            if (count >= effectiveLimit) break;
        }

        return responses;
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
