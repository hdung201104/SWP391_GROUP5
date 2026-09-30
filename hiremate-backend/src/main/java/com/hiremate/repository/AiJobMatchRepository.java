package com.hiremate.repository;

import com.hiremate.entity.AiJobMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiJobMatchRepository extends JpaRepository<AiJobMatch, Long> {
    Optional<AiJobMatch> findByCandidateIdAndJobId(Long candidateId, Long jobId);
    List<AiJobMatch> findByJobIdOrderByMatchingScoreDesc(Long jobId);
    List<AiJobMatch> findByCandidateIdOrderByMatchingScoreDesc(Long candidateId);
}
