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
    List<Job> findByRecruiter_RecruiterId(Long recruiterId);

    /** Lấy jobs theo status */
    List<Job> findByStatus(JobStatus status);

    /** Lấy jobs theo company */
    List<Job> findByCompany_CompanyId(Long companyId);

    /**
     * Tìm kiếm jobs PUBLISHED theo keyword và location.
     * Sử dụng JPQL path traversal qua Recruiter subclass.
     */
    @Query("SELECT j FROM Job j WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(CAST(:keyword AS string) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) AND " +
           "(CAST(:location AS string) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%')))")
    List<Job> searchJobs(@Param("keyword") String keyword, @Param("location") String location);

    /** Tìm kiếm phân trang (Pageable) cho published jobs */
    org.springframework.data.domain.Page<Job> findByStatus(JobStatus status, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(CAST(:keyword AS string) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) AND " +
           "(CAST(:location AS string) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%')))")
    org.springframework.data.domain.Page<Job> searchJobsPaged(@Param("keyword") String keyword, @Param("location") String location, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.status = com.hiremate.enums.JobStatus.PUBLISHED AND " +
           "(j.deadlineDate IS NULL OR j.deadlineDate >= CURRENT_DATE) AND " +
           "(CAST(:keyword AS string) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')) " +
           "   OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) AND " +
           "(CAST(:location AS string) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS string), '%'))) AND " +
           "(:employmentType IS NULL OR j.employmentType = :employmentType) AND " +
           "(:minSalary IS NULL OR j.salaryMax >= :minSalary) AND " +
           "(:maxSalary IS NULL OR j.salaryMin <= :maxSalary)")
    org.springframework.data.domain.Page<Job> searchJobsAdvancedPaged(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("employmentType") com.hiremate.enums.EmploymentType employmentType,
            @Param("minSalary") java.math.BigDecimal minSalary,
            @Param("maxSalary") java.math.BigDecimal maxSalary,
            org.springframework.data.domain.Pageable pageable
    );

    org.springframework.data.domain.Page<Job> findByRecruiter_RecruiterId(Long recruiterId, org.springframework.data.domain.Pageable pageable);
}
