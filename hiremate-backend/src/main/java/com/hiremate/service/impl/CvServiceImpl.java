package com.hiremate.service.impl;

import com.hiremate.dto.response.CvResponse;
import com.hiremate.entity.Cv;
import com.hiremate.entity.User;
import com.hiremate.enums.CvParseStatus;
import com.hiremate.repository.CvRepository;
import com.hiremate.service.CvService;
import com.hiremate.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CvServiceImpl implements CvService {

    private final CvRepository cvRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public CvResponse uploadCv(MultipartFile file, User candidate) {
        String fileUrl = fileStorageService.storeFile(file);

        String originalName = file.getOriginalFilename();
        String fileType = "pdf";
        if (originalName != null && originalName.lastIndexOf('.') >= 0) {
            fileType = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        }

        List<Cv> existingCvs = cvRepository.findByCandidateId(candidate.getUserId());
        boolean isFirst = existingCvs.isEmpty();

        String parsedText = null;
        if ("pdf".equalsIgnoreCase(fileType)) {
            try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(file.getBytes())) {
                org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                String rawText = stripper.getText(document);
                if (rawText != null && !rawText.isBlank()) {
                    parsedText = rawText.trim();
                    log.info(">> [CvService] Đã trích xuất thành công {} ký tự text từ CV PDF: {}", parsedText.length(), originalName);
                }
            } catch (Exception e) {
                log.warn(">> [CvService] Không thể bóc tách text từ file PDF: {}", e.getMessage());
            }
        }

        String summaryText = (parsedText != null && parsedText.length() > 300)
                ? parsedText.substring(0, 300).replaceAll("\\s+", " ") + "..."
                : "Uploaded via HireMate AI Candidate Portal";

        Cv cv = Cv.builder()
                .candidateId(candidate.getUserId())
                .fileName(originalName)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .fileSizeBytes((int) file.getSize())
                .parsedText(parsedText)
                .parseStatus(CvParseStatus.DONE)
                .summary(summaryText)
                .isDefault(isFirst)
                .build();

        Cv saved = cvRepository.save(cv);
        log.info("CV saved successfully for candidate ID: {}, file: {}", candidate.getUserId(), originalName);

        return mapToResponse(saved);
    }

    @Override
    public List<CvResponse> getCandidateCvs(Long candidateId) {
        List<Cv> cvList = cvRepository.findByCandidateId(candidateId);
        List<CvResponse> responses = new ArrayList<>();
        for (Cv cv : cvList) {
            responses.add(mapToResponse(cv));
        }
        return responses;
    }

    @Override
    @Transactional
    public CvResponse setDefaultCv(Long cvId, User candidate) {
        List<Cv> cvList = cvRepository.findByCandidateId(candidate.getUserId());
        Cv targetCv = null;
        for (Cv cv : cvList) {
            if (cv.getCvId().equals(cvId)) {
                cv.setIsDefault(true);
                targetCv = cv;
            } else {
                cv.setIsDefault(false);
            }
        }
        if (targetCv == null) {
            throw new IllegalArgumentException("CV not found or does not belong to candidate.");
        }
        cvRepository.saveAll(cvList);
        return mapToResponse(targetCv);
    }

    @Override
    @Transactional
    public void deleteCv(Long cvId, User candidate) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new IllegalArgumentException("CV not found: " + cvId));

        if (!cv.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("You are not authorized to delete this CV.");
        }

        // Delete from storage
        String fileName = cv.getFileUrl().replace("/uploads/", "");
        fileStorageService.deleteFile(fileName);

        cvRepository.delete(cv);
    }

    @Override
    public CvResponse getCvById(Long cvId) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new IllegalArgumentException("CV not found: " + cvId));
        return mapToResponse(cv);
    }

    private CvResponse mapToResponse(Cv cv) {
        return CvResponse.builder()
                .cvId(cv.getCvId())
                .candidateId(cv.getCandidateId())
                .fileName(cv.getFileName())
                .fileUrl(cv.getFileUrl())
                .fileType(cv.getFileType())
                .fileSizeBytes(cv.getFileSizeBytes())
                .parseStatus(cv.getParseStatus())
                .isDefault(cv.getIsDefault())
                .summary(cv.getSummary())
                .createdAt(cv.getCreatedAt())
                .build();
    }
}
