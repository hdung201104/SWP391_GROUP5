package com.hiremate.entity;

import com.hiremate.enums.SkillImportance;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "job_skill_id")
    private Long jobSkillId;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Enumerated(EnumType.STRING)
    @Column(name = "importance", nullable = false, length = 20)
    private SkillImportance importance;

    @Column(name = "min_years_experience")
    private Integer minYearsExperience;

    @Column(name = "weight")
    @Builder.Default
    private Float weight = 1.0f;
}
