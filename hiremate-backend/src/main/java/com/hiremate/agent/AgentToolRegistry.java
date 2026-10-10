package com.hiremate.agent;

import com.hiremate.entity.JobSkill;
import com.hiremate.entity.Skill;
import com.hiremate.repository.CandidateSkillRepository;
import com.hiremate.repository.JobSkillRepository;
import com.hiremate.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry quản lý và thực thi các Tools / Function Calling của AI Agent.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentToolRegistry {

    private final SkillRepository skillRepository;
    private final JobSkillRepository jobSkillRepository;
    private final CandidateSkillRepository candidateSkillRepository;

    private final Map<String, AgentTool> tools = new ConcurrentHashMap<>();

    @PostConstruct
    public void registerDefaultTools() {
        // Tool 1: Tra cứu định nghĩa & từ đồng nghĩa kỹ năng từ database chuẩn 3NF
        registerTool(new AgentTool() {
            @Override
            public String getName() {
                return "lookup_skill";
            }

            @Override
            public String getDescription() {
                return "Tra cứu kỹ năng, danh mục và từ đồng nghĩa trong từ điển kỹ năng CSDL";
            }

            @Override
            public Map<String, Object> execute(Map<String, Object> params) {
                if (params == null) return Map.of("found", false);
                Object rawSkill = params.get("skillName") != null ? params.get("skillName")
                        : (params.get("skill_name") != null ? params.get("skill_name") : params.get("name"));
                if (rawSkill == null) return Map.of("found", false);
                String skillName = rawSkill.toString().trim();
                if (skillName.isBlank()) return Map.of("found", false);
                Optional<Skill> sOpt = skillRepository.findBySkillNameIgnoreCase(skillName);
                if (sOpt.isPresent()) {
                    Skill s = sOpt.get();
                    return Map.of(
                            "found", true,
                            "skillId", s.getSkillId(),
                            "skillName", s.getSkillName(),
                            "category", s.getCategory() != null ? s.getCategory() : "General",
                            "aliases", s.getAliases() != null ? s.getAliases() : ""
                    );
                }
                return Map.of("found", false, "query", skillName);
            }
        });

        // Tool 2: Lấy danh sách kỹ năng bắt buộc và ưu tiên của Job kèm trọng số
        registerTool(new AgentTool() {
            @Override
            public String getName() {
                return "fetch_job_skills";
            }

            @Override
            public String getDescription() {
                return "Truy xuất danh sách kỹ năng Mandatory (70%) và Preferred (30%) của tin tuyển dụng";
            }

            @Override
            public Map<String, Object> execute(Map<String, Object> params) {
                if (params == null) return Map.of("error", "jobId is required");
                Object rawJobId = params.get("jobId") != null ? params.get("jobId")
                        : (params.get("job_id") != null ? params.get("job_id") : params.get("id"));
                if (rawJobId == null) {
                    return Map.of("error", "jobId is required");
                }
                Long jobId;
                try {
                    jobId = Long.valueOf(rawJobId.toString());
                } catch (Exception e) {
                    return Map.of("error", "Invalid jobId format");
                }
                List<JobSkill> jobSkills = jobSkillRepository.findByJobId(jobId);
                List<Map<String, Object>> list = new ArrayList<>();
                for (JobSkill js : jobSkills) {
                    Optional<Skill> sOpt = skillRepository.findById(js.getSkillId());
                    list.add(Map.of(
                            "skillName", sOpt.map(Skill::getSkillName).orElse("Skill #" + js.getSkillId()),
                            "importance", js.getImportance().name(),
                            "minYears", js.getMinYearsExperience() != null ? js.getMinYearsExperience() : 0
                    ));
                }
                return Map.of("jobId", jobId, "skillsCount", list.size(), "skills", list);
            }
        });

        // Tool 3: Tra cứu hồ sơ kỹ năng thực tế của ứng viên
        registerTool(new AgentTool() {
            @Override
            public String getName() {
                return "inspect_candidate_skills";
            }

            @Override
            public String getDescription() {
                return "Lấy danh sách các kỹ năng đã được xác thực của ứng viên";
            }

            @Override
            public Map<String, Object> execute(Map<String, Object> params) {
                if (params == null) return Map.of("error", "candidateId is required");
                Object rawCandId = params.get("candidateId") != null ? params.get("candidateId")
                        : (params.get("candidate_id") != null ? params.get("candidate_id")
                        : (params.get("userId") != null ? params.get("userId") : params.get("user_id")));
                if (rawCandId == null) {
                    return Map.of("error", "candidateId is required");
                }
                Long candidateId;
                try {
                    candidateId = Long.valueOf(rawCandId.toString());
                } catch (Exception e) {
                    return Map.of("error", "Invalid candidateId format");
                }
                var candSkills = candidateSkillRepository.findByProfileId(candidateId);
                List<Map<String, Object>> result = new ArrayList<>();
                for (var cs : candSkills) {
                    Optional<Skill> s = skillRepository.findById(cs.getSkillId());
                    result.add(Map.of(
                            "skillName", s.map(Skill::getSkillName).orElse("Unknown"),
                            "aiDetected", Boolean.TRUE.equals(cs.getAiDetected()),
                            "proficiency", cs.getProficiencyLevel() != null ? cs.getProficiencyLevel().name() : "INTERMEDIATE"
                    ));
                }
                return Map.of("candidateId", candidateId, "skills", result);
            }
        });

        log.info(">> [AgentToolRegistry] Đã khởi tạo {} Agent Tools cho AI Agent", tools.size());
    }

    public void registerTool(AgentTool tool) {
        tools.put(tool.getName(), tool);
    }

    public AgentTool getTool(String name) {
        return tools.get(name);
    }

    public Map<String, Object> executeTool(String name, Map<String, Object> params) {
        AgentTool tool = tools.get(name);
        if (tool == null) {
            log.warn(">> [AgentToolRegistry] Tool '{}' không tồn tại", name);
            return Map.of("error", "Tool not found: " + name);
        }
        log.info(">> [AgentToolRegistry] AI Agent tự động gọi Tool: '{}' với params: {}", name, params);
        return tool.execute(params);
    }

    public Collection<AgentTool> getAllTools() {
        return tools.values();
    }

    /**
     * Xuất danh sách khai báo Schema Function Declarations theo chuẩn Native Gemini Function Calling API.
     */
    public List<Map<String, Object>> getGeminiFunctionDeclarations() {
        return List.of(
                Map.of(
                        "name", "lookup_skill",
                        "description", "Tra cứu định nghĩa, danh mục phân loại và từ đồng nghĩa của kỹ năng trong từ điển CSDL PostgreSQL 3NF",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "skillName", Map.of("type", "string", "description", "Tên kỹ năng kỹ thuật cần tra cứu, ví dụ: Java, Docker, Redis, Kafka")
                                ),
                                "required", List.of("skillName")
                        )
                ),
                Map.of(
                        "name", "fetch_job_skills",
                        "description", "Truy xuất danh sách kỹ năng bắt buộc (Mandatory 70%) và ưu tiên (Preferred 30%) của tin tuyển dụng",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "jobId", Map.of("type", "integer", "description", "ID công việc cần lấy yêu cầu kỹ năng")
                                ),
                                "required", List.of("jobId")
                        )
                ),
                Map.of(
                        "name", "inspect_candidate_skills",
                        "description", "Lấy danh sách các kỹ năng thực tế đã được AI bóc tách hoặc ứng viên khai báo trong hồ sơ",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "candidateId", Map.of("type", "integer", "description", "ID hồ sơ ứng viên")
                                ),
                                "required", List.of("candidateId")
                        )
                )
        );
    }
}
