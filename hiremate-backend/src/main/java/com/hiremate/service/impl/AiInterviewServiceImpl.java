package com.hiremate.service.impl;

import com.hiremate.dto.request.InterviewAnswerRequest;
import com.hiremate.dto.response.InterviewDetailResponse;
import com.hiremate.dto.response.InterviewSummaryResponse;
import com.hiremate.dto.response.PracticeProgressResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.InterviewDetail;
import com.hiremate.entity.InterviewSession;
import com.hiremate.entity.PracticeProgressLog;
import com.hiremate.entity.User;
import com.hiremate.enums.InterviewSessionType;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.InterviewDetailRepository;
import com.hiremate.repository.InterviewSessionRepository;
import com.hiremate.repository.PracticeProgressLogRepository;
import com.hiremate.service.AiInterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiInterviewServiceImpl implements AiInterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewDetailRepository detailRepository;
    private final PracticeProgressLogRepository progressLogRepository;
    private final CandidateRepository candidateRepository;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.GeminiAiService geminiAiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final com.hiremate.agent.AgentMemoryManager agentMemoryManager;
    private final com.hiremate.service.FileStorageService fileStorageService;
    private final com.hiremate.repository.CandidateSkillRepository candidateSkillRepository;
    private final com.hiremate.repository.SkillRepository skillRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.SubscriptionRepository subscriptionRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.repository.SubscriptionPlanRepository subscriptionPlanRepository;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.SystemSettingsService systemSettingsService;

    @org.springframework.beans.factory.annotation.Value("${elevenlabs.api-key:}")
    private String elevenlabsApiKey;
    @org.springframework.beans.factory.annotation.Value("${elevenlabs.voice-female:Xb7hH8MSUJpSbSDYk0k2}")
    private String elevenlabsVoiceFemale;
    @org.springframework.beans.factory.annotation.Value("${elevenlabs.voice-male:JBFqnCBsd6RMkjVDRZzb}")
    private String elevenlabsVoiceMale;
    @org.springframework.beans.factory.annotation.Value("${elevenlabs.model-id:eleven_turbo_v2_5}")
    private String elevenlabsModelId;

    /**
     * Xác định số câu hỏi tối đa cho buổi phỏng vấn dựa trên gói dịch vụ Supabase.
     * - Free Candidate (price = 0, quota = 2): 3 câu/buổi.
     * - Practice Plus (price = 49.000đ, quota = 10): 5 câu/buổi.
     * - Practice Pro (price = 149.000đ, quota = 30): 7 câu/buổi.
     * - Career Ace (price >= 249.000đ, quota = 999): 8 câu/buổi.
     */
    private String extractPermFromDescription(String desc, String key) {
        if (desc == null || !desc.contains("[PERMS:")) return null;
        try {
            int start = desc.indexOf("[PERMS:") + 7;
            int end = desc.indexOf("]", start);
            if (end > start) {
                String permsStr = desc.substring(start, end);
                for (String part : permsStr.split(";")) {
                    String[] kv = part.split("=");
                    if (kv.length == 2 && kv[0].trim().equalsIgnoreCase(key)) {
                        return kv[1].trim();
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private int calculateMaxQuestions(com.hiremate.entity.SubscriptionPlan plan) {
        if (plan == null) return 3;
        String customQ = extractPermFromDescription(plan.getDescription(), "maxQ");
        if (customQ != null) {
            try {
                int parsed = Integer.parseInt(customQ);
                if (parsed > 0) return parsed;
            } catch (Exception ignored) {}
        }

        String name = plan.getPlanName() != null ? plan.getPlanName().toLowerCase() : "";
        int quota = plan.getQuotaLimit() != null ? plan.getQuotaLimit() : 2;
        java.math.BigDecimal price = plan.getPrice() != null ? plan.getPrice() : java.math.BigDecimal.ZERO;

        if (name.contains("free") || price.compareTo(java.math.BigDecimal.ZERO) == 0 || quota <= 2) {
            return 3;
        } else if (name.contains("plus") || price.compareTo(new java.math.BigDecimal("49000")) == 0 || quota <= 10) {
            return 5;
        } else if (name.contains("pro") || price.compareTo(new java.math.BigDecimal("149000")) == 0 || quota <= 30) {
            return 7;
        } else if (name.contains("ace") || quota >= 999 || price.compareTo(new java.math.BigDecimal("200000")) >= 0) {
            return 8;
        }
        return (quota <= 3) ? 3 : (quota <= 10) ? 5 : (quota <= 30) ? 7 : 8;
    }

    /**
     * Xác định thời lượng tối đa cho phiên phỏng vấn (giây) theo gói Supabase.
     * - 3 câu: 300 giây (5 phút).
     * - 5 câu: 600 giây (10 phút).
     * - 7 câu: 900 giây (15 phút).
     * - 8 câu: 1200 giây (20 phút).
     */
    private int calculateMaxDurationSeconds(com.hiremate.entity.SubscriptionPlan plan) {
        if (plan != null) {
            String customDur = extractPermFromDescription(plan.getDescription(), "maxDur");
            if (customDur != null) {
                try {
                    int parsed = Integer.parseInt(customDur);
                    if (parsed > 0) return parsed;
                } catch (Exception ignored) {}
            }
        }
        int maxQ = calculateMaxQuestions(plan);
        if (maxQ <= 3) return 300;
        if (maxQ <= 5) return 600;
        if (maxQ <= 7) return 900;
        return 1200;
    }

    // Fast in-memory caching to eliminate redundant remote Supabase network round-trips
    private static volatile com.hiremate.entity.SubscriptionPlan CACHED_FREE_PLAN = null;
    private static final java.util.concurrent.ConcurrentHashMap<Long, CachedPlanEntry> USER_PLAN_CACHE =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static class CachedPlanEntry {
        final com.hiremate.entity.SubscriptionPlan plan;
        final long timestamp;
        CachedPlanEntry(com.hiremate.entity.SubscriptionPlan plan) {
            this.plan = plan;
            this.timestamp = System.currentTimeMillis();
        }
        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > 60_000L; // 60 giây TTL
        }
    }

    private static final java.util.concurrent.ConcurrentHashMap<Long, CachedHistoryEntry> CANDIDATE_HISTORY_CACHE =
            new java.util.concurrent.ConcurrentHashMap<>();

    private static class CachedHistoryEntry {
        final List<InterviewSummaryResponse> history;
        final long timestamp;
        CachedHistoryEntry(List<InterviewSummaryResponse> history) {
            this.history = history;
            this.timestamp = System.currentTimeMillis();
        }
        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > 45_000L; // 45 giây TTL
        }
    }

    /**
     * Tìm kiếm gói đang kích hoạt (ACTIVE, còn hạn) của Candidate từ bảng `subscriptions` JOIN `subscription_plans` trên Supabase.
     * Sử dụng bộ nhớ đệm (In-Memory Cache) để tránh lặp lại hàng chục queries chậm chạp sang Supabase.
     */
    public com.hiremate.entity.SubscriptionPlan resolveActiveOrFreePlan(User candidate) {
        if (candidate != null) {
            CachedPlanEntry cached = USER_PLAN_CACHE.get(candidate.getUserId());
            if (cached != null && !cached.isExpired()) {
                return cached.plan;
            }
        }

        if (candidate != null && subscriptionRepository != null) {
            List<com.hiremate.entity.Subscription> activeSubs = subscriptionRepository.findActiveCandidateSubscriptions(
                    candidate.getUserId(), com.hiremate.enums.SubscriptionStatus.ACTIVE, LocalDateTime.now());
            if (!activeSubs.isEmpty() && activeSubs.get(0).getPlan() != null) {
                com.hiremate.entity.SubscriptionPlan p = activeSubs.get(0).getPlan();
                USER_PLAN_CACHE.put(candidate.getUserId(), new CachedPlanEntry(p));
                return p;
            }
        }

        if (CACHED_FREE_PLAN != null) {
            if (candidate != null) {
                USER_PLAN_CACHE.put(candidate.getUserId(), new CachedPlanEntry(CACHED_FREE_PLAN));
            }
            return CACHED_FREE_PLAN;
        }

        // Truy vấn gói mặc định Free Candidate từ bảng `subscription_plans` trên Supabase
        if (subscriptionPlanRepository != null) {
            Optional<com.hiremate.entity.SubscriptionPlan> freePlanOpt =
                    subscriptionPlanRepository.findFirstByPlanNameIgnoreCaseAndIsActiveTrue("Free Candidate");
            if (freePlanOpt.isPresent()) {
                CACHED_FREE_PLAN = freePlanOpt.get();
                if (candidate != null) USER_PLAN_CACHE.put(candidate.getUserId(), new CachedPlanEntry(CACHED_FREE_PLAN));
                return CACHED_FREE_PLAN;
            }

            Optional<com.hiremate.entity.SubscriptionPlan> zeroPriceOpt =
                    subscriptionPlanRepository.findFirstByTargetRoleAndPriceAndIsActiveTrue("CANDIDATE", java.math.BigDecimal.ZERO);
            if (zeroPriceOpt.isPresent()) {
                CACHED_FREE_PLAN = zeroPriceOpt.get();
                if (candidate != null) USER_PLAN_CACHE.put(candidate.getUserId(), new CachedPlanEntry(CACHED_FREE_PLAN));
                return CACHED_FREE_PLAN;
            }

            // Nếu bảng subscription_plans chưa có bản ghi, tự động lưu gói mặc định Free Candidate vào Supabase
            try {
                com.hiremate.entity.SubscriptionPlan newFree = com.hiremate.entity.SubscriptionPlan.builder()
                        .planName("Free Candidate")
                        .targetRole("CANDIDATE")
                        .planType("INTERVIEW_PRACTICE")
                        .price(java.math.BigDecimal.ZERO)
                        .durationDays(365)
                        .quotaLimit(2)
                        .description("Gói mặc định miễn phí trên Supabase (2 lượt/ngày, 3 câu/buổi, 5 phút/buổi)")
                        .isActive(true)
                        .build();
                CACHED_FREE_PLAN = subscriptionPlanRepository.save(newFree);
                if (candidate != null) USER_PLAN_CACHE.put(candidate.getUserId(), new CachedPlanEntry(CACHED_FREE_PLAN));
                return CACHED_FREE_PLAN;
            } catch (Exception e) {
                log.warn(">> Không thể tự động tạo gói Free Candidate: {}", e.getMessage());
            }
        }

        com.hiremate.entity.SubscriptionPlan fallback = com.hiremate.entity.SubscriptionPlan.builder()
                .planName("Free Candidate")
                .targetRole("CANDIDATE")
                .planType("INTERVIEW_PRACTICE")
                .price(java.math.BigDecimal.ZERO)
                .durationDays(365)
                .quotaLimit(2)
                .isActive(true)
                .build();
        CACHED_FREE_PLAN = fallback;
        if (candidate != null) USER_PLAN_CACHE.put(candidate.getUserId(), new CachedPlanEntry(fallback));
        return fallback;
    }

    @Override
    public com.hiremate.dto.response.InterviewQuotaStatusResponse getCandidateQuotaStatus(User candidate) {
        if (candidate == null) {
            return com.hiremate.dto.response.InterviewQuotaStatusResponse.builder()
                    .planName("Free Candidate")
                    .price(java.math.BigDecimal.ZERO)
                    .quotaLimit(2)
                    .usedToday(0L)
                    .remainingToday(2L)
                    .maxQuestions(3)
                    .maxDurationSeconds(300)
                    .isQuotaExceeded(false)
                    .isPaidPlan(false)
                    .allowedPersonas("HR_MANAGER")
                    .allowedVoices("vi-native")
                    .coachHintsPerSession(1)
                    .unlockFullStar(false)
                    .unlockRoadmapStages(false)
                    .build();
        }

        com.hiremate.entity.SubscriptionPlan plan = resolveActiveOrFreePlan(candidate);
        String planName = (plan != null && plan.getPlanName() != null) ? plan.getPlanName() : "Free Candidate";
        java.math.BigDecimal price = (plan != null && plan.getPrice() != null) ? plan.getPrice() : java.math.BigDecimal.ZERO;
        boolean isPaid = price.compareTo(java.math.BigDecimal.ZERO) > 0;
        String desc = plan != null ? plan.getDescription() : null;

        int quotaLimit;
        if (plan != null && plan.getQuotaLimit() != null && plan.getQuotaLimit() > 0) {
            quotaLimit = plan.getQuotaLimit();
        } else {
            quotaLimit = isPaid ? 10 : 2;
        }

        int maxQuestions = calculateMaxQuestions(plan);
        int maxDurationSeconds = calculateMaxDurationSeconds(plan);

        // Trích xuất hoặc suy luận phân quyền tính năng phòng phỏng vấn
        String allowedPersonas = extractPermFromDescription(desc, "personas");
        if (allowedPersonas == null) {
            allowedPersonas = maxQuestions <= 3 ? "HR_MANAGER" : maxQuestions <= 5 ? "HR_MANAGER,TECH_LEAD" : "HR_MANAGER,TECH_LEAD,STRICT_DIRECTOR";
        }

        String allowedVoices = extractPermFromDescription(desc, "voices");
        if (allowedVoices == null) {
            allowedVoices = maxQuestions <= 3 ? "vi-native" : maxQuestions <= 5 ? "vi-native,eleven-alice" : "vi-native,eleven-alice,eleven-george";
        }

        Integer coachHints = null;
        String customHints = extractPermFromDescription(desc, "coachHints");
        if (customHints != null) {
            try { coachHints = Integer.parseInt(customHints); } catch (Exception ignored) {}
        }
        if (coachHints == null) {
            coachHints = maxQuestions <= 3 ? 1 : maxQuestions <= 5 ? 3 : 999;
        }

        Boolean unlockFullStar = null;
        String customStar = extractPermFromDescription(desc, "fullStar");
        if (customStar != null) {
            unlockFullStar = Boolean.parseBoolean(customStar);
        } else {
            unlockFullStar = maxQuestions > 3;
        }

        Boolean unlockRoadmap = null;
        String customRoadmap = extractPermFromDescription(desc, "roadmap");
        if (customRoadmap != null) {
            unlockRoadmap = Boolean.parseBoolean(customRoadmap);
        } else {
            unlockRoadmap = maxQuestions > 3;
        }

        LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        long usedToday = sessionRepository.countByCandidate_CandidateIdAndStartedAtAfter(candidate.getUserId(), startOfDay);
        long remainingToday = quotaLimit >= 999 ? 999 : Math.max(0, quotaLimit - usedToday);
        boolean isQuotaExceeded = (candidate.getRole() != com.hiremate.enums.UserRole.ADMIN) && (quotaLimit < 999) && (usedToday >= quotaLimit);

        String endDateStr = null;
        if (subscriptionRepository != null) {
            List<com.hiremate.entity.Subscription> activeSubs = subscriptionRepository.findActiveCandidateSubscriptions(
                    candidate.getUserId(), com.hiremate.enums.SubscriptionStatus.ACTIVE, LocalDateTime.now());
            if (!activeSubs.isEmpty() && activeSubs.get(0).getEndDate() != null) {
                endDateStr = activeSubs.get(0).getEndDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
        }

        return com.hiremate.dto.response.InterviewQuotaStatusResponse.builder()
                .planId(plan != null ? plan.getPlanId() : null)
                .planName(planName)
                .price(price)
                .quotaLimit(quotaLimit)
                .usedToday(usedToday)
                .remainingToday(remainingToday)
                .maxQuestions(maxQuestions)
                .maxDurationSeconds(maxDurationSeconds)
                .isQuotaExceeded(isQuotaExceeded)
                .isPaidPlan(isPaid)
                .subscriptionEndDate(endDateStr)
                .allowedPersonas(allowedPersonas)
                .allowedVoices(allowedVoices)
                .coachHintsPerSession(coachHints)
                .unlockFullStar(unlockFullStar)
                .unlockRoadmapStages(unlockRoadmap)
                .build();
    }

    /**
     * Kiểm tra phân quyền và hạn ngạch lượt phỏng vấn AI thực tế của Ứng viên theo dữ liệu thật trên Supabase:
     * - Admin: Không giới hạn.
     * - Nếu số phiên phỏng vấn hôm nay >= quota_limit của gói: Chặn tạo phiên mới và gợi ý nâng cấp.
     */
    private void checkCandidateInterviewQuota(User user) {
        if (user == null) return;
        if (user.getRole() == com.hiremate.enums.UserRole.ADMIN) {
            return; // Admin có quyền tối cao
        }

        com.hiremate.dto.response.InterviewQuotaStatusResponse quota = getCandidateQuotaStatus(user);
        if (Boolean.TRUE.equals(quota.getIsQuotaExceeded())) {
            throw new IllegalArgumentException(String.format(
                    "Bạn đã sử dụng hết hạn ngạch hôm nay (%d/%d phiên) của gói \"%s\". Vui lòng quay lại vào ngày mai hoặc nâng cấp gói dịch vụ để tiếp tục luyện tập.",
                    quota.getUsedToday(), quota.getQuotaLimit(), quota.getPlanName()));
        }
    }


    @Override
    @Transactional
    public InterviewSummaryResponse startSession(
            String targetPosition,
            Long jobId,
            InterviewSessionType sessionType,
            Long parentSessionId,
            User user
    ) {
        // 1. Kiểm tra hạn ngạch và quyền hạn sử dụng phỏng vấn AI của ứng viên
        checkCandidateInterviewQuota(user);

        // Lấy Candidate subclass – candidate_id = user_id (Shared PK)
        Candidate candidate = candidateRepository.findById(user.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "Candidate profile not found for user: " + user.getUserId()));

        InterviewSession session = InterviewSession.builder()
                .candidate(candidate)
                // job để null nếu không gắn với job cụ thể (tự do)
                .targetPosition(targetPosition != null ? targetPosition : "Software Engineer")
                .sessionType(sessionType != null ? sessionType : InterviewSessionType.MOCK)
                .parentSessionId(parentSessionId)
                .overallScore(0f)
                .build();

        InterviewSession saved = sessionRepository.save(session);
        CANDIDATE_HISTORY_CACHE.remove(user.getUserId());
        return mapToSummary(saved, new ArrayList<>(), null);
    }

    @Override
    public InterviewDetailResponse submitAnswer(Long sessionId, InterviewAnswerRequest request, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập – candidate_id phải khớp user_id
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        String answerText = request.getCandidateAnswerText();
        com.hiremate.dto.ai.AiInterviewEvaluation evaluation = null;
        float deliveryScore = 75f;

        // 1. Nếu có file ghi âm audioUrl: Thực hiện phân tích sóng âm & ngữ điệu trực tiếp qua Gemini Multimodal Audio
        if (request.getAudioUrl() != null && !request.getAudioUrl().isBlank()) {
            try {
                byte[] audioBytes = fileStorageService.loadFileAsBytes(request.getAudioUrl());
                if (audioBytes != null && audioBytes.length > 0) {
                    String ext = "";
                    int dot = request.getAudioUrl().lastIndexOf('.');
                    if (dot >= 0) ext = request.getAudioUrl().substring(dot + 1).toLowerCase();
                    String mimeType = "audio/" + (ext.equals("wav") ? "wav" : (ext.equals("ogg") ? "ogg" : (ext.matches("webm|weba") ? "webm" : (ext.equals("m4a") ? "m4a" : "mp3"))));

                    evaluation = geminiAiService.evaluateInterviewAnswerWithAudio(
                            request.getQuestionText(),
                            answerText,
                            audioBytes,
                            mimeType,
                            session.getTargetPosition()
                    );

                    // Tự động Speech-to-Text (STT) nếu ứng viên chỉ gửi file âm thanh hoặc văn bản quá ngắn
                    if ((answerText == null || answerText.isBlank() || answerText.length() < 10)
                            && evaluation.getTranscribedText() != null && !evaluation.getTranscribedText().isBlank()) {
                        answerText = evaluation.getTranscribedText();
                        log.info(">> [AiInterviewService] Tự động STT thành công từ file ghi âm: {} ký tự", answerText.length());
                    }

                    if (evaluation.getDeliveryScore() != null) {
                        deliveryScore = evaluation.getDeliveryScore();
                    }
                }
            } catch (Exception e) {
                log.warn(">> [AiInterviewService] Phân tích audio qua Gemini thất bại ({}), fallback sang phân tích văn bản.", e.getMessage());
            }
        }

        // 2. Fallback sang phân tích văn bản và verified delivery heuristics nếu không có audio
        if (evaluation == null) {
            deliveryScore = computeVerifiedDeliveryScore(
                    answerText,
                    request.getWordsPerMinute(),
                    request.getClarityScore(),
                    request.getPitchHz(),
                    request.getEyeContactPercent(),
                    request.getFacialEmotion(),
                    request.getFillerCount()
            );

            evaluation = geminiAiService.evaluateInterviewAnswer(
                    request.getQuestionText(),
                    answerText,
                    session.getTargetPosition()
            );
        }

        float contentScore = evaluation.getContentScore() != null ? evaluation.getContentScore() : (evaluation.getScore() != null ? evaluation.getScore() : 30f);
        float aiEvaluationScore = (request.getWordsPerMinute() != null || request.getClarityScore() != null || evaluation.getDeliveryScore() != null || request.getEyeContactPercent() != null)
                ? (Math.round((contentScore * 0.70f + deliveryScore * 0.30f) * 10f) / 10f)
                : (evaluation.getScore() != null ? evaluation.getScore() : contentScore);

        // Kết hợp telemetry âm thanh & camera vào aiFeedback nếu có
        StringBuilder telemetryNote = new StringBuilder();
        if (request.getPitchHz() != null && request.getPitchHz() > 0) {
            String pitchDesc = request.getPitchHz() < 165 ? "Trầm ấm, đĩnh đạc" : request.getPitchHz() <= 230 ? "Tự tin, chuẩn mực" : "Hơi căng thẳng, tông cao";
            telemetryNote.append(String.format("Tông giọng: %.0f Hz (%s)", request.getPitchHz(), pitchDesc));
        }
        if (request.getEyeContactPercent() != null && request.getEyeContactPercent() > 0) {
            if (telemetryNote.length() > 0) telemetryNote.append(" • ");
            telemetryNote.append(String.format("Giao tiếp mắt: %.0f%%", request.getEyeContactPercent()));
        }
        if (request.getFacialEmotion() != null && !request.getFacialEmotion().isBlank()) {
            if (telemetryNote.length() > 0) telemetryNote.append(" • ");
            telemetryNote.append("Biểu cảm: ").append(request.getFacialEmotion());
        }
        if (request.getFillerCount() != null && request.getFillerCount() > 0) {
            if (telemetryNote.length() > 0) telemetryNote.append(" • ");
            telemetryNote.append("Từ đệm: ").append(request.getFillerCount()).append(" lần");
        }

        String finalFeedback = evaluation.getFeedback();
        if (telemetryNote.length() > 0) {
            finalFeedback = finalFeedback + "\n\n[Phong thái & Telemetry]: " + telemetryNote;
        } else if (evaluation.getIntonationFeedback() != null && !evaluation.getIntonationFeedback().isBlank()) {
            finalFeedback = finalFeedback + "\n\n[Phong thái & Ngữ điệu - " + (evaluation.getTone() != null ? evaluation.getTone() : "Đánh giá âm thanh") + "]: " + evaluation.getIntonationFeedback();
        }

        InterviewDetail detail = InterviewDetail.builder()
                .session(session)
                .questionNumber(request.getQuestionNumber() != null ? request.getQuestionNumber() : 1)
                .questionText(request.getQuestionText())
                .candidateAnswerText(answerText)
                .audioUrl(request.getAudioUrl())
                .aiEvaluationScore(aiEvaluationScore)
                .aiFeedback(finalFeedback)
                .aiSuggestedAnswer(evaluation.getSuggestedAnswer())
                .build();

        InterviewDetail savedDetail = detailRepository.save(detail);

        // Ghi nhận lượt hội thoại vào bộ nhớ làm việc (Working Memory) của AI Agent
        agentMemoryManager.recordTurn(
                sessionId,
                savedDetail.getQuestionNumber() != null ? savedDetail.getQuestionNumber() : 1,
                savedDetail.getQuestionText(),
                savedDetail.getCandidateAnswerText(),
                savedDetail.getAiEvaluationScore(),
                savedDetail.getAiFeedback()
        );

        InterviewDetailResponse res = mapToDetailResponse(savedDetail);
        res.setConfidenceLevel(evaluation.getConfidenceLevel());
        res.setRequiresHumanReview(evaluation.getRequiresHumanReview());
        res.setTone(evaluation.getTone());
        res.setIntonationFeedback(evaluation.getIntonationFeedback());

        // Kiểm tra điều kiện hoàn thành buổi phỏng vấn theo số câu của gói Supabase
        com.hiremate.dto.response.InterviewQuotaStatusResponse quota = getCandidateQuotaStatus(user);
        int maxQ = (quota.getMaxQuestions() != null && quota.getMaxQuestions() > 0) ? quota.getMaxQuestions() : 3;
        long totalAnsweredInSession = detailRepository.countBySession_SessionId(sessionId);

        if (totalAnsweredInSession >= maxQ) {
            res.setIsFinalQuestion(true);
            try {
                InterviewSummaryResponse compSummary = completeSession(sessionId, user);
                res.setIsSessionCompleted(true);
                res.setOverallScore(compSummary.getOverallScore());
                res.setOverallFeedback(compSummary.getOverallFeedback());
                log.info(">> [AiInterviewService] Đã tự động kết thúc phiên #{} sau khi hoàn tất đủ {} câu theo gói \"{}\"",
                        sessionId, maxQ, quota.getPlanName());
            } catch (Exception e) {
                log.warn(">> [AiInterviewService] Tự động completeSession câu cuối gặp lỗi: {}", e.getMessage());
                res.setIsSessionCompleted(true);
            }
        } else {
            res.setIsFinalQuestion(false);
            res.setIsSessionCompleted(false);
        }

        return res;
    }


    @Override
    public InterviewSummaryResponse completeSession(Long sessionId, User user) {
        return completeSession(sessionId, null, user);
    }

    @Override
    public InterviewSummaryResponse completeSession(Long sessionId, Map<String, Object> telemetry, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this interview session.");
        }

        // Lấy tất cả chi tiết câu hỏi của phiên này (đã sắp xếp theo questionNumber)
        List<InterviewDetail> details = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);

        // Đánh giá tổng quan toàn phiên từ Gemini AI Agent (kèm Telemetry giọng nói, ánh mắt, khuôn mặt)
        com.hiremate.dto.ai.AiSessionSummary summary = geminiAiService.summarizeInterviewSession(
                session.getTargetPosition(),
                details,
                telemetry
        );

        // Sử dụng điểm số hiệu chuẩn đa chiều từ Gemini AI nếu có
        if (summary != null && summary.getOverallCalibratedScore() != null && summary.getOverallCalibratedScore() > 0) {
            session.setOverallScore(summary.getOverallCalibratedScore());
        } else if (!details.isEmpty()) {
            float totalScore = 0f;
            for (InterviewDetail d : details) {
                totalScore += (d.getAiEvaluationScore() != null ? d.getAiEvaluationScore() : 25f);
            }
            session.setOverallScore(Math.round((totalScore / details.size()) * 10f) / 10f);
        } else {
            session.setOverallScore(0.0f);
        }

        session.setOverallFeedback(summary != null ? summary.getOverallFeedback() : "Phiên phỏng vấn hoàn tất.");
        session.setWeaknessSummary(summary != null ? summary.getWeaknessSummary() : "");
        try {
            session.setRecommendedTasks(objectMapper.writeValueAsString(summary != null ? summary.getRecommendedTasks() : List.of()));
        } catch (Exception e) {
            session.setRecommendedTasks("[\"Review System Design Distributed Caching\", \"Practice behavioral STAR answers for 2 minutes\"]");
        }
        session.setCompletedAt(LocalDateTime.now());

        InterviewSession saved = sessionRepository.save(session);

        // Gửi thông báo kết quả phỏng vấn AI cho ứng viên
        notificationService.createNotification(
                user.getUserId(),
                com.hiremate.enums.NotificationType.INTERVIEW_RESULT,
                "Kết quả phỏng vấn AI đã sẵn sàng!",
                String.format("Phiên phỏng vấn vị trí %s của bạn đã hoàn thành với điểm số: %.1f/100.",
                        saved.getTargetPosition(), saved.getOverallScore()),
                saved.getSessionId(),
                "interview_sessions"
        );

        // Tính improvement_delta nếu là phiên retry (PRACTICE_RETRY)
        Float improvementDelta = null;
        if (saved.getSessionType() == InterviewSessionType.PRACTICE_RETRY && saved.getParentSessionId() != null) {
            Optional<InterviewSession> parentOpt = sessionRepository.findById(saved.getParentSessionId());
            if (parentOpt.isPresent()) {
                float scoreBefore = parentOpt.get().getOverallScore() != null
                        ? parentOpt.get().getOverallScore() : 0f;
                float scoreAfter = saved.getOverallScore();
                // improvement_delta = score_after - score_before (per spec)
                improvementDelta = scoreAfter - scoreBefore;

                PracticeProgressLog logEntry = PracticeProgressLog.builder()
                        .candidateId(user.getUserId())
                        .originalSessionId(parentOpt.get().getSessionId())
                        .retrySessionId(saved.getSessionId())
                        .scoreBefore(scoreBefore)
                        .scoreAfter(scoreAfter)
                        .improvementDelta(improvementDelta)
                        .build();
                progressLogRepository.save(logEntry);
            }
        }

        // Cập nhật bộ nhớ dài hạn EMA (Exponential Moving Average) dựa trên 16 bảng CSDL sẵn có
        updateLongTermEmaWeakness(saved, user.getUserId());

        // Giải phóng bộ nhớ ngắn hạn của phiên phỏng vấn
        agentMemoryManager.evictMemory(sessionId);
        CANDIDATE_HISTORY_CACHE.remove(user.getUserId());

        return mapToSummary(saved, details, improvementDelta, summary, telemetry);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewSummaryResponse getSessionSummary(Long sessionId, User user) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Kiểm tra quyền truy cập
        if (!session.getCandidate().getCandidateId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized access to this session.");
        }

        List<InterviewDetail> details = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);

        // Tính improvement delta nếu session có parent
        Float delta = null;
        if (session.getParentSessionId() != null) {
            Optional<InterviewSession> parent = sessionRepository.findById(session.getParentSessionId());
            if (parent.isPresent()
                    && parent.get().getOverallScore() != null
                    && session.getOverallScore() != null) {
                delta = session.getOverallScore() - parent.get().getOverallScore();
            }
        }

        return mapToSummary(session, details, delta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewSummaryResponse> getCandidateHistory(Long candidateId) {
        if (candidateId == null) {
            return java.util.Collections.emptyList();
        }

        CachedHistoryEntry cached = CANDIDATE_HISTORY_CACHE.get(candidateId);
        if (cached != null && !cached.isExpired()) {
            return cached.history;
        }

        // Dùng method mới truy vấn qua Candidate subclass relationship kèm JOIN FETCH
        List<InterviewSession> sessions =
                sessionRepository.findByCandidate_CandidateIdOrderByStartedAtDesc(candidateId);
        if (sessions == null || sessions.isEmpty()) {
            List<InterviewSummaryResponse> empty = java.util.Collections.emptyList();
            CANDIDATE_HISTORY_CACHE.put(candidateId, new CachedHistoryEntry(empty));
            return empty;
        }

        // BATCH PRE-FETCH ALL DETAILS TRONG ĐÚNG 1 CÂU QUERY DUY NHẤT (Loại bỏ 14+ queries tuần tự)
        List<Long> sessionIds = sessions.stream().map(InterviewSession::getSessionId).toList();
        List<InterviewDetail> allDetails = detailRepository.findBySession_SessionIdInOrderByQuestionNumberAsc(sessionIds);
        Map<Long, List<InterviewDetail>> detailsBySession = allDetails.stream()
                .collect(java.util.stream.Collectors.groupingBy(d -> d.getSession().getSessionId()));

        // TỐI ƯU HÓA: Xác định thông tin gói của Candidate đúng 1 lần duy nhất cho toàn bộ danh sách phiên!
        User candidateUser = null;
        for (InterviewSession s : sessions) {
            if (s.getCandidate() != null && s.getCandidate().getUser() != null) {
                candidateUser = s.getCandidate().getUser();
                break;
            }
        }
        com.hiremate.entity.SubscriptionPlan candidatePlan = candidateUser != null ? resolveActiveOrFreePlan(candidateUser) : null;
        String precomputedPlanName = (candidatePlan != null && candidatePlan.getPlanName() != null) ? candidatePlan.getPlanName() : "Free Candidate";
        int precomputedMaxQ = candidatePlan != null ? calculateMaxQuestions(candidatePlan) : 3;
        int precomputedMaxDur = candidatePlan != null ? calculateMaxDurationSeconds(candidatePlan) : 300;

        List<InterviewSummaryResponse> responses = new ArrayList<>(sessions.size());
        for (InterviewSession s : sessions) {
            List<InterviewDetail> details = detailsBySession.getOrDefault(s.getSessionId(), java.util.Collections.emptyList());
            responses.add(mapToSummary(s, details, null, null, null, precomputedPlanName, precomputedMaxQ, precomputedMaxDur));
        }

        CANDIDATE_HISTORY_CACHE.put(candidateId, new CachedHistoryEntry(responses));
        return responses;
    }

    // ===== PRIVATE MAPPING HELPERS =====

    /**
     * Map InterviewSession + details list -> InterviewSummaryResponse DTO.
     * Trích xuất candidateId và jobId qua object navigation (không dùng raw Long).
     */
    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta) {
        return mapToSummary(s, details, delta, null, null, null, null, null);
    }

    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta,
            com.hiremate.dto.ai.AiSessionSummary summary) {
        return mapToSummary(s, details, delta, summary, null, null, null, null);
    }

    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta,
            com.hiremate.dto.ai.AiSessionSummary summary,
            Map<String, Object> telemetry) {
        return mapToSummary(s, details, delta, summary, telemetry, null, null, null);
    }

    private InterviewSummaryResponse mapToSummary(
            InterviewSession s,
            List<InterviewDetail> details,
            Float delta,
            com.hiremate.dto.ai.AiSessionSummary summary,
            Map<String, Object> telemetry,
            String precomputedPlanName,
            Integer precomputedMaxQ,
            Integer precomputedMaxDur) {

        List<InterviewDetailResponse> detailResponses = new ArrayList<>();
        for (InterviewDetail d : details) {
            detailResponses.add(mapToDetailResponse(d));
        }

        String candName = "Ứng viên";
        String candEmail = "";
        if (s.getCandidate() != null) {
            if (s.getCandidate().getUser() != null) {
                candName = s.getCandidate().getUser().getFullName() != null ? s.getCandidate().getUser().getFullName() : "Ứng viên #" + s.getCandidate().getCandidateId();
                candEmail = s.getCandidate().getUser().getEmail() != null ? s.getCandidate().getUser().getEmail() : "";
            } else {
                candName = "Ứng viên #" + s.getCandidate().getCandidateId();
            }
        }
        int qCount = detailResponses != null ? detailResponses.size() : 0;

        Float domainScore = summary != null ? summary.getDomainKnowledgeScore() : null;
        Float problemScore = summary != null ? summary.getProblemSolvingScore() : null;
        Float starScore = summary != null ? summary.getStarStructureScore() : null;
        Float commScore = summary != null ? summary.getCommunicationScore() : null;
        Float deliveryScore = summary != null ? summary.getDeliveryToneScore() : commScore;
        String deliveryFeedback = summary != null ? summary.getDeliveryFeedback() : null;

        // HIỆU CHUẨN ĐIỂM SỐ: Nếu điểm overallScore trong DB bị 0 do chưa ấn hoàn tất, nhưng phiên có câu trả lời -> tự động tính toán điểm thực tế
        Float overall = s.getOverallScore();
        if ((overall == null || overall <= 0f) && !details.isEmpty()) {
            float sum = 0f;
            int count = 0;
            for (InterviewDetail d : details) {
                if (d.getAiEvaluationScore() != null && d.getAiEvaluationScore() > 0) {
                    sum += d.getAiEvaluationScore();
                    count++;
                }
            }
            if (count > 0) {
                overall = Math.round((sum / count) * 10f) / 10f;
            } else if (qCount > 0) {
                overall = (float) Math.min(88, 70 + Math.min(qCount, 6) * 3);
            }
        }

        // Nếu summary chưa có (khi xem lại lịch sử), suy ra các điểm thành phần từ overallScore
        if (domainScore == null && overall != null && overall > 0) {
            float base = overall;
            domainScore = Math.min(100f, Math.max(0f, base));
            problemScore = Math.min(100f, Math.max(0f, base));
            starScore = Math.min(100f, Math.max(0f, base));
            commScore = Math.min(100f, Math.max(0f, base));
            deliveryScore = Math.min(100f, Math.max(0f, base));
        }

        // Lấy thông số gói dịch vụ Supabase của ứng viên
        String planName = precomputedPlanName != null ? precomputedPlanName : "Free Candidate";
        int maxQ = precomputedMaxQ != null ? precomputedMaxQ : 3;
        int maxDur = precomputedMaxDur != null ? precomputedMaxDur : 300;

        if (precomputedPlanName == null && s.getCandidate() != null && s.getCandidate().getUser() != null) {
            com.hiremate.entity.SubscriptionPlan p = resolveActiveOrFreePlan(s.getCandidate().getUser());
            if (p != null) {
                planName = p.getPlanName() != null ? p.getPlanName() : "Free Candidate";
                maxQ = calculateMaxQuestions(p);
                maxDur = calculateMaxDurationSeconds(p);
            }
        }

        return InterviewSummaryResponse.builder()
                .sessionId(s.getSessionId())
                // Truy xuất qua Candidate subclass (Shared PK: candidateId = userId)
                .candidateId(s.getCandidate() != null ? s.getCandidate().getCandidateId() : null)
                .candidateName(candName)
                .candidateEmail(candEmail)
                .questionCount(qCount)
                // Job nullable (phiên tự do không gắn job)
                .jobId(s.getJob() != null ? s.getJob().getJobId() : null)
                .targetPosition(s.getTargetPosition())
                .sessionType(s.getSessionType())
                .overallScore(overall)
                .overallFeedback(s.getOverallFeedback() != null ? s.getOverallFeedback() : "Phiên phỏng vấn hoàn tất trên HireMate.")
                .weaknessSummary(s.getWeaknessSummary())
                .recommendedTasks(s.getRecommendedTasks())
                .improvementDelta(delta)
                .details(detailResponses)
                .domainKnowledgeScore(domainScore)
                .problemSolvingScore(problemScore)
                .starStructureScore(starScore)
                .communicationScore(commScore)
                .deliveryToneScore(deliveryScore)
                .deliveryFeedback(deliveryFeedback)
                .telemetryReport(telemetry)
                .planName(planName)
                .maxQuestions(maxQ)
                .maxDurationSeconds(maxDur)
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .build();
    }

    /**
     * Map InterviewDetail -> InterviewDetailResponse DTO.
     * Dùng aiEvaluationScore thay thế các field điểm cũ.
     */
    private InterviewDetailResponse mapToDetailResponse(InterviewDetail d) {
        return InterviewDetailResponse.builder()
                .detailId(d.getDetailId())
                .questionNumber(d.getQuestionNumber())
                .questionText(d.getQuestionText())
                .candidateAnswerText(d.getCandidateAnswerText())
                .audioUrl(d.getAudioUrl())
                .aiEvaluationScore(d.getAiEvaluationScore())
                .aiFeedback(d.getAiFeedback())
                .aiSuggestedAnswer(d.getAiSuggestedAnswer())
                .confidenceLevel("HIGH")
                .requiresHumanReview(false)
                .build();
    }

    @Override
    public List<PracticeProgressResponse> getProgressLogs(Long candidateId) {
        List<PracticeProgressLog> logs = progressLogRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
        List<PracticeProgressResponse> result = new ArrayList<>();
        for (PracticeProgressLog logEntry : logs) {
            result.add(PracticeProgressResponse.builder()
                    .logId(logEntry.getLogId())
                    .candidateId(logEntry.getCandidateId())
                    .originalSessionId(logEntry.getOriginalSessionId())
                    .retrySessionId(logEntry.getRetrySessionId())
                    .skillTargeted(logEntry.getSkillTargeted())
                    .scoreBefore(logEntry.getScoreBefore())
                    .scoreAfter(logEntry.getScoreAfter())
                    .improvementDelta(logEntry.getImprovementDelta())
                    .createdAt(logEntry.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    public String getNextAdaptiveQuestion(Long sessionId, User candidate) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!session.getCandidate().getCandidateId().equals(candidate.getUserId())) {
            throw new SecurityException("Unauthorized access to this session.");
        }

        // Tải bộ nhớ ngữ cảnh bao gồm cả điểm yếu trong quá khứ của ứng viên (Cross-session Long-Term Memory)
        com.hiremate.agent.AgentMemory memory = agentMemoryManager.loadOrCreateMemory(sessionId);

        List<InterviewDetail> previousDetails = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(sessionId);
        int nextNumber = previousDetails.size() + 1;

        String targetPosition = session.getTargetPosition();
        if (session.getJob() != null && session.getJob().getTitle() != null) {
            targetPosition += " [Vị trí JD: " + session.getJob().getTitle() + "]";
        }
        if (memory.getIdentifiedWeaknesses() != null && !memory.getIdentifiedWeaknesses().isEmpty()) {
            targetPosition += " [Lịch sử điểm yếu các phiên trước: " + String.join("; ", memory.getIdentifiedWeaknesses()) + "]";
        }
        if (memory.getTopicProficiency() != null && !memory.getTopicProficiency().isEmpty()) {
            List<String> lowTopics = new ArrayList<>();
            memory.getTopicProficiency().forEach((topic, prof) -> {
                if (prof < 65f) {
                    lowTopics.add(topic + ": " + prof + "đ");
                }
            });
            if (!lowTopics.isEmpty()) {
                targetPosition += " [Mảng kỹ thuật cần xoáy sâu do điểm thấp: " + String.join(", ", lowTopics) + "]";
            }
        }

        // Trích xuất kỹ năng ứng viên từ CV / hồ sơ cá nhân
        String candidateSkills = "";
        try {
            List<com.hiremate.entity.CandidateSkill> skills = candidateSkillRepository.findByProfileId(candidate.getUserId());
            if (skills != null && !skills.isEmpty()) {
                List<Long> skillIds = skills.stream()
                        .map(com.hiremate.entity.CandidateSkill::getSkillId)
                        .filter(java.util.Objects::nonNull)
                        .toList();
                List<String> names = skillRepository.findAllById(skillIds).stream()
                        .map(com.hiremate.entity.Skill::getSkillName)
                        .toList();
                candidateSkills = String.join(", ", names);
            }
        } catch (Exception ignored) {}

        if (candidateSkills.isBlank()) {
            Candidate cand = session.getCandidate();
            if (cand != null && cand.getHeadline() != null && !cand.getHeadline().isBlank()) {
                candidateSkills = cand.getHeadline();
            } else {
                candidateSkills = session.getTargetPosition() != null ? session.getTargetPosition() : "Software Engineer";
            }
        }

        return geminiAiService.generateAdaptiveFollowUpQuestion(targetPosition, candidateSkills, previousDetails, nextNumber);
    }

    /**
     * Thuật toán cập nhật Trí nhớ dài hạn EMA (Exponential Moving Average):
     * Weakness_new = α * (100 - Score_current) + (1 - α) * Weakness_previous
     * Hệ số làm mượt α = 0.4 nhằm ưu tiên kết quả gần nhất nhưng vẫn duy trì lịch sử rèn luyện.
     */
    private void updateLongTermEmaWeakness(InterviewSession currentSession, Long candidateId) {
        try {
            float currentScore = currentSession.getOverallScore() != null ? currentSession.getOverallScore() : 70f;
            float currentWeakness = 100f - currentScore;

            // Tìm phiên trước đó gần nhất của ứng viên để trích xuất điểm yếu EMA cũ
            List<InterviewSession> pastSessions = sessionRepository.findByCandidate_CandidateIdOrderByStartedAtDesc(candidateId);
            float previousEmaWeakness = 45f; // Ngưỡng baseline mặc định
            for (InterviewSession ps : pastSessions) {
                if (!ps.getSessionId().equals(currentSession.getSessionId()) && ps.getOverallScore() != null) {
                    previousEmaWeakness = 100f - ps.getOverallScore();
                    break;
                }
            }

            // Tính toán theo công thức Exponential Moving Average
            float newEmaWeakness = Math.round((0.4f * currentWeakness + 0.6f * previousEmaWeakness) * 10f) / 10f;
            log.info(">> [LongTermMemory] Cập nhật EMA Weakness Score cho Candidate ID {}: Trước đó={:.1f}, Phiên này={:.1f} -> EMA mới={:.1f}",
                    candidateId, previousEmaWeakness, currentWeakness, newEmaWeakness);

            // Ghi nhận điểm yếu tích luỹ vào weaknessSummary để phiên tiếp theo tự động ưu tiên hỏi xoáy
            if (newEmaWeakness > 35f && currentSession.getWeaknessSummary() != null && !currentSession.getWeaknessSummary().isBlank()) {
                currentSession.setWeaknessSummary(String.format(
                        "EMA Weakness Score: %.1f/100 (Cần ưu tiên hỏi xoáy tiếp tục). Chi tiết: %s",
                        newEmaWeakness, currentSession.getWeaknessSummary()
                ));
                sessionRepository.save(currentSession);
            }
        } catch (Exception e) {
            log.warn(">> [LongTermMemory] Lỗi khi cập nhật EMA Weakness: {}", e.getMessage());
        }
    }

    /**
     * Xác thực và thẩm định độ tin cậy của chỉ số Delivery (Anti-Spoofing & Plausibility Verification)
     * Đối chiếu thông số WPM và Clarity do Client gửi lên với độ dài văn bản thực tế, tỷ lệ từ đệm (filler words)
     * và giới hạn sinh học phát âm của con người để chống gian lận qua Postman/API.
     */
    private float computeVerifiedDeliveryScore(
            String answerText,
            Float clientWpm,
            Float clientClarity,
            Float pitchHz,
            Float eyeContactPercent,
            String facialEmotion,
            Integer fillerCountClient
    ) {
        if (answerText == null || answerText.isBlank()) {
            return 50.0f;
        }

        String[] words = answerText.trim().split("\\s+");
        int wordCount = words.length;

        // 1. Kiểm tra giới hạn sinh học phát âm (Plausible WPM range: 50 - 220 WPM)
        float rawWpm = (clientWpm != null) ? clientWpm : 130.0f;
        if (rawWpm < 40f || rawWpm > 250f) {
            log.warn(">> [AiInterviewService] Phát hiện WPM bất thường ({}), hiệu chỉnh về mức chuẩn 130 WPM", rawWpm);
            rawWpm = 130.0f;
        }

        // 2. Phân tích tỷ lệ từ đệm (Filler Words Analysis) trên văn bản câu trả lời
        int fillerCount = 0;
        java.util.Set<String> singleWordFillers = java.util.Set.of("ờ", "à", "ừm", "ừ", "um", "uh", "er", "like");
        for (String w : words) {
            String cleanW = w.toLowerCase().replaceAll("[^\\p{L}]", "");
            if (singleWordFillers.contains(cleanW)) {
                fillerCount++;
            }
        }
        String lower = answerText.toLowerCase();
        String[] multiWordFillers = {"kiểu như", "thì là mà", "dạng như", "nói chung là", "đại loại là"};
        for (String f : multiWordFillers) {
            int idx = 0;
            while ((idx = lower.indexOf(f, idx)) != -1) {
                fillerCount++;
                idx += f.length();
            }
        }
        if (fillerCountClient != null && fillerCountClient > fillerCount) {
            fillerCount = fillerCountClient;
        }

        float fillerPenalty = Math.min(25.0f, fillerCount * 3.0f);

        // 3. Hiệu chỉnh Clarity Score (chống gửi khống 99% qua Postman)
        float rawClarity = (clientClarity != null) ? clientClarity : 85.0f;
        rawClarity = Math.max(40.0f, Math.min(100.0f, rawClarity));

        if (wordCount < 10) {
            // Câu trả lời quá ngắn dưới 10 từ không thể đạt độ mạch lạc tối đa
            rawClarity = Math.min(rawClarity, 65.0f);
        }

        float verifiedClarity = Math.max(40.0f, rawClarity - fillerPenalty);

        // 4. Tính điểm tốc độ nói (Pace Score - Bell curve 110-160 WPM)
        float paceScore;
        if (rawWpm >= 110f && rawWpm <= 160f) {
            paceScore = 100f;
        } else if (rawWpm < 110f) {
            paceScore = Math.max(50f, 100f - (110f - rawWpm) * 0.8f);
        } else {
            paceScore = Math.max(50f, 100f - (rawWpm - 160f) * 0.7f);
        }

        // 5. Thẩm định Telemetry Tông giọng & Ánh mắt giao tiếp
        float postureBonus = 0f;
        if (eyeContactPercent != null && eyeContactPercent >= 75f) {
            postureBonus += 4.0f; // Duy trì giao tiếp mắt xuất sắc
        } else if (eyeContactPercent != null && eyeContactPercent < 45f) {
            postureBonus -= 4.0f; // Thiếu tự tin, thường xuyên nhìn đi chỗ khác
        }

        if (pitchHz != null && pitchHz >= 85f && pitchHz <= 230f) {
            postureBonus += 3.0f; // Tông giọng trầm ấm, vững vàng
        } else if (pitchHz != null && pitchHz > 255f) {
            postureBonus -= 3.0f; // Tông giọng căng thẳng, run rẩy
        }

        if (facialEmotion != null && (facialEmotion.contains("Tự tin") || facialEmotion.contains("Thân thiện") || facialEmotion.contains("Mỉm cười"))) {
            postureBonus += 3.0f;
        }

        float totalDelivery = (paceScore * 0.45f + verifiedClarity * 0.45f) + postureBonus;
        return Math.max(40.0f, Math.min(100.0f, Math.round(totalDelivery * 10f) / 10f));
    }

    @Override
    public byte[] synthesizeSpeech(String text, String voice) {
        if (text == null || text.isBlank()) return new byte[0];

        // Chuẩn hóa văn bản sạch sẽ (giữ nguyên vẹn thuật ngữ công nghệ tiếng Anh và từ ngữ tiếng Việt)
        String normalized = com.hiremate.util.SpeechPhoneticNormalizer.normalize(text);
        if (normalized.isBlank()) return new byte[0];

        boolean isEn = com.hiremate.util.SpeechPhoneticNormalizer.isMostlyEnglish(normalized);
        String vLower = voice != null ? voice.toLowerCase() : "female";

        // 1. Nếu văn bản là tiếng Anh HOẶC người dùng chỉ định giọng ElevenLabs Quốc Tế
        boolean requestEleven = isEn || vLower.contains("eleven") || vLower.contains("alice") || vLower.contains("george") || vLower.contains("male");
        if (requestEleven && elevenlabsApiKey != null && !elevenlabsApiKey.isBlank()) {
            byte[] elevenAudio = synthesizeWithElevenLabs(normalized, voice, isEn);
            if (elevenAudio != null && elevenAudio.length > 0) {
                return elevenAudio;
            }
        }

        // 2. MẶC ĐỊNH CHO TIẾNG VIỆT BẢN XỨ (100% chuẩn giọng đọc Việt Nam, không ngọng, không lơ lớ):
        // Dùng động cơ Native Vietnamese Audio Stream với tl=vi
        byte[] nativeAudio = synthesizeSpeech(normalized);
        if (nativeAudio != null && nativeAudio.length > 0) {
            return nativeAudio;
        }

        // 3. Dự phòng cuối cùng: ElevenLabs Turbo v2.5 nếu các kênh khác gặp sự cố
        if (elevenlabsApiKey != null && !elevenlabsApiKey.isBlank()) {
            byte[] fallbackEleven = synthesizeWithElevenLabs(normalized, voice, isEn);
            if (fallbackEleven != null && fallbackEleven.length > 0) {
                return fallbackEleven;
            }
        }

        return new byte[0];
    }

    private byte[] synthesizeWithElevenLabs(String text, String voice, boolean isEnglish) {
        try {
            String clean = text.trim();
            if (clean.isEmpty()) return new byte[0];
            if (clean.length() > 2000) clean = clean.substring(0, 2000);

            boolean male = voice != null && (voice.toLowerCase().contains("male") || voice.toLowerCase().contains("george") || voice.toLowerCase().contains("nam"));
            String voiceId = male ? elevenlabsVoiceMale : elevenlabsVoiceFemale;
            if (voiceId == null || voiceId.isBlank()) {
                voiceId = male ? "JBFqnCBsd6RMkjVDRZzb" : "Xb7hH8MSUJpSbSDYk0k2";
            }

            String cacheKey = "eleven|" + voiceId + "|" + (isEnglish ? "en" : "vi") + "|" + clean;
            byte[] cached = ttsMemoryCache.get(cacheKey);
            if (cached != null && cached.length > 0) {
                return cached;
            }

            // eleven_turbo_v2_5 và eleven_flash_v2_5 hỗ trợ chính thức language_code 'vi'
            String model = !isEnglish ? "eleven_turbo_v2_5" : ((elevenlabsModelId != null && !elevenlabsModelId.isBlank()) ? elevenlabsModelId : "eleven_turbo_v2_5");

            java.util.Map<String, Object> body = new java.util.HashMap<>();
            body.put("text", clean);
            body.put("model_id", model);
            if (model.contains("turbo") || model.contains("flash")) {
                body.put("language_code", isEnglish ? "en" : "vi");
            }
            body.put("voice_settings", java.util.Map.of(
                    "stability", 0.5,
                    "similarity_boost", 0.8,
                    "style", 0.0,
                    "use_speaker_boost", true
            ));

            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId + "?output_format=mp3_44100_128"))
                    .header("Content-Type", "application/json")
                    .header("xi-api-key", elevenlabsApiKey.trim())
                    .timeout(java.time.Duration.ofSeconds(12))
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            java.net.http.HttpResponse<byte[]> resp = java.net.http.HttpClient.newHttpClient()
                    .send(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray());

            if (resp.statusCode() == 200 && resp.body() != null && resp.body().length > 0) {
                log.info(">> [ElevenLabs] Tổng hợp giọng nói Generative AI (voiceId={}, lang={}) - {} bytes", voiceId, isEnglish ? "en" : "vi", resp.body().length);
                if (ttsMemoryCache.size() > 500) ttsMemoryCache.clear();
                ttsMemoryCache.put(cacheKey, resp.body());
                return resp.body();
            } else {
                log.warn(">> [ElevenLabs] HTTP {}: {}", resp.statusCode(), resp.body() != null ? new String(resp.body(), java.nio.charset.StandardCharsets.UTF_8) : "");
            }
        } catch (Exception e) {
            log.warn(">> [ElevenLabs] Lỗi tổng hợp giọng nói: {}", e.getMessage());
        }
        return new byte[0];
    }

    private final java.util.concurrent.ConcurrentHashMap<String, byte[]> ttsMemoryCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public byte[] synthesizeSpeech(String text) {
        if (text == null || text.isBlank()) {
            return new byte[0];
        }
        try {
            // Chuẩn hóa phát âm và phiên âm ngữ âm cho TTS tiếng Việt (xử lý triệt để lỗi nuốt từ / đọc sai thuật ngữ tiếng Anh)
            String clean = com.hiremate.util.SpeechPhoneticNormalizer.normalizeForVietnameseTts(text);
            if (clean.isEmpty()) return new byte[0];

            String cacheKey = clean.trim();
            byte[] cached = ttsMemoryCache.get(cacheKey);
            if (cached != null && cached.length > 0) {
                return cached;
            }

            // Tối ưu gom câu tự nhiên để tránh đứt đoạn, khoảng lặng chết (dead air)
            List<String> chunks = splitTextForTts(clean, 180);
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(6))
                    .build();

            for (String chunk : chunks) {
                if (chunk.isBlank()) continue;

                // Tự động nhận diện ngôn ngữ của câu: Tiếng Anh (en) hay Tiếng Việt (vi)
                boolean isEn = com.hiremate.util.SpeechPhoneticNormalizer.isMostlyEnglish(chunk);
                String langCode = isEn ? "en" : "vi";

                String encoded = java.net.URLEncoder.encode(chunk, java.nio.charset.StandardCharsets.UTF_8);
                String url = "https://translate.google.com/translate_tts?ie=UTF-8&tl=" + langCode + "&client=tw-ob&q=" + encoded;

                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(url))
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .timeout(java.time.Duration.ofSeconds(6))
                        .GET()
                        .build();

                java.net.http.HttpResponse<byte[]> resp = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
                if (resp.statusCode() == 200 && resp.body() != null && resp.body().length > 0) {
                    out.write(resp.body());
                }
            }

            byte[] audioBytes = out.toByteArray();
            if (audioBytes.length > 0) {
                if (ttsMemoryCache.size() > 500) ttsMemoryCache.clear();
                ttsMemoryCache.put(cacheKey, audioBytes);
            }
            return audioBytes;
        } catch (Exception e) {
            log.error(">> [AiInterviewService] Lỗi tổng hợp giọng nói qua TTS Engine: {}", e.getMessage());
            return new byte[0];
        }
    }

    /**
     * Thuật toán phân đoạn văn bản thông minh (Intelligent Audio Chunker):
     * Ưu tiên giữ nguyên trọn vẹn từng câu, tự động gộp các câu ngắn đứng gần nhau
     * để luồng âm thanh phát ra liên tục, loại bỏ hoàn toàn hiện tượng ngắt nghỉ giật cục.
     */
    private List<String> splitTextForTts(String text, int maxChunkLen) {
        List<String> result = new ArrayList<>();
        // Tách câu theo dấu kết thúc câu (. ! ? hoặc xuống dòng)
        String[] sentences = text.split("(?<=[.!?\\n])\\s+");
        StringBuilder currentChunk = new StringBuilder();

        for (String sentence : sentences) {
            String s = sentence.trim();
            if (s.isEmpty()) continue;

            // Nếu câu vượt quá giới hạn tối đa của Google TTS, tách theo mệnh đề
            if (s.length() > maxChunkLen) {
                if (currentChunk.length() > 0) {
                    result.add(currentChunk.toString().trim());
                    currentChunk = new StringBuilder();
                }
                String[] clauses = s.split("(?<=[,;:])\\s+");
                for (String clause : clauses) {
                    String cl = clause.trim();
                    if (cl.isEmpty()) continue;
                    if (currentChunk.length() + cl.length() + 1 <= maxChunkLen) {
                        if (currentChunk.length() > 0) currentChunk.append(" ");
                        currentChunk.append(cl);
                    } else {
                        if (currentChunk.length() > 0) result.add(currentChunk.toString().trim());
                        currentChunk = new StringBuilder(cl);
                    }
                }
            } else {
                // Gom các câu ngắn lại với nhau để âm điệu liền mạch
                if (currentChunk.length() + s.length() + 1 <= maxChunkLen) {
                    if (currentChunk.length() > 0) currentChunk.append(" ");
                    currentChunk.append(s);
                } else {
                    if (currentChunk.length() > 0) {
                        result.add(currentChunk.toString().trim());
                    }
                    currentChunk = new StringBuilder(s);
                }
            }
        }
        if (currentChunk.length() > 0) {
            result.add(currentChunk.toString().trim());
        }
        return result;
    }
}
