package com.hiremate.repository;

import com.hiremate.entity.InterviewDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewDetailRepository extends JpaRepository<InterviewDetail, Long> {
    List<InterviewDetail> findBySessionIdOrderByQuestionNumberAsc(Long sessionId);
}
