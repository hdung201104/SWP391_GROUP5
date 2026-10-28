package com.hiremate.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillItemDTO {
    private Long skillId;
    private String skillName;
    private String category;
    private String aliases;
    private boolean isNew;
}
