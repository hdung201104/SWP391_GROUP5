package com.hiremate.repository;

import com.hiremate.entity.PracticeProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeProgressLogRepository extends JpaRepository<PracticeProgressLog, Long> {
    List<PracticeProgressLog> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
}
