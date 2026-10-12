package com.hiremate.repository;

import com.hiremate.entity.Application;
import com.hiremate.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Application entity.
 * THAY ĐỔI KIẾN TRÚC V2: candidate_id và job_id đều là @ManyToOne relationships,
 * nên query phải dùng path traversal: candidate.candidateId, job.jobId.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /** Kiểm tra ứng viên đã apply job này chưa (Single Application Rule) */
    Optional<Application> findByJob_JobIdAndCandidate_CandidateId(Long jobId, Long candidateId);

    /** Lấy tất cả đơn ứng tuyển của một ứng viên */
    List<Application> findByCandidate_CandidateId(Long candidateId);

    /** Lấy tất cả đơn ứng tuyển của một job */
    List<Application> findByJob_JobId(Long jobId);

    /** Lọc đơn ứng tuyển theo job và status */
    List<Application> findByJob_JobIdAndStatus(Long jobId, ApplicationStatus status);

    /** Đếm tổng số lượng ứng viên đã nộp đơn vào job này */
    long countByJob_JobId(Long jobId);
}
