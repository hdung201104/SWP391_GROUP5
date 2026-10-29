package com.hiremate.repository;

import com.hiremate.entity.Application;
import com.hiremate.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Application entity.
 * Sử dụng LEFT JOIN FETCH tối ưu hóa 100% N+1 queries.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "job.company", "job.recruiter", "job.recruiter.user", "candidate", "candidate.user", "cv"})
    Optional<Application> findById(Long applicationId);

    /** Kiểm tra ứng viên đã apply job này chưa (Single Application Rule) */
    Optional<Application> findByJob_JobIdAndCandidate_CandidateId(Long jobId, Long candidateId);

    /** Lấy tất cả đơn ứng tuyển của một ứng viên */
    @Query("SELECT a FROM Application a " +
           "LEFT JOIN FETCH a.job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "LEFT JOIN FETCH a.candidate c " +
           "LEFT JOIN FETCH c.user " +
           "LEFT JOIN FETCH a.cv " +
           "WHERE a.candidate.candidateId = :candidateId ORDER BY a.createdAt DESC")
    List<Application> findByCandidate_CandidateId(@Param("candidateId") Long candidateId);

    /** Lấy tất cả đơn ứng tuyển của một job */
    @Query("SELECT a FROM Application a " +
           "LEFT JOIN FETCH a.job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "LEFT JOIN FETCH a.candidate c " +
           "LEFT JOIN FETCH c.user " +
           "LEFT JOIN FETCH a.cv " +
           "WHERE a.job.jobId = :jobId ORDER BY a.createdAt DESC")
    List<Application> findByJob_JobId(@Param("jobId") Long jobId);

    /** Lấy tất cả đơn ứng tuyển của tất cả các bài đăng của nhà tuyển dụng (Dành cho Dashboard báo cáo thống kê, 1 câu query duy nhất) */
    @Query("SELECT a FROM Application a " +
           "LEFT JOIN FETCH a.job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "LEFT JOIN FETCH a.candidate c " +
           "LEFT JOIN FETCH c.user " +
           "LEFT JOIN FETCH a.cv " +
           "WHERE j.recruiter.recruiterId = :recruiterId ORDER BY a.createdAt DESC")
    List<Application> findByRecruiterId(@Param("recruiterId") Long recruiterId);

    /** Lọc đơn ứng tuyển theo job và status */
    @Query("SELECT a FROM Application a " +
           "LEFT JOIN FETCH a.job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "LEFT JOIN FETCH a.candidate c " +
           "LEFT JOIN FETCH c.user " +
           "LEFT JOIN FETCH a.cv " +
           "WHERE a.job.jobId = :jobId AND a.status = :status ORDER BY a.createdAt DESC")
    List<Application> findByJob_JobIdAndStatus(@Param("jobId") Long jobId, @Param("status") ApplicationStatus status);

    /** Đếm tổng số lượng ứng viên đã nộp đơn vào job này */
    long countByJob_JobId(Long jobId);

    /** Đếm số lượng ứng viên theo danh sách jobs (Batch count để loại bỏ N+1 queries) */
    @Query("SELECT a.job.jobId, COUNT(a.applicationId) FROM Application a WHERE a.job.jobId IN :jobIds GROUP BY a.job.jobId")
    List<Object[]> countApplicationsByJobIds(@Param("jobIds") java.util.Collection<Long> jobIds);

    /** Xóa tham chiếu cv khi CV bị xóa để tránh vi phạm khóa ngoại */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Application a SET a.cv = null WHERE a.cv.cvId = :cvId")
    void clearCvReference(@Param("cvId") Long cvId);

    /** Xóa toàn bộ đơn ứng tuyển của một job */
    void deleteByJob_JobId(Long jobId);
}
