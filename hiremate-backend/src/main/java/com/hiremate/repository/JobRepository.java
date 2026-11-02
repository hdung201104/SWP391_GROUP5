package com.hiremate.repository;

import com.hiremate.entity.Job;
import com.hiremate.enums.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository cho Job entity.
 * THAY ĐỔI KIẾN TRÚC V2: recruiter_id là @ManyToOne -> Recruiter (subclass),
 * nên query phải dùng path traversal: recruiter.recruiterId thay vì recruiterId thô.
 */
@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    /** Lấy tất cả jobs của một recruiter (qua Recruiter subclass FK) */
    @Query("SELECT j FROM Job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "WHERE j.recruiter.recruiterId = :recruiterId ORDER BY j.createdAt DESC")
    List<Job> findByRecruiter_RecruiterId(@Param("recruiterId") Long recruiterId);

    /** Lấy jobs theo status (chỉ lấy tin đã được duyệt APPROVED và chưa hết hạn) */
    @Query("SELECT j FROM Job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "WHERE j.status = :status AND " +
           "(j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) AND " +
           "(j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) " +
           "ORDER BY j.createdAt DESC")
    List<Job> findByStatus(@Param("status") JobStatus status);

    /** Lấy jobs theo company */
    List<Job> findByCompany_CompanyId(Long companyId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    org.springframework.data.domain.Page<Job> findByCompany_CompanyId(Long companyId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    org.springframework.data.domain.Page<Job> findByRecruiter_RecruiterId(Long recruiterId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT j FROM Job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "WHERE j.company.companyId = :companyId ORDER BY j.createdAt DESC")
    List<Job> findByCompany_CompanyIdOrderByCreatedAtDesc(@Param("companyId") Long companyId);

    /** Lấy published & approved jobs theo company (chưa hết hạn) */
    @Query("SELECT j FROM Job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "WHERE j.company.companyId = :companyId AND j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) AND " +
           "(j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) " +
           "ORDER BY j.createdAt DESC")
    List<Job> findPublishedByCompanyId(@Param("companyId") Long companyId);

    /**
     * Tìm kiếm jobs PUBLISHED theo keyword và location (chưa hết hạn).
     * Sử dụng JPQL path traversal qua Recruiter subclass và JOIN FETCH tối ưu.
     */
    @Query("SELECT j FROM Job j " +
           "LEFT JOIN FETCH j.company " +
           "LEFT JOIN FETCH j.recruiter r " +
           "LEFT JOIN FETCH r.user " +
           "WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) AND " +
           "(j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) AND " +
           "(CAST(:keyword AS string) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR (j.requirements IS NOT NULL AND LOWER(j.requirements) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) " +
           "   OR (j.company IS NOT NULL AND LOWER(j.company.companyName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))) AND " +
           "(CAST(:location AS string) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))) " +
           "ORDER BY j.createdAt DESC")
    List<Job> searchJobs(@Param("keyword") String keyword, @Param("location") String location);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    java.util.Optional<Job> findById(Long jobId);

    /** Tìm kiếm phân trang (Pageable) cho published jobs (chỉ lấy tin đã được duyệt APPROVED) */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    @Query("SELECT j FROM Job j WHERE j.status = :status AND " +
           "(j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED)")
    org.springframework.data.domain.Page<Job> findByStatus(@Param("status") JobStatus status, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    @Query("SELECT j FROM Job j WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) AND " +
           "(CAST(:keyword AS string) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR (j.requirements IS NOT NULL AND LOWER(j.requirements) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) " +
           "   OR (j.company IS NOT NULL AND LOWER(j.company.companyName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))) AND " +
           "(CAST(:location AS string) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%')))")
    org.springframework.data.domain.Page<Job> searchJobsPaged(@Param("keyword") String keyword, @Param("location") String location, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    @Query("SELECT j FROM Job j WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) AND " +
           "(j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) AND " +
           "(CAST(:keyword AS string) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR (j.requirements IS NOT NULL AND LOWER(j.requirements) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) " +
           "   OR (j.company IS NOT NULL AND LOWER(j.company.companyName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))) AND " +
           "(CAST(:location AS string) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))) AND " +
           "(:employmentType IS NULL OR j.employmentType = :employmentType) AND " +
           "(:minSalary IS NULL OR (CASE WHEN UPPER(COALESCE(j.salaryCurrency, 'VND')) = 'USD' THEN j.salaryMax * 25400 ELSE j.salaryMax END) >= :minSalary) AND " +
           "(:maxSalary IS NULL OR (CASE WHEN UPPER(COALESCE(j.salaryCurrency, 'VND')) = 'USD' THEN j.salaryMin * 25400 ELSE j.salaryMin END) <= :maxSalary)")
    org.springframework.data.domain.Page<Job> searchJobsAdvancedPaged(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("employmentType") com.hiremate.enums.EmploymentType employmentType,
            @Param("minSalary") java.math.BigDecimal minSalary,
            @Param("maxSalary") java.math.BigDecimal maxSalary,
            org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    List<Job> findAllByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    List<Job> findByApprovalStatusOrderByCreatedAtDesc(com.hiremate.enums.JobApprovalStatus approvalStatus);

    long countByApprovalStatus(com.hiremate.enums.JobApprovalStatus approvalStatus);

    /**
     * BƯỚC 1: Lọc thô bằng SQL Database (Pre-filtering)
     * Tìm các công việc PUBLISHED & APPROVED, cùng ngành nghề hoặc có ít nhất 1 kỹ năng trùng với ứng viên.
     */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    @Query("SELECT DISTINCT j FROM Job j " +
           "LEFT JOIN JobSkill js ON js.jobId = j.jobId " +
           "WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED " +
           "AND (j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) " +
           "AND (j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) " +
           "AND (" +
           "     (:hasSkills = true AND js.skillId IN :skillIds) " +
           "  OR (:hasKeyword = true AND (" +
           "       LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "       OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     ))" +
           ") " +
           "ORDER BY j.createdAt DESC")
    List<Job> findCandidatePreFilteredJobs(
            @Param("skillIds") List<Long> skillIds,
            @Param("hasSkills") boolean hasSkills,
            @Param("keyword") String keyword,
            @Param("hasKeyword") boolean hasKeyword,
            org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"company", "recruiter", "recruiter.user"})
    @Query("SELECT j FROM Job j " +
           "WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED " +
           "AND (j.approvalStatus IS NULL OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.APPROVED) " +
           "AND (j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) " +
           "ORDER BY j.createdAt DESC")
    List<Job> findRecentPublishedJobs(org.springframework.data.domain.Pageable pageable);

    /** Tìm các tin đang PUBLISHED nhưng đã quá hạn deadline để tự động đóng vào kho lưu trữ */
    @Query("SELECT j FROM Job j WHERE j.status = :status AND j.deadlineDate IS NOT NULL AND j.deadlineDate < :currentDate")
    List<Job> findExpiredActiveJobs(@Param("currentDate") java.time.LocalDate currentDate, @Param("status") JobStatus status);

    /** Đếm số tin tuyển dụng đang hoạt động của một nhà tuyển dụng để kiểm tra hạn ngạch gói (không tính tin đã đóng, bản nháp, hoặc bị từ chối) */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.recruiter.recruiterId = :recruiterId " +
           "AND j.status = com.hiremate.enums.JobStatus.PUBLISHED " +
           "AND (j.approvalStatus IS NULL OR j.approvalStatus <> com.hiremate.enums.JobApprovalStatus.REJECTED) " +
           "AND (j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE)")
    long countActiveJobsByRecruiterId(@Param("recruiterId") Long recruiterId);

    /** Đếm số tin tuyển dụng đang hoạt động của cả doanh nghiệp để kiểm tra hạn ngạch gói dùng chung của công ty */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.company.companyId = :companyId " +
           "AND j.status = com.hiremate.enums.JobStatus.PUBLISHED " +
           "AND (j.approvalStatus IS NULL OR j.approvalStatus <> com.hiremate.enums.JobApprovalStatus.REJECTED) " +
           "AND (j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE)")
    long countActiveJobsByCompanyId(@Param("companyId") Long companyId);

    /** Đếm tổng số tin ở trạng thái Nháp hoặc Chờ kiểm duyệt của Doanh nghiệp để chống spam / flooding database */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.company.companyId = :companyId AND (j.status = com.hiremate.enums.JobStatus.DRAFT OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.PENDING)")
    long countPendingOrDraftJobsByCompanyId(@Param("companyId") Long companyId);

    /** Đếm tổng số tin ở trạng thái Nháp hoặc Chờ kiểm duyệt của cá nhân Recruiter */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.recruiter.recruiterId = :recruiterId AND (j.status = com.hiremate.enums.JobStatus.DRAFT OR j.approvalStatus = com.hiremate.enums.JobApprovalStatus.PENDING)")
    long countPendingOrDraftJobsByRecruiterId(@Param("recruiterId") Long recruiterId);
}


