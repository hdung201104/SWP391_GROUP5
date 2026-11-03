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
import java.time.LocalDateTime;

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
    private ApplicationRepository applicationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.JobService jobService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.SkillService skillService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private RecruiterRepository recruiterRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private SubscriptionRepository subscriptionRepository;

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

        try {
            // Dọn dẹp các bản ghi tự động sinh trước đây khi chưa có yêu cầu phân tích của người dùng
            List<AiJobMatch> matches = aiJobMatchRepository.findAll();
            List<AiJobMatch> toDelete = new ArrayList<>();
            for (AiJobMatch m : matches) {
                if (m.getSkillGapJson() == null || !m.getSkillGapJson().contains("\"detailedReport\"")) {
                    toDelete.add(m);
                }
            }
            if (!toDelete.isEmpty()) {
                aiJobMatchRepository.deleteAll(toDelete);
                log.info(">> [AiJobMatchService] Dọn dẹp {} bản ghi tự động sinh không có báo cáo yêu cầu", toDelete.size());
            }
        } catch (Exception ignored) {}
    }

    public Map<Long, Skill> getActiveSkillCache() {
        try {
            long count = skillRepository.count();
            if (count != skillCache.size()) {
                skillRepository.findAll().forEach(s -> {
                    if (s.getSkillId() != null) {
                        skillCache.put(s.getSkillId(), s);
                    }
                });
                log.info(">> [AiJobMatchService] Synchronized dynamic skillCache (total: {})", skillCache.size());
            }
        } catch (Exception ignored) {}
        return skillCache;
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
            // Nếu bản ghi cũ bị kẹt điểm 70.0% phẳng hoặc điểm ảo >= 99.0% hoặc chưa có cấu trúc 4 trụ cột multi-pillar hoặc chứa chuỗi raw JSON: bắt buộc tính lại
            boolean isStaleFlatScore = existing.get().getMatchingScore() == 70.0f || existing.get().getMatchingScore() >= 99.0f;
            boolean isMissingMultiPillar = existing.get().getSkillGapJson() == null || !existing.get().getSkillGapJson().contains("skillsScore");
            boolean hasRawJsonInGap = existing.get().getSkillGapJson() != null && 
                    (existing.get().getSkillGapJson().contains("[{\"school") || existing.get().getSkillGapJson().contains("[{\"highlight"));

            if (!cvChanged && !isStaleFlatScore && !isMissingMultiPillar && !hasRawJsonInGap && !enableGemini) {
                return mapToResponse(existing.get());
            }
            log.info(">> [AiJobMatchService] Invalidate cache điểm cũ cho ứng viên {} và Job {} (cvChanged={}, isStaleFlat={}, isMissingMultiPillar={}, hasRawJson={})",
                    candidate.getCandidateId(), job.getJobId(), cvChanged, isStaleFlatScore, isMissingMultiPillar, hasRawJsonInGap);
        }

        // 1. Gather Candidate text/keywords from profile, skills, and CV
        StringBuilder candText = new StringBuilder();
        if (candidate.getHeadline() != null) candText.append(" ").append(candidate.getHeadline());
        if (candidate.getBio() != null) candText.append(" ").append(candidate.getBio());
        if (candidate.getExperiencesJson() != null) candText.append(" ").append(candidate.getExperiencesJson());
        if (candidate.getEducationsJson() != null) candText.append(" ").append(candidate.getEducationsJson());
        if (candidate.getProjectsJson() != null) candText.append(" ").append(candidate.getProjectsJson());
        if (candidate.getCareerGoals() != null) candText.append(" ").append(candidate.getCareerGoals());

        // Bổ sung kỹ năng từ bảng candidate_skills
        try {
            List<CandidateSkill> candSkills = candidateSkillRepository.findByProfileId(candidate.getCandidateId());
            for (CandidateSkill cs : candSkills) {
                Skill s = getActiveSkillCache().computeIfAbsent(cs.getSkillId(), id -> skillRepository.findById(id).orElse(null));
                if (s != null && s.getSkillName() != null) {
                    candText.append(" ").append(s.getSkillName());
                    if (s.getAliases() != null && !s.getAliases().isBlank()) {
                        candText.append(" ").append(s.getAliases());
                    }
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
                Skill s = getActiveSkillCache().computeIfAbsent(js.getSkillId(), id -> skillRepository.findById(id).orElse(null));
                String name = s != null ? s.getSkillName() : ("Skill #" + js.getSkillId());
                if (js.getImportance() == SkillImportance.MANDATORY) {
                    mandatorySkillNames.add(name);
                } else {
                    preferredSkillNames.add(name);
                }
            }
        } else {
            // TUYỆT ĐỐI KHÔNG bóc tách văn bản tự do hay benefits làm kỹ năng!
            // Quét text của Job (title, requirements, description) đối chiếu với kho từ điển kỹ năng chuẩn (getActiveSkillCache)
            String combinedJobText = (job.getTitle() + " " + (job.getRequirements() != null ? job.getRequirements() : "") + " " + (job.getDescription() != null ? job.getDescription() : "")).toLowerCase();
            for (Skill s : getActiveSkillCache().values()) {
                if (s.getSkillName() != null && isSkillPresentInText(combinedJobText, s.getSkillName(), s.getAliases())) {
                    if (!mandatorySkillNames.contains(s.getSkillName()) && !preferredSkillNames.contains(s.getSkillName())) {
                        if (mandatorySkillNames.size() < 4) {
                            mandatorySkillNames.add(s.getSkillName());
                        } else if (preferredSkillNames.size() < 3) {
                            preferredSkillNames.add(s.getSkillName());
                        }
                    }
                }
            }

            // Nếu tin tuyển dụng sơ sài chưa gắn tag trong DB, suy luận danh mục kỹ năng chuẩn theo vị trí tuyển dụng (Domain Inference)
            if (mandatorySkillNames.isEmpty()) {
                String titleLower = (job.getTitle() != null ? job.getTitle() : "").toLowerCase();
                String descLower = (job.getDescription() != null ? job.getDescription() : "").toLowerCase();
                if (titleLower.contains("marketing") || descLower.contains("marketing") || titleLower.contains("seo") || titleLower.contains("content")) {
                    mandatorySkillNames.addAll(List.of("Digital Marketing", "Content Creation", "SEO"));
                    preferredSkillNames.addAll(List.of("Google Analytics", "Facebook Ads", "Canva"));
                } else if (titleLower.contains("sales") || titleLower.contains("kinh doanh") || descLower.contains("bán hàng")) {
                    mandatorySkillNames.addAll(List.of("B2B Sales", "Đàm phán thương lượng", "Kỹ năng giao tiếp"));
                    preferredSkillNames.addAll(List.of("CRM", "Lead Generation", "Chăm sóc khách hàng"));
                } else if (titleLower.contains("kế toán") || titleLower.contains("kiểm toán") || titleLower.contains("tài chính") || titleLower.contains("accountant")) {
                    mandatorySkillNames.addAll(List.of("Kế toán tổng hợp", "Báo cáo tài chính", "MISA / FAST"));
                    preferredSkillNames.addAll(List.of("Kê khai thuế", "Excel nâng cao", "Hóa đơn điện tử"));
                } else if (titleLower.contains("nhân sự") || titleLower.contains("tuyển dụng") || titleLower.contains("hr") || titleLower.contains("c&b")) {
                    mandatorySkillNames.addAll(List.of("Tuyển dụng & Đào tạo", "Luật Lao động", "Quản lý hồ sơ nhân sự"));
                    preferredSkillNames.addAll(List.of("C&B", "BHXH", "Phỏng vấn & Đánh giá"));
                } else if (titleLower.contains("thiết kế") || titleLower.contains("designer") || titleLower.contains("graphic") || titleLower.contains("ui/ux")) {
                    mandatorySkillNames.addAll(List.of("Figma", "Adobe Photoshop", "Adobe Illustrator"));
                    preferredSkillNames.addAll(List.of("UI/UX Design", "Tư duy thẩm mỹ", "Typography"));
                } else if (titleLower.contains("business analyst") || titleLower.contains("ba") || descLower.contains("business analyst")) {
                    mandatorySkillNames.addAll(List.of("Phân tích nghiệp vụ", "SRS / User Stories", "UML & BPMN"));
                    preferredSkillNames.addAll(List.of("SQL cơ bản", "Jira", "Figma wireframe"));
                } else if (titleLower.contains("logistics") || titleLower.contains("xuất nhập khẩu") || titleLower.contains("kho vận")) {
                    mandatorySkillNames.addAll(List.of("Thủ tục Hải quan", "Chứng từ Xuất nhập khẩu", "Quản lý Kho vận"));
                    preferredSkillNames.addAll(List.of("Incoterms", "Tiếng Anh thương mại", "Đàm phán cước tàu"));
                } else if (titleLower.contains("backend") || titleLower.contains("java") || titleLower.contains("spring") || titleLower.contains("intern backend")) {
                    mandatorySkillNames.addAll(List.of("Java", "Spring Boot", "SQL / Database", "RESTful API"));
                    preferredSkillNames.addAll(List.of("Docker", "Git", "Cấu trúc dữ liệu"));
                } else if (titleLower.contains("frontend") || titleLower.contains("react") || titleLower.contains("web")) {
                    mandatorySkillNames.addAll(List.of("React.js", "JavaScript", "HTML5 / CSS3", "REST API"));
                    preferredSkillNames.addAll(List.of("TypeScript", "TailwindCSS", "Git"));
                } else if (titleLower.contains("test") || titleLower.contains("qa") || titleLower.contains("qc")) {
                    mandatorySkillNames.addAll(List.of("Manual Testing", "Test Case Design", "SQL", "Postman API"));
                    preferredSkillNames.addAll(List.of("Automation Testing", "Jira / Bug Report"));
                } else if (titleLower.contains("mobile") || titleLower.contains("flutter") || titleLower.contains("android")) {
                    mandatorySkillNames.addAll(List.of("Flutter / Dart", "Mobile UI", "REST API"));
                    preferredSkillNames.addAll(List.of("Firebase", "State Management", "Git"));
                } else if (titleLower.contains("ai") || titleLower.contains("data") || titleLower.contains("python")) {
                    mandatorySkillNames.addAll(List.of("Python", "SQL", "Cấu trúc dữ liệu & Thuật toán", "Data Analysis"));
                    preferredSkillNames.addAll(List.of("Machine Learning", "Docker", "Git"));
                } else if (titleLower.contains("lập trình") || titleLower.contains("kỹ sư phần mềm") || titleLower.contains("kỹ sư cntt") || titleLower.contains("kỹ sư hệ thống") || titleLower.contains("developer") || titleLower.contains("engineer")) {
                    mandatorySkillNames.addAll(List.of("Lập trình cốt lõi", "Cơ sở dữ liệu (SQL)", "RESTful API"));
                    preferredSkillNames.addAll(List.of("Git & Version Control", "Docker cơ bản"));
                } else {
                    mandatorySkillNames.addAll(List.of("Kỹ năng giao tiếp", "Giải quyết vấn đề", "Làm việc nhóm"));
                    preferredSkillNames.addAll(List.of("Tin học văn phòng", "Tiếng Anh giao tiếp"));
                }
            }
        }

        if (mandatorySkillNames.isEmpty() && preferredSkillNames.isEmpty()) {
            mandatorySkillNames.addAll(List.of("Kỹ năng chuyên môn", "Giải quyết vấn đề"));
            preferredSkillNames.add("Làm việc nhóm");
        }

        // 3. Đánh giá đối soát kỹ năng
        List<String> matchedMandatory = new ArrayList<>();
        List<String> missingMandatory = new ArrayList<>();
        for (String skillName : mandatorySkillNames) {
            if (candProfileStr.isBlank()) {
                missingMandatory.add(skillName);
                continue;
            }
            String aliases = null;
            for (Skill s : getActiveSkillCache().values()) {
                if (s.getSkillName() != null && s.getSkillName().equalsIgnoreCase(skillName.trim())) {
                    aliases = s.getAliases();
                    break;
                }
            }
            if (isSkillPresentInText(candProfileStr, skillName, aliases)) {
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
            String aliases = null;
            for (Skill s : getActiveSkillCache().values()) {
                if (s.getSkillName() != null && s.getSkillName().equalsIgnoreCase(skillName.trim())) {
                    aliases = s.getAliases();
                    break;
                }
            }
            if (isSkillPresentInText(candProfileStr, skillName, aliases)) {
                matchedPreferred.add(skillName);
            } else {
                missingPreferred.add(skillName);
            }
        }

        // Semantic Skill Evaluation qua Gemini AI nếu còn kỹ năng chưa khớp bằng từ khóa
        if (enableGemini && geminiAiService != null && (!missingMandatory.isEmpty() || !missingPreferred.isEmpty()) && !candProfileStr.isBlank()) {
            try {
                List<String> allMissing = new ArrayList<>();
                allMissing.addAll(missingMandatory);
                allMissing.addAll(missingPreferred);
                Map<String, String> semanticMatches = geminiAiService.evaluateSemanticSkillMatches(job.getTitle(), candProfileStr, allMissing);
                if (semanticMatches != null && !semanticMatches.isEmpty()) {
                    List<String> newlyMatchedMand = new ArrayList<>();
                    for (String m : missingMandatory) {
                        for (String k : semanticMatches.keySet()) {
                            if (k.equalsIgnoreCase(m)) {
                                newlyMatchedMand.add(m);
                                if (!matchedMandatory.contains(m)) matchedMandatory.add(m);
                                break;
                            }
                        }
                    }
                    missingMandatory.removeAll(newlyMatchedMand);

                    List<String> newlyMatchedPref = new ArrayList<>();
                    for (String p : missingPreferred) {
                        for (String k : semanticMatches.keySet()) {
                            if (k.equalsIgnoreCase(p)) {
                                newlyMatchedPref.add(p);
                                if (!matchedPreferred.contains(p)) matchedPreferred.add(p);
                                break;
                            }
                        }
                    }
                    missingPreferred.removeAll(newlyMatchedPref);

                    log.info(">> [AiJobMatch] Semantic matching chuyển đổi thành công {} kỹ năng bắt buộc và {} kỹ năng ưu tiên",
                            newlyMatchedMand.size(), newlyMatchedPref.size());
                }
            } catch (Exception ex) {
                log.warn(">> [AiJobMatch] Semantic skill matching failed: {}", ex.getMessage());
            }
        }

        // 4. Tính toán điểm matching chuẩn ATS Doanh Nghiệp Quốc Tế (Multi-Criteria Evaluation Matrix)
        float finalMatchingScore;
        float skillsScore = 0.0f;
        float experienceScore = 0.0f;
        float educationScore = 0.0f;
        float semanticScore = 0.0f;

        String titleLower = (job.getTitle() != null ? job.getTitle() : "").toLowerCase();
        boolean isInternOrFresher = titleLower.contains("intern") || titleLower.contains("thực tập") || titleLower.contains("fresher") || titleLower.contains("mới tốt nghiệp");
        boolean isSeniorOrLead = titleLower.contains("senior") || titleLower.contains("lead") || titleLower.contains("trưởng") || titleLower.contains("quản lý") || titleLower.contains("manager") || titleLower.contains("architect");

        // Đọc cấu hình trọng số từ SystemSettingsService
        com.hiremate.dto.response.AdminSettingsDTO settings = systemSettingsService != null ? systemSettingsService.getSettings() : null;
        boolean enableAdaptive = settings == null || Boolean.TRUE.equals(settings.getAdaptiveRoleWeighting());

        // Trọng số thích ứng theo cấp bậc (Adaptive Multi-Criteria Weights) hoặc Cấu hình Hệ thống
        int wSkills = 40;
        int wExp = 30;
        int wEdu = 15;
        int wSem = 15;
        String formulaName = "Chuẩn ATS Doanh Nghiệp (40% Kỹ năng - 30% Kinh nghiệm - 15% Học vấn - 15% AI Dự án)";

        if (enableAdaptive && isInternOrFresher) {
            wSkills = 45;
            wExp = 10;
            wEdu = 30;
            wSem = 15;
            formulaName = "Cấp bậc Thực tập & Mới tốt nghiệp (45% Kỹ năng - 10% Kinh nghiệm - 30% Học vấn - 15% Tiềm năng)";
        } else if (enableAdaptive && isSeniorOrLead) {
            wSkills = 35;
            wExp = 45;
            wEdu = 5;
            wSem = 15;
            formulaName = "Cấp bậc Senior & Tech Lead (45% Kinh nghiệm - 35% Kỹ năng - 15% Dự án - 5% Bằng cấp)";
        } else if (settings != null) {
            if (settings.getSkillsWeight() != null && settings.getExperienceWeight() != null) {
                wSkills = settings.getSkillsWeight();
                wExp = settings.getExperienceWeight();
                wEdu = settings.getEducationWeight() != null ? settings.getEducationWeight() : 15;
                wSem = settings.getSemanticWeight() != null ? settings.getSemanticWeight() : Math.max(0, 100 - wSkills - wExp - wEdu);
                formulaName = settings.getMatchingPreset() != null ? settings.getMatchingPreset() : "Cấu hình trọng số do Admin thiết lập";
            }
        }

        if (candProfileStr.isBlank()) {
            finalMatchingScore = 0.0f;
        } else {
            // Trụ Cột 1: Kỹ Năng Chuyên Môn (Core & Preferred Skills)
            float scoreMandatory = mandatorySkillNames.isEmpty() ? 100.0f : ((float) matchedMandatory.size() / mandatorySkillNames.size()) * 100.0f;
            float scorePreferred = preferredSkillNames.isEmpty() ? 100.0f : ((float) matchedPreferred.size() / preferredSkillNames.size()) * 100.0f;
            float mandW = (settings != null && settings.getMandatoryWeight() != null) ? settings.getMandatoryWeight() / 100.0f : 0.70f;
            float prefW = 1.0f - mandW;
            skillsScore = (scoreMandatory * mandW) + (scorePreferred * prefW);
            if (scoreMandatory == 100.0f && (preferredSkillNames.isEmpty() || scorePreferred == 100.0f)) {
                skillsScore = 100.0f;
            }

            // Trụ Cột 2: Kinh Nghiệm Thực Tế & Cấp Bậc (Realistic Seniority & Years)
            String jobTitleLower = (job.getTitle() != null ? job.getTitle() : "").toLowerCase();
            boolean isSeniorOrLeadRole = jobTitleLower.contains("senior") || jobTitleLower.contains("lead") || jobTitleLower.contains("principal") || jobTitleLower.contains("trưởng nhóm");
            boolean isInternOrFresherRole = jobTitleLower.contains("intern") || jobTitleLower.contains("fresher") || jobTitleLower.contains("thực tập");

            boolean candIsIntern = candProfileStr.contains("intern") || candProfileStr.contains("thực tập") || candProfileStr.contains("fresher") || candProfileStr.contains("sinh viên") || candProfileStr.contains("student");

            float candYears = 0.0f;
            if (candidate.getExperienceYears() != null && candidate.getExperienceYears() > 0) {
                candYears = candidate.getExperienceYears().floatValue();
            } else if (candIsIntern) {
                candYears = 0.5f;
            } else if (cv != null && cv.getParsedText() != null) {
                String cvLower = cv.getParsedText().toLowerCase();
                if (cvLower.contains("senior") && !candIsIntern) candYears = 4.0f;
                else if (cvLower.contains("middle") || cvLower.contains("2 năm")) candYears = 2.0f;
                else if (cvLower.contains("junior") || cvLower.contains("1 năm")) candYears = 1.0f;
                else candYears = 0.8f;
            }

            float requiredYears = isInternOrFresherRole ? 0.0f : (isSeniorOrLeadRole ? 4.0f : 2.0f);
            if (isInternOrFresherRole) {
                experienceScore = candYears >= 0.5f ? 95.0f : 85.0f;
            } else if (requiredYears == 0.0f || candYears >= requiredYears) {
                experienceScore = 100.0f;
            } else {
                experienceScore = Math.max(25.0f, (candYears / requiredYears) * 100.0f);
            }

            // Trụ Cột 3: Học Vấn & Bằng Cấp / Chứng Chỉ
            educationScore = 85.0f;
            String eduText = ((candidate.getEducationsJson() != null ? candidate.getEducationsJson() : "") + " " + candProfileStr).toLowerCase();
            if (eduText.contains("đại học") || eduText.contains("university") || eduText.contains("cử nhân") || eduText.contains("bachelor") || eduText.contains("kỹ sư")) {
                educationScore = 92.0f;
            } else if (eduText.contains("thạc sĩ") || eduText.contains("master") || eduText.contains("tiến sĩ")) {
                educationScore = 98.0f;
            } else if (eduText.contains("cao đẳng")) {
                educationScore = 80.0f;
            }
            if (eduText.contains("aws") || eduText.contains("istqb") || eduText.contains("ielts") || eduText.contains("toeic") || eduText.contains("chứng chỉ")) {
                educationScore = Math.min(100.0f, educationScore + 4.0f);
            }

            // Trụ Cột 4: Dự Án & Ngữ Nghĩa Toàn Diện (AI Semantic Relevance)
            int kwHits = 0;
            String[] keywords = {"dự án", "project", "xây dựng", "phát triển", "triển khai", "tối ưu", "api", "database", "git", "agile", "scrum", "teamwork"};
            for (String kw : keywords) {
                if (candProfileStr.contains(kw)) kwHits++;
            }
            semanticScore = Math.min(90.0f, 60.0f + (kwHits * 2.5f));

            // Domain & Role Specialization Alignment
            float roleMultiplier = 1.0f;
            boolean jobIsTester = jobTitleLower.contains("test") || jobTitleLower.contains("qa") || jobTitleLower.contains("qc") || jobTitleLower.contains("kiểm thử");
            if (jobIsTester) {
                boolean candHasTesting = candProfileStr.contains("tester") || candProfileStr.contains("test case") || candProfileStr.contains("kiểm thử") || candProfileStr.contains("qa") || candProfileStr.contains("qc") || candProfileStr.contains("selenium") || candProfileStr.contains("cypress") || candProfileStr.contains("junit");
                if (!candHasTesting) {
                    roleMultiplier = Math.min(roleMultiplier, 0.48f); // Candidate has no testing skills -> reduce to ~45-48%
                }
            }

            boolean jobIsFrontend = jobTitleLower.contains("frontend") || jobTitleLower.contains("front-end") || jobTitleLower.contains("react") || jobTitleLower.contains("vue") || jobTitleLower.contains("angular");
            if (jobIsFrontend) {
                boolean candHasFrontend = candProfileStr.contains("frontend") || candProfileStr.contains("front-end") || candProfileStr.contains("react") || candProfileStr.contains("vue") || candProfileStr.contains("angular") || candProfileStr.contains("html") || candProfileStr.contains("css");
                if (!candHasFrontend) {
                    roleMultiplier = Math.min(roleMultiplier, 0.52f);
                }
            }

            boolean jobIsBackend = jobTitleLower.contains("backend") || jobTitleLower.contains("back-end") || jobTitleLower.contains("java") || jobTitleLower.contains("spring");
            if (jobIsBackend) {
                boolean candHasBackend = candProfileStr.contains("backend") || candProfileStr.contains("back-end") || candProfileStr.contains("java") || candProfileStr.contains("spring") || candProfileStr.contains("database") || candProfileStr.contains("sql") || candProfileStr.contains("api");
                if (!candHasBackend) {
                    roleMultiplier = Math.min(roleMultiplier, 0.52f);
                }
            }

            // Seniority Level Multiplier
            float levelMultiplier = 1.0f;
            if (isSeniorOrLeadRole && candIsIntern) {
                levelMultiplier = 0.72f; // Intern applying for Senior role
            }

            // Tổng điểm có trọng số
            float rawWeighted = (skillsScore * wSkills + experienceScore * wExp + educationScore * wEdu + semanticScore * wSem) / 100.0f;
            float adjustedTotal = rawWeighted * roleMultiplier * levelMultiplier;
            // Cap at 95.0f max so matches look realistic and natural
            finalMatchingScore = Math.round(Math.min(95.0f, Math.max(15.0f, adjustedTotal)) * 10.0f) / 10.0f;
        }

        // 5. Construct JSON Gap & Reasoning
        Map<String, Object> gapMap = new HashMap<>();
        gapMap.put("matchedMandatory", matchedMandatory);
        gapMap.put("missingMandatory", missingMandatory);
        gapMap.put("matchedPreferred", matchedPreferred);
        gapMap.put("missingPreferred", missingPreferred);
        gapMap.put("mandatoryScore", Math.round((mandatorySkillNames.isEmpty() ? 0f : ((float) matchedMandatory.size() / mandatorySkillNames.size()) * 100f) * 10f) / 10f);
        gapMap.put("preferredScore", Math.round((preferredSkillNames.isEmpty() ? 0f : ((float) matchedPreferred.size() / preferredSkillNames.size()) * 100f) * 10f) / 10f);
        gapMap.put("skillsScore", Math.round(skillsScore * 10f) / 10f);
        gapMap.put("experienceScore", Math.round(experienceScore * 10f) / 10f);
        gapMap.put("educationScore", Math.round(educationScore * 10f) / 10f);
        gapMap.put("semanticScore", Math.round(semanticScore * 10f) / 10f);
        gapMap.put("skillsWeight", wSkills);
        gapMap.put("experienceWeight", wExp);
        gapMap.put("educationWeight", wEdu);
        gapMap.put("semanticWeight", wSem);
        gapMap.put("matchingFormula", formulaName);

        String reasoning = null;
        if (enableGemini && geminiAiService != null && geminiAiService.isAvailable()) {
            try {
                reasoning = geminiAiService.generateMatchReasoning(
                        job.getTitle(),
                        matchedMandatory,
                        missingMandatory,
                        finalMatchingScore
                );
            } catch (Exception ex) {
                log.warn(">> [AiJobMatchService] Lỗi gọi Gemini generateMatchReasoning: {}", ex.getMessage());
            }
        }
        if (reasoning == null || reasoning.isBlank()) {
            String matched = !matchedMandatory.isEmpty() ? String.join(", ", matchedMandatory) : "Kỹ năng cốt lõi";
            String missing = !missingMandatory.isEmpty() ? String.join(", ", missingMandatory) : "Một số kỹ năng bổ trợ";
            if (finalMatchingScore >= 80.0f) {
                reasoning = "Ứng viên đạt " + String.format(Locale.US, "%.1f", finalMatchingScore) + "% độ tương thích vị trí " + job.getTitle() +
                        ", làm chủ xuất sắc nhóm kỹ năng cốt lõi: " + matched + ". Đề xuất ưu tiên mời phỏng vấn kỹ thuật trực tiếp.";
            } else if (finalMatchingScore >= 65.0f) {
                reasoning = "Hồ sơ đạt độ tương thích tốt (" + String.format(Locale.US, "%.1f", finalMatchingScore) + "%), đáp ứng nền tảng về " + matched +
                        ". Nên sắp xếp phỏng vấn để làm rõ thêm về " + missing + " trong bối cảnh thực tế của dự án.";
            } else {
                reasoning = "Độ tương thích đạt " + String.format(Locale.US, "%.1f", finalMatchingScore) + "% cho vị trí " + job.getTitle() +
                        ". Hồ sơ hiện còn khoảng trống về " + missing + "; đề xuất kiểm tra thêm qua bài test kỹ thuật đầu vào.";
            }
        }

        // Giữ lại detailedReport nếu người dùng đã từng yêu cầu AI tạo trước đó; KHÔNG tự động tạo detailedReport để tiết kiệm token
        if (existing.isPresent() && existing.get().getSkillGapJson() != null) {
            try {
                JsonNode prevRoot = objectMapper.readTree(existing.get().getSkillGapJson());
                if (prevRoot.has("detailedReport") && !prevRoot.get("detailedReport").isNull()) {
                    gapMap.put("detailedReport", prevRoot.get("detailedReport"));
                }
            } catch (Exception ignored) {}
        }

        String gapJson;
        try {
            gapJson = objectMapper.writeValueAsString(gapMap);
        } catch (Exception e) {
            gapJson = "{}";
        }

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

        Optional<AiJobMatch> existing = aiJobMatchRepository
                .findByCandidate_CandidateIdAndJob_JobId(candidate.getCandidateId(), job.getJobId());

        if (existing.isPresent() && existing.get().getMatchingScore() != null) {
            return mapToResponse(existing.get());
        }

        // Không tự tiện tính toán lưu DB khi chỉ mở xem tin tuyển dụng.
        // Chỉ tính toán khi người dùng chủ động bấm 'Nhờ AI chấm độ phù hợp' (evaluateJobWithCv)
        return null;
    }

    @Override
    @Transactional
    public AiJobMatchResponse evaluateJobWithCv(Long jobId, Long cvId, User candidateUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin tuyển dụng: " + jobId));

        Candidate candidate = candidateRepository.findById(candidateUser.getUserId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy hồ sơ ứng viên: " + candidateUser.getUserId()));

        Cv targetCv;
        if (cvId != null) {
            targetCv = cvRepository.findById(cvId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy CV: " + cvId));
            if (!targetCv.getCandidateId().equals(candidate.getCandidateId())) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền đánh giá bằng CV của người khác");
            }
        } else {
            targetCv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidate.getCandidateId())
                    .orElseGet(() -> {
                        List<Cv> cvs = cvRepository.findByCandidateId(candidate.getCandidateId());
                        return cvs.isEmpty() ? null : cvs.get(0);
                    });
        }

        // Chấm điểm tức thì (force AI compute = true, lưu vào cache ai_job_matches)
        return calculateAndSaveMatch(candidate, job, targetCv, true);
    }

    private boolean isAuthorizedRecruiterForJob(Job job, User user) {
        if (user == null || job == null) return false;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return true;
        }
        if (job.getRecruiter() != null && job.getRecruiter().getRecruiterId().equals(user.getUserId())) {
            return true;
        }
        if (job.getCompany() != null && recruiterRepository != null) {
            Optional<Recruiter> recOpt = recruiterRepository.findById(user.getUserId());
            if (recOpt.isPresent() && recOpt.get().getCompany() != null
                    && recOpt.get().getCompany().getCompanyId().equals(job.getCompany().getCompanyId())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public List<AiJobMatchResponse> getMatchesForJob(Long jobId, User recruiterUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!isAuthorizedRecruiterForJob(job, recruiterUser)) {
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
        Long candidateId = candidateUser.getUserId();
        List<AiJobMatch> matches = aiJobMatchRepository.findByCandidate_CandidateIdOrderByMatchingScoreDesc(candidateId);
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
        int effectiveLimit = (limit != null && limit > 0) ? Math.min(100, limit) : 50;
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

        if (!cachedMatches.isEmpty()) {
            // Kiểm tra xem các bản ghi trong cachedMatches có gắn đúng defaultCv hiện tại không
            boolean cvChanged = false;
            if (defaultCv != null) {
                for (AiJobMatch m : cachedMatches) {
                    if (m.getCv() == null || !defaultCv.getCvId().equals(m.getCv().getCvId())) {
                        cvChanged = true;
                        break;
                    }
                }
            }
            boolean hasStaleFlatScore = false;
            for (AiJobMatch m : cachedMatches) {
                if (m.getMatchingScore() != null && m.getMatchingScore() >= 99.0f) {
                    hasStaleFlatScore = true;
                    break;
                }
            }
            if (cvChanged || hasStaleFlatScore) {
                log.info(">> [AiJobMatch] Phát hiện cache AI Job Matches cũ (cvChanged={}, hasStaleFlatScore={}). Hủy cache và tính toán lại.", cvChanged, hasStaleFlatScore);
                try {
                    aiJobMatchRepository.deleteByCandidate_CandidateId(candidateId);
                } catch (Exception ex) {
                    log.warn(">> [AiJobMatch] Lỗi khi dọn cache: {}", ex.getMessage());
                }
                cachedMatches = Collections.emptyList();
            }
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

        // Không tự ý chạy ngầm tính toán lưu DB hàng loạt khi chỉ mở trang.
        // Chỉ trả về danh sách rỗng nếu ứng viên chưa có kết quả đánh giá nào trong DB.
        return Collections.emptyList();
    }

    @Override
    @Transactional
    public List<com.hiremate.dto.response.JobResponse> reMatchJobs(User candidateUser) {
        Long candidateId = candidateUser.getUserId();
        log.info(">> [AiJobMatchService] Ứng viên {} yêu cầu Làm mới gợi ý AI (Re-Match). Xóa cache cũ...", candidateId);
        aiJobMatchRepository.deleteByCandidate_CandidateId(candidateId);
        return getIndustrialJobRecommendations(candidateUser, 50.0f, 10);
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
    @Transactional
    public java.util.concurrent.CompletableFuture<Integer> recalculateMatchesForJobAsync(Long jobId, User recruiterUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!isAuthorizedRecruiterForJob(job, recruiterUser)) {
            throw new SecurityException("Unauthorized to run batch matching for this job");
        }

        int count = 0;
        Set<Long> processedCandIds = new HashSet<>();

        // 1. Ưu tiên tính lại cho toàn bộ ứng viên đã nộp đơn vào bài đăng này (theo đúng CV ứng tuyển)
        List<Application> apps = applicationRepository != null ? applicationRepository.findByJob_JobId(jobId) : Collections.emptyList();
        if (apps != null && !apps.isEmpty()) {
            for (Application app : apps) {
                if (app.getCandidate() != null) {
                    try {
                        Candidate cand = app.getCandidate();
                        Cv appCv = app.getCv() != null ? app.getCv()
                                : cvRepository.findByCandidateIdAndIsDefaultTrue(cand.getCandidateId()).orElse(null);
                        aiJobMatchRepository.deleteByCandidate_CandidateIdAndJob_JobId(cand.getCandidateId(), jobId);
                        calculateAndSaveMatch(cand, job, appCv, false);
                        processedCandIds.add(cand.getCandidateId());
                        count++;
                    } catch (Exception ex) {
                        log.warn(">> [AiJobMatchService] Lỗi khi tính lại match cho ứng viên đã nộp {}: {}", app.getCandidate().getCandidateId(), ex.getMessage());
                    }
                }
            }
        }

        // 2. Quét tiếp các ứng viên khác trong hệ thống để phục vụ tính năng tìm kiếm đề cử
        List<Candidate> allCandidates = candidateRepository.findAll();
        for (Candidate cand : allCandidates) {
            if (!processedCandIds.contains(cand.getCandidateId())) {
                try {
                    Cv defaultCv = cvRepository.findByCandidateIdAndIsDefaultTrue(cand.getCandidateId()).orElse(null);
                    calculateAndSaveMatch(cand, job, defaultCv, false);
                    count++;
                } catch (Exception ex) {
                    log.warn(">> [AiJobMatchService] Lỗi khi tính match cho Candidate {}: {}", cand.getCandidateId(), ex.getMessage());
                }
            }
        }

        log.info(">> [AiJobMatchService] Hoàn tất chấm lại toàn bộ CV cho Job ID {}. Đã tính điểm cho {} ứng viên",
                jobId, count);
        return java.util.concurrent.CompletableFuture.completedFuture(count);
    }

    @Override
    public AiJobMatchResponse mapToResponse(AiJobMatch m) {
        List<String> matchedMandatory = new ArrayList<>();
        List<String> missingMandatory = new ArrayList<>();
        List<String> matchedPreferred = new ArrayList<>();
        List<String> missingPreferred = new ArrayList<>();

        Float skillsScore = null;
        Float experienceScore = null;
        Float educationScore = null;
        Float semanticScore = null;
        String matchingFormula = null;

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
                if (map.get("skillsScore") != null) {
                    skillsScore = ((Number) map.get("skillsScore")).floatValue();
                }
                if (map.get("experienceScore") != null) {
                    experienceScore = ((Number) map.get("experienceScore")).floatValue();
                }
                if (map.get("educationScore") != null) {
                    educationScore = ((Number) map.get("educationScore")).floatValue();
                }
                if (map.get("semanticScore") != null) {
                    semanticScore = ((Number) map.get("semanticScore")).floatValue();
                }
                if (map.get("matchingFormula") != null) {
                    matchingFormula = map.get("matchingFormula").toString();
                }
            } catch (Exception ignored) {}
        }

        // Fallback tự động cho các bản ghi cũ chưa lưu breakdown
        if (skillsScore == null) skillsScore = m.getMatchingScore() != null ? m.getMatchingScore() : 80.0f;
        if (experienceScore == null) experienceScore = Math.min(100.0f, skillsScore + 5.0f);
        if (educationScore == null) educationScore = 90.0f;
        if (semanticScore == null) semanticScore = Math.min(100.0f, skillsScore * 0.95f + 5.0f);
        if (matchingFormula == null) matchingFormula = "Chuẩn ATS Doanh Nghiệp (40% Kỹ năng - 30% Kinh nghiệm - 15% Học vấn - 15% AI)";

        String candName = "Ứng viên";
        if (m.getCandidate() != null) {
            if (m.getCandidate().getUser() != null && m.getCandidate().getUser().getFullName() != null) {
                candName = m.getCandidate().getUser().getFullName();
            } else if (m.getCandidate().getCandidateId() != null) {
                Optional<User> uOpt = userRepository.findById(m.getCandidate().getCandidateId());
                if (uOpt.isPresent()) candName = uOpt.get().getFullName();
            }
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
                .skillsScore(skillsScore)
                .experienceScore(experienceScore)
                .educationScore(educationScore)
                .semanticScore(semanticScore)
                .matchingFormula(matchingFormula)
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
        return isSkillPresentInText(text, skillName, null);
    }

    private boolean isSkillPresentInText(String text, String skillName, String directAliases) {
        if (text == null || skillName == null || skillName.isBlank()) return false;
        String cleanSkill = skillName.trim();
        String lowerSkill = cleanSkill.toLowerCase();

        // 1. Kiểm tra chính tên kỹ năng
        if (hasRegexMatchWithNegation(text, cleanSkill)) {
            return true;
        }

        // 2. Nếu tên kỹ năng là dạng ghép (chứa '/', '|', '&', 'hoặc', 'or')
        // Ví dụ: "Kiểm Thử API / Postman", "HTML5 / CSS3", "Flutter / Dart", "Git & Version Control", "SQL / Database"
        if (cleanSkill.contains("/") || cleanSkill.contains("|") || cleanSkill.contains("&") 
                || lowerSkill.contains(" hoặc ") || lowerSkill.contains(" or ")) {
            String[] parts = cleanSkill.split("[/|&]|(?i)\\s+(hoặc|or)\\s+");
            for (String p : parts) {
                String sub = p.trim();
                if (!sub.isBlank() && sub.length() >= 2) {
                    if (isSkillPresentInText(text, sub, null)) {
                        return true;
                    }
                }
            }
        }

        // 3. Tách tiền tố phổ biến như "Frontend React.js" -> "React.js", "Lập trình Java" -> "Java"
        String[] prefixKeywords = {"frontend", "backend", "fullstack", "lập trình", "chuyên viên", "kỹ sư", "nhân viên", "kỹ năng", "thành thạo", "hiểu biết"};
        for (String pref : prefixKeywords) {
            if (lowerSkill.startsWith(pref + " ") && lowerSkill.length() > pref.length() + 2) {
                String stripped = cleanSkill.substring(pref.length() + 1).trim();
                if (!stripped.isBlank() && isSkillPresentInText(text, stripped, null)) {
                    return true;
                }
            }
        }

        // 4. Tách hậu tố phổ biến như "Developer", "Engineer", "Dev"
        String[] suffixKeywords = {"developer", "engineer", "dev", "lập trình viên"};
        for (String suff : suffixKeywords) {
            if (lowerSkill.endsWith(" " + suff) && lowerSkill.length() > suff.length() + 2) {
                String stripped = cleanSkill.substring(0, cleanSkill.length() - suff.length() - 1).trim();
                if (!stripped.isBlank() && isSkillPresentInText(text, stripped, null)) {
                    return true;
                }
            }
        }

        // 5. Kiểm tra directAliases được truyền vào
        if (directAliases != null && !directAliases.isBlank()) {
            String[] aliasArr = directAliases.split("[,;]");
            for (String a : aliasArr) {
                String trimmed = a.trim();
                if (!trimmed.isBlank() && (hasRegexMatchWithNegation(text, trimmed) || hasRegexMatchDirect(text, trimmed))) {
                    return true;
                }
            }
        }

        // 6. Tra cứu từ đồng nghĩa (aliases) trong kho từ điển động getActiveSkillCache()
        for (Skill s : getActiveSkillCache().values()) {
            if (s.getSkillName() != null && s.getSkillName().equalsIgnoreCase(cleanSkill)) {
                if (s.getAliases() != null && !s.getAliases().isBlank()) {
                    String[] aliasArr = s.getAliases().split("[,;]");
                    for (String a : aliasArr) {
                        String trimmed = a.trim();
                        if (!trimmed.isBlank() && (hasRegexMatchWithNegation(text, trimmed) || hasRegexMatchDirect(text, trimmed))) {
                            return true;
                        }
                    }
                }
                break;
            }
        }

        // 7. Tra cứu từ điển COMMON_TECH_SYNONYMS
        List<String> synonyms = COMMON_TECH_SYNONYMS.get(lowerSkill);
        if (synonyms != null) {
            for (String syn : synonyms) {
                if (hasRegexMatchDirect(text, syn)) {
                    return true;
                }
            }
        }

        return false;
    }

    private static final Map<String, List<String>> COMMON_TECH_SYNONYMS = new HashMap<>();

    private static void putSyn(String key, List<String> syns) {
        COMMON_TECH_SYNONYMS.put(key.toLowerCase(), syns);
    }

    static {
        // React & Frontend Ecosystem
        putSyn("react", List.of("reactjs", "react.js", "react js", "frontend react", "react frontend", "react native"));
        putSyn("react.js", List.of("react", "reactjs", "react js", "frontend react", "react frontend"));
        putSyn("reactjs", List.of("react", "react.js", "react js", "frontend react", "react frontend"));
        putSyn("frontend react.js", List.of("react", "reactjs", "react.js", "react js", "frontend react", "react developer"));
        putSyn("frontend react", List.of("react", "reactjs", "react.js", "react js", "frontend"));
        putSyn("javascript", List.of("js", "ecmascript", "es6", "es6+", "vanilla js"));
        putSyn("typescript", List.of("ts"));
        putSyn("html5 / css3", List.of("html", "html5", "css", "css3", "tailwind", "tailwindcss", "bootstrap", "sass", "scss"));
        putSyn("html", List.of("html5", "css", "css3", "web markup"));
        putSyn("css", List.of("css3", "html", "html5", "tailwind", "bootstrap", "sass", "scss"));
        putSyn("tailwind", List.of("tailwindcss", "css"));
        putSyn("tailwindcss", List.of("tailwind", "css"));

        // API & Postman & Web Services
        putSyn("postman", List.of("kiểm thử api", "api testing", "postman api", "test api", "rest api testing", "api test"));
        putSyn("kiểm thử api / postman", List.of("postman", "kiểm thử api", "api testing", "test api", "postman api", "api test"));
        putSyn("kiểm thử api", List.of("postman", "api testing", "test api", "kiểm thử", "api test"));
        putSyn("postman api", List.of("postman", "kiểm thử api", "api testing", "test api"));
        putSyn("rest api", List.of("restful api", "restful", "rest", "api", "web api", "http api", "postman"));
        putSyn("restful api", List.of("rest api", "restful", "rest", "api", "web api", "http api"));
        putSyn("api", List.of("rest api", "restful api", "rest", "web api", "postman"));

        // Backend & Java / Spring
        putSyn("java", List.of("spring", "spring boot", "springboot", "java core", "j2ee", "jpa", "hibernate"));
        putSyn("spring boot", List.of("spring", "springboot", "spring mvc", "java spring"));
        putSyn("sql / database", List.of("sql", "mysql", "postgresql", "postgres", "sql server", "database", "rdbms", "cơ sở dữ liệu", "db"));
        putSyn("cơ sở dữ liệu (sql)", List.of("sql", "mysql", "postgresql", "database", "rdbms", "cơ sở dữ liệu", "db"));
        putSyn("sql", List.of("mysql", "postgresql", "postgres", "sql server", "database", "rdbms", "cơ sở dữ liệu", "db"));
        putSyn("postgresql", List.of("postgres", "psql", "sql"));
        putSyn("mysql", List.of("sql", "database"));

        // Git & DevOps
        putSyn("git", List.of("github", "gitlab", "bitbucket", "version control", "git & version control"));
        putSyn("git & version control", List.of("git", "github", "gitlab", "bitbucket", "version control"));
        putSyn("docker", List.of("container", "containers", "containerization", "docker compose"));
        putSyn("kubernetes", List.of("k8s"));
        putSyn("k8s", List.of("kubernetes"));
        putSyn("ci/cd", List.of("cicd", "continuous integration", "jenkins", "github actions", "gitlab ci"));

        // Testing & QA
        putSyn("manual testing", List.of("manual test", "kiểm thử thủ công", "test case", "test design", "qa tester", "tester"));
        putSyn("automation testing", List.of("automation test", "selenium", "cypress", "playwright", "appium"));

        // Mobile
        putSyn("flutter / dart", List.of("flutter", "dart", "mobile flutter"));
        putSyn("flutter", List.of("dart", "flutter / dart", "mobile development"));
        putSyn("dart", List.of("flutter", "flutter / dart"));

        // Python & Data / AI
        putSyn("python", List.of("python3", "django", "fastapi", "flask", "pandas", "numpy"));
        putSyn("cấu trúc dữ liệu & thuật toán", List.of("cấu trúc dữ liệu", "thuật toán", "dsa", "data structures", "algorithms"));

        // Node & Vue
        putSyn("node", List.of("nodejs", "node.js", "express", "expressjs", "nest", "nestjs"));
        putSyn("nodejs", List.of("node", "node.js", "express", "expressjs", "nest", "nestjs"));
        putSyn("node.js", List.of("node", "nodejs", "express", "expressjs", "nest", "nestjs"));
        putSyn("vue", List.of("vuejs", "vue.js", "vue 3", "vuex", "pinia"));
        putSyn("vuejs", List.of("vue", "vue.js", "vue 3"));
        putSyn("vue.js", List.of("vue", "vuejs", "vue 3"));
    }

    private boolean hasRegexMatchWithNegation(String text, String cleanSkill) {
        if (text == null || cleanSkill == null || cleanSkill.isBlank()) return false;
        String[] tokens = cleanSkill.trim().split("\\s+");
        StringBuilder patternBuilder = new StringBuilder();
        patternBuilder.append("(?<=^|[^\\p{L}\\p{N}])");
        for (int i = 0; i < tokens.length; i++) {
            if (i > 0) patternBuilder.append("\\s+");
            patternBuilder.append(java.util.regex.Pattern.quote(tokens[i]));
        }
        patternBuilder.append("(?![\\p{L}\\p{N}+#])");

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                patternBuilder.toString(),
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
        if (text == null || synonym == null || synonym.isBlank()) return false;
        String[] tokens = synonym.trim().split("\\s+");
        StringBuilder patternBuilder = new StringBuilder();
        patternBuilder.append("(?<=^|[^\\p{L}\\p{N}])");
        for (int i = 0; i < tokens.length; i++) {
            if (i > 0) patternBuilder.append("\\s+");
            patternBuilder.append(java.util.regex.Pattern.quote(tokens[i]));
        }
        patternBuilder.append("(?![\\p{L}\\p{N}+#])");
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(patternBuilder.toString(), java.util.regex.Pattern.CASE_INSENSITIVE).matcher(text);
        return m.find();
    }

    private String formatEducationSummary(String educationsJson) {
        if (educationsJson == null || educationsJson.isBlank() || "[]".equals(educationsJson.trim())) {
            return "Được đào tạo bài bản nền tảng kỹ thuật phần mềm";
        }
        try {
            JsonNode root = objectMapper.readTree(educationsJson);
            if (root.isArray() && !root.isEmpty()) {
                List<String> formattedItems = new ArrayList<>();
                for (JsonNode edu : root) {
                    String school = edu.hasNonNull("school") ? edu.get("school").asText().trim() : "";
                    String degree = edu.hasNonNull("degree") ? edu.get("degree").asText().trim() 
                            : (edu.hasNonNull("major") ? edu.get("major").asText().trim() : "");
                    String grade = edu.hasNonNull("grade") ? edu.get("grade").asText().trim() : "";
                    String period = edu.hasNonNull("period") ? edu.get("period").asText().trim() 
                            : (edu.hasNonNull("year") ? edu.get("year").asText().trim() : "");

                    StringBuilder sb = new StringBuilder();
                    if (!school.isBlank()) sb.append(school);
                    if (!degree.isBlank()) {
                        if (sb.length() > 0) sb.append(" - ");
                        sb.append(degree);
                    }
                    if (!grade.isBlank()) {
                        sb.append(" (").append(grade).append(")");
                    }
                    if (!period.isBlank()) {
                        sb.append(" [Niên khóa: ").append(period).append("]");
                    }
                    if (sb.length() > 0) formattedItems.add(sb.toString());
                }
                if (!formattedItems.isEmpty()) {
                    return "Hồ sơ ghi nhận: " + String.join(" | ", formattedItems);
                }
            }
        } catch (Exception ignored) {}
        if (!educationsJson.startsWith("[") && !educationsJson.startsWith("{")) {
            return "Hồ sơ ghi nhận: " + educationsJson;
        }
        return "Được đào tạo bài bản nền tảng kỹ thuật phần mềm";
    }

    private com.hiremate.dto.response.AiDetailedEvaluationReport buildDefaultEvaluationReport(
            Job job,
            Candidate candidate,
            Cv cv,
            List<String> matchedMandatory,
            List<String> missingMandatory,
            List<String> matchedPreferred,
            List<String> missingPreferred,
            float skillsScore,
            float experienceScore,
            float educationScore,
            float semanticScore,
            float finalMatchingScore,
            String reasoning
    ) {
        String candName = (candidate != null && candidate.getUser() != null)
                ? candidate.getUser().getFullName() : "Ứng viên #" + (candidate != null ? candidate.getCandidateId() : 0);
        String candEmail = (candidate != null && candidate.getUser() != null)
                ? candidate.getUser().getEmail() : "";

        String tier = finalMatchingScore >= 85 ? "⭐ Phù Hợp Xuất Sắc"
                : finalMatchingScore >= 70 ? "✨ Phù Hợp Tốt (Khuyên Mời Phỏng Vấn)"
                : finalMatchingScore >= 50 ? "💡 Tiềm Năng (Có Thể Cân Nhắc)"
                : "⚠️ Trau Dồi Kỹ Năng";

        List<com.hiremate.dto.response.AiDetailedEvaluationReport.AdvantageItem> advantages = new ArrayList<>();
        List<com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem> disadvantages = new ArrayList<>();

        if (!matchedMandatory.isEmpty()) {
            advantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.AdvantageItem.builder()
                    .category("Kỹ năng chuyên môn cốt lõi")
                    .title("Đáp ứng xuất sắc bộ kỹ năng bắt buộc của vị trí")
                    .cvEvidence("Đã xác thực sở hữu: " + String.join(", ", matchedMandatory))
                    .jobMatch("Trọng tâm yêu cầu kỹ thuật: " + (job != null ? job.getTitle() : ""))
                    .assessment("Đạt chuẩn cao")
                    .build());
        }

        if (!matchedPreferred.isEmpty()) {
            advantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.AdvantageItem.builder()
                    .category("Kỹ năng bổ trợ & Ưu tiên")
                    .title("Sở hữu kỹ năng điểm cộng gia tăng lợi thế tuyển dụng")
                    .cvEvidence("Kỹ năng ưu tiên đã có: " + String.join(", ", matchedPreferred))
                    .jobMatch("Tiêu chí ưu tiên của nhà tuyển dụng")
                    .assessment("Vượt trội")
                    .build());
        }

        if (educationScore >= 80) {
            advantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.AdvantageItem.builder()
                    .category("Bằng cấp & Học vấn")
                    .title("Nền tảng đào tạo chính quy chuyên ngành Công nghệ thông tin")
                    .cvEvidence(candidate != null && candidate.getEducationsJson() != null && !candidate.getEducationsJson().isBlank()
                            ? formatEducationSummary(candidate.getEducationsJson())
                            : "Được đào tạo bài bản nền tảng kỹ thuật phần mềm")
                    .jobMatch("Yêu cầu trình độ học vấn của doanh nghiệp")
                    .assessment("Đạt chuẩn")
                    .build());
        }

        if (experienceScore >= 75) {
            advantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.AdvantageItem.builder()
                    .category("Kinh nghiệm & Năng lực thực chiến")
                    .title("Thời gian làm việc và tích lũy dự án phù hợp với cấp bậc tuyển dụng")
                    .cvEvidence("Điểm kinh nghiệm ATS đạt " + Math.round(experienceScore) + "% so với mô tả công việc")
                    .jobMatch("Cấp bậc tuyển dụng: " + (job != null ? job.getTitle() : ""))
                    .assessment("Phù hợp tốt")
                    .build());
        }

        if (!missingMandatory.isEmpty()) {
            disadvantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem.builder()
                    .category("Kỹ năng bắt buộc cần bổ sung")
                    .title("Chưa thể hiện đủ một số công nghệ trọng tâm trong CV")
                    .jobRequirement("Yêu cầu bắt buộc: " + String.join(", ", missingMandatory))
                    .cvShortfall("Chưa tìm thấy từ khóa hoặc minh chứng dự án cụ thể về: " + String.join(", ", missingMandatory))
                    .severity("Cần lưu ý kiểm tra vòng phỏng vấn")
                    .build());
        }

        if (!missingPreferred.isEmpty()) {
            disadvantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem.builder()
                    .category("Kỹ năng ưu tiên chưa có")
                    .title("Thiếu một số công cụ bổ trợ nâng cao")
                    .jobRequirement("Tiêu chí khuyến khích: " + String.join(", ", missingPreferred))
                    .cvShortfall("Chưa ghi nhận trong danh mục kỹ năng của CV")
                    .severity("Có thể đào tạo nội bộ")
                    .build());
        }

        String execRec = finalMatchingScore >= 80
                ? "Ứng viên có độ tương thích cao. Đề xuất HR ưu tiên duyệt hồ sơ và gửi lời mời phỏng vấn kỹ thuật vòng 1."
                : finalMatchingScore >= 65
                ? "Hồ sơ đáp ứng nền tảng cốt lõi. Nên sắp xếp phỏng vấn sàng lọc để đánh giá thêm mức độ thích ứng công việc."
                : "Ứng viên có khoảng cách nhất định với yêu cầu công việc. Cân nhắc xem xét các ứng viên khác hoặc bài kiểm tra năng lực đầu vào.";

        return com.hiremate.dto.response.AiDetailedEvaluationReport.builder()
                .candidateId(candidate != null ? candidate.getCandidateId() : null)
                .candidateName(candName)
                .candidateEmail(candEmail)
                .jobId(job != null ? job.getJobId() : null)
                .jobTitle(job != null ? job.getTitle() : "")
                .matchingScore(finalMatchingScore)
                .skillsScore(skillsScore)
                .experienceScore(experienceScore)
                .educationScore(educationScore)
                .semanticScore(semanticScore)
                .matchedMandatorySkills(matchedMandatory)
                .missingMandatorySkills(missingMandatory)
                .matchedPreferredSkills(matchedPreferred)
                .missingPreferredSkills(missingPreferred)
                .matchTier(tier)
                .overallVerdict(reasoning)
                .executiveRecommendation(execRec)
                .advantages(advantages)
                .disadvantages(disadvantages)
                .build();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.hiremate.dto.response.AiDetailedEvaluationReport getDetailedCandidateEvaluation(Long jobId, Long candidateId) {
        return getDetailedCandidateEvaluation(jobId, candidateId, false);
    }

    @Override
    @Transactional
    public com.hiremate.dto.response.AiDetailedEvaluationReport getDetailedCandidateEvaluation(Long jobId, Long candidateId, boolean forceRefresh) {
        return getDetailedCandidateEvaluation(jobId, candidateId, forceRefresh, null);
    }

    @Override
    @Transactional
    public com.hiremate.dto.response.AiDetailedEvaluationReport getDetailedCandidateEvaluation(Long jobId, Long candidateId, boolean forceRefresh, User currentUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job không tồn tại: " + jobId));

        if (currentUser != null) {
            boolean isCandidateSelf = currentUser.getRole() == com.hiremate.enums.UserRole.CANDIDATE
                    && currentUser.getUserId().equals(candidateId);
            if (!isCandidateSelf && !isAuthorizedRecruiterForJob(job, currentUser)) {
                throw new SecurityException("Unauthorized: Bạn không có quyền truy cập báo cáo đánh giá ứng viên của tin tuyển dụng này.");
            }
        }

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Ứng viên không tồn tại: " + candidateId));

        // 1. KIỂM TRA DATABASE CACHE NẾU KHÔNG BẬT CỜ CHẤM LẠI (forceRefresh == false)
        if (!forceRefresh) {
            Optional<AiJobMatch> matchOpt = aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(candidateId, jobId);
            if (matchOpt.isPresent()) {
                AiJobMatch m = matchOpt.get();
                if (m.getSkillGapJson() != null && !m.getSkillGapJson().isBlank()) {
                    try {
                        JsonNode root = objectMapper.readTree(m.getSkillGapJson());
                        if (root.has("detailedReport") && !root.get("detailedReport").isNull()) {
                            String detailedStr = root.get("detailedReport").toString();
                            boolean hasRawJsonDump = detailedStr.contains("[{\\\"school") || detailedStr.contains("[{\\\"highlight") || detailedStr.contains("[{\\\"period");
                            if (!hasRawJsonDump) {
                                com.hiremate.dto.response.AiDetailedEvaluationReport cachedReport = objectMapper.treeToValue(
                                        root.get("detailedReport"), com.hiremate.dto.response.AiDetailedEvaluationReport.class
                                );
                                if (cachedReport != null && cachedReport.getMatchingScore() != null) {
                                    log.info(">> [AiJobMatchService] Trả về báo cáo AI từ DB CACHE cho candidateId={} jobId={} (0ms, 0 AI token)",
                                            candidateId, jobId);
                                    return cachedReport;
                                }
                            } else {
                                log.info(">> [AiJobMatchService] Invalidate cache detailedReport do chứa raw JSON cũ cho candidateId={} jobId={}", candidateId, jobId);
                            }
                        }
                    } catch (Exception ex) {
                        log.warn(">> [AiJobMatchService] Lỗi giải mã detailedReport từ cache: {}", ex.getMessage());
                    }
                }
            }
        }

        // 2. NẾU forceRefresh == true HOẶC CHƯA CÓ TRONG CACHE: CHẠY ĐỐI SOÁT AI
        log.info(">> [AiJobMatchService] Bắt đầu đánh giá đối soát AI (forceRefresh={}) cho candidateId={} jobId={}",
                forceRefresh, candidateId, jobId);

        // 1. Tìm đúng CV mà ứng viên đã nộp cho bài tuyển dụng này (nếu có application)
        Cv cv = null;
        try {
            if (applicationRepository != null) {
                Optional<Application> appOpt = applicationRepository.findByJob_JobIdAndCandidate_CandidateId(jobId, candidateId);
                if (appOpt.isPresent() && appOpt.get().getCv() != null) {
                    cv = appOpt.get().getCv();
                }
            }
        } catch (Exception ignored) {}

        if (cv == null) {
            cv = cvRepository.findByCandidateIdAndIsDefaultTrue(candidateId)
                    .orElseGet(() -> {
                        List<Cv> cvs = cvRepository.findByCandidateId(candidateId);
                        return cvs.isEmpty() ? null : cvs.get(0);
                    });
        }

        // 2. Tính toán trước ma trận ATS để lấy danh sách kỹ năng khớp và thiếu (bằng keyword matching siêu tốc, không gọi Gemini lặp lại)
        AiJobMatchResponse matchRes = null;
        try {
            matchRes = calculateAndSaveMatch(candidate, job, cv, false);
        } catch (Exception ex) {
            log.warn(">> [AiJobMatchService] Lỗi tính điểm trước khi lập báo cáo: {}", ex.getMessage());
        }

        // 3. Xây dựng ngữ cảnh hồ sơ toàn diện (Học vấn, Bằng cấp, Chứng chỉ, Ngoại ngữ, Kỹ năng)
        StringBuilder profileBuilder = new StringBuilder();
        if (candidate.getEducationsJson() != null && !candidate.getEducationsJson().isBlank()) {
            profileBuilder.append(" [HỌC VẤN & BẰNG CẤP: ").append(candidate.getEducationsJson()).append("] ");
        }
        if (cv != null && cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
            profileBuilder.append(" [DỮ LIỆU CV TRÍCH XUẤT (Bằng cấp, Chứng chỉ, Ngoại ngữ): ").append(cv.getParsedJson()).append("] ");
        }
        if (candidate.getExperiencesJson() != null && !candidate.getExperiencesJson().isBlank()) {
            profileBuilder.append(" [KINH NGHIỆM: ").append(candidate.getExperiencesJson()).append("] ");
        }
        if (candidate.getProjectsJson() != null && !candidate.getProjectsJson().isBlank()) {
            profileBuilder.append(" [DỰ ÁN: ").append(candidate.getProjectsJson()).append("] ");
        }
        if (candidate.getBio() != null && !candidate.getBio().isBlank()) {
            profileBuilder.append(" [GIỚI THIỆU: ").append(candidate.getBio()).append("] ");
        }

        // Bổ sung kỹ năng đã xác thực từ candidate_skills
        try {
            List<CandidateSkill> candSkills = candidateSkillRepository.findByProfileId(candidateId);
            if (!candSkills.isEmpty()) {
                profileBuilder.append(" [KỸ NĂNG XÁC THỰC: ");
                for (CandidateSkill cs : candSkills) {
                    Skill s = skillCache.computeIfAbsent(cs.getSkillId(), id -> skillRepository.findById(id).orElse(null));
                    if (s != null && s.getSkillName() != null) {
                        profileBuilder.append(s.getSkillName()).append(", ");
                    }
                }
                profileBuilder.append("] ");
            }
        } catch (Exception ignored) {}

        // Bổ sung kết quả so khớp kỹ năng từ engine ATS
        if (matchRes != null) {
            if (matchRes.getMatchedMandatorySkills() != null && !matchRes.getMatchedMandatorySkills().isEmpty()) {
                profileBuilder.append(" [KỸ NĂNG BẮT BUỘC ĐÃ ĐẠP ỨNG: ").append(String.join(", ", matchRes.getMatchedMandatorySkills())).append("] ");
            }
            if (matchRes.getMissingMandatorySkills() != null && !matchRes.getMissingMandatorySkills().isEmpty()) {
                profileBuilder.append(" [KỸ NĂNG BẮT BUỘC CÒN THIẾU: ").append(String.join(", ", matchRes.getMissingMandatorySkills())).append("] ");
                profileBuilder.append(" [KỸ NĂNG CÒN THIẾU: ").append(String.join(", ", matchRes.getMissingMandatorySkills())).append("] ");
            }
            if (matchRes.getMatchedPreferredSkills() != null && !matchRes.getMatchedPreferredSkills().isEmpty()) {
                profileBuilder.append(" [KỸ NĂNG ƯU TIÊN ĐẠT ĐƯỢC: ").append(String.join(", ", matchRes.getMatchedPreferredSkills())).append("] ");
            }
            if (matchRes.getMissingPreferredSkills() != null && !matchRes.getMissingPreferredSkills().isEmpty()) {
                profileBuilder.append(" [KỸ NĂNG ƯU TIÊN CÒN THIẾU: ").append(String.join(", ", matchRes.getMissingPreferredSkills())).append("] ");
            }
        }

        String cvText = (cv != null && cv.getParsedText() != null) ? cv.getParsedText() : "";
        String candidateName = candidate.getUser() != null ? candidate.getUser().getFullName() : "Ứng viên #" + candidateId;
        String candidateEmail = candidate.getUser() != null ? candidate.getUser().getEmail() : "";

        com.hiremate.dto.response.AiDetailedEvaluationReport report = null;
        // TUYỆT ĐỐI CHỈ GỌI GEMINI AI KHI NGƯỜI DÙNG THỰC SỰ ẤN NÚT "CHẤM LẠI" (forceRefresh == true)
        // Xem báo cáo bình thường, reload hoặc quay lại trang KHÔNG BAO GIỜ tốn token Gemini
        if (forceRefresh && geminiAiService != null && geminiAiService.isAvailable()) {
            try {
                report = geminiAiService.evaluateCandidateCvAgainstJob(
                        job.getTitle(),
                        job.getRequirements(),
                        job.getDescription(),
                        candidateName,
                        cvText,
                        profileBuilder.toString()
                );
            } catch (Exception ex) {
                log.warn(">> [AiJobMatchService] Lỗi gọi Gemini evaluateCandidateCvAgainstJob: {}. Dùng fallback.", ex.getMessage());
            }
        }
        if (report == null) {
            report = buildDefaultEvaluationReport(
                    job, candidate, cv,
                    matchRes != null ? matchRes.getMatchedMandatorySkills() : Collections.emptyList(),
                    matchRes != null ? matchRes.getMissingMandatorySkills() : Collections.emptyList(),
                    matchRes != null ? matchRes.getMatchedPreferredSkills() : Collections.emptyList(),
                    matchRes != null ? matchRes.getMissingPreferredSkills() : Collections.emptyList(),
                    matchRes != null && matchRes.getSkillsScore() != null ? matchRes.getSkillsScore() : 80f,
                    matchRes != null && matchRes.getExperienceScore() != null ? matchRes.getExperienceScore() : 80f,
                    matchRes != null && matchRes.getEducationScore() != null ? matchRes.getEducationScore() : 90f,
                    matchRes != null && matchRes.getSemanticScore() != null ? matchRes.getSemanticScore() : 80f,
                    matchRes != null && matchRes.getMatchingScore() != null ? matchRes.getMatchingScore() : 80f,
                    matchRes != null ? matchRes.getAiReasoning() : ""
            );
        }

        // Đồng bộ điểm số và xếp loại thống nhất với Ma trận 4 Trụ Cột ATS (calculateAndSaveMatch)
        if (matchRes != null && matchRes.getMatchingScore() != null && matchRes.getMatchingScore() > 0) {
            report.setMatchingScore(matchRes.getMatchingScore());
        } else if (report.getMatchingScore() == null || report.getMatchingScore() <= 0) {
            report.setMatchingScore(75.0f);
        }

        float s = report.getMatchingScore();
        report.setMatchTier(s >= 85 ? "⭐ Phù Hợp Xuất Sắc"
                : s >= 70 ? "✨ Phù Hợp Tốt (Khuyên Mời Phỏng Vấn)"
                : s >= 50 ? "💡 Tiềm Năng (Có Thể Cân Nhắc)"
                : "⚠️ Trau Dồi Kỹ Năng");

        if (matchRes != null) {
            if (report.getSkillsScore() == null) report.setSkillsScore(matchRes.getSkillsScore());
            if (report.getExperienceScore() == null) report.setExperienceScore(matchRes.getExperienceScore());
            if (report.getEducationScore() == null) report.setEducationScore(matchRes.getEducationScore());
            if (report.getSemanticScore() == null) report.setSemanticScore(matchRes.getSemanticScore());
            if (report.getMatchedMandatorySkills() == null || report.getMatchedMandatorySkills().isEmpty()) report.setMatchedMandatorySkills(matchRes.getMatchedMandatorySkills());
            if (report.getMissingMandatorySkills() == null || report.getMissingMandatorySkills().isEmpty()) report.setMissingMandatorySkills(matchRes.getMissingMandatorySkills());
            if (report.getMatchedPreferredSkills() == null || report.getMatchedPreferredSkills().isEmpty()) report.setMatchedPreferredSkills(matchRes.getMatchedPreferredSkills());
            if (report.getMissingPreferredSkills() == null || report.getMissingPreferredSkills().isEmpty()) report.setMissingPreferredSkills(matchRes.getMissingPreferredSkills());
        }

        // Bóc tách & Đồng bộ toàn diện danh sách tiêu chí còn thiếu từ bảng tuyển dụng vào báo cáo HR
        enrichAndSynchronizeReportDisadvantages(report, job, candidate, cv, matchRes);

        report.setCandidateId(candidateId);
        report.setCandidateEmail(candidateEmail);
        report.setJobId(jobId);
        report.setJobTitle(job.getTitle());

        // Lưu vào DATABASE CACHE (ai_job_matches.skill_gap_json) để lần sau đọc lại tức thì
        try {
            Optional<AiJobMatch> savedMatchOpt = aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(candidateId, jobId);
            if (savedMatchOpt.isPresent()) {
                AiJobMatch match = savedMatchOpt.get();
                if (report.getMatchingScore() != null && report.getMatchingScore() > 0) {
                    match.setMatchingScore(report.getMatchingScore());
                }
                if (report.getOverallVerdict() != null && !report.getOverallVerdict().isBlank()) {
                    match.setAiReasoning(report.getOverallVerdict());
                }
                Map<String, Object> gapMap;
                try {
                    gapMap = objectMapper.readValue(match.getSkillGapJson(), new TypeReference<>() {});
                } catch (Exception ex) {
                    gapMap = new HashMap<>();
                }
                gapMap.put("detailedReport", report);
                match.setSkillGapJson(objectMapper.writeValueAsString(gapMap));
                aiJobMatchRepository.save(match);
                log.info(">> [AiJobMatchService] Đã lưu báo cáo AI chi tiết vào Database Cache cho candidateId={} jobId={}",
                        candidateId, jobId);
            }
        } catch (Exception ex) {
            log.warn(">> [AiJobMatchService] Lỗi khi lưu cache detailedReport vào DB: {}", ex.getMessage());
        }

        return report;
    }

    private void enrichAndSynchronizeReportDisadvantages(
            com.hiremate.dto.response.AiDetailedEvaluationReport report,
            Job job,
            Candidate candidate,
            Cv cv,
            AiJobMatchResponse matchRes
    ) {
        if (report == null) return;
        List<com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem> disadvantages = report.getDisadvantages();
        if (disadvantages == null) {
            disadvantages = new ArrayList<>();
            report.setDisadvantages(disadvantages);
        }

        List<String> missingMandatory = (matchRes != null && matchRes.getMissingMandatorySkills() != null) 
                ? matchRes.getMissingMandatorySkills() : Collections.emptyList();
        List<String> missingPreferred = (matchRes != null && matchRes.getMissingPreferredSkills() != null) 
                ? matchRes.getMissingPreferredSkills() : Collections.emptyList();

        String jobTitle = job.getTitle() != null ? job.getTitle() : "Vị trí tuyển dụng";
        String titleLower = jobTitle.toLowerCase();
        boolean isInternOrFresher = titleLower.contains("intern") || titleLower.contains("fresher") 
                || titleLower.contains("thực tập") || titleLower.contains("mới tốt nghiệp");

        // 1. Nếu vị trí là Intern/Fresher, loại bỏ các mục bất hợp lý như "Vận hành hệ thống tải lớn"
        if (isInternOrFresher) {
            disadvantages.removeIf(item -> item.getTitle() != null && (
                    item.getTitle().toLowerCase().contains("chịu tải") 
                    || item.getTitle().toLowerCase().contains("quy mô lớn")
                    || item.getTitle().toLowerCase().contains("vận hành hệ thống")
            ));
        }

        // 2. Bổ sung tất cả kỹ năng bắt buộc còn thiếu từ bảng tuyển dụng
        List<com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem> mandatorySkillItems = new ArrayList<>();
        for (String sk : missingMandatory) {
            String cleanSk = sk.trim();
            if (cleanSk.isBlank()) continue;
            boolean alreadyExists = disadvantages.stream().anyMatch(d -> 
                    (d.getTitle() != null && d.getTitle().toLowerCase().contains(cleanSk.toLowerCase())) ||
                    (d.getJobRequirement() != null && d.getJobRequirement().toLowerCase().contains(cleanSk.toLowerCase()))
            );
            if (!alreadyExists) {
                mandatorySkillItems.add(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem.builder()
                        .category("Kỹ năng bắt buộc còn thiếu")
                        .title("Chưa Đáp Ứng Kỹ Năng Bắt Buộc: " + cleanSk)
                        .jobRequirement("Bảng tuyển dụng " + jobTitle + " yêu cầu bắt buộc ứng viên thành thạo " + cleanSk + " để trực tiếp phát triển sản phẩm.")
                        .cvShortfall("Hồ sơ CV và danh mục kỹ năng của ứng viên chưa ghi nhận kinh nghiệm làm việc thực tế với " + cleanSk + ".")
                        .severity("Bắt buộc / Cần phỏng vấn xác thực")
                        .build());
            }
        }
        // Chèn các kỹ năng bắt buộc thiếu lên đầu danh sách
        disadvantages.addAll(0, mandatorySkillItems);

        // 3. Bổ sung tất cả kỹ năng ưu tiên còn thiếu từ bảng tuyển dụng
        for (String sk : missingPreferred) {
            String cleanSk = sk.trim();
            if (cleanSk.isBlank()) continue;
            boolean alreadyExists = disadvantages.stream().anyMatch(d -> 
                    (d.getTitle() != null && d.getTitle().toLowerCase().contains(cleanSk.toLowerCase())) ||
                    (d.getJobRequirement() != null && d.getJobRequirement().toLowerCase().contains(cleanSk.toLowerCase()))
            );
            if (!alreadyExists) {
                disadvantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem.builder()
                        .category("Kỹ năng ưu tiên chưa có")
                        .title("Chưa Có Kỹ Năng Ưu Tiên: " + cleanSk)
                        .jobRequirement("Nhà tuyển dụng ưu tiên ứng viên có kiến thức về " + cleanSk + " để gia tăng hiệu suất dự án.")
                        .cvShortfall("Chưa thấy thông tin hoặc dự án áp dụng " + cleanSk + " trong hồ sơ CV.")
                        .severity("Điểm cộng (Có thể đào tạo 1-2 tuần)")
                        .build());
            }
        }

        // 4. Đảm bảo có phân tích kinh nghiệm phù hợp với cấp bậc bài tuyển dụng
        boolean hasExpItem = disadvantages.stream().anyMatch(d -> 
                (d.getCategory() != null && d.getCategory().toLowerCase().contains("kinh nghiệm")) ||
                (d.getTitle() != null && d.getTitle().toLowerCase().contains("kinh nghiệm"))
        );
        if (!hasExpItem) {
            if (isInternOrFresher) {
                disadvantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem.builder()
                        .category("Kinh nghiệm thực chiến")
                        .title("Kinh Nghiệm Triển Khai Dự Án Doanh Nghiệp Thực Tế")
                        .jobRequirement("Vị trí " + jobTitle + " mong muốn ứng viên nhanh chóng thích nghi với môi trường làm việc chuyên nghiệp.")
                        .cvShortfall("Kinh nghiệm tích lũy chủ yếu đến từ các đồ án môn học hoặc bài tập lớn tại trường đại học, cần thêm thời gian cọ xát với quy trình vận hành dự án thực tế.")
                        .severity("Có thể đào tạo (Onboarding 1-2 tuần)")
                        .build());
            } else {
                disadvantages.add(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem.builder()
                        .category("Kinh nghiệm chưa đủ chuẩn")
                        .title("Chưa Đạt Chuẩn Số Năm Kinh Nghiệm Cấp Bậc Vị Trí")
                        .jobRequirement("Bảng tuyển dụng yêu cầu số năm kinh nghiệm làm việc thực tế ở cấp độ tương ứng với vị trí " + jobTitle + ".")
                        .cvShortfall("Số năm kinh nghiệm tích lũy thực tế trong CV còn thấp hơn chuẩn mong muốn của bài tuyển dụng.")
                        .severity("Cần lưu ý / Cần Tech Lead kèm cặp")
                        .build());
            }
        }

        // 5. Sắp xếp thứ tự ưu tiên: Bắt buộc thiếu -> Kinh nghiệm -> Bằng cấp/Chứng chỉ -> Ưu tiên thiếu -> Khác
        disadvantages.sort((a, b) -> {
            int scoreA = getDisadvantageSortPriority(a);
            int scoreB = getDisadvantageSortPriority(b);
            return Integer.compare(scoreA, scoreB);
        });
    }

    private int getDisadvantageSortPriority(com.hiremate.dto.response.AiDetailedEvaluationReport.DisadvantageItem item) {
        if (item == null) return 99;
        String cat = item.getCategory() != null ? item.getCategory().toLowerCase() : "";
        String sev = item.getSeverity() != null ? item.getSeverity().toLowerCase() : "";
        if (cat.contains("bắt buộc") || sev.contains("bắt buộc")) return 1;
        if (cat.contains("kinh nghiệm")) return 2;
        if (cat.contains("chứng chỉ") || cat.contains("bằng cấp") || cat.contains("ngoại ngữ")) return 3;
        if (cat.contains("ưu tiên")) return 4;
        return 5;
    }

    @Override
    @Transactional
    public com.hiremate.dto.response.AiDetailedEvaluationReport getCandidateJobReport(
            Long jobId, Long cvId, boolean forceRefresh, User candidateUser) {
        if (candidateUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("Vui lòng đăng nhập để xem báo cáo đánh giá");
        }
        Long candidateId = candidateUser.getUserId();

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin tuyển dụng: " + jobId));

        // 1. Phân hạng người dùng ứng viên (Candidate Subscription Tier)
        String tier = "FREE";
        String tierName = "Free Candidate";
        boolean isUnlimited = false;
        int maxQuota = 3; // Ứng viên Free được miễn phí tối đa 3 lượt yêu cầu AI viết báo cáo chuyên sâu
        int remainingQuota = maxQuota;

        if (subscriptionRepository != null) {
            List<com.hiremate.entity.Subscription> activeSubs = subscriptionRepository.findActiveCandidateSubscriptions(
                    candidateId, com.hiremate.enums.SubscriptionStatus.ACTIVE, java.time.LocalDateTime.now());
            if (!activeSubs.isEmpty() && activeSubs.get(0).getPlan() != null) {
                com.hiremate.entity.SubscriptionPlan plan = activeSubs.get(0).getPlan();
                tierName = plan.getPlanName();
                String pNameUpper = tierName.toUpperCase();
                if (pNameUpper.contains("ACE") || pNameUpper.contains("VIP")) {
                    tier = "ACE";
                } else if (pNameUpper.contains("PRO")) {
                    tier = "PRO";
                } else if (pNameUpper.contains("PLUS")) {
                    tier = "PLUS";
                }
                isUnlimited = true;
                remainingQuota = -1;
            }
        }

        // Nếu là gói Free, tính số lượng báo cáo chi tiết mà candidate này đã từng yêu cầu AI tạo trong DB
        if (!isUnlimited) {
            long usedCount = 0;
            List<AiJobMatch> candidateMatches = aiJobMatchRepository.findByCandidate_CandidateIdOrderByMatchingScoreDesc(candidateId);
            for (AiJobMatch m : candidateMatches) {
                if (m.getSkillGapJson() != null && m.getSkillGapJson().contains("\"detailedReport\"")) {
                    usedCount++;
                }
            }
            remainingQuota = Math.max(0, maxQuota - (int) usedCount);
        }

        // 2. KIỂM TRA DATABASE CACHE: Nếu đã có báo cáo trong DB cho jobId này và không forceRefresh
        Optional<AiJobMatch> matchOpt = aiJobMatchRepository.findByCandidate_CandidateIdAndJob_JobId(candidateId, jobId);
        if (!forceRefresh && matchOpt.isPresent()) {
            AiJobMatch m = matchOpt.get();
            if (m.getSkillGapJson() != null && !m.getSkillGapJson().isBlank()) {
                try {
                    JsonNode root = objectMapper.readTree(m.getSkillGapJson());
                    if (root.has("detailedReport") && !root.get("detailedReport").isNull()) {
                        com.hiremate.dto.response.AiDetailedEvaluationReport cachedReport = objectMapper.treeToValue(
                                root.get("detailedReport"), com.hiremate.dto.response.AiDetailedEvaluationReport.class
                        );
                        if (cachedReport != null && cachedReport.getMatchingScore() != null) {
                            cachedReport.setCandidateTier(tier);
                            cachedReport.setCandidateTierName(tierName);
                            cachedReport.setIsUnlimited(isUnlimited);
                            cachedReport.setReportsRemaining(remainingQuota);
                            cachedReport.setIsReportCached(true);
                            decorateActionableReportAdvice(cachedReport, job);
                            log.info(">> [AiJobMatchService] Trả về báo cáo AI có sẵn từ DB cho Candidate {} (0ms, 0 AI tokens)", candidateId);
                            return cachedReport;
                        }
                    }
                } catch (Exception ex) {
                    log.warn(">> [AiJobMatchService] Lỗi parse cached detailedReport: {}", ex.getMessage());
                }
            }
            // Nếu chưa có báo cáo chi tiết trong DB và người dùng chỉ đang load trang thông thường (forceRefresh=false)
            // -> Trả về thông tin điểm tương thích cơ bản và phân hạng, KHÔNG tạo báo cáo chi tiết để tiết kiệm token
            return com.hiremate.dto.response.AiDetailedEvaluationReport.builder()
                    .candidateId(candidateId)
                    .candidateName(candidateUser.getFullName())
                    .candidateEmail(candidateUser.getEmail())
                    .jobId(jobId)
                    .jobTitle(job.getTitle())
                    .matchingScore(m.getMatchingScore())
                    .overallVerdict(m.getAiReasoning())
                    .candidateTier(tier)
                    .candidateTierName(tierName)
                    .isUnlimited(isUnlimited)
                    .reportsRemaining(remainingQuota)
                    .isReportCached(false)
                    .advantages(null)
                    .disadvantages(null)
                    .build();
        }

        // Nếu ứng viên chưa có kết quả match trong DB và không yêu cầu tạo báo cáo (forceRefresh=false)
        if (!forceRefresh && matchOpt.isEmpty()) {
            return null;
        }

        // 3. NẾU ỨNG VIÊN BẤM NÚT YÊU CẦU AI VIẾT BÁO CÁO (forceRefresh=true):
        if (forceRefresh) {
            // Kiểm tra hạn mức đối với gói Free
            if (!isUnlimited && remainingQuota <= 0) {
                throw new com.hiremate.exception.BadRequestException(
                        "Bạn đã sử dụng hết " + maxQuota + " lượt phân tích AI chuyên sâu của gói " + tierName + 
                        ". Vui lòng nâng cấp lên gói Practice Plus hoặc Practice Pro để mở khóa phân tích báo cáo không giới hạn!"
                );
            }

            // Gán CV nếu ứng viên chọn cụ thể
            if (cvId != null && matchOpt.isPresent()) {
                Cv targetCv = cvRepository.findById(cvId).orElse(null);
                if (targetCv != null && targetCv.getCandidateId().equals(candidateId)) {
                    AiJobMatch m = matchOpt.get();
                    m.setCv(targetCv);
                    aiJobMatchRepository.save(m);
                }
            }

            com.hiremate.dto.response.AiDetailedEvaluationReport newReport = getDetailedCandidateEvaluation(jobId, candidateId, true, candidateUser);
            if (newReport != null) {
                newReport.setCandidateTier(tier);
                newReport.setCandidateTierName(tierName);
                newReport.setIsUnlimited(isUnlimited);
                newReport.setReportsRemaining(isUnlimited ? -1 : Math.max(0, remainingQuota - 1));
                newReport.setIsReportCached(false);
                decorateActionableReportAdvice(newReport, job);
            }
            return newReport;
        }

        return null;
    }

    private void decorateActionableReportAdvice(com.hiremate.dto.response.AiDetailedEvaluationReport report, Job job) {
        if (report == null || job == null) return;

        List<String> suggestions = new ArrayList<>();
        List<String> interviewTips = new ArrayList<>();

        List<String> missing = report.getMissingMandatorySkills() != null ? report.getMissingMandatorySkills() : Collections.emptyList();
        List<String> matched = report.getMatchedMandatorySkills() != null ? report.getMatchedMandatorySkills() : Collections.emptyList();

        if (!missing.isEmpty()) {
            suggestions.add("Bổ sung các từ khóa công nghệ còn thiếu: [" + String.join(", ", missing) + "] vào phần Kỹ năng & Mục tiêu nghề nghiệp trong CV.");
            suggestions.add("Cập nhật các dự án cá nhân hoặc bài tập lớn có sử dụng hoặc liên quan tới " + missing.get(0) + " để vượt qua bộ lọc ATS tự động.");
            interviewTips.add("Nhà tuyển dụng có thể hỏi xoáy vào kinh nghiệm thực chiến với " + String.join(", ", missing) + ". Hãy áp dụng mô hình STAR (Situation, Task, Action, Result) và nhấn mạnh khả năng tự học thích ứng nhanh.");
        } else {
            suggestions.add("Hồ sơ CV của bạn đã bao quát trọn vẹn các kỹ năng cốt lõi cho vị trí " + job.getTitle() + ".");
            interviewTips.add("Bạn sở hữu lợi thế cạnh tranh rất lớn về " + String.join(", ", matched) + ". Hãy tự tin làm nổi bật các thành tích và dự án tiêu biểu.");
        }

        suggestions.add("Lượng hóa kết quả công việc bằng số liệu cụ thể (ví dụ: tối ưu hiệu năng bao nhiêu %, quản lý bao nhiêu users/records).");
        suggestions.add("Đảm bảo định dạng CV rõ ràng, không dùng bảng phức tạp hoặc ảnh chụp scan văn bản để AI ATS đọc chuẩn xác 100%.");

        interviewTips.add("Tìm hiểu kỹ mô hình sản phẩm và văn hóa của " + (job.getCompany() != null ? job.getCompany().getCompanyName() : "doanh nghiệp") + " để trả lời thuyết phục câu hỏi vì sao bạn muốn gia nhập.");
        interviewTips.add("Chuẩn bị sẵn 2-3 câu hỏi chất lượng dành cho người phỏng vấn về định hướng phát triển của đội ngũ kỹ thuật.");

        report.setCvImprovementSuggestions(suggestions);
        report.setInterviewTips(interviewTips);
    }
}
