package com.hiremate.service;

import com.hiremate.dto.response.AiJobMatchResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Cv;
import com.hiremate.entity.Job;
import com.hiremate.entity.User;

import java.util.List;

public interface AiJobMatchService {
    AiJobMatchResponse calculateAndSaveMatch(Candidate candidate, Job job, Cv cv);
    AiJobMatchResponse getOrCalculateMatch(Long jobId, User candidateUser);
    List<AiJobMatchResponse> getMatchesForJob(Long jobId, User recruiterUser);
}
