package com.hiremate.service;

import com.hiremate.dto.response.CandidateProfileResponse;
import com.hiremate.entity.User;

public interface CandidateService {
    CandidateProfileResponse getCandidateProfile(Long candidateId, User currentUser);
}
