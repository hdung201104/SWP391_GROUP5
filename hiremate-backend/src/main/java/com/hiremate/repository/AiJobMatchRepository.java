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
}
