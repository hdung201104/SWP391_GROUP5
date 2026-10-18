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

    /** Xóa tất cả matches liên quan đến một job */
    void deleteByJob_JobId(Long jobId);

    /** Xóa match giữa một candidate cụ thể và job cụ thể khi tính lại */
    void deleteByCandidate_CandidateIdAndJob_JobId(Long candidateId, Long jobId);

    /** Lấy danh sách việc làm gợi ý cho candidate: Job PUBLISHED, chưa hết hạn, matchingScore >= minScore */
    @org.springframework.data.jpa.repository.Query("SELECT m FROM AiJobMatch m " +
            "JOIN FETCH m.job j " +
            "LEFT JOIN FETCH j.company " +
            "LEFT JOIN FETCH j.recruiter r " +
            "LEFT JOIN FETCH r.user " +
            "LEFT JOIN FETCH m.cv " +
            "WHERE m.candidate.candidateId = :candidateId " +
            "AND m.matchingScore >= :minScore " +
            "AND j.status = com.hiremate.enums.JobStatus.PUBLISHED " +
            "AND (j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) " +
            "ORDER BY m.matchingScore DESC")
    List<AiJobMatch> findRecommendations(
            @org.springframework.data.repository.query.Param("candidateId") Long candidateId,
            @org.springframework.data.repository.query.Param("minScore") Float minScore
    );

    /** Xóa các matches của candidate khi re-match */
    void deleteByCandidate_CandidateId(Long candidateId);

    /** Xóa tham chiếu cv khi CV bị xóa để tránh vi phạm khóa ngoại */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE AiJobMatch m SET m.cv = null WHERE m.cv.cvId = :cvId")
    void clearCvReference(@org.springframework.data.repository.query.Param("cvId") Long cvId);
}
