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

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.RecruiterRepository recruiterRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.AiJobMatchService aiJobMatchService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.AiInterviewService aiInterviewService;

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

        // Kiểm tra phân quyền giới hạn lưu trữ CV theo gói dịch vụ thật trên Supabase (Admin luôn được bypass)
        if (candidate.getRole() != com.hiremate.enums.UserRole.ADMIN) {
            int maxCvAllowed = 2; // Mặc định gói Free Candidate: tối đa 2 bản CV
            String planName = "Free Candidate";
            if (aiInterviewService != null) {
                try {
                    com.hiremate.dto.response.InterviewQuotaStatusResponse quota = aiInterviewService.getCandidateQuotaStatus(candidate);
                    if (quota != null) {
                        planName = quota.getPlanName() != null ? quota.getPlanName() : planName;
                        java.math.BigDecimal price = quota.getPrice() != null ? quota.getPrice() : java.math.BigDecimal.ZERO;
                        if (price.compareTo(new java.math.BigDecimal("100000")) >= 0 || planName.toLowerCase().contains("pro") || planName.toLowerCase().contains("ace") || planName.toLowerCase().contains("vip")) {
                            maxCvAllowed = Integer.MAX_VALUE; // Không giới hạn cho Practice Pro / Career Ace
                        } else if (price.compareTo(java.math.BigDecimal.ZERO) > 0 || planName.toLowerCase().contains("plus")) {
                            maxCvAllowed = 5; // Tối đa 5 bản CV cho Practice Plus
                        }
                    }
                } catch (Exception e) {
                    log.warn(">> Không thể kiểm tra quota gói của ứng viên khi upload CV: {}", e.getMessage());
                }
            }
            if (maxCvAllowed != Integer.MAX_VALUE && existingCvs.size() >= maxCvAllowed) {
                throw new IllegalArgumentException(String.format(
                        "Bạn đã đạt giới hạn lưu trữ tối đa (%d/%d bản CV) của gói \"%s\". Vui lòng xóa bớt CV cũ hoặc nâng cấp gói dịch vụ để lưu trữ thêm CV.",
                        existingCvs.size(), maxCvAllowed, planName));
            }
        }

        boolean isFirst = existingCvs.isEmpty();

        String parsedText = null;
        com.hiremate.dto.ai.AiCvAnalysis visionAnalysisResult = null;

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
                        int maxPages = Math.min(document.getNumberOfPages(), 3);
                        org.apache.pdfbox.rendering.PDFRenderer renderer = new org.apache.pdfbox.rendering.PDFRenderer(document);
                        List<java.awt.image.BufferedImage> pageImages = new ArrayList<>();
                        int totalHeight = 0;
                        int maxWidth = 0;

                        for (int p = 0; p < maxPages; p++) {
                            java.awt.image.BufferedImage pageImg = renderer.renderImageWithDPI(p, 140);
                            pageImages.add(pageImg);
                            totalHeight += pageImg.getHeight();
                            if (pageImg.getWidth() > maxWidth) {
                                maxWidth = pageImg.getWidth();
                            }
                        }

                        java.awt.image.BufferedImage stitched = new java.awt.image.BufferedImage(maxWidth, totalHeight, java.awt.image.BufferedImage.TYPE_INT_RGB);
                        java.awt.Graphics2D g2d = stitched.createGraphics();
                        int currentY = 0;
                        for (java.awt.image.BufferedImage pageImg : pageImages) {
                            g2d.drawImage(pageImg, 0, currentY, null);
                            currentY += pageImg.getHeight();
                        }
                        g2d.dispose();

                        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                        javax.imageio.ImageIO.write(stitched, "png", baos);
                        byte[] stitchedBytes = baos.toByteArray();
                        visionAnalysisResult = geminiAiService.analyzeCvImage(stitchedBytes, "image/png");
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
                visionAnalysisResult = geminiAiService.analyzeCvImage(file.getBytes(), mimeType);
            } catch (Exception e) {
                log.warn(">> [CvService] Không thể OCR file ảnh CV bằng Gemini Vision: {}", e.getMessage());
            }
        }

        // Nếu đã có kết quả từ Gemini Vision OCR, xây dựng parsedText đầy đủ và giữ rawJson
        String visionRawJson = null;
        if (visionAnalysisResult != null) {
            StringBuilder sb = new StringBuilder();
            if (visionAnalysisResult.getCandidateName() != null && !visionAnalysisResult.getCandidateName().isBlank()) {
                sb.append("Họ tên: ").append(visionAnalysisResult.getCandidateName()).append("\n");
            }
            if (visionAnalysisResult.getHeadline() != null && !visionAnalysisResult.getHeadline().isBlank()) {
                sb.append("Chức danh: ").append(visionAnalysisResult.getHeadline()).append("\n");
            }
            if (visionAnalysisResult.getPhone() != null && !visionAnalysisResult.getPhone().isBlank()) {
                sb.append("Số điện thoại: ").append(visionAnalysisResult.getPhone()).append("\n");
            }
            if (visionAnalysisResult.getEmail() != null && !visionAnalysisResult.getEmail().isBlank()) {
                sb.append("Email: ").append(visionAnalysisResult.getEmail()).append("\n");
            }
            if (visionAnalysisResult.getAddress() != null && !visionAnalysisResult.getAddress().isBlank()) {
                sb.append("Địa chỉ: ").append(visionAnalysisResult.getAddress()).append("\n");
            }
            if (visionAnalysisResult.getSummary() != null && !visionAnalysisResult.getSummary().isBlank()) {
                sb.append("Tóm tắt: ").append(visionAnalysisResult.getSummary()).append("\n");
            }
            if (visionAnalysisResult.getSkills() != null && !visionAnalysisResult.getSkills().isEmpty()) {
                sb.append("Kỹ năng: ").append(String.join(", ", visionAnalysisResult.getSkills())).append("\n");
            }
            if (visionAnalysisResult.getExperiencesJson() != null && !"[]".equals(visionAnalysisResult.getExperiencesJson())) {
                sb.append("Kinh nghiệm làm việc: ").append(visionAnalysisResult.getExperiencesJson()).append("\n");
            }
            if (visionAnalysisResult.getEducationsJson() != null && !"[]".equals(visionAnalysisResult.getEducationsJson())) {
                sb.append("Học vấn: ").append(visionAnalysisResult.getEducationsJson()).append("\n");
            }
            if (visionAnalysisResult.getProjectsJson() != null && !"[]".equals(visionAnalysisResult.getProjectsJson())) {
                sb.append("Dự án tiêu biểu: ").append(visionAnalysisResult.getProjectsJson()).append("\n");
            }
            if (visionAnalysisResult.getCertificationsJson() != null && !"[]".equals(visionAnalysisResult.getCertificationsJson())) {
                sb.append("Chứng chỉ: ").append(visionAnalysisResult.getCertificationsJson()).append("\n");
            }
            if (visionAnalysisResult.getLanguagesJson() != null && !"[]".equals(visionAnalysisResult.getLanguagesJson())) {
                sb.append("Ngoại ngữ: ").append(visionAnalysisResult.getLanguagesJson()).append("\n");
            }
            if (sb.length() > 0) {
                parsedText = sb.toString().trim();
                log.info(">> [CvService] Đã trích xuất cấu trúc hoàn chỉnh {} ký tự từ Gemini Vision OCR", parsedText.length());
            }
            if (visionAnalysisResult.getRawJson() != null && !visionAnalysisResult.getRawJson().isBlank()) {
                visionRawJson = visionAnalysisResult.getRawJson();
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
                .parsedJson(visionRawJson)
                .parseStatus(CvParseStatus.DONE)
                .summary(summaryText)
                .isDefault(isFirst)
                .build();

        Cv saved = cvRepository.save(cv);
        log.info("CV saved successfully for candidate ID: {}, file: {}", candidate.getUserId(), originalName);

        try {
            aiJobMatchRepository.deleteByCandidate_CandidateId(candidate.getUserId());
            log.info(">> [CvService] Đã làm mới cache AI Job Matching khi tải lên CV mới cho candidate: {}", candidate.getUserId());
        } catch (Exception ex) {
            log.warn(">> [CvService] Không thể xóa cache AI Job Match cũ: {}", ex.getMessage());
        }

        try {
            // Automatically scan and parse CV with Gemini AI to extract real profile data
            return analyzeCv(saved.getCvId(), candidate);
        } catch (Throwable e) {
            log.warn("Automatic CV analysis on upload encountered error, returning base saved CV: {}", e.getMessage());
            return mapToResponse(saved);
        }
    }

    @Override
    @Transactional
    public List<CvResponse> getCandidateCvs(Long candidateId) {
        if (candidateId == null) {
            return Collections.emptyList();
        }
        List<Cv> cvList = cvRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
        if (cvList == null || cvList.isEmpty()) {
            cvList = cvRepository.findByCandidateId(candidateId);
        }

        // Pre-fetch candidate profile data 1 lần duy nhất cho toàn bộ danh sách CV
        var cand = candidateRepository.findByCandidateId(candidateId).orElse(null);
        var candUser = userRepository.findById(candidateId).orElse(null);

        // Tự động đồng bộ bản ghi CV Trực Tuyến vào bảng cvs nếu ứng viên chưa có CV nào VÀ thực sự đã có dữ liệu hồ sơ trực tuyến
        if ((cvList == null || cvList.isEmpty()) && cand != null) {
            boolean hasBio = cand.getBio() != null && !cand.getBio().isBlank();
            boolean hasHeadline = cand.getHeadline() != null && !cand.getHeadline().isBlank();
            boolean hasExp = cand.getExperiencesJson() != null && !cand.getExperiencesJson().isBlank() && !"[]".equals(cand.getExperiencesJson().trim());
            boolean hasEdu = cand.getEducationsJson() != null && !cand.getEducationsJson().isBlank() && !"[]".equals(cand.getEducationsJson().trim());
            boolean hasOnlineProfileData = hasBio || hasHeadline || hasExp || hasEdu;

            if (hasOnlineProfileData) {
                String fullName = candUser != null && candUser.getFullName() != null
                        ? candUser.getFullName()
                        : (cand.getUser() != null ? cand.getUser().getFullName() : "HireMate");
                String cleanName = fullName != null && !fullName.isBlank() ? fullName.trim().replaceAll("\\s+", "_") : "HireMate";
                String generatedFileName = "CV_Truc_Tuyen_" + cleanName + ".pdf";

                Cv onlineCv = Cv.builder()
                        .candidateId(candidateId)
                        .fileName(generatedFileName)
                        .fileUrl("/candidate/profile")
                        .fileType("pdf")
                        .fileSizeBytes(102400)
                        .parseStatus(CvParseStatus.DONE)
                        .summary(cand.getBio() != null ? cand.getBio() : "Hồ sơ ứng viên trực tuyến đồng bộ từ hệ thống HireMate.")
                        .isDefault(true)
                        .build();

                try {
                    onlineCv = cvRepository.save(onlineCv);
                    cvList = new ArrayList<>(List.of(onlineCv));
                    log.info(">> Tự động đồng bộ bản ghi CV Trực Tuyến thành công cho ứng viên ID: {} (cvId: {})", candidateId, onlineCv.getCvId());
                } catch (Exception ex) {
                    log.warn(">> Không thể tự động tạo CV Trực Tuyến cho ứng viên {}: {}", candidateId, ex.getMessage());
                }
            }
        }

        if (cvList == null || cvList.isEmpty()) {
            return Collections.emptyList();
        }

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

        try {
            aiJobMatchRepository.deleteByCandidate_CandidateId(candidate.getUserId());
            log.info(">> [CvService] Đã làm mới cache AI Job Matching khi đổi CV mặc định cho candidate: {}", candidate.getUserId());
        } catch (Exception ex) {
            log.warn(">> [CvService] Không thể xóa cache AI Job Match cũ: {}", ex.getMessage());
        }

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

        // Kiểm tra xem CV có đang nằm trong các đơn ứng tuyển đang xét duyệt không
        long activeApps = applicationRepository.countActiveApplicationsByCvId(cvId);
        if (activeApps > 0) {
            throw new IllegalStateException("CV này đang được sử dụng trong các đơn ứng tuyển đang xét duyệt, không thể xóa để bảo toàn hồ sơ gửi tới Nhà tuyển dụng.");
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
        List<Cv> remaining = cvRepository.findByCandidateId(candidate.getUserId());
        if (Boolean.TRUE.equals(cv.getIsDefault())) {
            if (!remaining.isEmpty()) {
                Cv newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                cvRepository.save(newDefault);
                log.info("Promoted CV {} as new default for candidate {}", newDefault.getCvId(), candidate.getUserId());
            }
        }

        // 5. Nếu sau khi xóa mà không còn CV nào và CV vừa xóa là CV Trực Tuyến ("/candidate/profile"),
        // xóa trắng thông tin hồ sơ để lần gọi getMyCvs tiếp theo không tự động sinh lại CV
        if (remaining.isEmpty() && cv.getFileUrl() != null && cv.getFileUrl().contains("/candidate/profile")) {
            candidateRepository.findByCandidateId(candidate.getUserId()).ifPresent(cand -> {
                cand.setBio(null);
                cand.setHeadline(null);
                cand.setExperiencesJson(null);
                cand.setEducationsJson(null);
                cand.setProjectsJson(null);
                candidateRepository.save(cand);
                log.info(">> Đã xóa trắng dữ liệu hồ sơ trực tuyến của candidate ID: {} sau khi xóa CV Trực Tuyến cuối cùng.", candidate.getUserId());
            });
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

        // 1. Nếu cv.getParsedJson() (hoặc cv.getAiAnalysisJson()) đã có sẵn JSON hợp lệ (ví dụ từ Gemini Vision OCR lúc upload),
        // hãy tái sử dụng và parse trực tiếp thay vì gọi lại Gemini API lần thứ 2
        if (cv.getParsedJson() != null && !cv.getParsedJson().isBlank() && cv.getParsedJson().trim().startsWith("{")) {
            try {
                analysis = geminiAiService.parseCvAnalysisJson(cv.getParsedJson(), textToAnalyze);
                log.info(">> [CvService] Tái sử dụng kết quả phân tích JSON đã lưu trữ cho CV ID: {}", cvId);
            } catch (Exception e) {
                log.warn(">> [CvService] Parse cached parsedJson failed, fallback to fresh analysis: {}", e.getMessage());
            }
        }

        // 2. Nếu chưa có analysis và có parsedText -> Phân tích bằng mô hình ATS Text Engine
        if (analysis == null && textToAnalyze != null && !textToAnalyze.isBlank()) {
            analysis = geminiAiService.analyzeCv(textToAnalyze);
        } else if (analysis == null && cv.getFileUrl() != null) {
            // 3. Nếu chưa có parsedText mà file là ảnh (PNG, JPG, WEBP) -> Phân tích bằng Gemini Multimodal Vision OCR
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

        // Fallback nếu cả các phương thức trên đều chưa có kết quả
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

        // Nếu CV không có mục kỹ năng riêng biệt (< 2 kỹ năng), tự động suy luận kỹ năng từ tiêu đề, tóm tắt và kinh nghiệm
        if ((allDetectedSkills == null || allDetectedSkills.size() < 2) && skillService != null) {
            try {
                String contextTitle = analysis.getHeadline() != null && !analysis.getHeadline().isBlank()
                        ? analysis.getHeadline()
                        : "Chuyên viên";
                String contextDesc = String.join("\n",
                        analysis.getSummary() != null ? analysis.getSummary() : "",
                        analysis.getExperiencesJson() != null ? analysis.getExperiencesJson() : "",
                        analysis.getEducationsJson() != null ? analysis.getEducationsJson() : ""
                ).trim();
                if (!contextDesc.isBlank()) {
                    com.hiremate.dto.request.AiJdSkillExtractRequest extractReq = com.hiremate.dto.request.AiJdSkillExtractRequest.builder()
                            .title(contextTitle)
                            .description(contextDesc)
                            .build();
                    com.hiremate.dto.response.AiJdSkillExtractResponse autoSkills = skillService.extractSkillsFromJd(extractReq);
                    if (autoSkills != null) {
                        List<String> inferred = new ArrayList<>();
                        if (allDetectedSkills != null) inferred.addAll(allDetectedSkills);
                        if (autoSkills.getMandatorySkills() != null) {
                            for (com.hiremate.dto.response.SkillItemDTO item : autoSkills.getMandatorySkills()) {
                                if (item.getSkillName() != null && !inferred.contains(item.getSkillName())) {
                                    inferred.add(item.getSkillName());
                                }
                            }
                        }
                        if (autoSkills.getPreferredSkills() != null) {
                            for (com.hiremate.dto.response.SkillItemDTO item : autoSkills.getPreferredSkills()) {
                                if (item.getSkillName() != null && !inferred.contains(item.getSkillName())) {
                                    inferred.add(item.getSkillName());
                                }
                            }
                        }
                        allDetectedSkills = inferred;
                        analysis.setSkills(inferred);
                        log.info(">> [CvService] Tự động suy luận {} kỹ năng chuyên môn từ hồ sơ CV ID: {}", inferred.size(), cvId);
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [CvService] Tự động suy luận kỹ năng thất bại: {}", ex.getMessage());
            }
        }

        List<String> normalizedSkillNames = new ArrayList<>();
        if (allDetectedSkills != null) {
            Set<Long> currentCvSkillIds = new HashSet<>();

            for (String rawSkill : allDetectedSkills) {
                if (rawSkill == null || rawSkill.isBlank()) continue;
                String[] subSkills = rawSkill.split("[,;•|\\t]");
                for (String s : subSkills) {
                    String trimmedSkill = s.trim();
                    if (trimmedSkill.isBlank() || trimmedSkill.length() > 65 || trimmedSkill.length() < 2) continue;
                    String lower = trimmedSkill.toLowerCase();
                    if (lower.startsWith("nếu") || lower.contains("kinh nghiệm") || lower.contains("dự án") 
                            || lower.contains("thay phần này") || lower.contains("hướng dẫn") || lower.contains("tháng/năm")
                            || lower.contains("[") || lower.contains("]") || lower.contains("theo dõi") || lower.contains("chuẩn bị")
                            || lower.contains("từng làm") || lower.contains("kết quả") || lower.contains("quy mô") || lower.contains("công nghệ")
                            || lower.contains("tiếng việt") || lower.contains("áp lực cao")
                            || trimmedSkill.length() > 65) {
                        continue;
                    }
                    try {
                        com.hiremate.entity.Skill skill = skillService.findOrCreateNormalizedSkill(trimmedSkill, null, null);
                        if (skill != null) {
                            if (!normalizedSkillNames.contains(skill.getSkillName())) {
                                normalizedSkillNames.add(skill.getSkillName());
                            }
                            currentCvSkillIds.add(skill.getSkillId());
                        }
                    } catch (Exception skillEx) {
                        log.warn(">> [CvService] Bỏ qua kỹ năng '{}' do lỗi: {}", trimmedSkill, skillEx.getMessage());
                    }
                }
            }

            // Đồng bộ bảng candidate_skills: Xóa các skill cũ của ứng viên mà không còn trong CV mới
            try {
                List<com.hiremate.entity.CandidateSkill> existingList = candidateSkillRepository.findByProfileId(candidate.getUserId());
                for (com.hiremate.entity.CandidateSkill cs : existingList) {
                    if (cs.getSkillId() != null && !currentCvSkillIds.contains(cs.getSkillId())) {
                        candidateSkillRepository.delete(cs);
                    }
                }
                Set<Long> keptIds = existingList.stream()
                        .map(com.hiremate.entity.CandidateSkill::getSkillId)
                        .filter(currentCvSkillIds::contains)
                        .collect(java.util.stream.Collectors.toSet());
                for (Long sid : currentCvSkillIds) {
                    if (!keptIds.contains(sid)) {
                        candidateSkillRepository.save(com.hiremate.entity.CandidateSkill.builder()
                                .profileId(candidate.getUserId())
                                .skillId(sid)
                                .proficiencyLevel(com.hiremate.enums.SkillProficiency.INTERMEDIATE)
                                .aiDetected(true)
                                .build());
                    }
                }
            } catch (Exception ex) {
                log.warn(">> [CvService] Lỗi khi đồng bộ candidate_skills: {}", ex.getMessage());
            }
        }

        // Cập nhật danh sách kỹ năng đã được chuẩn hóa vào analysis và JSON
        if (!normalizedSkillNames.isEmpty()) {
            analysis.setSkills(normalizedSkillNames);
            try {
                String rawJson = analysis.getRawJson();
                if (rawJson != null && !rawJson.isBlank() && rawJson.trim().startsWith("{")) {
                    com.fasterxml.jackson.databind.node.ObjectNode rootNode = (com.fasterxml.jackson.databind.node.ObjectNode) objectMapper.readTree(rawJson);
                    com.fasterxml.jackson.databind.node.ArrayNode skillsArr = rootNode.putArray("skills");
                    for (String sk : normalizedSkillNames) {
                        skillsArr.add(sk);
                    }

                    // Đồng bộ skill_categories / skillCategories
                    Set<String> categorizedSkills = new HashSet<>();
                    com.fasterxml.jackson.databind.node.ArrayNode catArr = null;
                    if (rootNode.has("skill_categories") && rootNode.get("skill_categories").isArray()) {
                        catArr = (com.fasterxml.jackson.databind.node.ArrayNode) rootNode.get("skill_categories");
                    } else if (rootNode.has("skillCategories") && rootNode.get("skillCategories").isArray()) {
                        catArr = (com.fasterxml.jackson.databind.node.ArrayNode) rootNode.get("skillCategories");
                    } else {
                        catArr = rootNode.putArray("skill_categories");
                    }

                    // Chuẩn hóa tên các kỹ năng đang có trong từng nhóm
                    for (int i = 0; i < catArr.size(); i++) {
                        com.fasterxml.jackson.databind.JsonNode catNode = catArr.get(i);
                        if (catNode.isObject()) {
                            com.fasterxml.jackson.databind.node.ObjectNode catObj = (com.fasterxml.jackson.databind.node.ObjectNode) catNode;
                            String itemsKey = catObj.has("items") ? "items" : (catObj.has("skills") ? "skills" : null);
                            if (itemsKey != null && catObj.get(itemsKey).isArray()) {
                                com.fasterxml.jackson.databind.node.ArrayNode oldItems = (com.fasterxml.jackson.databind.node.ArrayNode) catObj.get(itemsKey);
                                com.fasterxml.jackson.databind.node.ArrayNode newItems = objectMapper.createArrayNode();
                                for (int j = 0; j < oldItems.size(); j++) {
                                    String rawItem = oldItems.get(j).asText();
                                    String norm = skillService.normalizeSkillName(rawItem);
                                    if (!norm.isBlank()) {
                                        newItems.add(norm);
                                        categorizedSkills.add(norm.toLowerCase());
                                    }
                                }
                                catObj.set(itemsKey, newItems);
                            }
                        }
                    }

                    // Kiểm tra xem kỹ năng nào trong normalizedSkillNames chưa có trong category nào
                    List<String> unmapped = new ArrayList<>();
                    for (String sk : normalizedSkillNames) {
                        if (!categorizedSkills.contains(sk.toLowerCase())) {
                            unmapped.add(sk);
                        }
                    }

                    if (!unmapped.isEmpty()) {
                        if (catArr.isEmpty()) {
                            com.fasterxml.jackson.databind.node.ObjectNode defaultCat = catArr.addObject();
                            defaultCat.put("category", "Kỹ năng chuyên môn");
                            com.fasterxml.jackson.databind.node.ArrayNode itemsNode = defaultCat.putArray("items");
                            for (String sk : unmapped) {
                                itemsNode.add(sk);
                            }
                        } else {
                            // Thêm vào nhóm đầu tiên
                            com.fasterxml.jackson.databind.JsonNode firstCat = catArr.get(0);
                            if (firstCat.isObject()) {
                                com.fasterxml.jackson.databind.node.ObjectNode firstObj = (com.fasterxml.jackson.databind.node.ObjectNode) firstCat;
                                String itemsKey = firstObj.has("items") ? "items" : "skills";
                                com.fasterxml.jackson.databind.node.ArrayNode itemsNode;
                                if (firstObj.has(itemsKey) && firstObj.get(itemsKey).isArray()) {
                                    itemsNode = (com.fasterxml.jackson.databind.node.ArrayNode) firstObj.get(itemsKey);
                                } else {
                                    itemsNode = firstObj.putArray("items");
                                }
                                for (String sk : unmapped) {
                                    itemsNode.add(sk);
                                }
                            }
                        }
                    }

                    rootNode.set("skill_categories", catArr);
                    rootNode.set("skillCategories", catArr);

                    analysis.setRawJson(objectMapper.writeValueAsString(rootNode));
                }
            } catch (Exception ex) {
                log.warn(">> [CvService] Cập nhật kỹ năng chuẩn hóa vào rawJson lỗi: {}", ex.getMessage());
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

        // 7. Làm mới cache AI Job Matching: Xóa cache cũ trước để tránh Race Condition
        try {
            aiJobMatchRepository.deleteByCandidate_CandidateId(candidate.getUserId());
            log.info(">> [CvService] Đã xóa cache AI Job Matching cũ trước khi tính điểm mới cho candidate: {}", candidate.getUserId());
        } catch (Exception ex) {
            log.warn(">> [CvService] Không thể xóa cache AI Job Match cũ: {}", ex.getMessage());
        }

        // Tự động tính toán & lưu cache ma trận khớp nối việc làm AI (Rule 3) chạy async ngầm
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
        if (updateDto.getSkills() != null) {
            Set<Long> targetSkillIds = new HashSet<>();
            for (String skillName : updateDto.getSkills()) {
                if (skillName == null || skillName.isBlank()) continue;
                String trimmed = skillName.trim();
                try {
                    com.hiremate.entity.Skill skill = skillService.findOrCreateNormalizedSkill(trimmed, null, null);
                    if (skill != null && skill.getSkillId() != null) {
                        targetSkillIds.add(skill.getSkillId());
                    }
                } catch (Exception ex) {
                    log.warn(">> [CvService] Lỗi khi chuẩn hóa kỹ năng '{}': {}", trimmed, ex.getMessage());
                }
            }

            // Đồng bộ candidate_skills: xóa các skill cũ không còn trong danh sách mới
            List<com.hiremate.entity.CandidateSkill> currentCandSkills = candidateSkillRepository.findByProfileId(candidate.getUserId());
            Set<Long> existingIds = new HashSet<>();
            for (com.hiremate.entity.CandidateSkill cs : currentCandSkills) {
                if (!targetSkillIds.contains(cs.getSkillId())) {
                    candidateSkillRepository.delete(cs);
                } else {
                    existingIds.add(cs.getSkillId());
                }
            }

            // Thêm các skill mới chưa có
            for (Long skillId : targetSkillIds) {
                if (!existingIds.contains(skillId)) {
                    candidateSkillRepository.save(com.hiremate.entity.CandidateSkill.builder()
                            .profileId(candidate.getUserId())
                            .skillId(skillId)
                            .proficiencyLevel(com.hiremate.enums.SkillProficiency.INTERMEDIATE)
                            .aiDetected(true)
                            .build());
                }
            }

            // Tự động tính toán lại AI Matching bất đồng bộ sau khi cập nhật CV
            CompletableFuture.runAsync(() -> {
                try {
                    if (aiJobMatchService != null) {
                        aiJobMatchService.reMatchJobs(candidate);
                        log.info(">> [CvService] Re-matched jobs successfully after updating CV skills for user: {}", candidate.getUserId());
                    }
                } catch (Exception matchEx) {
                    log.warn(">> [CvService] Lỗi khi re-match việc làm sau khi cập nhật CV: {}", matchEx.getMessage());
                }
            });
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

        CvParsedDTO parsedData = null;
        if (cv.getParsedJson() != null && !cv.getParsedJson().isBlank()) {
            try {
                parsedData = objectMapper.readValue(cv.getParsedJson(), CvParsedDTO.class);
            } catch (Exception e) {
                log.warn("Error parsing parsedJson for CV {}: {}", cv.getCvId(), e.getMessage());
            }
        }

        // 1. Ưu tiên dữ liệu riêng của chính bản CV từ parsedData
        if (parsedData != null) {
            if (parsedData.getFullName() != null && !parsedData.getFullName().isBlank()) {
                fullName = parsedData.getFullName().trim();
            }
            if (parsedData.getHeadline() != null && !parsedData.getHeadline().isBlank()) {
                headline = parsedData.getHeadline().trim();
            }
            if (parsedData.getPhone() != null && !parsedData.getPhone().isBlank()) {
                phone = parsedData.getPhone().trim();
            }
            if (parsedData.getEmail() != null && !parsedData.getEmail().isBlank()) {
                email = parsedData.getEmail().trim();
            }
            if (parsedData.getAddress() != null && !parsedData.getAddress().isBlank()) {
                address = parsedData.getAddress().trim();
            }
            if (parsedData.getYearsOfExperience() != null) {
                experienceYears = parsedData.getYearsOfExperience();
            }
            if (parsedData.getExperiences() != null && !parsedData.getExperiences().isEmpty()) {
                try {
                    experiencesJson = objectMapper.writeValueAsString(parsedData.getExperiences());
                } catch (Exception ignored) {}
            }
            if (parsedData.getEducations() != null && !parsedData.getEducations().isEmpty()) {
                try {
                    educationsJson = objectMapper.writeValueAsString(parsedData.getEducations());
                } catch (Exception ignored) {}
            }
            if (parsedData.getProjects() != null && !parsedData.getProjects().isEmpty()) {
                try {
                    projectsJson = objectMapper.writeValueAsString(parsedData.getProjects());
                } catch (Exception ignored) {}
            }
        }

        // 2. Chỉ khi parsedData thiếu, mới fallback sang Candidate và User Profile
        if (cv.getCandidateId() != null) {
            var cand = prefetchedCand != null ? prefetchedCand : candidateRepository.findByCandidateId(cv.getCandidateId()).orElse(null);
            if (cand != null) {
                if (headline == null || headline.isBlank()) headline = cand.getHeadline();
                if (experienceYears == null) experienceYears = cand.getExperienceYears();
                if (educationsJson == null || educationsJson.isBlank() || "[]".equals(educationsJson)) educationsJson = cand.getEducationsJson();
                if (experiencesJson == null || experiencesJson.isBlank() || "[]".equals(experiencesJson)) experiencesJson = cand.getExperiencesJson();
                if (projectsJson == null || projectsJson.isBlank() || "[]".equals(projectsJson)) projectsJson = cand.getProjectsJson();
                if (address == null || address.isBlank()) address = cand.getLocation();
            }
            User candUser = prefetchedUser != null ? prefetchedUser : userRepository.findById(cv.getCandidateId()).orElse(null);
            if (candUser != null) {
                if (fullName == null || fullName.isBlank()) fullName = candUser.getFullName();
                if (phone == null || phone.isBlank()) phone = candUser.getPhone();
                if (email == null || email.isBlank()) email = candUser.getEmail();
                if (address == null || address.isBlank()) address = candUser.getAddress();
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

    @Override
    public String rewriteSummary(com.hiremate.dto.request.RewriteSummaryRequest request, User candidate) {
        log.info(">> [CvService] Candidate #{} requesting AI summary rewrite for target title: {}",
                candidate != null ? candidate.getUserId() : "null", request != null ? request.getTargetTitle() : "null");
        if (request == null) {
            return "Chuyên viên với kinh nghiệm thực tế, năng động, tận tâm và cam kết mang lại giá trị cao trong công việc.";
        }
        return geminiAiService.rewriteCandidateSummary(
                request.getTargetTitle(),
                request.getCurrentSummary(),
                request.getSkills(),
                request.getExperiences(),
                request.getEducations()
        );
    }

    @Override
    public boolean isAuthorizedToAccessCv(Long cvId, User user) {
        if (user == null || cvId == null) return false;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return true;
        }
        Cv cv = cvRepository.findById(cvId).orElse(null);
        if (cv == null) return false;

        // 1. Chính ứng viên sở hữu CV
        if (cv.getCandidateId().equals(user.getUserId())) {
            return true;
        }

        // 2. Recruiter: Phải có ứng tuyển hợp lệ nộp vào tin của Recruiter hoặc công ty của Recruiter
        if (user.getRole() == com.hiremate.enums.UserRole.RECRUITER) {
            if (applicationRepository.existsByCvIdAndRecruiterId(cvId, user.getUserId())) {
                return true;
            }
            if (recruiterRepository != null) {
                com.hiremate.entity.Recruiter rec = recruiterRepository.findById(user.getUserId()).orElse(null);
                if (rec != null && rec.getCompany() != null) {
                    Long companyId = rec.getCompany().getCompanyId();
                    if (applicationRepository.existsByCvIdAndCompanyId(cvId, companyId)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
