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
        float draftScore = initialScore != null ? initialScore : 40.0f;
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

        // 2.2 Đánh giá mật độ chuyên môn & từ điển thuật ngữ đa ngành nghề (Multi-domain Keyword Density)
        String lowerQuestion = (question != null) ? question.toLowerCase() : "";
        boolean isBehavioralOrIntro = lowerQuestion.contains("giới thiệu") || lowerQuestion.contains("bản thân")
                || lowerQuestion.contains("chia sẻ") || lowerQuestion.contains("mở đầu")
                || lowerQuestion.contains("định hướng") || lowerQuestion.contains("mục tiêu")
                || lowerQuestion.contains("xung đột") || lowerQuestion.contains("áp lực")
                || lowerQuestion.contains("thất bại") || lowerQuestion.contains("thách thức");

        int techKeywordCount = 0;
        List<String> detectedTechTerms = new ArrayList<>();
        String[] coreTechKeywords = {
                // Testing, QA & QC
                "test case", "test plan", "test suite", "test scenario", "boundary value", "equivalence partitioning",
                "regression", "smoke test", "sanity test", "selenium", "postman", "jmeter", "cypress", "playwright",
                "testng", "junit", "mock", "bug", "defect", "severity", "priority", "uat", "automation", "manual",
                "api test", "performance test", "load test", "stress test", "black-box", "white-box", "ci/cd",
                // Backend, Cloud & Architecture
                "b-tree", "index", "cluster", "acid", "mutex", "lock", "thread", "concurrency",
                "kafka", "rabbitmq", "redis", "postgres", "sql", "nosql", "sharding", "replication",
                "spring", "docker", "kubernetes", "k8s", "microservices", "rest", "grpc", "websocket",
                "memory leak", "garbage collection", "jvm", "event-driven", "async", "cache", "circuit breaker", "transaction",
                // Frontend, Mobile & AI
                "react", "vue", "angular", "javascript", "typescript", "css", "html", "dom", "redux", "state", "hook", "component", "vite", "nextjs",
                "flutter", "dart", "react native", "python", "fastapi", "django", "llm", "genai", "prompt", "machine learning",
                // Kế toán, Kiểm toán, Tài chính & Ngân hàng
                "báo cáo tài chính", "bctc", "cân đối kế toán", "dòng tiền", "cashflow", "thuế", "gtgt", "vat", "tndn", "tncn",
                "vas", "ifrs", "kiểm toán", "công nợ", "tồn kho", "khấu hao", "misa", "sap", "chứng từ", "hóa đơn", "quyết toán",
                "kiểm soát nội bộ", "biên lợi nhuận", "npv", "irr", "roi", "ebitda", "tín dụng", "thanh khoản", "ngân sách", "chi phí",
                // Marketing, Truyền thông, SEO & Content
                "marketing", "seo", "sem", "content", "brand", "thương hiệu", "chiến dịch", "campaign", "roas", "cac", "ltv",
                "ctr", "cvr", "cpc", "cpm", "chuyển đổi", "conversion", "phễu", "funnel", "khách hàng mục tiêu", "target audience",
                "insight", "a/b testing", "google analytics", "facebook ads", "tiktok", "truyền thông", "khủng hoảng", "định vị", "organic", "traffic",
                // Kinh doanh & Bán hàng (Sales & BD)
                "kinh doanh", "bán hàng", "sales", "doanh số", "doanh thu", "kpi", "quota", "chốt đơn", "closing", "đàm phán",
                "thương lượng", "từ chối", "objection", "b2b", "b2c", "crm", "khách hàng", "lead", "pipeline", "phễu bán hàng",
                "hợp đồng", "chiết khấu", "thị trường", "giữ chân", "retention", "upsell", "cross-sell", "spin selling",
                // Nhân sự & Tuyển dụng (HR & C&B)
                "nhân sự", "tuyển dụng", "headhunt", "c&b", "lương", "thưởng", "phúc lợi", "bảo hiểm", "bhxh", "luật lao động",
                "đánh giá năng lực", "okr", "onboarding", "đào tạo", "turnover", "văn hóa doanh nghiệp", "quan hệ lao động", "kỷ luật", "jd", "phỏng vấn",
                // Logistics, Xuất nhập khẩu & Chuỗi cung ứng
                "logistics", "chuỗi cung ứng", "supply chain", "xuất nhập khẩu", "hải quan", "tờ khai", "vnaccs", "incoterms",
                "vận chuyển", "kho bãi", "wms", "bill of lading", "c/o", "forwarder", "cảng", "giao nhận", "lead time", "nhà cung ứng", "vendor",
                // Business Analyst, Quản lý dự án & BrSE
                "srs", "brd", "user story", "acceptance criteria", "use case", "bpmn", "uml", "stakeholder", "yêu cầu", "nghiệp vụ",
                "scope", "agile", "scrum", "sprint", "backlog", "kihon sekkei", "shosai sekkei", "hou-ren-so", "tiến độ", "rủi ro", "phân bổ nguồn lực",
                // Chăm sóc khách hàng, Vận hành & Đa ngành
                "sla", "csat", "nps", "khiếu nại", "phản hồi", "quy trình", "sop", "giải pháp", "kế hoạch", "mục tiêu", "tối ưu", "hiệu quả", "dự án", "phối hợp"
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

        // 2.3 Phân loại câu trả lời & Hiệu chuẩn điểm (Multi-dimensional Calibration)
        int wordCount = cleanAnswer.isEmpty() ? 0 : cleanAnswer.split("\\s+").length;
        boolean isTooShort = wordCount < 8;
        boolean isConciseTechnical = (cleanAnswer.length() < 50 && techKeywordCount >= 2);

        if (!isInjection) {
            if (isTooShort) {
                critique.append("CẢNH BÁO CÂU TRẢ LỜI QUÁ NGẮN: Dưới 8 từ, không đủ nội dung để đánh giá chuyên môn. ");
                calibratedScore = Math.min(calibratedScore, 20.0f);
            } else if (isConciseTechnical) {
                critique.append("NHẬN DIỆN CÂU TRẢ LỜI SÚC TÍCH CHUẨN XÁC: Ứng viên trả lời cô đọng nhưng trúng trọng tâm chuyên môn (")
                        .append(String.join(", ", detectedTechTerms))
                        .append("). ");
                calibratedScore = Math.max(calibratedScore, 70.0f);
            } else if (isBehavioralOrIntro) {
                // Câu hỏi giới thiệu bản thân / hành vi STAR: Tôn trọng đánh giá ngữ nghĩa của Gemini AI
                critique.append("CÂU HỎI HÀNH VI / GIỚI THIỆU BẢN THÂN: Đánh giá dựa trên phong thái, độ lưu loát và kinh nghiệm thực tế. ");
                if (wordCount >= 20 && draftScore >= 60.0f) {
                    calibratedScore = draftScore;
                }
            } else {
                // Câu hỏi chuyên môn kỹ thuật hoặc nghiệp vụ
                if (techKeywordCount >= 2) {
                    critique.append("MẬT ĐỘ THUẬT NGỮ CHUYÊN MÔN CAO: Ứng viên vận dụng tốt các khái niệm chuyên ngành (")
                            .append(String.join(", ", detectedTechTerms))
                            .append("). ");
                    calibratedScore = Math.min(100.0f, calibratedScore + 3.0f);
                } else if (techKeywordCount == 1) {
                    critique.append("CÓ ĐỀ CẬP THUẬT NGỮ CHUYÊN NGÀNH: Đã nêu thuật ngữ cốt lõi, khuyến khích đào sâu thêm giải pháp. ");
                    if (wordCount < 20) {
                        calibratedScore = Math.min(calibratedScore, 55.0f);
                    }
                } else {
                    // techKeywordCount == 0
                    if (wordCount < 20) {
                        critique.append("CẢNH BÁO THIẾU DỮ LIỆU CHUYÊN MÔN: Câu trả lời ngắn và thiếu vắng thuật ngữ ngành. ");
                        calibratedScore = Math.min(calibratedScore, 30.0f);
                    } else {
                        // Trả lời dài, diễn giải bằng lời văn riêng: tôn trọng điểm ngữ nghĩa của Gemini, chỉ trừ nhẹ 5đ
                        critique.append("CÂU TRẢ LỜI DIỄN GIẢI THỰC TẾ: Ứng viên diễn đạt bằng văn phong cá nhân, cần bổ sung thêm thuật ngữ chuẩn. ");
                        calibratedScore = Math.max(calibratedScore - 5.0f, 40.0f);
                    }
                }
            }
        }

        // 2.4 Kiểm định phương pháp STAR & Phòng chống Nhồi nhét từ khóa sáo rỗng (Anti-Keyword Stuffing)
        boolean hasStarKeywords = (lowerAns.contains("tình huống") || lowerAns.contains("situation") || lowerAns.contains("bối cảnh"))
                && (lowerAns.contains("nhiệm vụ") || lowerAns.contains("task") || lowerAns.contains("mục tiêu"))
                && (lowerAns.contains("hành động") || lowerAns.contains("action") || lowerAns.contains("triển khai") || lowerAns.contains("giải pháp"))
                && (lowerAns.contains("kết quả") || lowerAns.contains("result") || lowerAns.contains("đạt được"));

        boolean hasConcreteMetrics = lowerAns.matches(".*\\d+(\\.\\d+)?(%|ms|rps|tps|kb|mb|gb|req/s|usd|triệu|tỷ|k|lần|người|h|tháng|năm).*");

        if (hasStarKeywords && !isInjection) {
            if (techKeywordCount >= 1 || hasConcreteMetrics || isBehavioralOrIntro) {
                // STAR thật sự có gắn liền giải pháp kỹ thuật, số liệu định lượng hoặc câu hỏi hành vi
                critique.append("ỨNG VIÊN ÁP DỤNG STAR CHUẨN MỰC: Có dẫn chứng hành động và kết quả đo lường rõ ràng (+5 điểm). ");
                calibratedScore = Math.min(100.0f, calibratedScore + 5.0f);
            } else {
                // Nhồi nhét từ khóa STAR nhưng rỗng ruột
                critique.append("CẢNH BÁO NHỒI NHÉT TỪ KHÓA (KEYWORD STUFFING): Ứng viên dùng khung STAR nhưng thiếu giải pháp và số liệu minh chứng cụ thể. Giữ nguyên điểm cơ sở, không cộng điểm khuyến khích. ");
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
        } else if (isTooShort) {
            confidenceLevel = "LOW";
            requiresHumanReview = true;
            confidenceReason = "Câu trả lời quá ngắn, thiếu dữ liệu để AI kết luận chắc chắn.";
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
            confidenceReason = "Câu trả lời đầy đủ, có ngữ cảnh và đối chiếu thành công với từ điển chuyên môn.";
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
