package com.hiremate.repository;

import com.hiremate.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByCandidateIdOrderByCreatedAtDesc(Long candidateId);
}
