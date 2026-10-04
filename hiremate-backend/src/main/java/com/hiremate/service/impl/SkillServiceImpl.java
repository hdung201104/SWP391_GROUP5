package com.hiremate.service.impl;

import com.hiremate.dto.response.SkillResponse;
import com.hiremate.entity.Skill;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements SkillService {

    private final SkillRepository skillRepository;

    @PostConstruct
    public void seedDefaultSkills() {
        if (skillRepository.count() == 0) {
            log.info(">> [SkillService] Seeding initial standard tech skills dictionary...");
            List<Skill> initialSkills = Arrays.asList(
                    // Backend
                    Skill.builder().skillName("Java").category("BACKEND").aliases("Java Core, JDK, JVM").build(),
                    Skill.builder().skillName("Spring Boot").category("BACKEND").aliases("Spring, Spring Data, Spring Security").build(),
                    Skill.builder().skillName("Node.js").category("BACKEND").aliases("NodeJS, ExpressJS").build(),
                    Skill.builder().skillName("Python").category("BACKEND").aliases("Python 3, Django, FastAPI").build(),
                    Skill.builder().skillName("C# / .NET").category("BACKEND").aliases(".NET Core, ASP.NET").build(),
                    Skill.builder().skillName("Go (Golang)").category("BACKEND").aliases("Go, Golang").build(),
                    
                    // Frontend
                    Skill.builder().skillName("React.js").category("FRONTEND").aliases("React, ReactJS, Next.js").build(),
                    Skill.builder().skillName("TypeScript").category("FRONTEND").aliases("TS").build(),
                    Skill.builder().skillName("JavaScript").category("FRONTEND").aliases("JS, ES6").build(),
                    Skill.builder().skillName("Vue.js").category("FRONTEND").aliases("Vue, VueJS").build(),
                    Skill.builder().skillName("HTML5 & CSS3").category("FRONTEND").aliases("HTML, CSS, Tailwind CSS").build(),
                    
                    // Database & Cloud
                    Skill.builder().skillName("PostgreSQL").category("DATABASE").aliases("Postgres, PSQL").build(),
                    Skill.builder().skillName("MySQL").category("DATABASE").aliases("MySQL Server").build(),
                    Skill.builder().skillName("MongoDB").category("DATABASE").aliases("Mongo, NoSQL").build(),
                    Skill.builder().skillName("Redis").category("DATABASE").aliases("Redis Cache, In-memory").build(),
                    Skill.builder().skillName("Docker").category("DEVOPS").aliases("Container, Dockerfile").build(),
                    Skill.builder().skillName("Kubernetes").category("DEVOPS").aliases("K8s").build(),
                    Skill.builder().skillName("AWS").category("CLOUD").aliases("Amazon Web Services, EC2, S3").build(),
                    Skill.builder().skillName("Kafka").category("MESSAGE_QUEUE").aliases("Apache Kafka, Event Streaming").build(),
                    
                    // AI & Data
                    Skill.builder().skillName("Generative AI").category("AI").aliases("LLM, OpenAI, Gemini API, Prompt Engineering").build(),
                    Skill.builder().skillName("Machine Learning").category("AI").aliases("ML, PyTorch, TensorFlow").build()
            );
            skillRepository.saveAll(initialSkills);
            log.info(">> [SkillService] Seeded {} standard tech skills successfully.", initialSkills.size());
        }
    }

    @Override
    public List<SkillResponse> getAllSkills(String category, String keyword) {
        List<Skill> skills = skillRepository.findAll();
        List<SkillResponse> result = new ArrayList<>();

        for (Skill s : skills) {
            if (category != null && !category.isBlank() && !s.getCategory().equalsIgnoreCase(category)) {
                continue;
            }
            if (keyword != null && !keyword.isBlank()) {
                String kw = keyword.toLowerCase();
                boolean matchName = s.getSkillName().toLowerCase().contains(kw);
                boolean matchAlias = s.getAliases() != null && s.getAliases().toLowerCase().contains(kw);
                if (!matchName && !matchAlias) {
                    continue;
                }
            }
            result.add(mapToResponse(s));
        }

        return result;
    }

    @Override
    public SkillResponse getSkillById(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new IllegalArgumentException("Skill not found with ID: " + skillId));
        return mapToResponse(skill);
    }

    @Override
    @Transactional
    public SkillResponse createSkill(String skillName, String category, String aliases) {
        if (skillRepository.findBySkillName(skillName).isPresent()) {
            throw new IllegalArgumentException("Skill with name '" + skillName + "' already exists");
        }
        Skill skill = Skill.builder()
                .skillName(skillName.trim())
                .category(category != null ? category.trim().toUpperCase() : "GENERAL")
                .aliases(aliases)
                .build();
        Skill saved = skillRepository.save(skill);
        return mapToResponse(saved);
    }

    private SkillResponse mapToResponse(Skill s) {
        return SkillResponse.builder()
                .skillId(s.getSkillId())
                .skillName(s.getSkillName())
                .category(s.getCategory())
                .aliases(s.getAliases())
                .build();
    }
}
