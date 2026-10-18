package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillCreateRequest {

    @NotBlank(message = "Tên kỹ năng không được để trống")
    private String skillName;

    private String category;

    private String aliases;
}
