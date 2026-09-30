package com.hiremate.service;

import com.hiremate.dto.response.CvResponse;
import com.hiremate.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CvService {
    CvResponse uploadCv(MultipartFile file, User candidate);
    List<CvResponse> getCandidateCvs(Long candidateId);
    CvResponse setDefaultCv(Long cvId, User candidate);
    void deleteCv(Long cvId, User candidate);
    CvResponse getCvById(Long cvId);
}
