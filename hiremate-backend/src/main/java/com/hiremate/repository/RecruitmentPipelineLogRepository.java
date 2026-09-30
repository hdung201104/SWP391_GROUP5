package com.hiremate.repository;

import com.hiremate.entity.RecruitmentPipelineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruitmentPipelineLogRepository extends JpaRepository<RecruitmentPipelineLog, Long> {
    List<RecruitmentPipelineLog> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);
}
