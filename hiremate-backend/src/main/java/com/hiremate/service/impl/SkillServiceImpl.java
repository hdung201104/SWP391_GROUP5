package com.hiremate.service.impl;

import com.hiremate.dto.request.SkillCreateRequest;
import com.hiremate.dto.response.SkillResponse;
import com.hiremate.entity.Skill;
import com.hiremate.repository.CandidateSkillRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.SkillRepository;
import com.hiremate.service.SkillService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements SkillService {

    private final SkillRepository skillRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final JobSkillRepository jobSkillRepository;

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
                .category(s.getCategory() != null ? s.getCategory() : "Technical")
                .aliases(s.getAliases())
                .build();
    }
}
