package com.hiremate.repository;

import com.hiremate.entity.Application;
import com.hiremate.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Optional<Application> findByJobIdAndCandidateId(Long jobId, Long candidateId);
    List<Application> findByCandidateId(Long candidateId);
    List<Application> findByJobId(Long jobId);
    List<Application> findByJobIdAndStatus(Long jobId, ApplicationStatus status);
}
