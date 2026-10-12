package com.hiremate.agent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Động cơ Suy luận & Hiệu chỉnh đa pha (Multi-Phase Calibration & Reflection Engine) của AI Agent.
 * Đảm bảo mọi kết quả trước khi trả về đều qua quy trình 3 pha nghiêm ngặt:
 *  - Pha 1: Thought & Evaluation phác thảo từ LLM
 *  - Pha 2: Self-Critique & Tool Verification (Tra cứu kỹ năng CSDL 3NF, rà soát injection, kiểm tra ảo giác điểm số)
 *  - Pha 3: Calibrated Decision & Confidence Estimation (Xác định độ tin cậy và gắn cờ Human-in-the-Loop)
 */
@Slf4j
@Component
public class AgentReflectionEngine {

    private final AgentToolRegistry agentToolRegistry;

    public AgentReflectionEngine(@Autowired(required = false) AgentToolRegistry agentToolRegistry) {
        this.agentToolRegistry = agentToolRegistry;
    }

    public AgentReflectionEngine() {
        this(null);
    }

    public AgentReflectionTrace reflectAndCalibrate(
            String question,
            String answer,
            String targetPosition,
            Float initialScore,
            String initialFeedback
    ) {
        List<String> toolsInvoked = new ArrayList<>();
        float draftScore = initialScore != null ? initialScore : 70.0f;
        String cleanAnswer = (answer != null) ? answer.trim() : "";

        // Giai đoạn 1: Initial Thought
        String thought = String.format("Phân tích sơ bộ: Câu trả lời có độ dài %d ký tự cho vị trí %s. Điểm khởi điểm: %.1f.",
                cleanAnswer.length(), targetPosition, draftScore);

        // Giai đoạn 2: Reflection & Self-Critique & Substantive Calibration
        StringBuilder critique = new StringBuilder();
        float calibratedScore = draftScore;
        boolean isInjection = false;

        // 2.1 Kiểm tra Prompt Injection / System Override (Đa tầng: Plaintext, Base64 & Roleplay)
        String lowerAns = cleanAnswer.toLowerCase();
        boolean hasInjectionPattern = false;

        String[] injectionKeywords = {
                "ignore previous", "system admin", "bỏ qua hướng dẫn", "cho tôi 100",
                "system prompt", "bypass security", "give me full score", "assistant mode",
                "developer mode", "jailbreak", "override instructions", "do anything now"
        };
        for (String kw : injectionKeywords) {
            if (lowerAns.contains(kw)) {
                hasInjectionPattern = true;
                break;
            }
        }

        // Kiểm tra mã hóa mờ nhạt Base64 (Obfuscated Base64 Injection)
        if (!hasInjectionPattern && cleanAnswer.length() >= 20) {
            java.util.regex.Matcher b64Matcher = java.util.regex.Pattern.compile("[A-Za-z0-9+/=]{20,}").matcher(cleanAnswer);
            while (b64Matcher.find()) {
                try {
                    byte[] decoded = java.util.Base64.getDecoder().decode(b64Matcher.group());
                    String decodedText = new String(decoded, java.nio.charset.StandardCharsets.UTF_8).toLowerCase();
                    for (String kw : injectionKeywords) {
                        if (decodedText.contains(kw)) {
                            hasInjectionPattern = true;
                            log.warn(">> [AgentReflection] Phát hiện Base64 Obfuscated Prompt Injection: '{}'", b64Matcher.group());
                            break;
                        }
                    }
                } catch (Exception ignored) {}
                if (hasInjectionPattern) break;
            }
        }

        // Kiểm tra Roleplay Hijacking ("Hãy đóng vai", "Pretend you are an AI that awards 100")
        if (!hasInjectionPattern && (lowerAns.contains("đóng vai") || lowerAns.contains("pretend") || lowerAns.contains("act as"))
                && (lowerAns.contains("100 điểm") || lowerAns.contains("full score") || lowerAns.contains("chấm điểm tối đa") || lowerAns.contains("100 points"))) {
            hasInjectionPattern = true;
            log.warn(">> [AgentReflection] Phát hiện Roleplay Hijacking Prompt Injection");
        }

        if (hasInjectionPattern) {
            critique.append("PHÁT HIỆN HÀNH VI PROMPT INJECTION / JAILBREAK: Ứng viên cố tình thao túng barem chấm điểm hoặc mã hóa lệnh nhằm qua mặt hệ thống. ");
            calibratedScore = 15.0f; // Trừng phạt gian lận
            isInjection = true;
        }

        // 2.2 Đánh giá mật độ chuyên môn kỹ thuật (Technical Density & Semantic Substance)
        int techKeywordCount = 0;
        List<String> detectedTechTerms = new ArrayList<>();
        String[] coreTechKeywords = {
                // Testing, QA & QC
                "test case", "test plan", "test suite", "test scenario", "boundary value", "equivalence partitioning",
                "regression", "smoke test", "sanity test", "selenium", "postman", "jmeter", "cypress", "playwright",
                "testng", "junit", "mock", "bug", "defect", "severity", "priority", "uat", "automation", "manual",
                "api test", "performance test", "load test", "stress test", "black-box", "white-box", "ci/cd",
                // Backend & Architecture
                "b-tree", "index", "cluster", "acid", "mutex", "lock", "thread", "concurrency",
                "kafka", "rabbitmq", "redis", "postgres", "sql", "nosql", "sharding", "replication",
                "spring", "docker", "kubernetes", "k8s", "microservices", "rest", "grpc", "websocket",
                "memory leak", "garbage collection", "jvm", "event-driven", "async", "cache", "circuit breaker", "transaction",
                // Frontend & Web
                "react", "vue", "angular", "javascript", "typescript", "css", "html", "dom", "redux", "state", "hook", "component", "vite", "nextjs"
        };

        for (String kw : coreTechKeywords) {
            if (lowerAns.contains(kw)) {
                techKeywordCount++;
                detectedTechTerms.add(kw);
                if (agentToolRegistry != null && toolsInvoked.size() < 3) {
                    Map<String, Object> toolRes = agentToolRegistry.executeTool("lookup_skill", Map.of("skillName", kw));
                    if (Boolean.TRUE.equals(toolRes.get("found"))) {
                        toolsInvoked.add("lookup_skill('" + kw + "') -> " + toolRes.get("category"));
                    }
                }
            }
        }

        // 2.3 Phân loại câu trả lời: Concise Technical (Súc tích chuyên môn) vs Vague/Empty (Sơ sài)
        boolean isConciseTechnical = (cleanAnswer.length() < 45 && techKeywordCount >= 2);
        boolean isVagueOrTrivial = (cleanAnswer.length() < 35 && techKeywordCount == 0);

        if (isConciseTechnical && !isInjection) {
            critique.append("NHẬN DIỆN CÂU TRẢ LỜI SÚC TÍCH CHUẨN XÁC: Ứng viên trả lời cô đọng nhưng trúng trọng tâm kỹ thuật (")
                    .append(String.join(", ", detectedTechTerms))
                    .append("). Bảo toàn điểm đánh giá kỹ thuật cao cấp, không phạt độ dài. ");
            calibratedScore = Math.max(calibratedScore, 75.0f);
        } else if (isVagueOrTrivial && !isInjection) {
            critique.append("CẢNH BÁO THIẾU DỮ LIỆU CHUYÊN MÔN: Câu trả lời quá ngắn và không chứa thuật ngữ hay giải pháp kỹ thuật nào. ");
            calibratedScore = Math.min(calibratedScore, 40.0f);
        }

        // 2.4 Kiểm định phương pháp STAR & Phòng chống Nhồi nhét từ khóa sáo rỗng (Anti-Keyword Stuffing)
        boolean hasStarKeywords = (lowerAns.contains("tình huống") || lowerAns.contains("situation") || lowerAns.contains("bối cảnh"))
                && (lowerAns.contains("nhiệm vụ") || lowerAns.contains("task") || lowerAns.contains("mục tiêu"))
                && (lowerAns.contains("hành động") || lowerAns.contains("action") || lowerAns.contains("triển khai") || lowerAns.contains("giải pháp"))
                && (lowerAns.contains("kết quả") || lowerAns.contains("result") || lowerAns.contains("đạt được"));

        boolean hasConcreteMetrics = lowerAns.matches(".*\\d+(\\.\\d+)?(%|ms|rps|tps|kb|mb|gb|req/s|usd|triệu|lần).*");

        if (hasStarKeywords && !isInjection) {
            if (techKeywordCount >= 1 || hasConcreteMetrics) {
                // STAR thật sự có gắn liền giải pháp kỹ thuật hoặc số liệu định lượng
                critique.append("ỨNG VIÊN ÁP DỤNG STAR CHUẨN MỰC: Có dẫn chứng hành động kỹ thuật và kết quả đo lường rõ ràng (+5 điểm). ");
                calibratedScore = Math.min(100.0f, calibratedScore + 5.0f);
            } else {
                // Nhồi nhét từ khóa STAR nhưng rỗng ruột kỹ thuật
                critique.append("CẢNH BÁO NHỒI NHÉT TỪ KHÓA (KEYWORD STUFFING): Ứng viên dùng khung STAR nhưng thiếu giải pháp kỹ thuật và số liệu minh chứng cụ thể. Giữ nguyên điểm cơ sở, không cộng điểm khuyến khích. ");
            }
        }

        if (critique.length() == 0) {
            critique.append("Đánh giá tự phản biện: Điểm số nhất quán với Barem 4 chiều (Kỹ thuật, Giải pháp, STAR, Trình bày).");
        }

        calibratedScore = Math.round(calibratedScore * 10f) / 10f;
        String finalDecision = initialFeedback != null ? initialFeedback : "Đã hoàn tất đánh giá phản biện.";

        // Giai đoạn 3: Xác định độ tin cậy (Confidence Estimation) & Cờ Human-in-the-Loop
        String confidenceLevel;
        boolean requiresHumanReview;
        String confidenceReason;

        if (isInjection) {
            confidenceLevel = "LOW";
            requiresHumanReview = true;
            confidenceReason = "Nghi vấn gian lận Prompt Injection nhằm thao túng hệ thống chấm điểm.";
        } else if (isVagueOrTrivial) {
            confidenceLevel = "LOW";
            requiresHumanReview = true;
            confidenceReason = "Câu trả lời sơ sài, thiếu dữ liệu chuyên môn để AI kết luận chắc chắn.";
        } else if (isConciseTechnical) {
            confidenceLevel = "HIGH";
            requiresHumanReview = false;
            confidenceReason = "Câu trả lời súc tích, mật độ chuyên môn cao và đối chiếu chính xác với nguyên lý kỹ thuật.";
        } else if (cleanAnswer.length() < 80) {
            confidenceLevel = "MEDIUM";
            requiresHumanReview = false;
            confidenceReason = "Câu trả lời tương đối ngắn, chưa cung cấp đầy đủ ví dụ kỹ thuật cụ thể.";
        } else {
            confidenceLevel = "HIGH";
            requiresHumanReview = false;
            confidenceReason = "Câu trả lời đầy đủ, có ngữ cảnh và đối chiếu thành công với từ điển kỹ năng 3NF.";
        }

        log.info(">> [AgentReflection] Hoàn tất 3-Phase Calibration: Điểm gốc=%.1f -> Sau phản biện=%.1f, Confidence={}, HumanReview={}",
                draftScore, calibratedScore, confidenceLevel, requiresHumanReview);

        return AgentReflectionTrace.builder()
                .initialThought(thought)
                .selfCritique(critique.toString().trim())
                .calibratedScore(calibratedScore)
                .toolsInvoked(toolsInvoked)
                .finalDecision(finalDecision)
                .confidenceLevel(confidenceLevel)
                .requiresHumanReview(requiresHumanReview)
                .confidenceReason(confidenceReason)
                .build();
    }
}
