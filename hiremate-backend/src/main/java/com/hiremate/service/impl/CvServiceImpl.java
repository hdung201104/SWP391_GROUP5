package com.hiremate.service.impl;

import com.hiremate.dto.response.CvParsedDTO;
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

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CvServiceImpl implements CvService {

    private final CvRepository cvRepository;
    private final FileStorageService fileStorageService;
    private final com.hiremate.service.GeminiAiService geminiAiService;
    private final com.hiremate.service.SkillService skillService;
    private final com.hiremate.repository.SkillRepository skillRepository;
    private final com.hiremate.repository.CandidateSkillRepository candidateSkillRepository;
    private final com.hiremate.repository.CandidateRepository candidateRepository;
    private final com.hiremate.repository.UserRepository userRepository;
    private final com.hiremate.repository.ApplicationRepository applicationRepository;
    private final com.hiremate.repository.AiJobMatchRepository aiJobMatchRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.AiJobMatchService aiJobMatchService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.NotificationService notificationService;

    @Override
    @Transactional
    public CvResponse uploadCv(MultipartFile file, User candidate) {
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            fileBytes = new byte[0];
        }

        String fileUrl = fileStorageService.storeFile(file);

        String originalName = file.getOriginalFilename();
        String fileType = "pdf";
        if (originalName != null && originalName.lastIndexOf('.') >= 0) {
            fileType = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        }

        // Đảm bảo bản ghi Candidate trong bảng candidates tồn tại để thỏa mãn ràng buộc khóa ngoại cvs_candidate_id_fkey
        candidateRepository.findByCandidateId(candidate.getUserId())
                .orElseGet(() -> candidateRepository.save(com.hiremate.entity.Candidate.builder()
                        .candidateId(candidate.getUserId())
                        .user(candidate)
                        .isNewEntity(true)
                        .build()));

        List<Cv> existingCvs = cvRepository.findByCandidateId(candidate.getUserId());
        boolean isFirst = existingCvs.isEmpty();

        String parsedText = null;
        if ("pdf".equalsIgnoreCase(fileType)) {
            try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(fileBytes)) {
                org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
                String rawText = stripper.getText(document);
                if (rawText != null && !rawText.isBlank()) {
                    parsedText = rawText.trim();
                    log.info(">> [CvService] Đã trích xuất thành công {} ký tự text từ CV PDF: {}", parsedText.length(), originalName);
                }

                // Nếu PDF dạng ảnh scan (không có text stream hoặc ít hơn 50 ký tự), dùng Gemini Vision OCR
                if ((parsedText == null || parsedText.length() < 50) && document.getNumberOfPages() > 0) {
                    log.info(">> [CvService] PDF có ít text (<50 ký tự), tiến hành render ảnh để OCR bằng Gemini Vision...");
                    try {
                        org.apache.pdfbox.rendering.PDFRenderer renderer = new org.apache.pdfbox.rendering.PDFRenderer(document);
                        java.awt.image.BufferedImage bim = renderer.renderImageWithDPI(0, 150);
                        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                        javax.imageio.ImageIO.write(bim, "png", baos);
                        byte[] pageBytes = baos.toByteArray();
                        com.hiremate.dto.ai.AiCvAnalysis visionAnalysis = geminiAiService.analyzeCvImage(pageBytes, "image/png");
                        if (visionAnalysis != null) {
                            StringBuilder sb = new StringBuilder();
                            if (visionAnalysis.getCandidateName() != null) sb.append("Họ tên: ").append(visionAnalysis.getCandidateName()).append("\n");
                            if (visionAnalysis.getHeadline() != null) sb.append("Chức danh: ").append(visionAnalysis.getHeadline()).append("\n");
                            if (visionAnalysis.getSummary() != null) sb.append(visionAnalysis.getSummary()).append("\n");
                            if (visionAnalysis.getSkills() != null && !visionAnalysis.getSkills().isEmpty()) {
                                sb.append("Kỹ năng: ").append(String.join(", ", visionAnalysis.getSkills())).append("\n");
                            }
                            if (visionAnalysis.getExperiencesJson() != null && !"[]".equals(visionAnalysis.getExperiencesJson())) {
                                sb.append("Kinh nghiệm: ").append(visionAnalysis.getExperiencesJson()).append("\n");
                            }
                            if (visionAnalysis.getEducationsJson() != null && !"[]".equals(visionAnalysis.getEducationsJson())) {
                                sb.append("Học vấn: ").append(visionAnalysis.getEducationsJson()).append("\n");
                            }
                            if (sb.length() > 0) {
                                parsedText = sb.toString().trim();
                                log.info(">> [CvService] Đã trích xuất thành công {} ký tự từ scanned PDF qua Gemini Vision", parsedText.length());
                            }
                        }
                    } catch (Exception ocrEx) {
                        log.warn(">> [CvService] Không thể OCR file PDF scan: {}", ocrEx.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn(">> [CvService] Không thể bóc tách text từ file PDF: {}", e.getMessage());
            }
        } else if ("docx".equalsIgnoreCase(fileType)) {
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes);
                 org.apache.poi.xwpf.usermodel.XWPFDocument doc = new org.apache.poi.xwpf.usermodel.XWPFDocument(bais);
                 org.apache.poi.xwpf.extractor.XWPFWordExtractor extractor = new org.apache.poi.xwpf.extractor.XWPFWordExtractor(doc)) {
                String rawText = extractor.getText();
                if (rawText != null && !rawText.isBlank()) {
                    parsedText = rawText.trim();
                    log.info(">> [CvService] Đã trích xuất thành công {} ký tự text từ CV DOCX bằng Apache POI: {}", parsedText.length(), originalName);
                }
            } catch (Exception e) {
                log.warn(">> [CvService] Apache POI đọc DOCX lỗi ({}), thử fallback ZipInputStream...", e.getMessage());
                try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(fileBytes))) {
                    java.util.zip.ZipEntry entry;
                    while ((entry = zis.getNextEntry()) != null) {
                        if ("word/document.xml".equals(entry.getName())) {
                            String xmlContent = new String(zis.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                            String cleaned = xmlContent
                                    .replaceAll("(?i)<w:p[^>]*>", "\n")
                                    .replaceAll("(?i)<w:br[^>]*>", "\n")
                                    .replaceAll("(?i)<w:tab[^>]*>", "\t")
                                    .replaceAll("<[^>]+>", " ")
                                    .replaceAll("[ \t]+", " ")
                                    .replaceAll("\n\\s*\n", "\n")
                                    .trim();
                            if (!cleaned.isBlank()) {
                                parsedText = cleaned;
                                log.info(">> [CvService] Đã trích xuất {} ký tự từ DOCX qua fallback ZipInputStream", parsedText.length());
                            }
                            break;
                        }
                    }
                } catch (Exception zipEx) {
                    log.warn(">> [CvService] Không thể bóc tách text từ DOCX: {}", zipEx.getMessage());
                }
            }
        } else if ("doc".equalsIgnoreCase(fileType)) {
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(fileBytes);
                 org.apache.poi.hwpf.HWPFDocument doc = new org.apache.poi.hwpf.HWPFDocument(bais);
                 org.apache.poi.hwpf.extractor.WordExtractor extractor = new org.apache.poi.hwpf.extractor.WordExtractor(doc)) {
                String rawText = extractor.getText();
                if (rawText != null && !rawText.isBlank()) {
                    parsedText = rawText.trim();
                    log.info(">> [CvService] Đã trích xuất thành công {} ký tự Unicode từ CV DOC bằng Apache POI: {}", parsedText.length(), originalName);
                }
            } catch (Exception e) {
                log.warn(">> [CvService] Không thể bóc tách Unicode từ file DOC qua Apache POI: {}", e.getMessage());
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
                    if (visionAnalysis.getExperiencesJson() != null && !"[]".equals(visionAnalysis.getExperiencesJson())) {
                        extracted.append("Kinh nghiệm: ").append(visionAnalysis.getExperiencesJson()).append("\n");
                    }
                    if (visionAnalysis.getEducationsJson() != null && !"[]".equals(visionAnalysis.getEducationsJson())) {
                        extracted.append("Học vấn: ").append(visionAnalysis.getEducationsJson()).append("\n");
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

        try {
            // Automatically scan and parse CV with Gemini AI to extract real profile data
            return analyzeCv(saved.getCvId(), candidate);
        } catch (Throwable e) {
            log.warn("Automatic CV analysis on upload encountered error, returning base saved CV: {}", e.getMessage());
            return mapToResponse(saved);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CvResponse> getCandidateCvs(Long candidateId) {
        if (candidateId == null) {
            return Collections.emptyList();
        }
        List<Cv> cvList = cvRepository.findByCandidateId(candidateId);
        if (cvList == null || cvList.isEmpty()) {
            return Collections.emptyList();
        }

        // Pre-fetch candidate profile data 1 lần duy nhất cho toàn bộ danh sách CV
        var cand = candidateRepository.findByCandidateId(candidateId).orElse(null);
        var candUser = userRepository.findById(candidateId).orElse(null);

        List<String> profileSkills = new ArrayList<>();
        var candSkills = candidateSkillRepository.findByProfileId(candidateId);
        if (!candSkills.isEmpty()) {
            List<Long> skillIds = candSkills.stream()
                    .map(com.hiremate.entity.CandidateSkill::getSkillId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            List<com.hiremate.entity.Skill> skills = skillRepository.findAllById(skillIds);
            for (com.hiremate.entity.Skill sk : skills) {
                if (sk.getSkillName() != null && !sk.getSkillName().isBlank()) {
                    String skn = sk.getSkillName().trim();
                    if (!skn.contains("[") && !skn.contains("]") && skn.length() <= 35 && !profileSkills.contains(skn)) {
                        profileSkills.add(skn);
                    }
                }
            }
        }

        List<CvResponse> responses = new ArrayList<>(cvList.size());
        for (Cv cv : cvList) {
            responses.add(mapToResponse(cv, cand, candUser, profileSkills));
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

        // 1. Clear any foreign key references to this CV in applications & ai_job_matches
        try {
            applicationRepository.clearCvReference(cvId);
            aiJobMatchRepository.clearCvReference(cvId);
        } catch (Exception e) {
            log.warn("Could not clear FK references for CV {}: {}", cvId, e.getMessage());
        }

        // 2. Delete physical storage file (Cloudinary CDN or local disk fallback) safely
        try {
            fileStorageService.deleteFile(cv.getFileUrl());
        } catch (Exception e) {
            log.warn("Could not delete physical storage file for CV {}: {}", cvId, e.getMessage());
        }

        // 3. Delete CV entity from database
        cvRepository.delete(cv);
        log.info("CV ID {} deleted successfully from database", cvId);

        // 4. If the deleted CV was default, promote another CV if available
        if (Boolean.TRUE.equals(cv.getIsDefault())) {
            List<Cv> remaining = cvRepository.findByCandidateId(candidate.getUserId());
            if (!remaining.isEmpty()) {
                Cv newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                cvRepository.save(newDefault);
                log.info("Promoted CV {} as new default for candidate {}", newDefault.getCvId(), candidate.getUserId());
            }
        }
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
        if (analysis.getProjectsJson() != null && !analysis.getProjectsJson().isBlank() && !"[]".equals(analysis.getProjectsJson())) {
            candidateProfile.setProjectsJson(analysis.getProjectsJson());
        }
        if (analysis.getAddress() != null && !analysis.getAddress().isBlank()) {
            candidateProfile.setLocation(analysis.getAddress());
        }
        if (analysis.getSummary() != null && !analysis.getSummary().isBlank()) {
            if (candidateProfile.getBio() == null || candidateProfile.getBio().isBlank()) {
                candidateProfile.setBio(analysis.getSummary());
            }
        }
        candidateRepository.save(candidateProfile);

        // 4. Cập nhật họ tên và số điện thoại ứng viên từ hồ sơ CV
        boolean userUpdated = false;
        if (analysis.getCandidateName() != null && !analysis.getCandidateName().isBlank() 
                && !analysis.getCandidateName().toLowerCase().contains("của bạn")
                && !analysis.getCandidateName().equalsIgnoreCase("Ứng Viên Tuyển Dụng")) {
            candidate.setFullName(analysis.getCandidateName());
            userUpdated = true;
        }
        if (analysis.getPhone() != null && !analysis.getPhone().isBlank() && !analysis.getPhone().contains("điện thoại")) {
            candidate.setPhone(analysis.getPhone());
            userUpdated = true;
        }
        if (userUpdated) {
            userRepository.save(candidate);
        }

        // 5. Tự động chuẩn hóa & lưu kỹ năng phát hiện vào candidate_skills (ai_detected = true, chuẩn 3NF)
        List<String> allDetectedSkills = analysis.getSkills();
        if (allDetectedSkills == null || allDetectedSkills.isEmpty()) {
            allDetectedSkills = analysis.getTopSkills();
        }
        if (allDetectedSkills != null) {
            Map<String, com.hiremate.entity.Skill> skillByNameMap = new HashMap<>();
            try {
                for (com.hiremate.entity.Skill s : skillRepository.findAll()) {
                    if (s.getSkillName() != null) {
                        skillByNameMap.put(s.getSkillName().toLowerCase().trim(), s);
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [CvService] Pre-fetch skills warning: {}", ex.getMessage());
            }

            Set<Long> existingCandSkillIds = new HashSet<>();
            try {
                for (com.hiremate.entity.CandidateSkill cs : candidateSkillRepository.findByProfileId(candidate.getUserId())) {
                    if (cs.getSkillId() != null) {
                        existingCandSkillIds.add(cs.getSkillId());
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [CvService] Pre-fetch candidate skills warning: {}", ex.getMessage());
            }

            for (String rawSkill : allDetectedSkills) {
                if (rawSkill == null || rawSkill.isBlank()) continue;
                String[] subSkills = rawSkill.split("[,;•|\\t]");
                for (String s : subSkills) {
                    String trimmedSkill = s.trim();
                    if (trimmedSkill.isBlank() || trimmedSkill.length() > 50 || trimmedSkill.length() < 2) continue;
                    String lower = trimmedSkill.toLowerCase();
                    if (lower.startsWith("nếu") || lower.contains("kinh nghiệm") || lower.contains("dự án") 
                            || lower.contains("thay phần này") || lower.contains("hướng dẫn") || lower.contains("tháng/năm")
                            || lower.contains("[") || lower.contains("]") || lower.contains("theo dõi") || lower.contains("chuẩn bị")
                            || lower.contains("từng làm") || lower.contains("kết quả") || lower.contains("quy mô") || lower.contains("công nghệ")
                            || lower.contains("tiếng anh") || lower.contains("tiếng nhật") || lower.contains("tiếng việt")
                            || lower.contains("ielts") || lower.contains("jlpt") || lower.contains("toeic")
                            || lower.contains("giao tiếp") || lower.contains("lãnh đạo") || lower.contains("áp lực cao")
                            || lower.contains("tài liệu") || lower.contains("vị trí") || lower.contains("công ty")
                            || trimmedSkill.length() > 35) {
                        continue;
                    }
                    try {
                        com.hiremate.entity.Skill skill = skillService.findOrCreateNormalizedSkill(trimmedSkill, null, null);
                        if (skill != null && !existingCandSkillIds.contains(skill.getSkillId())) {
                            candidateSkillRepository.save(com.hiremate.entity.CandidateSkill.builder()
                                    .profileId(candidate.getUserId())
                                    .skillId(skill.getSkillId())
                                    .proficiencyLevel(com.hiremate.enums.SkillProficiency.INTERMEDIATE)
                                    .aiDetected(true)
                                    .build());
                            existingCandSkillIds.add(skill.getSkillId());
                        }
                    } catch (Exception skillEx) {
                        log.warn(">> [CvService] Bỏ qua kỹ năng '{}' do lỗi: {}", trimmedSkill, skillEx.getMessage());
                    }
                }
            }
        }

        // 6. Lưu bản tóm tắt thực sự của ứng viên và chuỗi rawJson vào CV
        String cleanSummary = (analysis.getSummary() != null && !analysis.getSummary().isBlank())
                ? analysis.getSummary()
                : "Hồ sơ ứng viên chuyên nghiệp trên nền tảng HireMate AI.";
        cv.setSummary(cleanSummary.trim());
        if (analysis.getRawJson() != null && !analysis.getRawJson().isBlank()) {
            cv.setParsedJson(analysis.getRawJson());
        }
        Cv updated = cvRepository.save(cv);
        log.info(">> [CvService] CV ID {} analyzed successfully via Gemini ATS Engine", cvId);

        // 7. Tự động tính toán & lưu cache ma trận khớp nối việc làm AI (Rule 3) chạy async ngầm
        CompletableFuture.runAsync(() -> {
            try {
                if (aiJobMatchService != null) {
                    List<com.hiremate.dto.response.JobResponse> matches = aiJobMatchService.reMatchJobs(candidate);
                    long highMatchesCount = matches.stream()
                            .filter(j -> j.getMatchingScore() != null && j.getMatchingScore() >= 70.0f)
                            .count();
                    if (notificationService != null && highMatchesCount > 0) {
                        notificationService.createNotification(
                                candidate.getUserId(),
                                com.hiremate.enums.NotificationType.AI_MATCH_DONE,
                                "🎯 Đã tìm thấy " + highMatchesCount + " việc làm phù hợp với CV mới của bạn!",
                                "Hệ thống HireMate AI đã tự động so khớp hồ sơ của bạn và tìm thấy " + highMatchesCount + " việc làm có độ tương thích cao (>70%). Hãy khám phá ngay!",
                                null,
                                "jobs"
                        );
                    }
                }
            } catch (Exception matchEx) {
                log.warn(">> [CvService] Tự động tính toán gợi ý việc làm sau khi phân tích CV gặp lỗi nhỏ: {}", matchEx.getMessage());
            }
        });

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CvResponse updateCv(Long cvId, CvParsedDTO updateDto, User candidate) {
        Cv cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new IllegalArgumentException("CV not found: " + cvId));

        if (!cv.getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("You are not authorized to update this CV.");
        }

        if (updateDto.getSummary() != null && !updateDto.getSummary().isBlank()) {
            cv.setSummary(updateDto.getSummary().trim());
        }

        try {
            cv.setParsedJson(objectMapper.writeValueAsString(updateDto));
        } catch (Exception ignored) {}

        cvRepository.save(cv);

        // Đồng bộ vào Candidate Profile
        var candOpt = candidateRepository.findByCandidateId(candidate.getUserId());
        if (candOpt.isPresent()) {
            var cand = candOpt.get();
            if (updateDto.getHeadline() != null) cand.setHeadline(updateDto.getHeadline());
            if (updateDto.getSummary() != null) cand.setBio(updateDto.getSummary());
            if (updateDto.getAddress() != null) cand.setLocation(updateDto.getAddress());
            try {
                if (updateDto.getExperiences() != null) {
                    cand.setExperiencesJson(objectMapper.writeValueAsString(updateDto.getExperiences()));
                }
                if (updateDto.getEducations() != null) {
                    cand.setEducationsJson(objectMapper.writeValueAsString(updateDto.getEducations()));
                }
                if (updateDto.getProjects() != null) {
                    cand.setProjectsJson(objectMapper.writeValueAsString(updateDto.getProjects()));
                }
            } catch (Exception ignored) {}
            candidateRepository.save(cand);
        }

        // Đồng bộ vào Users nếu có thông tin cá nhân
        boolean userNeedsUpdate = false;
        if (updateDto.getFullName() != null && !updateDto.getFullName().isBlank()) {
            candidate.setFullName(updateDto.getFullName());
            userNeedsUpdate = true;
        }
        if (updateDto.getPhone() != null && !updateDto.getPhone().isBlank()) {
            candidate.setPhone(updateDto.getPhone());
            userNeedsUpdate = true;
        }
        if (updateDto.getAddress() != null && !updateDto.getAddress().isBlank()) {
            candidate.setAddress(updateDto.getAddress());
            userNeedsUpdate = true;
        }
        if (userNeedsUpdate) {
            userRepository.save(candidate);
        }

        // Cập nhật Skills nếu có
        if (updateDto.getSkills() != null && !updateDto.getSkills().isEmpty()) {
            for (String skillName : updateDto.getSkills()) {
                if (skillName == null || skillName.isBlank()) continue;
                String trimmed = skillName.trim();
                try {
                    com.hiremate.entity.Skill skill = skillService.findOrCreateNormalizedSkill(trimmed, null, null);
                    if (skill != null && candidateSkillRepository.findByProfileIdAndSkillId(candidate.getUserId(), skill.getSkillId()).isEmpty()) {
                        candidateSkillRepository.save(com.hiremate.entity.CandidateSkill.builder()
                                .profileId(candidate.getUserId())
                                .skillId(skill.getSkillId())
                                .proficiencyLevel(com.hiremate.enums.SkillProficiency.INTERMEDIATE)
                                .aiDetected(true)
                                .build());
                    }
                } catch (Exception ex) {
                    log.warn(">> [CvService] Lỗi khi cập nhật kỹ năng '{}': {}", trimmed, ex.getMessage());
                }
            }
        }

        return mapToResponse(cv);
    }

    private CvResponse mapToResponse(Cv cv) {
        return mapToResponse(cv, null, null, null);
    }

    private CvResponse mapToResponse(Cv cv, com.hiremate.entity.Candidate prefetchedCand, User prefetchedUser, List<String> prefetchedSkills) {
        String headline = null;
        Integer experienceYears = null;
        String educationsJson = null;
        String experiencesJson = null;
        String projectsJson = null;
        String fullName = null;
        String phone = null;
        String email = null;
        String address = null;
        List<String> detectedSkills = new ArrayList<>();

        if (cv.getCandidateId() != null) {
            var cand = prefetchedCand != null ? prefetchedCand : candidateRepository.findByCandidateId(cv.getCandidateId()).orElse(null);
            if (cand != null) {
                headline = cand.getHeadline();
                experienceYears = cand.getExperienceYears();
                educationsJson = cand.getEducationsJson();
                experiencesJson = cand.getExperiencesJson();
                projectsJson = cand.getProjectsJson();
                address = cand.getLocation();
            }
            User candUser = prefetchedUser != null ? prefetchedUser : userRepository.findById(cv.getCandidateId()).orElse(null);
            if (candUser != null) {
                if (fullName == null) fullName = candUser.getFullName();
                if (phone == null) phone = candUser.getPhone();
                if (email == null) email = candUser.getEmail();
                if (address == null) address = candUser.getAddress();
            }
        }

        CvParsedDTO parsedData = null;
        if (cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
            try {
                parsedData = objectMapper.readValue(cv.getParsedJson(), CvParsedDTO.class);
            } catch (Exception e) {
                log.warn("Error parsing parsedJson for CV {}: {}", cv.getCvId(), e.getMessage());
            }
        }

        if (parsedData != null && parsedData.getSkills() != null && !parsedData.getSkills().isEmpty()) {
            for (String s : parsedData.getSkills()) {
                if (s != null && !s.isBlank() && !detectedSkills.contains(s.trim())) {
                    detectedSkills.add(s.trim());
                }
            }
        } else if (prefetchedSkills != null && !prefetchedSkills.isEmpty()) {
            detectedSkills.addAll(prefetchedSkills);
        } else if (cv.getCandidateId() != null) {
            var candSkills = candidateSkillRepository.findByProfileId(cv.getCandidateId());
            if (!candSkills.isEmpty()) {
                List<Long> skillIds = candSkills.stream()
                        .map(com.hiremate.entity.CandidateSkill::getSkillId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();
                List<com.hiremate.entity.Skill> skills = skillRepository.findAllById(skillIds);
                for (com.hiremate.entity.Skill sk : skills) {
                    if (sk.getSkillName() != null && !sk.getSkillName().isBlank()) {
                        String skn = sk.getSkillName().trim();
                        if (!skn.contains("[") && !skn.contains("]") && skn.length() <= 35 && !detectedSkills.contains(skn)) {
                            detectedSkills.add(skn);
                        }
                    }
                }
            }
        }
        if (parsedData == null) {
            parsedData = new CvParsedDTO();
            parsedData.setFullName(fullName);
            parsedData.setHeadline(headline);
            parsedData.setPhone(phone);
            parsedData.setEmail(email);
            parsedData.setAddress(address);
            parsedData.setSummary(cv.getSummary());
            parsedData.setSkills(detectedSkills);
            try {
                if (experiencesJson != null && !experiencesJson.isBlank() && !"[]".equals(experiencesJson)) {
                    parsedData.setExperiences(objectMapper.readValue(experiencesJson, new com.fasterxml.jackson.core.type.TypeReference<List<CvParsedDTO.ExperienceItem>>() {}));
                }
                if (educationsJson != null && !educationsJson.isBlank() && !"[]".equals(educationsJson)) {
                    parsedData.setEducations(objectMapper.readValue(educationsJson, new com.fasterxml.jackson.core.type.TypeReference<List<CvParsedDTO.EducationItem>>() {}));
                }
                if (projectsJson != null && !projectsJson.isBlank() && !"[]".equals(projectsJson)) {
                    parsedData.setProjects(objectMapper.readValue(projectsJson, new com.fasterxml.jackson.core.type.TypeReference<List<CvParsedDTO.ProjectItem>>() {}));
                }
            } catch (Exception ignored) {}
        }

        String certificationsJson = "[]";
        String languagesJson = "[]";
        if (parsedData != null) {
            try {
                if ((projectsJson == null || "[]".equals(projectsJson)) && parsedData.getProjects() != null && !parsedData.getProjects().isEmpty()) {
                    projectsJson = objectMapper.writeValueAsString(parsedData.getProjects());
                }
                if (parsedData.getCertifications() != null && !parsedData.getCertifications().isEmpty()) {
                    certificationsJson = objectMapper.writeValueAsString(parsedData.getCertifications());
                }
                if (parsedData.getLanguages() != null && !parsedData.getLanguages().isEmpty()) {
                    languagesJson = objectMapper.writeValueAsString(parsedData.getLanguages());
                }
            } catch (Exception ignored) {}
        }

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
                .headline(headline)
                .experienceYears(experienceYears)
                .educationsJson(educationsJson)
                .experiencesJson(experiencesJson)
                .projectsJson(projectsJson)
                .certificationsJson(certificationsJson)
                .languagesJson(languagesJson)
                .detectedSkills(detectedSkills)
                .fullName(fullName)
                .phone(phone)
                .email(email)
                .address(address)
                .parsedJson(cv.getParsedJson())
                .parsedData(parsedData)
                .parsedText(cv.getParsedText())
                .build();
    }
}
