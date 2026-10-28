package com.hiremate.controller;

import com.hiremate.dto.request.SkillCreateRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.SkillResponse;
import com.hiremate.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping
    public ResponseEntity<ApiResponse<SkillResponse>> createSkill(@RequestBody @Valid SkillCreateRequest request) {
        SkillResponse created = skillService.createSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Thêm kỹ năng mới thành công", created));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<com.hiremate.dto.response.SkillCategoryCountDTO>>> getCategoriesSummary() {
        return ResponseEntity.ok(ApiResponse.ok(skillService.getSkillCategoriesSummary()));
    }

    @PostMapping("/ai-extract-jd")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.AiJdSkillExtractResponse>> extractSkillsFromJd(
            @RequestBody @Valid com.hiremate.dto.request.AiJdSkillExtractRequest request
    ) {
        com.hiremate.dto.response.AiJdSkillExtractResponse response = skillService.extractSkillsFromJd(request);
        return ResponseEntity.ok(ApiResponse.ok("Trích xuất và chuẩn hóa kỹ năng từ JD thành công", response));
    }

    @PostMapping("/ai-generate-industry")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.AiIndustrySkillGenerateResponse>> generateSkillsForIndustry(
            @RequestBody @Valid com.hiremate.dto.request.AiIndustrySkillGenerateRequest request
    ) {
        com.hiremate.dto.response.AiIndustrySkillGenerateResponse response = skillService.generateSkillsForIndustry(request);
        return ResponseEntity.ok(ApiResponse.ok("Khởi tạo bộ kỹ năng theo ngành thành công", response));
    }
}
