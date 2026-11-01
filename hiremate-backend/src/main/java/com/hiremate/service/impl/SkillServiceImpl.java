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
                    // IT & Phần Mềm (Backend, Frontend, Database, DevOps, Mobile, AI/Data)
                    Skill.builder().skillName("Java").category("IT_SOFTWARE").aliases("Java Core, JDK, JVM, Java 17, Java 21").build(),
                    Skill.builder().skillName("Spring Boot").category("IT_SOFTWARE").aliases("Spring Framework, Spring Data, Spring Security").build(),
                    Skill.builder().skillName("Node.js").category("IT_SOFTWARE").aliases("NodeJS, ExpressJS, NestJS").build(),
                    Skill.builder().skillName("Python").category("IT_SOFTWARE").aliases("Python 3, Django, FastAPI, Flask").build(),
                    Skill.builder().skillName("C# / .NET").category("IT_SOFTWARE").aliases(".NET Core, ASP.NET, C#").build(),
                    Skill.builder().skillName("Go (Golang)").category("IT_SOFTWARE").aliases("Go, Golang, Gin, Fiber").build(),
                    Skill.builder().skillName("RESTful API").category("IT_SOFTWARE").aliases("REST API, Web API Design").build(),
                    Skill.builder().skillName("Microservices Architecture").category("IT_SOFTWARE").aliases("Microservices, Distributed Systems").build(),
                    
                    // Frontend
                    Skill.builder().skillName("React.js").category("IT_SOFTWARE").aliases("React, ReactJS, Next.js, Redux").build(),
                    Skill.builder().skillName("TypeScript").category("IT_SOFTWARE").aliases("TS, Strict Typing").build(),
                    Skill.builder().skillName("JavaScript").category("IT_SOFTWARE").aliases("JS, ES6+, Web JS").build(),
                    Skill.builder().skillName("Vue.js").category("IT_SOFTWARE").aliases("Vue, VueJS, Nuxt.js").build(),
                    Skill.builder().skillName("HTML5 & CSS3").category("IT_SOFTWARE").aliases("HTML, CSS, SCSS, Tailwind CSS").build(),
                    Skill.builder().skillName("Tailwind CSS").category("IT_SOFTWARE").aliases("Tailwind, Utility CSS").build(),
                    Skill.builder().skillName("Next.js").category("IT_SOFTWARE").aliases("NextJS, React SSR").build(),
                    Skill.builder().skillName("Figma / UI-UX").category("DESIGN_CREATIVE").aliases("Figma, UI Design, Wireframing").build(),

                    // Database
                    Skill.builder().skillName("PostgreSQL").category("IT_SOFTWARE").aliases("Postgres, PSQL, Supabase").build(),
                    Skill.builder().skillName("MySQL").category("IT_SOFTWARE").aliases("MySQL Server, MariaDB").build(),
                    Skill.builder().skillName("MongoDB").category("IT_SOFTWARE").aliases("Mongo, NoSQL, Document DB").build(),
                    Skill.builder().skillName("Redis").category("IT_SOFTWARE").aliases("Redis Cache, In-memory DB").build(),
                    Skill.builder().skillName("SQL").category("IT_SOFTWARE").aliases("Standard SQL, Complex Queries").build(),
                    
                    // DevOps & Cloud
                    Skill.builder().skillName("Docker").category("IT_SOFTWARE").aliases("Container, Docker Compose, Dockerfile").build(),
                    Skill.builder().skillName("Kubernetes").category("IT_SOFTWARE").aliases("K8s, Pods, Deployments").build(),
                    Skill.builder().skillName("AWS").category("IT_SOFTWARE").aliases("Amazon Web Services, EC2, S3, RDS").build(),
                    Skill.builder().skillName("CI/CD").category("IT_SOFTWARE").aliases("GitHub Actions, GitLab CI, Jenkins").build(),
                    Skill.builder().skillName("Git").category("IT_SOFTWARE").aliases("Git, GitHub, GitLab, Version Control").build(),
                    Skill.builder().skillName("Kafka").category("IT_SOFTWARE").aliases("Apache Kafka, Event Streaming, MQ").build(),

                    // Mobile
                    Skill.builder().skillName("Flutter").category("IT_SOFTWARE").aliases("Flutter, Dart, Cross-platform").build(),
                    Skill.builder().skillName("React Native").category("IT_SOFTWARE").aliases("RN, Mobile React").build(),
                    Skill.builder().skillName("iOS (Swift)").category("IT_SOFTWARE").aliases("Swift, SwiftUI, Xcode").build(),
                    Skill.builder().skillName("Android (Kotlin)").category("IT_SOFTWARE").aliases("Kotlin, Android Jetpack").build(),
                    
                    // AI & Data
                    Skill.builder().skillName("Generative AI").category("IT_SOFTWARE").aliases("LLM, OpenAI, Gemini API, Claude").build(),
                    Skill.builder().skillName("Machine Learning").category("IT_SOFTWARE").aliases("ML, PyTorch, TensorFlow, Scikit-learn").build(),
                    Skill.builder().skillName("Data Analytics").category("IT_SOFTWARE").aliases("Data Analysis, PowerBI, Pandas").build(),

                    // Business & Management
                    Skill.builder().skillName("Business Analysis (BA)").category("BUSINESS_MANAGEMENT").aliases("BRD, SRS, Agile BA, User Stories").build(),
                    Skill.builder().skillName("Agile / Scrum").category("BUSINESS_MANAGEMENT").aliases("Scrum Master, Sprint, Jira").build(),

                    // Soft Skills & Languages
                    Skill.builder().skillName("Giao tiếp & Làm việc nhóm").category("SOFT_SKILLS").aliases("Teamwork, Communication, Kỹ năng giao tiếp").build(),
                    Skill.builder().skillName("Tiếng Anh (Giao tiếp / TOEIC)").category("EDUCATION_TRAINING").aliases("English, Professional English, TOEIC, IELTS").build(),
                    Skill.builder().skillName("Tư duy phản biện (Critical Thinking)").category("SOFT_SKILLS").aliases("Problem Solving, Critical Thinking").build()
            );
            skillRepository.saveAll(initialSkills);
            log.info(">> [SkillService] Seeded {} standard tech skills successfully.", initialSkills.size());
        } else {
            cleanCorruptedSkillAliasesAndCategories();
        }
    }

    private void cleanCorruptedSkillAliasesAndCategories() {
        try {
            List<Skill> allSkills = skillRepository.findAll();
            List<Skill> toUpdate = new ArrayList<>();
            List<String> domainKeywords = List.of(
                    "marketing", "công nghệ thông tin", "kinh doanh", "tài chính",
                    "nhân sự", "kỹ thuật", "thiết kế", "logistics", "y tế", "giáo dục", "quản trị", "bán hàng", " / "
            );

            for (Skill s : allSkills) {
                boolean changed = false;
                String domainFromAlias = null;
                if (s.getAliases() != null && !s.getAliases().isBlank()) {
                    String[] aliases = s.getAliases().split("[,;]");
                    List<String> cleanedAliases = new ArrayList<>();
                    for (String a : aliases) {
                        String trimmed = a.trim();
                        if (trimmed.isEmpty()) continue;
                        String lower = trimmed.toLowerCase();
                        boolean isDomainText = trimmed.contains(" / ") 
                                || lower.startsWith("marketing") 
                                || lower.startsWith("công nghệ thông tin") 
                                || lower.startsWith("kinh doanh") 
                                || lower.startsWith("tài chính") 
                                || lower.startsWith("nhân sự") 
                                || lower.startsWith("kỹ thuật") 
                                || lower.startsWith("thiết kế")
                                || lower.startsWith("logistics")
                                || lower.startsWith("y tế")
                                || lower.startsWith("giáo dục")
                                || (domainKeywords.stream().anyMatch(lower::contains) && trimmed.length() > 10);
                        if (!isDomainText) {
                            cleanedAliases.add(trimmed);
                        } else {
                            changed = true;
                            domainFromAlias = trimmed;
                        }
                    }
                    String newAliasesStr = String.join(", ", cleanedAliases);
                    if (!newAliasesStr.equals(s.getAliases())) {
                        s.setAliases(newAliasesStr.isBlank() ? null : newAliasesStr);
                        changed = true;
                    }
                }

                // Cập nhật lại category đúng cho skill nếu đang là IT_SOFTWARE nhưng không phải skill IT, hoặc có domain từ alias
                String corrected = detectCategory(s.getSkillName(), domainFromAlias != null ? domainFromAlias : s.getCategory());
                if (!corrected.equals(s.getCategory())) {
                    s.setCategory(corrected);
                    changed = true;
                }

                if (changed) {
                    toUpdate.add(s);
                }
            }

            if (!toUpdate.isEmpty()) {
                skillRepository.saveAll(toUpdate);
                cachedSkillsRef.set(null);
                log.info(">> [SkillService] Đã làm sạch {} kỹ năng có aliases/category bị lỗi từ trước.", toUpdate.size());
            }
        } catch (Exception ex) {
            log.warn(">> [SkillService] Lỗi khi dọn dẹp kỹ năng bị lỗi: {}", ex.getMessage());
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

        String targetCat = null;
        if (hasCategory) {
            String upper = category.trim().toUpperCase();
            if (upper.equals("BACKEND") || upper.equals("FRONTEND") || upper.equals("DATABASE")
                    || upper.equals("DEVOPS_CLOUD") || upper.equals("MOBILE") || upper.equals("AI_DATA")
                    || upper.equals("TECHNICAL") || upper.equals("IT")) {
                targetCat = "IT_SOFTWARE";
            } else if (upper.equals("BUSINESS_BA") || upper.equals("BUSINESS")) {
                targetCat = "BUSINESS_MANAGEMENT";
            } else if (upper.equals("SOFT_SKILL")) {
                targetCat = "SOFT_SKILLS";
            } else {
                targetCat = category.trim();
            }
        }

        List<SkillResponse> result = new ArrayList<>();
        String kw = hasKeyword ? keyword.toLowerCase().trim() : null;

        for (SkillResponse s : all) {
            if (targetCat != null && !s.getCategory().equalsIgnoreCase(targetCat)) {
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
        String cat = s.getCategory();
        if (cat == null || cat.isBlank()) {
            cat = detectCategory(s.getSkillName(), "IT_SOFTWARE");
        } else {
            String upper = cat.trim().toUpperCase();
            if (upper.equals("BACKEND") || upper.equals("FRONTEND") || upper.equals("DATABASE")
                    || upper.equals("DEVOPS_CLOUD") || upper.equals("MOBILE") || upper.equals("AI_DATA")
                    || upper.equals("TECHNICAL") || upper.equals("IT")) {
                cat = "IT_SOFTWARE";
            } else if (upper.equals("BUSINESS_BA") || upper.equals("BUSINESS")) {
                cat = "BUSINESS_MANAGEMENT";
            } else if (upper.equals("SOFT_SKILL")) {
                cat = "SOFT_SKILLS";
            }
        }
        return SkillResponse.builder()
                .skillId(s.getSkillId())
                .skillName(s.getSkillName())
                .category(cat)
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
        CANONICAL_SKILL_MAP.put("b2b sales", "Kỹ năng Bán hàng B2B");
        CANONICAL_SKILL_MAP.put("b2b sale", "Kỹ năng Bán hàng B2B");
        CANONICAL_SKILL_MAP.put("b2c sales", "Bán hàng B2C");
        CANONICAL_SKILL_MAP.put("b2c sale", "Bán hàng B2C");
        CANONICAL_SKILL_MAP.put("telesale", "Telesales");
        CANONICAL_SKILL_MAP.put("telesales", "Telesales");
        CANONICAL_SKILL_MAP.put("sale admin", "Sales Admin");
        CANONICAL_SKILL_MAP.put("sales admin", "Sales Admin");
        CANONICAL_SKILL_MAP.put("content creator", "Sáng tạo Nội dung (Content Creator)");
        CANONICAL_SKILL_MAP.put("tiktok shop", "Quản trị Gian hàng TikTok Shop / Shopee");
        CANONICAL_SKILL_MAP.put("livestream", "Kỹ năng Livestream Bán hàng");
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
        CANONICAL_SKILL_MAP.put("c&b", "C&B (Lương thưởng & Phúc lợi)");
        CANONICAL_SKILL_MAP.put("luật lao động", "Luật Lao động");

        // Engineering / Manufacturing / Construction / Logistics
        CANONICAL_SKILL_MAP.put("autocad", "AutoCAD");
        CANONICAL_SKILL_MAP.put("revit", "Revit / SketchUp");
        CANONICAL_SKILL_MAP.put("sketchup", "Revit / SketchUp");
        CANONICAL_SKILL_MAP.put("cnc", "Vận hành máy CNC / PLC");
        CANONICAL_SKILL_MAP.put("plc", "Vận hành máy CNC / PLC");
        CANONICAL_SKILL_MAP.put("hse", "An toàn lao động (HSE)");
        CANONICAL_SKILL_MAP.put("qa/qc", "Kiểm soát Chất lượng (QA/QC)");
        CANONICAL_SKILL_MAP.put("qa qc", "Kiểm soát Chất lượng (QA/QC)");
        CANONICAL_SKILL_MAP.put("xnk", "Nghiệp vụ Xuất nhập khẩu");
        CANONICAL_SKILL_MAP.put("xuất nhập khẩu", "Nghiệp vụ Xuất nhập khẩu");
        CANONICAL_SKILL_MAP.put("hải quan", "Khai báo Hải quan (VNACCS)");
        CANONICAL_SKILL_MAP.put("vnaccs", "Khai báo Hải quan (VNACCS)");
        CANONICAL_SKILL_MAP.put("incoterms", "Incoterms");
        CANONICAL_SKILL_MAP.put("wms", "Quản lý Kho vận (WMS)");

        // Customer Service
        CANONICAL_SKILL_MAP.put("cskh", "Chăm sóc Khách hàng");
        CANONICAL_SKILL_MAP.put("chăm sóc khách hàng", "Chăm sóc Khách hàng");

        // Education & Academic
        CANONICAL_SKILL_MAP.put("sư phạm", "Phương pháp Sư phạm & Giảng dạy Đại học");
        CANONICAL_SKILL_MAP.put("phương pháp sư phạm", "Phương pháp Sư phạm & Giảng dạy Đại học");
        CANONICAL_SKILL_MAP.put("giảng dạy đại học", "Phương pháp Sư phạm & Giảng dạy Đại học");
        CANONICAL_SKILL_MAP.put("lms", "Biên soạn Đề cương & Bài giảng LMS");
        CANONICAL_SKILL_MAP.put("canvas", "Biên soạn Đề cương & Bài giảng LMS");
        CANONICAL_SKILL_MAP.put("moodle", "Biên soạn Đề cương & Bài giảng LMS");
        CANONICAL_SKILL_MAP.put("nghiên cứu khoa học", "Nghiên cứu Khoa học & Công bố Quốc tế (Scopus/ISI)");
        CANONICAL_SKILL_MAP.put("scopus", "Nghiên cứu Khoa học & Công bố Quốc tế (Scopus/ISI)");
        CANONICAL_SKILL_MAP.put("isi", "Nghiên cứu Khoa học & Công bố Quốc tế (Scopus/ISI)");
        CANONICAL_SKILL_MAP.put("khảo thí", "Xây dựng Ma trận Đề thi & Khảo thí");
        CANONICAL_SKILL_MAP.put("spss", "Phân tích Dữ liệu Nghiên cứu (SPSS / R)");
        CANONICAL_SKILL_MAP.put("r studio", "Phân tích Dữ liệu Nghiên cứu (SPSS / R)");
        CANONICAL_SKILL_MAP.put("aun-qa", "Kiểm định Chất lượng Giáo dục (AUN-QA)");
        CANONICAL_SKILL_MAP.put("kiểm định chất lượng giáo dục", "Kiểm định Chất lượng Giáo dục (AUN-QA)");

        // Law & Legal
        CANONICAL_SKILL_MAP.put("soạn thảo hợp đồng", "Soạn thảo & Đàm phán Hợp đồng Thương mại");
        CANONICAL_SKILL_MAP.put("hợp đồng thương mại", "Soạn thảo & Đàm phán Hợp đồng Thương mại");
        CANONICAL_SKILL_MAP.put("tranh tụng", "Kỹ năng Tranh tụng tại Tòa & Trọng tài");
        CANONICAL_SKILL_MAP.put("viac", "Kỹ năng Tranh tụng tại Tòa & Trọng tài");
        CANONICAL_SKILL_MAP.put("due diligence", "Thẩm định Pháp lý Doanh nghiệp (Due Diligence)");
        CANONICAL_SKILL_MAP.put("pháp chế", "Tư vấn Tuân thủ & Quản trị Rủi ro Pháp lý");
        CANONICAL_SKILL_MAP.put("pháp lý doanh nghiệp", "Tư vấn Tuân thủ & Quản trị Rủi ro Pháp lý");
        CANONICAL_SKILL_MAP.put("sở hữu trí tuệ", "Bảo hộ Sở hữu Trí tuệ (IP)");

        // Healthcare & Pharma
        CANONICAL_SKILL_MAP.put("chẩn đoán lâm sàng", "Khám Chẩn đoán & Điều trị Lâm sàng");
        CANONICAL_SKILL_MAP.put("khám bệnh", "Khám Chẩn đoán & Điều trị Lâm sàng");
        CANONICAL_SKILL_MAP.put("dược lý", "Dược lý học & Kê đơn Thuốc an toàn");
        CANONICAL_SKILL_MAP.put("kê đơn thuốc", "Dược lý học & Kê đơn Thuốc an toàn");
        CANONICAL_SKILL_MAP.put("bệnh án điện tử", "Bệnh án Điện tử & Hệ thống HIS/EMR");
        CANONICAL_SKILL_MAP.put("his", "Bệnh án Điện tử & Hệ thống HIS/EMR");
        CANONICAL_SKILL_MAP.put("emr", "Bệnh án Điện tử & Hệ thống HIS/EMR");
        CANONICAL_SKILL_MAP.put("gpp", "Thực hành tốt Nhà thuốc (GPP / GDP)");
        CANONICAL_SKILL_MAP.put("nhà thuốc gpp", "Thực hành tốt Nhà thuốc (GPP / GDP)");
        CANONICAL_SKILL_MAP.put("bls", "Hồi sức Cấp cứu Tim phổi (BLS / ACLS)");
        CANONICAL_SKILL_MAP.put("acls", "Hồi sức Cấp cứu Tim phổi (BLS / ACLS)");

        // Construction & Architecture
        CANONICAL_SKILL_MAP.put("etabs", "Mô hình Kết cấu (ETABS / SAP2000)");
        CANONICAL_SKILL_MAP.put("sap2000", "Mô hình Kết cấu (ETABS / SAP2000)");
        CANONICAL_SKILL_MAP.put("bim", "Mô hình Thông tin Công trình (BIM / Revit)");
        CANONICAL_SKILL_MAP.put("dự toán", "Bóc tách Khối lượng & Lập Dự toán (G8/Acitt)");
        CANONICAL_SKILL_MAP.put("bóc tách khối lượng", "Bóc tách Khối lượng & Lập Dự toán (G8/Acitt)");
        CANONICAL_SKILL_MAP.put("giám sát thi công", "Giám sát Thi công & Nghiệm thu Công trình");

        // Mechanical & Automation
        CANONICAL_SKILL_MAP.put("solidworks", "Thiết kế Cơ khí 3D (SolidWorks / Inventor)");
        CANONICAL_SKILL_MAP.put("inventor", "Thiết kế Cơ khí 3D (SolidWorks / Inventor)");
        CANONICAL_SKILL_MAP.put("mastercam", "Lập trình & Vận hành Máy CNC (Mastercam)");
        CANONICAL_SKILL_MAP.put("lập trình cnc", "Lập trình & Vận hành Máy CNC (Mastercam)");
        CANONICAL_SKILL_MAP.put("lập trình plc", "Lập trình Hệ thống Tự động hóa PLC (Siemens / Mitsubishi)");
        CANONICAL_SKILL_MAP.put("tpm", "Bảo trì & Quản lý Thiết bị Nhà máy (TPM)");

        // Hospitality & F&B
        CANONICAL_SKILL_MAP.put("haccp", "Tiêu chuẩn An toàn Vệ sinh Thực phẩm (HACCP)");
        CANONICAL_SKILL_MAP.put("opera pms", "Phần mềm Quản lý Khách sạn (Opera PMS)");
        CANONICAL_SKILL_MAP.put("food cost", "Quản trị Chi phí Thực phẩm & Đồ uống (F&B Cost Control)");
        CANONICAL_SKILL_MAP.put("barista", "Kỹ thuật Pha chế Đồ uống (Barista / Bartender)");
        CANONICAL_SKILL_MAP.put("pha chế", "Kỹ thuật Pha chế Đồ uống (Barista / Bartender)");
        CANONICAL_SKILL_MAP.put("đầu bếp", "Kỹ thuật Chế biến Món ăn Chuyên nghiệp (Culinary Arts)");

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
        cleaned = cleaned.replaceAll("^[\\.\\,\\-\\:\\;\"']+|[\\.\\,\\-\\:\\;\"']+$", "").trim();
        String lower = cleaned.toLowerCase();

        // Khớp chính xác với CANONICAL_SKILL_MAP (không so sánh startsWith/endsWith làm biến dạng kỹ năng ghép)
        if (CANONICAL_SKILL_MAP.containsKey(lower)) {
            return CANONICAL_SKILL_MAP.get(lower);
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

    public String normalizeCategoryCode(String suggested) {
        if (suggested == null || suggested.isBlank()) return null;
        String s = suggested.trim().toLowerCase();

        if (s.contains("it_software") || s.contains("công nghệ thông tin") || s.contains("cntt") 
                || s.contains("phần mềm") || s.contains("lập trình") || s.contains("software") || s.contains("tech")) {
            return "IT_SOFTWARE";
        }
        if (s.contains("marketing_sales") || s.contains("marketing") || s.contains("truyền thông") 
                || s.contains("quảng cáo") || s.contains("bán hàng") || s.contains("kinh doanh") || s.contains("sales")) {
            return "MARKETING_SALES";
        }
        if (s.contains("finance_accounting") || s.contains("kế toán") || s.contains("kiểm toán") 
                || s.contains("tài chính") || s.contains("ngân hàng") || s.contains("finance") || s.contains("accounting") || s.contains("thuế")) {
            return "FINANCE_ACCOUNTING";
        }
        if (s.contains("design_creative") || s.contains("thiết kế") || s.contains("sáng tạo") 
                || s.contains("đồ họa") || s.contains("design") || s.contains("creative") || s.contains("kiến trúc") || s.contains("nội thất")) {
            return "DESIGN_CREATIVE";
        }
        if (s.contains("hr_admin") || s.contains("nhân sự") || s.contains("hành chính") 
                || s.contains("tuyển dụng") || s.contains("pháp chế") || s.contains("văn phòng") || s.contains("hr")) {
            return "HR_ADMIN";
        }
        if (s.contains("customer_service") || s.contains("chăm sóc khách hàng") || s.contains("cskh") 
                || s.contains("dịch vụ khách hàng") || s.contains("call center")) {
            return "CUSTOMER_SERVICE";
        }
        if (s.contains("education_training") || s.contains("giáo dục") || s.contains("đào tạo") 
                || s.contains("giảng dạy") || s.contains("sư phạm") || s.contains("education")) {
            return "EDUCATION_TRAINING";
        }
        if (s.contains("healthcare_pharma") || s.contains("y tế") || s.contains("dược") 
                || s.contains("chăm sóc sức khỏe") || s.contains("y khoa") || s.contains("pharma") || s.contains("healthcare")) {
            return "HEALTHCARE_PHARMA";
        }
        if (s.contains("engineering_manufacturing") || s.contains("cơ khí") || s.contains("kỹ thuật") 
                || s.contains("sản xuất") || s.contains("xây dựng") || s.contains("chế tạo") 
                || s.contains("logistics") || s.contains("xuất nhập khẩu") || s.contains("chuỗi cung ứng") || s.contains("kho vận")) {
            return "ENGINEERING_MANUFACTURING";
        }
        if (s.contains("soft_skills") || s.contains("kỹ năng mềm") || s.contains("soft skills")) {
            return "SOFT_SKILLS";
        }
        if (s.contains("business_management") || s.contains("quản trị") || s.contains("quản lý") 
                || s.contains("kinh doanh") || s.contains("business") || s.contains("management")) {
            return "BUSINESS_MANAGEMENT";
        }
        return null;
    }

    public String detectCategory(String skillName, String fallback) {
        String normalizedFallback = normalizeCategoryCode(fallback);

        if (skillName != null && !skillName.isBlank()) {
            String s = skillName.toLowerCase();

            // Nếu người gọi đã cung cấp nhóm ngành chuyên biệt (không phải fallback mặc định), ưu tiên nhóm ngành đó
            // trừ khi kỹ năng chắc chắn 100% là công cụ lập trình IT (Java, React, Python, Docker...)
            boolean hasSpecificFallback = normalizedFallback != null && !normalizedFallback.isBlank() 
                    && !normalizedFallback.equals("BUSINESS_MANAGEMENT") && !normalizedFallback.equals("IT_SOFTWARE");

            // 1. Core IT / Software Tools (chỉ match công cụ kỹ thuật phần mềm thực sự, KHÔNG dùng s.contains("ai") bừa bãi)
            boolean isExplicitItTool = s.contains("react") || s.contains("java") || s.contains("python") || s.contains("node") 
                    || s.contains("c#") || s.contains(".net") || s.contains("sql") || s.contains("docker") 
                    || s.contains("k8s") || s.contains("cloud") || s.contains("devops")
                    || s.contains("backend") || s.contains("frontend") || s.contains("lập trình")
                    || s.contains("aws") || s.contains("git") || s.contains("linux")
                    || s.contains("phần mềm") || s.contains("golang") || s.contains("angular") || s.contains("flutter")
                    || s.matches(".*\\b(ai|ml|llm|llms|nlp|genai)\\b.*")
                    || s.contains("trí tuệ nhân tạo") || s.contains("machine learning") || s.contains("deep learning")
                    || s.contains("mạng máy tính") || s.contains("quản trị mạng") || s.contains("an ninh mạng")
                    || s.contains("mobile app") || s.contains("web app") || s.contains("clean code")
                    || s.contains("data science") || s.contains("data engineer") || s.contains("big data");

            if (isExplicitItTool && !hasSpecificFallback) {
                return "IT_SOFTWARE";
            }

            // 2. Education / Training / Academic
            if (s.contains("giáo dục") || s.contains("giảng dạy") || s.contains("sư phạm") || s.contains("giáo án")
                    || s.contains("đào tạo") || s.contains("đại học") || s.contains("giảng viên") || s.contains("khảo thí")
                    || s.contains("scopus") || s.contains("isi") || s.contains("lms") || s.contains("moodle")
                    || s.contains("canvas") || s.contains("aun-qa") || s.contains("cdio") || s.contains("obe")
                    || s.contains("spss") || s.contains("tiếng anh") || s.contains("english") || s.contains("ielts") || s.contains("toeic")) {
                return "EDUCATION_TRAINING";
            }

            // 3. Healthcare / Pharma / Medical
            if (s.contains("y tế") || s.contains("dược") || s.contains("thuốc") || s.contains("gpp") || s.contains("gdp")
                    || s.contains("bệnh nhân") || s.contains("y khoa") || s.contains("điều dưỡng") || s.contains("phòng khám")
                    || s.contains("bác sĩ") || s.contains("lâm sàng") || s.contains("bệnh án") || s.contains("his")
                    || s.contains("emr") || s.contains("kê đơn") || s.contains("vô trùng") || s.contains("nhiễm khuẩn")
                    || s.contains("cấp cứu") || s.contains("hồi sức") || s.contains("bls") || s.contains("acls") || s.contains("y đức")) {
                return "HEALTHCARE_PHARMA";
            }

            // 4. HR / Admin / Law & Legal
            if (s.contains("tuyển dụng") || s.contains("nhân sự") || s.contains("hr") || s.contains("c&b") 
                    || s.contains("hành chính") || s.contains("luật lao động") || s.contains("bhxh")
                    || s.contains("lương thưởng") || s.contains("văn thư") || s.contains("hồ sơ")
                    || s.contains("pháp chế") || s.contains("luật") || s.contains("pháp lý") || s.contains("tranh tụng")
                    || s.contains("tòa án") || s.contains("trọng tài") || s.contains("viac") || s.contains("due diligence")
                    || s.contains("hợp đồng thương mại") || s.contains("sở hữu trí tuệ") || s.contains("bản quyền")) {
                return "HR_ADMIN";
            }

            // 5. Finance / Accounting / Tax
            if (s.contains("thuế") || s.contains("kế toán") || s.contains("kiểm toán") || s.contains("tài chính") 
                    || s.contains("ngân hàng") || s.contains("bctc") || s.contains("misa") || s.contains("fast")
                    || s.contains("dòng tiền") || s.contains("audit") || s.contains("accounting") || s.contains("hóa đơn")
                    || s.contains("báo cáo tài chính") || s.contains("vas") || s.contains("ifrs") || s.contains("quyết toán")) {
                return "FINANCE_ACCOUNTING";
            }

            // 6. Marketing / Sales
            if (s.contains("ads") || s.contains("marketing") || s.contains("seo") || s.contains("content") 
                    || s.contains("sales") || s.contains("bán hàng") || s.contains("tiếp thị") || s.contains("quảng cáo")
                    || s.contains("chốt deal") || s.contains("lead") || s.contains("tiktok shop") || s.contains("livestream")
                    || s.contains("copywriting") || s.contains("telesale") || s.contains("chốt sale") || s.contains("pr")
                    || s.contains("thương mại điện tử") || s.contains("chăm sóc đại lý")) {
                return "MARKETING_SALES";
            }

            // 7. Design / Creative
            if (s.contains("figma") || s.contains("photoshop") || s.contains("illustrator") || s.contains("design") 
                    || s.contains("ui") || s.contains("ux") || s.contains("đồ họa") || s.contains("video")
                    || s.contains("premiere") || s.contains("after effects") || s.contains("3d") || s.contains("canva")
                    || s.contains("mỹ thuật") || s.contains("nội thất") || s.contains("kiến trúc")) {
                return "DESIGN_CREATIVE";
            }

            // 8. Engineering / Manufacturing / Logistics / Construction / Hospitality F&B
            if (s.contains("cơ khí") || s.contains("điện") || s.contains("xây dựng") || s.contains("sản xuất") 
                    || s.contains("logistics") || s.contains("chuỗi cung ứng") || s.contains("kho bãi") || s.contains("kho vận")
                    || s.contains("hải quan") || s.contains("xnk") || s.contains("xuất nhập khẩu") || s.contains("vnaccs")
                    || s.contains("incoterms") || s.contains("wms") || s.contains("autocad") || s.contains("revit")
                    || s.contains("sketchup") || s.contains("cnc") || s.contains("plc") || s.contains("hse")
                    || s.contains("bản vẽ") || s.contains("thi công") || s.contains("bóc tách khối lượng")
                    || s.contains("chế tạo") || s.contains("vận hành máy") || s.contains("etabs") || s.contains("sap2000")
                    || s.contains("solidworks") || s.contains("inventor") || s.contains("mastercam") || s.contains("tpm")
                    || s.contains("khách sạn") || s.contains("nhà hàng") || s.contains("f&b") || s.contains("bếp")
                    || s.contains("đầu bếp") || s.contains("barista") || s.contains("bartender") || s.contains("haccp")
                    || s.contains("opera pms") || s.contains("food cost")) {
                return "ENGINEERING_MANUFACTURING";
            }

            // 9. Customer Service
            if (s.contains("cskh") || s.contains("chăm sóc khách hàng") || s.contains("call center") 
                    || s.contains("tổng đài") || s.contains("khiếu nại") || s.contains("dịch vụ khách hàng")
                    || s.contains("quan hệ khách hàng")) {
                return "CUSTOMER_SERVICE";
            }

            // 10. Soft Skills
            if (s.contains("giao tiếp") || s.contains("làm việc nhóm") || s.contains("thuyết trình") 
                    || s.contains("đàm phán") || s.contains("phản biện") || s.contains("giải quyết vấn đề")
                    || s.contains("quản lý thời gian") || s.contains("tư duy phản biện")) {
                return "SOFT_SKILLS";
            }

            // 11. Business / Management
            if (s.contains("dự án") || s.contains("scrum") || s.contains("agile") || s.contains("ba") 
                    || s.contains("business") || s.contains("nghiệp vụ") || s.contains("quản lý") || s.contains("vận hành")
                    || s.contains("quản trị") || s.contains("chiến lược") || s.contains("kế hoạch") || s.contains("crm")) {
                return "BUSINESS_MANAGEMENT";
            }

            // Nếu là công cụ IT thuần túy
            if (isExplicitItTool) {
                return "IT_SOFTWARE";
            }
        }

        // Nếu skillName chưa khớp từ khóa chuyên môn thì dùng normalized fallback
        if (normalizedFallback != null && !normalizedFallback.isBlank()) {
            return normalizedFallback;
        }

        // Mặc định trả về "BUSINESS_MANAGEMENT" (tuyệt đối không gán ẩu sang IT_SOFTWARE)
        return "BUSINESS_MANAGEMENT";
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

        // 3. Kiểm tra tính hợp lệ nghiêm ngặt: Tuyệt đối không lưu từ vựng đơn lẻ, câu văn, placeholder vào skills
        if (!isValidSkillName(normalized)) {
            log.warn(">> [AI Skill Taxonomy] Từ chối lưu từ/cụm từ không đạt chuẩn vào Supabase: '{}'", normalized);
            return null;
        }

        // 4. INSERT kỹ năng mới đạt chuẩn vào bảng skills trên Supabase
        String category = detectCategory(normalized, suggestedCategory);

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
        if (saved != null) {
            log.info(">> [AI Skill Taxonomy] Tự động bổ sung kỹ năng mới vào Supabase: {} ({})", saved.getSkillName(), saved.getCategory());
            return saved;
        }
        return newSkill;
    }

    private static final Set<String> JUNK_STOPWORDS = Set.of(
            "tóm", "tắt", "năng", "lực", "nhóm", "kỹ", "thuật", "chỉnh", "theo", "thực",
            "quy", "trình", "phát", "triển", "cơ", "sở", "dữ", "liệu", "kiểm", "thử",
            "vòng", "đời", "sdlc", "phần", "mềm", "để", "làm", "rõ", "yêu", "cầu",
            "hạn", "chế", "hiểu", "nhầm", "hỗ", "trợ", "dự", "án", "bàn", "giao",
            "đúng", "phạm", "vi", "chất", "lượng", "tiến", "độ", "tài", "mô", "hình",
            "công", "cụ", "giữ", "đã", "sử", "nền", "tảng", "bản", "đọc", "và",
            "hoặc", "là", "của", "trong", "với", "cho", "được", "từng", "các", "những",
            "này", "kia", "đó", "đây", "rất", "nhiều", "ít", "tổng", "quan", "mục", "tiêu",
            "user", "story", "use", "case", "acceptance", "criteria", "meeting", "minutes",
            "activity", "diagram", "sequence", "requirement", "elicitation", "analysis", "business"
    );

    public boolean isValidSkillName(String name) {
        if (name == null || name.isBlank()) return false;
        String trimmed = name.trim();
        if (trimmed.length() < 2 || trimmed.length() > 65) return false;

        // Bỏ qua các chuỗi chứa ngoặc vuông, ngoặc nhọn, dấu câu kết thúc hoặc ký tự không hợp lệ
        if (trimmed.contains("[") || trimmed.contains("]") || trimmed.contains("—")
                || trimmed.contains(":") || trimmed.contains("?") || trimmed.contains("!")
                || trimmed.endsWith(".") || trimmed.contains("{") || trimmed.contains("}")) {
            return false;
        }

        // Tối đa 10 từ (kỹ năng chuẩn hóa chuyên môn tiếng Việt đa âm tiết)
        String[] words = trimmed.split("\\s+");
        if (words.length > 10) return false;

        String lower = trimmed.toLowerCase();
        if (JUNK_STOPWORDS.contains(lower)) return false;

        // Chặn các cụm từ mô tả văn xuôi hoặc placeholder
        if (lower.contains("kinh nghiệm") || lower.contains("dự án") || lower.contains("theo dõi")
                || lower.contains("chuẩn bị") || lower.contains("hỗ trợ") || lower.contains("kết quả")
                || lower.contains("số lượng") || lower.contains("chức năng") || lower.contains("quy mô")
                || lower.contains("công nghệ") || lower.contains("phúc lợi") || lower.contains("áp lực cao")
                || lower.contains("thành thạo") || lower.contains("khả năng") || lower.contains("tài liệu")
                || lower.contains("công ty") || lower.contains("thành phố") || lower.contains("vị trí")) {
            return false;
        }

        return true;
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
        boolean isPreview = Boolean.TRUE.equals(request.getPreviewOnly());

        // BƯỚC 2: NẾU ĐÂY LÀ YÊU CẦU LƯU (ADMIN ĐÃ CHỌN LỌC CÁC KỸ NĂNG TỪ PREVIEW MODAL)
        if (!isPreview && request.getSelectedSkills() != null && !request.getSelectedSkills().isEmpty()) {
            int newAddedCount = 0;
            List<SkillItemDTO> savedResult = new ArrayList<>();
            String detectedCat = "IT_SOFTWARE";

            for (SkillItemDTO item : request.getSelectedSkills()) {
                if (item.getSkillName() == null || item.getSkillName().isBlank()) continue;
                String norm = normalizeSkillName(item.getSkillName());
                boolean existed = skillRepository.existsBySkillNameIgnoreCase(norm);
                Skill s = findOrCreateNormalizedSkill(item.getSkillName(), item.getCategory(), item.getAliases());
                if (s != null) {
                    if (!existed) {
                        newAddedCount++;
                    }
                    detectedCat = s.getCategory();
                    savedResult.add(SkillItemDTO.builder()
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
                    .generatedSkills(savedResult)
                    .totalNewSkillsAdded(newAddedCount)
                    .build();
        }

        // BƯỚC 1: PREVIEW ONLY (AI SINH DANH SÁCH ĐỀ XUẤT, KIỂM TRA TRÙNG LẶP, CHƯA LƯU VÀO DB)
        List<SkillItemDTO> aiItems = geminiAiService.generateSkillsForIndustryWithAi(indName);
        List<SkillItemDTO> previewList = new ArrayList<>();
        String detectedCat = "IT_SOFTWARE";
        int newCandidatesCount = 0;

        for (SkillItemDTO item : aiItems) {
            if (item.getSkillName() == null || item.getSkillName().isBlank()) continue;
            String norm = normalizeSkillName(item.getSkillName());
            boolean existed = skillRepository.existsBySkillNameIgnoreCase(norm);
            if (!existed) {
                newCandidatesCount++;
            }
            if (item.getCategory() != null && !item.getCategory().isBlank()) {
                detectedCat = item.getCategory();
            }

            // Nếu là preview, KHÔNG gọi findOrCreateNormalizedSkill để tránh ghi vào DB
            if (isPreview) {
                previewList.add(SkillItemDTO.builder()
                        .skillName(item.getSkillName().trim())
                        .category(item.getCategory() != null ? item.getCategory() : detectedCat)
                        .aliases(item.getAliases() != null ? item.getAliases() : "")
                        .isNew(!existed)
                        .build());
            } else {
                // Backward-compatibility: Tự lưu luôn nếu không chỉ định previewOnly
                Skill s = findOrCreateNormalizedSkill(item.getSkillName(), item.getCategory(), item.getAliases());
                if (s != null) {
                    previewList.add(SkillItemDTO.builder()
                            .skillId(s.getSkillId())
                            .skillName(s.getSkillName())
                            .category(s.getCategory())
                            .aliases(s.getAliases())
                            .isNew(!existed)
                            .build());
                }
            }
        }

        return AiIndustrySkillGenerateResponse.builder()
                .industryName(indName)
                .category(detectedCat)
                .generatedSkills(previewList)
                .totalNewSkillsAdded(newCandidatesCount)
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
