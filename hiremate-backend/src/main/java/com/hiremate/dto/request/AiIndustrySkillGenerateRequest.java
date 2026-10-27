package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiIndustrySkillGenerateRequest {

    @NotBlank(message = "Tên ngành nghề không được để trống")
    private String industryName;
}
