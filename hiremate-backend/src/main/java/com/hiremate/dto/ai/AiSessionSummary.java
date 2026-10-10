package com.hiremate.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSessionSummary {
    private String overallFeedback;
    private String weaknessSummary;
    private List<String> recommendedTasks;
}
