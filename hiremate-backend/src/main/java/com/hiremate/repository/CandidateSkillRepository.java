package com.hiremate.repository;

import com.hiremate.entity.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, Long> {
    List<CandidateSkill> findByProfileId(Long profileId);
    java.util.Optional<CandidateSkill> findByProfileIdAndSkillId(Long profileId, Long skillId);
    void deleteByProfileIdAndSkillId(Long profileId, Long skillId);
}
