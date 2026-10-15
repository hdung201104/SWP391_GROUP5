package com.hiremate.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobBriefForMatching {
    private Long jobId;
    private String title;
    private String location;
    private String employmentType;
    private List<String> mandatorySkills;
    private List<String> preferredSkills;
    private String requirements;
}
