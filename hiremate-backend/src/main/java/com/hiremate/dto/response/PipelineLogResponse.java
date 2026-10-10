package com.hiremate.dto.response;

import com.hiremate.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineLogResponse {
    private Long logId;
    private Long applicationId;
    private ApplicationStatus fromStage;
    private ApplicationStatus toStage;
    private String stageLabel;
    private String notes;
    private Long changedBy;
    private String changedByName;
    private LocalDateTime createdAt;
}
