package com.hiremate.dto.request;

import com.hiremate.enums.SkillProficiency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddCandidateSkillRequest {

    /**
     * ID của kỹ năng từ bảng skills (hệ thống).
     * Có thể truyền skillId HOẶC skillName.
     */
    private Long skillId;

    /**
     * Tên kỹ năng (ví dụ: "Java", "React", "Docker",...).
     */
    private String skillName;

    /**
     * Mức độ thành thạo: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT.
     * Mặc định là INTERMEDIATE nếu không truyền.
     */
    @Builder.Default
    private SkillProficiency proficiencyLevel = SkillProficiency.INTERMEDIATE;

    /**
     * Số năm kinh nghiệm với kỹ năng này.
     */
    @Builder.Default
    private Float yearsOfExperience = 1.0f;
}
