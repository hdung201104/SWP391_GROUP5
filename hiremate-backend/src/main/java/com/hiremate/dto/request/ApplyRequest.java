package com.hiremate.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyRequest {
    @NotNull(message = "Job ID is required")
    private Long jobId;

    private Long cvId;

    private String coverLetter;
}
