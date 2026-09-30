package com.hiremate.entity;

import com.hiremate.enums.SkillProficiency;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidate_skills")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "candidate_skill_id")
    private Long candidateSkillId;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Enumerated(EnumType.STRING)
    @Column(name = "proficiency_level", length = 20)
    private SkillProficiency proficiencyLevel;

    @Column(name = "years_of_experience")
    private Float yearsOfExperience;

    @Column(name = "ai_detected")
    @Builder.Default
    private Boolean aiDetected = false;
}
