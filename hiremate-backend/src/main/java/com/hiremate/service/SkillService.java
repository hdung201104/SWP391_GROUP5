package com.hiremate.service;

import com.hiremate.dto.response.SkillResponse;

import java.util.List;

public interface SkillService {
    List<SkillResponse> getAllSkills(String category, String keyword);
    SkillResponse getSkillById(Long skillId);
    SkillResponse createSkill(String skillName, String category, String aliases);
}
