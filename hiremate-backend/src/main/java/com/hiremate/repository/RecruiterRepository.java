package com.hiremate.repository;

import com.hiremate.entity.Recruiter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho Recruiter (Subclass của users).
 * recruiter_id = user_id (Shared PK pattern).
 */
@Repository
public interface RecruiterRepository extends JpaRepository<Recruiter, Long> {

    /** Tìm Recruiter theo user_id (vì recruiter_id = user_id) */
    Optional<Recruiter> findByRecruiterId(Long recruiterId);

    /** Tìm Recruiter theo company */
    Optional<Recruiter> findByCompany_CompanyId(Long companyId);

    /** Kiểm tra recruiter đã có profile chưa */
    boolean existsByRecruiterId(Long recruiterId);
}
