package com.hiremate.service;

import com.hiremate.dto.request.AiIndustrySkillGenerateRequest;
import com.hiremate.dto.request.AiJdSkillExtractRequest;
import com.hiremate.dto.request.SkillCreateRequest;
import com.hiremate.dto.response.AiIndustrySkillGenerateResponse;
import com.hiremate.dto.response.AiJdSkillExtractResponse;
import com.hiremate.dto.response.SkillCategoryCountDTO;
import com.hiremate.dto.response.SkillResponse;
import com.hiremate.entity.Skill;

import java.util.List;

public interface SkillService {
    List<SkillResponse> getAllSkills(String category, String keyword);
    SkillResponse getSkillById(Long skillId);
    SkillResponse createSkill(String skillName, String category, String aliases);
    SkillResponse createSkill(SkillCreateRequest request);
    void deleteSkill(Long skillId);

    // AI Self-Evolving Skill Taxonomy methods
    AiJdSkillExtractResponse extractSkillsFromJd(AiJdSkillExtractRequest request);
    AiIndustrySkillGenerateResponse generateSkillsForIndustry(AiIndustrySkillGenerateRequest request);
    Skill findOrCreateNormalizedSkill(String rawName, String suggestedCategory, String aliases);
    List<SkillCategoryCountDTO> getSkillCategoriesSummary();
}
