package com.hiremate.repository;

import com.hiremate.entity.CandidateProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * @deprecated Thay thế bởi CandidateRepository
 */
@Deprecated(since = "2.0", forRemoval = true)
public interface CandidateProfileRepository {
    // Legacy interface
}
