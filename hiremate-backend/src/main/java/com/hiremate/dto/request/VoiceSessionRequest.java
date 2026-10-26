package com.hiremate.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceSessionRequest {
    private String targetPosition;
    private String level;
    private String voice; // e.g., alloy, shimmer, echo, verse, ash, coral, sage
    private String customNotes;
    private Long jobId;
}
