package com.hiremate.repository;

import com.hiremate.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {
    List<JobSkill> findByJobId(Long jobId);
    void deleteByJobId(Long jobId);
}

