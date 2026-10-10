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
    private final com.hiremate.service.GeminiAiService geminiAiService;
    private final com.hiremate.repository.SkillRepository skillRepository;
    private final com.hiremate.repository.CandidateSkillRepository candidateSkillRepository;
    private final com.hiremate.repository.CandidateRepository candidateRepository;
    private final com.hiremate.repository.UserRepository userRepository;

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
        } else if ("docx".equalsIgnoreCase(fileType)) {
            try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(file.getInputStream())) {
                java.util.zip.ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    if ("word/document.xml".equals(entry.getName())) {
                        String xmlContent = new String(zis.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                        parsedText = xmlContent.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
                        log.info(">> [CvService] Đã trích xuất thành công {} ký tự text từ CV DOCX: {}", parsedText.length(), originalName);
                        break;
                    }
                }
            } catch (Exception e) {
                log.warn(">> [CvService] Không thể bóc tách text từ file DOCX: {}", e.getMessage());
            }
        } else if ("png".equalsIgnoreCase(fileType) || "jpg".equalsIgnoreCase(fileType) || "jpeg".equalsIgnoreCase(fileType) || "webp".equalsIgnoreCase(fileType)) {
            try {
                String mimeType = "image/" + ("jpg".equalsIgnoreCase(fileType) ? "jpeg" : fileType.toLowerCase());
                com.hiremate.dto.ai.AiCvAnalysis visionAnalysis = geminiAiService.analyzeCvImage(file.getBytes(), mimeType);
                if (visionAnalysis != null) {
                    StringBuilder extracted = new StringBuilder();
                    if (visionAnalysis.getCandidateName() != null) extracted.append("Họ tên: ").append(visionAnalysis.getCandidateName()).append("\n");
                    if (visionAnalysis.getHeadline() != null) extracted.append("Chức danh: ").append(visionAnalysis.getHeadline()).append("\n");
                    if (visionAnalysis.getSummary() != null) extracted.append(visionAnalysis.getSummary()).append("\n");
                    if (visionAnalysis.getSkills() != null && !visionAnalysis.getSkills().isEmpty()) {
                        extracted.append("Kỹ năng: ").append(String.join(", ", visionAnalysis.getSkills())).append("\n");
                    }
                    parsedText = extracted.toString().trim();
                    log.info(">> [CvService] Đã trích xuất thành công {} ký tự text từ CV ảnh bằng Gemini Vision OCR", parsedText.length());
                }
            } catch (Exception e) {
                log.warn(">> [CvService] Không thể OCR file ảnh CV bằng Gemini Vision: {}", e.getMessage());
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

        // Delete from storage (Cloudinary CDN or local disk fallback)
        fileStorageService.deleteFile(cv.getFileUrl());

        cvRepository.delete(cv);
    }

    @Override
    @Transactional
    public CvResponse renameCv(Long cvId, String newName, User candidate) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new IllegalArgumentException("CV not found: " + cvId));

        if (!cv.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("You are not authorized to rename this CV.");
        }

        if (newName != null && !newName.isBlank()) {
            cv.setFileName(newName.trim());
            Cv updated = cvRepository.save(cv);
            log.info("CV ID {} renamed to: {}", cvId, newName);
            return mapToResponse(updated);
        }
        return mapToResponse(cv);
    }

    @Override
    public CvResponse getCvById(Long cvId) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new IllegalArgumentException("CV not found: " + cvId));
        return mapToResponse(cv);
    }

    @Override
    @Transactional
    public CvResponse analyzeCv(Long cvId, User candidate) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new IllegalArgumentException("CV not found: " + cvId));

        if (!cv.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("You are not authorized to analyze this CV.");
        }

        com.hiremate.dto.ai.AiCvAnalysis analysis = null;
        String textToAnalyze = cv.getParsedText();

        // 1. Nếu đã có parsedText -> Phân tích bằng mô hình ATS Text Engine
        if (textToAnalyze != null && !textToAnalyze.isBlank()) {
            analysis = geminiAiService.analyzeCv(textToAnalyze);
        } else if (cv.getFileUrl() != null) {
            // 2. Nếu chưa có parsedText mà file là ảnh (PNG, JPG, WEBP) -> Phân tích bằng Gemini Multimodal Vision OCR
            String fileType = cv.getFileType() != null ? cv.getFileType().toLowerCase() : "";
            if (fileType.matches("png|jpg|jpeg|webp")) {
                try {
                    byte[] imageBytes = fileStorageService.loadFileAsBytes(cv.getFileUrl());
                    if (imageBytes != null && imageBytes.length > 0) {
                        String mimeType = "image/" + ("jpg".equals(fileType) ? "jpeg" : fileType);
                        analysis = geminiAiService.analyzeCvImage(imageBytes, mimeType);
                    }
                } catch (Exception e) {
                    log.warn(">> [CvService] Đọc file ảnh để phân tích qua Gemini Vision thất bại: {}", e.getMessage());
                }
            }
        }

        // Fallback nếu cả 2 phương thức trên đều chưa có kết quả
        if (analysis == null) {
            analysis = geminiAiService.analyzeCv(cv.getFileName() != null ? cv.getFileName() : "Resume");
        }

        // 3. Tự động đồng bộ thông tin trích xuất vào hồ sơ ứng viên (Candidate Profile)
        com.hiremate.entity.Candidate candidateProfile = candidateRepository.findByCandidateId(candidate.getUserId())
                .orElseGet(() -> com.hiremate.entity.Candidate.builder()
                        .candidateId(candidate.getUserId())
                        .user(candidate)
                        .isNewEntity(true)
                        .build());

        if (analysis.getHeadline() != null && !analysis.getHeadline().isBlank()) {
            candidateProfile.setHeadline(analysis.getHeadline());
        }
        if (analysis.getYearsOfExperience() != null) {
            candidateProfile.setExperienceYears(analysis.getYearsOfExperience());
        }
        if (analysis.getEducationsJson() != null && !analysis.getEducationsJson().isBlank() && !"[]".equals(analysis.getEducationsJson())) {
            candidateProfile.setEducationsJson(analysis.getEducationsJson());
        }
        if (analysis.getExperiencesJson() != null && !analysis.getExperiencesJson().isBlank() && !"[]".equals(analysis.getExperiencesJson())) {
            candidateProfile.setExperiencesJson(analysis.getExperiencesJson());
        }
        if (analysis.getSummary() != null && !analysis.getSummary().isBlank()) {
            if (candidateProfile.getBio() == null || candidateProfile.getBio().isBlank()) {
                candidateProfile.setBio(analysis.getSummary());
            }
        }
        candidateRepository.save(candidateProfile);

        // 4. Nếu họ tên ứng viên chưa có hoặc trống, tự động cập nhật nếu AI trích xuất được
        if (analysis.getCandidateName() != null && !analysis.getCandidateName().isBlank()) {
            if (candidate.getFullName() == null || candidate.getFullName().isBlank()) {
                candidate.setFullName(analysis.getCandidateName());
                userRepository.save(candidate);
            }
        }

        // 5. Tự động chuẩn hóa & lưu kỹ năng phát hiện vào candidate_skills (ai_detected = true, chuẩn 3NF)
        List<String> allDetectedSkills = analysis.getSkills();
        if (allDetectedSkills == null || allDetectedSkills.isEmpty()) {
            allDetectedSkills = analysis.getTopSkills();
        }
        if (allDetectedSkills != null) {
            for (String skillName : allDetectedSkills) {
                if (skillName == null || skillName.isBlank()) continue;
                String trimmedSkill = skillName.trim();
                com.hiremate.entity.Skill skill = skillRepository.findBySkillNameIgnoreCase(trimmedSkill)
                        .orElseGet(() -> skillRepository.save(com.hiremate.entity.Skill.builder()
                                .skillName(trimmedSkill)
                                .category("Technical")
                                .build()));

                if (candidateSkillRepository.findByProfileIdAndSkillId(candidate.getUserId(), skill.getSkillId()).isEmpty()) {
                    candidateSkillRepository.save(com.hiremate.entity.CandidateSkill.builder()
                            .profileId(candidate.getUserId())
                            .skillId(skill.getSkillId())
                            .proficiencyLevel(com.hiremate.enums.SkillProficiency.INTERMEDIATE)
                            .aiDetected(true)
                            .build());
                }
            }
        }

        // 6. Xây dựng bản tóm tắt phân tích chuyên nghiệp lưu vào CV
        StringBuilder sb = new StringBuilder();
        if (analysis.getHeadline() != null && !analysis.getHeadline().isBlank()) {
            sb.append("Vị trí: ").append(analysis.getHeadline()).append("\n");
        }
        if (analysis.getYearsOfExperience() != null) {
            sb.append("Kinh nghiệm ước tính: ").append(analysis.getYearsOfExperience()).append(" năm\n\n");
        }
        if (analysis.getSummary() != null && !analysis.getSummary().isBlank()) {
            sb.append(analysis.getSummary()).append("\n\n");
        }
        if (allDetectedSkills != null && !allDetectedSkills.isEmpty()) {
            sb.append("Kỹ năng phát hiện: ").append(String.join(", ", allDetectedSkills)).append(".\n");
        }
        if (analysis.getSuggestedRoles() != null && !analysis.getSuggestedRoles().isEmpty()) {
            sb.append("Vị trí đề xuất: ").append(String.join(", ", analysis.getSuggestedRoles())).append(".\n");
        }
        if (analysis.getImprovementAdvice() != null && !analysis.getImprovementAdvice().isBlank()) {
            sb.append("Lời khuyên cải thiện CV: ").append(analysis.getImprovementAdvice());
        }

        cv.setSummary(sb.toString().trim());
        Cv updated = cvRepository.save(cv);
        log.info(">> [CvService] CV ID {} analyzed successfully via Gemini ATS Engine", cvId);
        return mapToResponse(updated);
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
