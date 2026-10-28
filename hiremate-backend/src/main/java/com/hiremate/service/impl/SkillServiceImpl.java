package com.hiremate.service.impl;

import com.hiremate.dto.request.AiIndustrySkillGenerateRequest;
import com.hiremate.dto.request.AiJdSkillExtractRequest;
import com.hiremate.dto.request.SkillCreateRequest;
import com.hiremate.dto.response.*;
import com.hiremate.entity.Skill;
import com.hiremate.repository.CandidateSkillRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.GeminiAiService;
import com.hiremate.service.SkillService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

@Slf4j
@Service
public class SkillServiceImpl implements SkillService {

    private final SkillRepository skillRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final JobSkillRepository jobSkillRepository;
    private final GeminiAiService geminiAiService;

    public SkillServiceImpl(
            SkillRepository skillRepository,
            CandidateSkillRepository candidateSkillRepository,
            JobSkillRepository jobSkillRepository,
            @Lazy GeminiAiService geminiAiService
    ) {
        this.skillRepository = skillRepository;
        this.candidateSkillRepository = candidateSkillRepository;
        this.jobSkillRepository = jobSkillRepository;
        this.geminiAiService = geminiAiService;
    }

    private final AtomicReference<List<SkillResponse>> cachedSkillsRef = new AtomicReference<>(null);

    @PostConstruct
    public void seedDefaultSkills() {
        if (skillRepository.count() == 0) {
            log.info(">> [SkillService] Seeding initial standard tech skills dictionary...");
            List<Skill> initialSkills = Arrays.asList(
                    // Backend
                    Skill.builder().skillName("Java").category("BACKEND").aliases("Java Core, JDK, JVM, Java 17, Java 21").build(),
                    Skill.builder().skillName("Spring Boot").category("BACKEND").aliases("Spring Framework, Spring Data, Spring Security").build(),
                    Skill.builder().skillName("Node.js").category("BACKEND").aliases("NodeJS, ExpressJS, NestJS").build(),
                    Skill.builder().skillName("Python").category("BACKEND").aliases("Python 3, Django, FastAPI, Flask").build(),
                    Skill.builder().skillName("C# / .NET").category("BACKEND").aliases(".NET Core, ASP.NET, C#").build(),
                    Skill.builder().skillName("Go (Golang)").category("BACKEND").aliases("Go, Golang, Gin, Fiber").build(),
                    Skill.builder().skillName("RESTful API").category("BACKEND").aliases("REST API, Web API Design").build(),
                    Skill.builder().skillName("Microservices Architecture").category("BACKEND").aliases("Microservices, Distributed Systems").build(),
                    
                    // Frontend
                    Skill.builder().skillName("React.js").category("FRONTEND").aliases("React, ReactJS, Next.js, Redux").build(),
                    Skill.builder().skillName("TypeScript").category("FRONTEND").aliases("TS, Strict Typing").build(),
                    Skill.builder().skillName("JavaScript").category("FRONTEND").aliases("JS, ES6+, Web JS").build(),
                    Skill.builder().skillName("Vue.js").category("FRONTEND").aliases("Vue, VueJS, Nuxt.js").build(),
                    Skill.builder().skillName("HTML5 & CSS3").category("FRONTEND").aliases("HTML, CSS, SCSS, Tailwind CSS").build(),
                    Skill.builder().skillName("Tailwind CSS").category("FRONTEND").aliases("Tailwind, Utility CSS").build(),
                    Skill.builder().skillName("Next.js").category("FRONTEND").aliases("NextJS, React SSR").build(),
                    Skill.builder().skillName("Figma / UI-UX").category("FRONTEND").aliases("Figma, UI Design, Wireframing").build(),

                    // Database
                    Skill.builder().skillName("PostgreSQL").category("DATABASE").aliases("Postgres, PSQL, Supabase").build(),
                    Skill.builder().skillName("MySQL").category("DATABASE").aliases("MySQL Server, MariaDB").build(),
                    Skill.builder().skillName("MongoDB").category("DATABASE").aliases("Mongo, NoSQL, Document DB").build(),
                    Skill.builder().skillName("Redis").category("DATABASE").aliases("Redis Cache, In-memory DB").build(),
                    Skill.builder().skillName("SQL").category("DATABASE").aliases("Standard SQL, Complex Queries").build(),
                    
                    // DevOps & Cloud
                    Skill.builder().skillName("Docker").category("DEVOPS_CLOUD").aliases("Container, Docker Compose, Dockerfile").build(),
                    Skill.builder().skillName("Kubernetes").category("DEVOPS_CLOUD").aliases("K8s, Pods, Deployments").build(),
                    Skill.builder().skillName("AWS").category("DEVOPS_CLOUD").aliases("Amazon Web Services, EC2, S3, RDS").build(),
                    Skill.builder().skillName("CI/CD").category("DEVOPS_CLOUD").aliases("GitHub Actions, GitLab CI, Jenkins").build(),
                    Skill.builder().skillName("Git").category("DEVOPS_CLOUD").aliases("Git, GitHub, GitLab, Version Control").build(),
                    Skill.builder().skillName("Kafka").category("DEVOPS_CLOUD").aliases("Apache Kafka, Event Streaming, MQ").build(),

                    // Mobile
                    Skill.builder().skillName("Flutter").category("MOBILE").aliases("Flutter, Dart, Cross-platform").build(),
                    Skill.builder().skillName("React Native").category("MOBILE").aliases("RN, Mobile React").build(),
                    Skill.builder().skillName("iOS (Swift)").category("MOBILE").aliases("Swift, SwiftUI, Xcode").build(),
                    Skill.builder().skillName("Android (Kotlin)").category("MOBILE").aliases("Kotlin, Android Jetpack").build(),
                    
                    // AI & Data
                    Skill.builder().skillName("Generative AI").category("AI_DATA").aliases("LLM, OpenAI, Gemini API, Claude").build(),
                    Skill.builder().skillName("Machine Learning").category("AI_DATA").aliases("ML, PyTorch, TensorFlow, Scikit-learn").build(),
                    Skill.builder().skillName("Data Analytics").category("AI_DATA").aliases("Data Analysis, PowerBI, Pandas").build(),

                    // Business & Management
                    Skill.builder().skillName("Business Analysis (BA)").category("BUSINESS_BA").aliases("BRD, SRS, Agile BA, User Stories").build(),
                    Skill.builder().skillName("Agile / Scrum").category("BUSINESS_BA").aliases("Scrum Master, Sprint, Jira").build(),

                    // Soft Skills
                    Skill.builder().skillName("Giao tiếp & Làm việc nhóm").category("SOFT_SKILL").aliases("Teamwork, Communication").build(),
                    Skill.builder().skillName("Tiếng Anh (Giao tiếp / TOEIC)").category("SOFT_SKILL").aliases("English, Professional English").build(),
                    Skill.builder().skillName("Tư duy phản biện (Critical Thinking)").category("SOFT_SKILL").aliases("Problem Solving, Critical Thinking").build()
            );
            skillRepository.saveAll(initialSkills);
            log.info(">> [SkillService] Seeded {} standard tech skills successfully.", initialSkills.size());
        }
    }

    @Override
    public List<SkillResponse> getAllSkills(String category, String keyword) {
        List<SkillResponse> all = cachedSkillsRef.get();
        if (all == null) {
            List<Skill> skills = skillRepository.findAll();
            all = skills.stream().map(this::mapToResponse).toList();
            cachedSkillsRef.set(all);
        }

        boolean hasCategory = category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL");
        boolean hasKeyword = keyword != null && !keyword.isBlank();

        if (!hasCategory && !hasKeyword) {
            return all;
        }

        List<SkillResponse> result = new ArrayList<>();
        String kw = hasKeyword ? keyword.toLowerCase().trim() : null;

        for (SkillResponse s : all) {
            if (hasCategory && !s.getCategory().equalsIgnoreCase(category.trim())) {
                continue;
            }
            if (hasKeyword) {
                boolean matchName = s.getSkillName() != null && s.getSkillName().toLowerCase().contains(kw);
                boolean matchAlias = s.getAliases() != null && s.getAliases().toLowerCase().contains(kw);
                if (!matchName && !matchAlias) {
                    continue;
                }
            }
            result.add(s);
        }

        return result;
    }

    @Override
    public SkillResponse getSkillById(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kỹ năng với ID: " + skillId));
        return mapToResponse(skill);
    }

    @Override
    @Transactional
    public SkillResponse createSkill(String skillName, String category, String aliases) {
        if (skillName == null || skillName.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên kỹ năng không được để trống");
        }
        String trimmed = skillName.trim();
        if (skillRepository.existsBySkillNameIgnoreCase(trimmed)) {
            throw new IllegalArgumentException("Kỹ năng '" + trimmed + "' đã tồn tại trong danh mục hệ thống!");
        }

        String cat = (category != null && !category.isBlank()) ? category.trim() : "Technical";

        Skill skill = Skill.builder()
                .skillName(trimmed)
                .category(cat)
                .aliases(aliases != null && !aliases.isBlank() ? aliases.trim() : null)
                .build();
        Skill saved = skillRepository.save(skill);
        cachedSkillsRef.set(null); // Invalidate cache
        log.info(">> [SkillService] Created new skill: {} ({})", saved.getSkillName(), saved.getCategory());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SkillResponse createSkill(SkillCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu tạo kỹ năng không hợp lệ");
        }
        return createSkill(request.getSkillName(), request.getCategory(), request.getAliases());
    }

    @Override
    @Transactional
    public void deleteSkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kỹ năng với ID: " + skillId));

        // Cascade delete from candidate_skills and job_skills to prevent foreign key errors
        try {
            candidateSkillRepository.deleteBySkillId(skillId);
            jobSkillRepository.deleteBySkillId(skillId);
        } catch (Exception e) {
            log.warn(">> [SkillService] Non-fatal cleanup issue for skillId {}: {}", skillId, e.getMessage());
        }

        skillRepository.delete(skill);
        cachedSkillsRef.set(null); // Invalidate cache
        log.info(">> [SkillService] Deleted skill: {} (ID: {})", skill.getSkillName(), skillId);
    }

    private SkillResponse mapToResponse(Skill s) {
        return SkillResponse.builder()
                .skillId(s.getSkillId())
                .skillName(s.getSkillName())
                .category(s.getCategory() != null ? s.getCategory() : "IT_SOFTWARE")
                .aliases(s.getAliases())
                .build();
    }

    // =========================================================================
    // AI SELF-EVOLVING SKILL TAXONOMY IMPLEMENTATION (4 LUỒNG CHUẨN HÓA)
    // =========================================================================

    private static final Map<String, String> CANONICAL_SKILL_MAP = new HashMap<>();
    static {
        // IT / Tech
        CANONICAL_SKILL_MAP.put("react", "ReactJS");
        CANONICAL_SKILL_MAP.put("react.js", "ReactJS");
        CANONICAL_SKILL_MAP.put("reactjs", "ReactJS");
        CANONICAL_SKILL_MAP.put("react js", "ReactJS");
        CANONICAL_SKILL_MAP.put("vue", "Vue.js");
        CANONICAL_SKILL_MAP.put("vue.js", "Vue.js");
        CANONICAL_SKILL_MAP.put("vuejs", "Vue.js");
        CANONICAL_SKILL_MAP.put("node", "Node.js");
        CANONICAL_SKILL_MAP.put("nodejs", "Node.js");
        CANONICAL_SKILL_MAP.put("node.js", "Node.js");
        CANONICAL_SKILL_MAP.put("nextjs", "Next.js");
        CANONICAL_SKILL_MAP.put("next.js", "Next.js");
        CANONICAL_SKILL_MAP.put("ts", "TypeScript");
        CANONICAL_SKILL_MAP.put("typescript", "TypeScript");
        CANONICAL_SKILL_MAP.put("js", "JavaScript");
        CANONICAL_SKILL_MAP.put("javascript", "JavaScript");
        CANONICAL_SKILL_MAP.put("java", "Java");
        CANONICAL_SKILL_MAP.put("java core", "Java");
        CANONICAL_SKILL_MAP.put("spring", "Spring Boot");
        CANONICAL_SKILL_MAP.put("spring boot", "Spring Boot");
        CANONICAL_SKILL_MAP.put("springboot", "Spring Boot");
        CANONICAL_SKILL_MAP.put("python", "Python");
        CANONICAL_SKILL_MAP.put("python 3", "Python");
        CANONICAL_SKILL_MAP.put("c#", ".NET / C#");
        CANONICAL_SKILL_MAP.put("c sharp", ".NET / C#");
        CANONICAL_SKILL_MAP.put("dotnet", ".NET / C#");
        CANONICAL_SKILL_MAP.put(".net", ".NET / C#");
        CANONICAL_SKILL_MAP.put("asp.net", ".NET / C#");
        CANONICAL_SKILL_MAP.put("golang", "Golang");
        CANONICAL_SKILL_MAP.put("go", "Golang");
        CANONICAL_SKILL_MAP.put("docker", "Docker");
        CANONICAL_SKILL_MAP.put("k8s", "Kubernetes");
        CANONICAL_SKILL_MAP.put("kubernetes", "Kubernetes");
        CANONICAL_SKILL_MAP.put("aws", "AWS Cloud");
        CANONICAL_SKILL_MAP.put("gcp", "Google Cloud (GCP)");
        CANONICAL_SKILL_MAP.put("azure", "Microsoft Azure");
        CANONICAL_SKILL_MAP.put("git", "Git");
        CANONICAL_SKILL_MAP.put("rest", "RESTful API");
        CANONICAL_SKILL_MAP.put("rest api", "RESTful API");
        CANONICAL_SKILL_MAP.put("restful api", "RESTful API");
        CANONICAL_SKILL_MAP.put("tailwind", "TailwindCSS");
        CANONICAL_SKILL_MAP.put("tailwindcss", "TailwindCSS");
        CANONICAL_SKILL_MAP.put("postgres", "PostgreSQL");
        CANONICAL_SKILL_MAP.put("postgresql", "PostgreSQL");
        CANONICAL_SKILL_MAP.put("psql", "PostgreSQL");

        // Marketing / Sales
        CANONICAL_SKILL_MAP.put("fb ads", "Facebook Ads");
        CANONICAL_SKILL_MAP.put("facebook ads", "Facebook Ads");
        CANONICAL_SKILL_MAP.put("chạy ads fb", "Facebook Ads");
        CANONICAL_SKILL_MAP.put("chay ads fb", "Facebook Ads");
        CANONICAL_SKILL_MAP.put("quảng cáo facebook", "Facebook Ads");
        CANONICAL_SKILL_MAP.put("google ads", "Google Ads");
        CANONICAL_SKILL_MAP.put("gg ads", "Google Ads");
        CANONICAL_SKILL_MAP.put("adwords", "Google Ads");
        CANONICAL_SKILL_MAP.put("tiktok ads", "TikTok Ads");
        CANONICAL_SKILL_MAP.put("seo", "SEO Optimization");
        CANONICAL_SKILL_MAP.put("seo web", "SEO Optimization");
        CANONICAL_SKILL_MAP.put("content", "Content Marketing");
        CANONICAL_SKILL_MAP.put("content marketing", "Content Marketing");
        CANONICAL_SKILL_MAP.put("viết bài", "Content Marketing");
        CANONICAL_SKILL_MAP.put("copywriting", "Copywriting");
        CANONICAL_SKILL_MAP.put("sales", "Kỹ năng Bán hàng B2B");
        CANONICAL_SKILL_MAP.put("bán hàng", "Kỹ năng Bán hàng B2B");
        CANONICAL_SKILL_MAP.put("crm", "Quản trị CRM & Phễu Bán hàng");
        CANONICAL_SKILL_MAP.put("hubspot", "Quản trị CRM & Phễu Bán hàng");
        CANONICAL_SKILL_MAP.put("chốt sale", "Kỹ năng Đàm phán & Chốt Deal");
        CANONICAL_SKILL_MAP.put("đàm phán", "Kỹ năng Đàm phán");

        // Finance / Accounting
        CANONICAL_SKILL_MAP.put("bctc", "Phân tích Báo cáo Tài chính");
        CANONICAL_SKILL_MAP.put("báo cáo tài chính", "Phân tích Báo cáo Tài chính");
        CANONICAL_SKILL_MAP.put("kế toán thuế", "Kế toán Thuế");
        CANONICAL_SKILL_MAP.put("khai báo thuế", "Kế toán Thuế");
        CANONICAL_SKILL_MAP.put("misa", "Phần mềm MISA SME");
        CANONICAL_SKILL_MAP.put("fast", "Phần mềm FAST Accounting");
        CANONICAL_SKILL_MAP.put("kiểm toán", "Kiểm toán Nội bộ");
        CANONICAL_SKILL_MAP.put("dòng tiền", "Quản trị Dòng tiền");

        // Design / Creative
        CANONICAL_SKILL_MAP.put("figma", "Figma / UI-UX");
        CANONICAL_SKILL_MAP.put("ui/ux", "Figma / UI-UX");
        CANONICAL_SKILL_MAP.put("pts", "Adobe Photoshop");
        CANONICAL_SKILL_MAP.put("photoshop", "Adobe Photoshop");
        CANONICAL_SKILL_MAP.put("illustrator", "Adobe Illustrator");
        CANONICAL_SKILL_MAP.put("premiere", "Adobe Premiere Pro");
        CANONICAL_SKILL_MAP.put("after effects", "Adobe After Effects");
        CANONICAL_SKILL_MAP.put("dựng video", "Dựng Video Premiere Pro");

        // HR / Admin
        CANONICAL_SKILL_MAP.put("tuyển dụng", "Tuyển dụng & Săn đầu người");
        CANONICAL_SKILL_MAP.put("headhunt", "Tuyển dụng & Săn đầu người");
        CANONICAL_SKILL_MAP.put("c&b", "Chính sách Lương & Phúc lợi (C&B)");
        CANONICAL_SKILL_MAP.put("luật lao động", "Luật Lao động");

        // Soft Skills / Languages
        CANONICAL_SKILL_MAP.put("tiếng anh", "Tiếng Anh (Giao tiếp)");
        CANONICAL_SKILL_MAP.put("english", "Tiếng Anh (Giao tiếp)");
        CANONICAL_SKILL_MAP.put("toeic", "Tiếng Anh (Giao tiếp)");
        CANONICAL_SKILL_MAP.put("ielts", "Tiếng Anh (Giao tiếp)");
        CANONICAL_SKILL_MAP.put("tiếng nhật", "Tiếng Nhật (N3 - N1)");
        CANONICAL_SKILL_MAP.put("giao tiếp", "Kỹ năng Giao tiếp Chuyên nghiệp");
        CANONICAL_SKILL_MAP.put("làm việc nhóm", "Kỹ năng Làm việc Nhóm (Teamwork)");
        CANONICAL_SKILL_MAP.put("quản lý dự án", "Quản lý Dự án (PM)");
        CANONICAL_SKILL_MAP.put("scrum", "Agile / Scrum");
        CANONICAL_SKILL_MAP.put("ba", "Phân tích Nghiệp vụ (BA)");
    }

    public String normalizeSkillName(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String cleaned = raw.replaceAll("[\\[\\]•|;,\t]", " ").trim();
        cleaned = cleaned.replaceAll("\\s+", " ");
        String lower = cleaned.toLowerCase();

        if (CANONICAL_SKILL_MAP.containsKey(lower)) {
            return CANONICAL_SKILL_MAP.get(lower);
        }

        // Tự động kiểm tra các cụm từ phổ biến
        for (Map.Entry<String, String> entry : CANONICAL_SKILL_MAP.entrySet()) {
            if (lower.equals(entry.getKey()) || lower.startsWith(entry.getKey() + " ") || lower.endsWith(" " + entry.getKey())) {
                return entry.getValue();
            }
        }

        // Nếu là tên chưa có trong từ điển: format chuẩn Title Case
        if (cleaned.length() <= 3) {
            return cleaned.toUpperCase();
        }
        String[] words = cleaned.split(" ");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            if (w.isEmpty()) continue;
            if (i > 0) sb.append(" ");
            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
        }
        return sb.toString();
    }

    public String detectCategory(String skillName, String fallback) {
        if (skillName == null) return fallback != null ? fallback : "IT_SOFTWARE";
        String s = skillName.toLowerCase();

        if (s.contains("react") || s.contains("java") || s.contains("python") || s.contains("node") 
                || s.contains("c#") || s.contains(".net") || s.contains("sql") || s.contains("docker") 
                || s.contains("k8s") || s.contains("cloud") || s.contains("api") || s.contains("devops")
                || s.contains("backend") || s.contains("frontend") || s.contains("lập trình") || s.contains("code")) {
            return "IT_SOFTWARE";
        }
        if (s.contains("ads") || s.contains("marketing") || s.contains("seo") || s.contains("content") 
                || s.contains("sales") || s.contains("bán hàng") || s.contains("tiếp thị") || s.contains("quảng cáo")
                || s.contains("chốt deal") || s.contains("lead")) {
            return "MARKETING_SALES";
        }
        if (s.contains("thuế") || s.contains("kế toán") || s.contains("kiểm toán") || s.contains("tài chính") 
                || s.contains("ngân hàng") || s.contains("bctc") || s.contains("misa") || s.contains("fast")
                || s.contains("dòng tiền") || s.contains("audit") || s.contains("accounting")) {
            return "FINANCE_ACCOUNTING";
        }
        if (s.contains("figma") || s.contains("photoshop") || s.contains("illustrator") || s.contains("design") 
                || s.contains("ui") || s.contains("ux") || s.contains("đồ họa") || s.contains("video")
                || s.contains("premiere") || s.contains("after effects") || s.contains("3d")) {
            return "DESIGN_CREATIVE";
        }
        if (s.contains("tuyển dụng") || s.contains("nhân sự") || s.contains("hr") || s.contains("c&b") 
                || s.contains("hành chính") || s.contains("luật lao động") || s.contains("đào tạo")) {
            return "HR_ADMIN";
        }
        if (s.contains("dự án") || s.contains("scrum") || s.contains("agile") || s.contains("ba") 
                || s.contains("business") || s.contains("nghiệp vụ") || s.contains("quản lý") || s.contains("vận hành")) {
            return "BUSINESS_MANAGEMENT";
        }
        if (s.contains("cơ khí") || s.contains("điện") || s.contains("xây dựng") || s.contains("sản xuất") 
                || s.contains("logistics") || s.contains("chuỗi cung ứng") || s.contains("kho bãi") || s.contains("hải quan")) {
            return "ENGINEERING_MANUFACTURING";
        }
        if (s.contains("cskh") || s.contains("chăm sóc khách hàng") || s.contains("telesales") || s.contains("call center")) {
            return "CUSTOMER_SERVICE";
        }
        if (s.contains("tiếng anh") || s.contains("english") || s.contains("tiếng nhật") || s.contains("dịch thuật") || s.contains("giáo dục")) {
            return "EDUCATION_TRAINING";
        }
        if (s.contains("giao tiếp") || s.contains("làm việc nhóm") || s.contains("thuyết trình") || s.contains("đàm phán") || s.contains("phản biện")) {
            return "SOFT_SKILLS";
        }

        return fallback != null && !fallback.isBlank() ? fallback : "IT_SOFTWARE";
    }

    @Override
    @Transactional
    public Skill findOrCreateNormalizedSkill(String rawName, String suggestedCategory, String aliases) {
        if (rawName == null || rawName.isBlank()) {
            return null;
        }

        String normalized = normalizeSkillName(rawName);
        if (normalized.isBlank()) return null;

        // 1. Kiểm tra chính xác theo tên (case-insensitive)
        Optional<Skill> existing = skillRepository.findBySkillNameIgnoreCase(normalized);
        if (existing.isPresent()) {
            return existing.get();
        }

        // 2. Tìm kiếm trong aliases của các skill hiện có (sử dụng in-memory cache, tránh query findAll lặp lại)
        List<SkillResponse> cachedSkills = getAllSkills(null, null);
        for (SkillResponse s : cachedSkills) {
            if (s.getAliases() != null && !s.getAliases().isBlank()) {
                String[] aliasArr = s.getAliases().split("[,;]");
                for (String a : aliasArr) {
                    if (a.trim().equalsIgnoreCase(normalized) || a.trim().equalsIgnoreCase(rawName.trim())) {
                        return skillRepository.findById(s.getSkillId()).orElse(null);
                    }
                }
            }
        }

        // 3. Tự động INSERT kỹ năng mới vào bảng skills trên Supabase
        String category = (suggestedCategory != null && !suggestedCategory.isBlank())
                ? suggestedCategory
                : detectCategory(normalized, null);

        StringBuilder sbAliases = new StringBuilder();
        if (!rawName.trim().equalsIgnoreCase(normalized)) {
            sbAliases.append(rawName.trim());
        }
        if (aliases != null && !aliases.isBlank()) {
            if (sbAliases.length() > 0) sbAliases.append(", ");
            sbAliases.append(aliases.trim());
        }

        Skill newSkill = Skill.builder()
                .skillName(normalized)
                .category(category)
                .aliases(sbAliases.length() > 0 ? sbAliases.toString() : null)
                .build();

        Skill saved = skillRepository.save(newSkill);
        cachedSkillsRef.set(null); // Invalidate cache để các API khác cập nhật tức thì
        log.info(">> [AI Skill Taxonomy] Tự động bổ sung kỹ năng mới vào Supabase: {} ({})", saved.getSkillName(), saved.getCategory());
        return saved;
    }

    @Override
    @Transactional
    public AiJdSkillExtractResponse extractSkillsFromJd(AiJdSkillExtractRequest request) {
        if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Vui lòng cung cấp tiêu đề tuyển dụng!");
        }

        AiJdSkillExtractResponse aiResp = geminiAiService.extractSkillsFromJdWithAi(
                request.getTitle(),
                request.getDescription(),
                request.getIndustry()
        );

        // Lưu trữ tự động & liên kết vào bảng skills trên Supabase
        if (aiResp.getMandatorySkills() != null) {
            for (SkillItemDTO item : aiResp.getMandatorySkills()) {
                boolean existed = skillRepository.existsBySkillNameIgnoreCase(normalizeSkillName(item.getSkillName()));
                Skill s = findOrCreateNormalizedSkill(item.getSkillName(), item.getCategory(), item.getAliases());
                if (s != null) {
                    item.setSkillId(s.getSkillId());
                    item.setSkillName(s.getSkillName());
                    item.setCategory(s.getCategory());
                    item.setNew(!existed);
                }
            }
        }

        if (aiResp.getPreferredSkills() != null) {
            for (SkillItemDTO item : aiResp.getPreferredSkills()) {
                boolean existed = skillRepository.existsBySkillNameIgnoreCase(normalizeSkillName(item.getSkillName()));
                Skill s = findOrCreateNormalizedSkill(item.getSkillName(), item.getCategory(), item.getAliases());
                if (s != null) {
                    item.setSkillId(s.getSkillId());
                    item.setSkillName(s.getSkillName());
                    item.setCategory(s.getCategory());
                    item.setNew(!existed);
                }
            }
        }

        return aiResp;
    }

    @Override
    @Transactional
    public AiIndustrySkillGenerateResponse generateSkillsForIndustry(AiIndustrySkillGenerateRequest request) {
        if (request == null || request.getIndustryName() == null || request.getIndustryName().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập tên ngành nghề!");
        }

        String indName = request.getIndustryName().trim();
        List<SkillItemDTO> aiItems = geminiAiService.generateSkillsForIndustryWithAi(indName);
        int newAddedCount = 0;

        List<SkillItemDTO> resultList = new ArrayList<>();
        String detectedCat = "IT_SOFTWARE";

        for (SkillItemDTO item : aiItems) {
            String norm = normalizeSkillName(item.getSkillName());
            boolean existed = skillRepository.existsBySkillNameIgnoreCase(norm);
            Skill s = findOrCreateNormalizedSkill(item.getSkillName(), item.getCategory(), item.getAliases());
            if (s != null) {
                if (!existed) {
                    newAddedCount++;
                }
                detectedCat = s.getCategory();
                resultList.add(SkillItemDTO.builder()
                        .skillId(s.getSkillId())
                        .skillName(s.getSkillName())
                        .category(s.getCategory())
                        .aliases(s.getAliases())
                        .isNew(!existed)
                        .build());
            }
        }

        return AiIndustrySkillGenerateResponse.builder()
                .industryName(indName)
                .category(detectedCat)
                .generatedSkills(resultList)
                .totalNewSkillsAdded(newAddedCount)
                .build();
    }

    @Override
    public List<SkillCategoryCountDTO> getSkillCategoriesSummary() {
        List<SkillResponse> all = getAllSkills(null, null);
        Map<String, Long> countMap = new HashMap<>();

        for (SkillResponse s : all) {
            String cat = (s.getCategory() != null && !s.getCategory().isBlank()) ? s.getCategory().trim() : "IT_SOFTWARE";
            countMap.put(cat, countMap.getOrDefault(cat, 0L) + 1);
        }

        // Định danh tên tiếng Việt và Icon cho từng Nhóm ngành
        Map<String, String[]> metaMap = new LinkedHashMap<>();
        metaMap.put("IT_SOFTWARE", new String[]{"Công Nghệ Thông Tin & Phần Mềm", "terminal"});
        metaMap.put("MARKETING_SALES", new String[]{"Tiếp Thị & Bán Hàng (Marketing / Sales)", "trending_up"});
        metaMap.put("FINANCE_ACCOUNTING", new String[]{"Tài Chính, Kế Toán & Kiểm Toán", "account_balance"});
        metaMap.put("DESIGN_CREATIVE", new String[]{"Thiết Kế Đồ Họa & Sáng Tạo (UI/UX)", "palette"});
        metaMap.put("HR_ADMIN", new String[]{"Quản Trị Nhân Sự & Hành Chính", "badge"});
        metaMap.put("BUSINESS_MANAGEMENT", new String[]{"Quản Trị Kinh Doanh & Dự Án (PM/BA)", "business_center"});
        metaMap.put("ENGINEERING_MANUFACTURING", new String[]{"Kỹ Thuật, Xây Dựng & Chuỗi Cung Ứng", "precision_manufacturing"});
        metaMap.put("CUSTOMER_SERVICE", new String[]{"Dịch Vụ Khách Hàng & Call Center", "support_agent"});
        metaMap.put("EDUCATION_TRAINING", new String[]{"Giáo Dục, Đào Tạo & Ngoại Ngữ", "school"});
        metaMap.put("HEALTHCARE_PHARMA", new String[]{"Y Tế, Dược Phẩm & Sức Khỏe", "medical_services"});
        metaMap.put("SOFT_SKILLS", new String[]{"Kỹ Năng Mềm & Lãnh Đạo", "psychology"});

        List<SkillCategoryCountDTO> list = new ArrayList<>();
        // Đưa các nhóm đã định nghĩa lên trước
        for (Map.Entry<String, String[]> entry : metaMap.entrySet()) {
            String key = entry.getKey();
            long cnt = countMap.getOrDefault(key, 0L);
            list.add(SkillCategoryCountDTO.builder()
                    .categoryKey(key)
                    .categoryDisplayName(entry.getValue()[0])
                    .skillCount(cnt)
                    .iconName(entry.getValue()[1])
                    .build());
        }

        // Bổ sung các nhóm khác nếu có trong DB
        for (Map.Entry<String, Long> entry : countMap.entrySet()) {
            if (!metaMap.containsKey(entry.getKey())) {
                list.add(SkillCategoryCountDTO.builder()
                        .categoryKey(entry.getKey())
                        .categoryDisplayName(entry.getKey())
                        .skillCount(entry.getValue())
                        .iconName("label")
                        .build());
            }
        }

        return list;
    }
}
