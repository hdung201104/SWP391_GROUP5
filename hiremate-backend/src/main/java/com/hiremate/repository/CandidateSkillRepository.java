package com.hiremate.repository;

import com.hiremate.entity.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, Long> {
    List<CandidateSkill> findByProfileId(Long profileId);
    Optional<CandidateSkill> findByProfileIdAndSkillId(Long profileId, Long skillId);
    void deleteByProfileIdAndSkillId(Long profileId, Long skillId);
    void deleteBySkillId(Long skillId);
    boolean existsBySkillId(Long skillId);
}
