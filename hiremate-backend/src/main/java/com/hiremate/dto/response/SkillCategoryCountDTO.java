package com.hiremate.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillCategoryCountDTO {
    private String categoryKey;
    private String categoryDisplayName;
    private long skillCount;
    private String iconName;
}
