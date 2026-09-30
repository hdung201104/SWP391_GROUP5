package com.hiremate.repository;

import com.hiremate.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository cho InterviewSession.
 * THAY ĐỔI: candidate_id nay là FK -> candidates.candidate_id (Subclass),
 * truy vấn qua đối tượng candidate thay vì raw candidateId.
 */
@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    /** Lấy tất cả phiên phỏng vấn của một candidate, mới nhất trước */
    List<InterviewSession> findByCandidate_CandidateIdOrderByStartedAtDesc(Long candidateId);

    /** Lấy các phiên phỏng vấn MOCK gốc (không phải retry) */
    @Query("SELECT s FROM InterviewSession s WHERE s.candidate.candidateId = :candidateId AND s.parentSessionId IS NULL ORDER BY s.startedAt DESC")
    List<InterviewSession> findOriginalSessionsByCandidate(@Param("candidateId") Long candidateId);

    /** Lấy các phiên retry của một session gốc */
    List<InterviewSession> findByParentSessionIdOrderByStartedAtAsc(Long parentSessionId);

    /** Lấy tất cả phiên phỏng vấn gắn với một job cụ thể */
    List<InterviewSession> findByJob_JobId(Long jobId);
}
