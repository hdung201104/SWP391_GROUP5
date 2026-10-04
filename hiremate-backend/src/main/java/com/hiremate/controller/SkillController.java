package com.hiremate.controller;

import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.SkillResponse;
import com.hiremate.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SkillResponse>>> getSkills(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword
    ) {
        List<SkillResponse> skills = skillService.getAllSkills(category, keyword);
        return ResponseEntity.ok(ApiResponse.ok(skills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SkillResponse>> getSkillById(@PathVariable Long id) {
        SkillResponse skill = skillService.getSkillById(id);
        return ResponseEntity.ok(ApiResponse.ok(skill));
    }
}
