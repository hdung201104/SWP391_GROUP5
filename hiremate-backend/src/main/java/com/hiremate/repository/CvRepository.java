package com.hiremate.repository;

import com.hiremate.entity.Cv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CvRepository extends JpaRepository<Cv, Long> {
    List<Cv> findByCandidateId(Long candidateId);
    Optional<Cv> findByCandidateIdAndIsDefaultTrue(Long candidateId);
}
