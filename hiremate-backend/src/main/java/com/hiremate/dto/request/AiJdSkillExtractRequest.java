package com.hiremate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiJdSkillExtractRequest {

    @NotBlank(message = "Tiêu đề công việc không được để trống")
    private String title;

    private String description;

    private String industry;
}
