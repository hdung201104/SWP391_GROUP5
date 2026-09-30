package com.hiremate.repository;

import com.hiremate.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho Candidate (Subclass của users).
 * candidate_id = user_id (Shared PK pattern).
 */
@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    /** Tìm Candidate theo user_id (vì candidate_id = user_id) */
    Optional<Candidate> findByCandidateId(Long candidateId);

    /** Kiểm tra ứng viên đã có profile chưa */
    boolean existsByCandidateId(Long candidateId);
}
