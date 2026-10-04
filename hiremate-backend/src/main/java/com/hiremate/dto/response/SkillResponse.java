package com.hiremate.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillResponse {
    private Long skillId;
    private String skillName;
    private String category;
    private String aliases;
}
