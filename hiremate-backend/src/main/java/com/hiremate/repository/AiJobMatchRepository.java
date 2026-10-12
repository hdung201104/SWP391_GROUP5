package com.hiremate.repository;

import com.hiremate.entity.AiJobMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho AiJobMatch entity.
 * THAY ĐỔI KIẾN TRÚC V2: candidate_id và job_id là @ManyToOne relationships,
 * nên query phải dùng path traversal: candidate.candidateId, job.jobId.
 */
@Repository
public interface AiJobMatchRepository extends JpaRepository<AiJobMatch, Long> {

    /** Tìm match cụ thể theo candidate và job (dùng để check cache) */
    Optional<AiJobMatch> findByCandidate_CandidateIdAndJob_JobId(Long candidateId, Long jobId);

    /** Lấy tất cả matches của một job, sắp xếp điểm cao nhất trước */
    List<AiJobMatch> findByJob_JobIdOrderByMatchingScoreDesc(Long jobId);

    /** Lấy tất cả matches của một candidate, sắp xếp điểm cao nhất trước */
    List<AiJobMatch> findByCandidate_CandidateIdOrderByMatchingScoreDesc(Long candidateId);

    /** Lấy danh sách việc làm gợi ý cho candidate: Job PUBLISHED, chưa hết hạn, matchingScore >= minScore */
    @org.springframework.data.jpa.repository.Query("SELECT m FROM AiJobMatch m " +
            "JOIN m.job j " +
            "WHERE m.candidate.candidateId = :candidateId " +
            "AND m.matchingScore >= :minScore " +
            "AND j.status = com.hiremate.enums.JobStatus.PUBLISHED " +
            "AND (j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) " +
            "ORDER BY m.matchingScore DESC")
    List<AiJobMatch> findRecommendations(
            @org.springframework.data.repository.query.Param("candidateId") Long candidateId,
            @org.springframework.data.repository.query.Param("minScore") Float minScore
    );
}
