package com.hiremate.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hiremate.config.OpenAiConfig;
import com.hiremate.dto.request.VoiceSessionRequest;
import com.hiremate.dto.response.VoiceSessionResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.User;
import com.hiremate.exception.BadRequestException;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.service.VoiceAgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceAgentServiceImpl implements VoiceAgentService {

    private final OpenAiConfig openAiConfig;
    private final ObjectMapper objectMapper;
    private final CandidateRepository candidateRepository;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.hiremate.service.AiInterviewService aiInterviewService;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            Bạn là trợ lý AI tuyển dụng của nền tảng HireMate.
            Tên ứng viên đang trò chuyện: %s.
            %s

            Bạn giao tiếp bằng tiếng Việt tự nhiên, thân thiện, lịch sự và dễ hiểu. Hãy trò chuyện như một trợ lý và chuyên gia phỏng vấn thực tế, không nói như đang đọc tài liệu hoặc trả lời theo mẫu cứng nhắc.

            Quy tắc giao tiếp cốt lõi:
            - Ưu tiên câu trả lời ngắn gọn, cô đọng, tự nhiên và phù hợp với hội thoại bằng giọng nói (voice-first conversation).
            - Mỗi lượt chỉ hỏi một hoặc hai câu cần thiết, tuyệt đối không hỏi dồn dập nhiều câu cùng một lúc.
            - Luôn lắng nghe, ghi nhớ thông tin người dùng đã cung cấp trong suốt phiên hiện tại.
            - Hỏi lại một cách nhã nhặn khi câu nói của ứng viên chưa rõ hoặc thông tin quan trọng còn thiếu.
            - Không tự bịa đặt công việc, mức lương, yêu cầu tuyển dụng hoặc thông tin ứng viên.
            - Phân biệt rõ ràng giữa dữ liệu thật từ hệ thống và gợi ý tư vấn do AI tạo ra.
            - Khi người dùng muốn tìm việc, hãy trao đổi để làm rõ vị trí, kỹ năng, kinh nghiệm, địa điểm làm việc và mức lương mong muốn.
            - Khi cần dữ liệu tuyển dụng thực tế (danh sách việc làm, chi tiết công việc, hồ sơ nộp đơn), HÃY SỬ DỤNG CÔNG CỤ (tool) gọi hệ thống thay vì tự suy đoán.
            - Không đọc to những đoạn văn dài hay danh sách dài như đọc báo cáo; hãy tóm tắt những ý quan trọng nhất (như tên công việc, công ty, mức lương nổi bật) thành các lượt trao đổi tự nhiên.
            - Nếu người dùng muốn luyện tập phỏng vấn theo vị trí cụ thể, hãy đóng vai người phỏng vấn chuyên nghiệp, đặt câu hỏi tình huống thực tế và lắng nghe câu trả lời để nhận xét ngắn gọn trước khi chuyển sang câu tiếp theo.
            - Nếu người dùng chỉ muốn trò chuyện hoặc tìm hiểu về nền tảng, hãy phản hồi phù hợp, ấm áp mà không ép buộc họ phải tìm việc.
            """;

    @Override
    public VoiceSessionResponse createRealtimeSession(VoiceSessionRequest request, User user) {
        if (!openAiConfig.isConfigured()) {
            throw new BadRequestException("Hệ thống chưa được cấu hình biến môi trường OPENAI_API_KEY. Vui lòng liên hệ Quản trị viên để kích hoạt tính năng Trò chuyện Giọng nói AI.");
        }

        // Kiểm tra phân quyền & hạn ngạch phỏng vấn trong ngày của Ứng viên (Admin luôn được bypass)
        if (user != null && user.getRole() == com.hiremate.enums.UserRole.CANDIDATE) {
            if (aiInterviewService != null) {
                var quota = aiInterviewService.getCandidateQuotaStatus(user);
                if (Boolean.TRUE.equals(quota.getIsQuotaExceeded())) {
                    throw new BadRequestException(String.format(
                            "Bạn đã sử dụng hết hạn ngạch hôm nay (%d/%d phiên) của gói \"%s\". Vui lòng quay lại vào ngày mai hoặc nâng cấp gói dịch vụ để tiếp tục luyện tập.",
                            quota.getUsedToday(), quota.getQuotaLimit(), quota.getPlanName()));
                }
            }
        }

        String candidateName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                ? user.getFullName() : "Bạn";

        // Bổ sung ngữ cảnh hồ sơ ứng viên nếu có
        StringBuilder profileContext = new StringBuilder();
        if (user != null) {
            Optional<Candidate> candOpt = candidateRepository.findById(user.getUserId());
            if (candOpt.isPresent()) {
                Candidate c = candOpt.get();
                if (c.getHeadline() != null && !c.getHeadline().isBlank()) {
                    profileContext.append("Chức danh nghề nghiệp hiện tại của ứng viên: ").append(c.getHeadline()).append(". ");
                }
                if (c.getExperienceYears() != null && c.getExperienceYears() > 0) {
                    profileContext.append("Số năm kinh nghiệm: ").append(c.getExperienceYears()).append(" năm. ");
                }
            }
        }
        if (request != null && request.getTargetPosition() != null && !request.getTargetPosition().isBlank()) {
            profileContext.append("Vị trí phỏng vấn/quan tâm hiện tại: ").append(request.getTargetPosition());
            if (request.getLevel() != null && !request.getLevel().isBlank()) {
                profileContext.append(" (Cấp bậc: ").append(request.getLevel()).append(")");
            }
            profileContext.append(". ");
        }

        String instructions = String.format(SYSTEM_PROMPT_TEMPLATE, candidateName, profileContext.toString().trim());

        String voice = (request != null && request.getVoice() != null && !request.getVoice().isBlank())
                ? request.getVoice() : openAiConfig.getVoice();
        if (voice == null || voice.isBlank()) {
            voice = "alloy";
        }

        String model = openAiConfig.getRealtimeModel();
        if (model == null || model.isBlank()) {
            model = "gpt-4o-realtime-preview";
        }

        try {
            Map<String, Object> sessionPayload = new LinkedHashMap<>();
            sessionPayload.put("model", model);
            sessionPayload.put("modalities", List.of("audio", "text"));
            sessionPayload.put("voice", voice);
            sessionPayload.put("instructions", instructions);

            // Whisper transcription for live candidate voice speech-to-text
            sessionPayload.put("input_audio_transcription", Map.of(
                    "model", "whisper-1"
            ));

            // Server-side Voice Activity Detection for seamless barge-in and turn detection
            sessionPayload.put("turn_detection", Map.of(
                    "type", "server_vad",
                    "threshold", 0.5,
                    "prefix_padding_ms", 300,
                    "silence_duration_ms", 650,
                    "create_response", true
            ));

            // Khai báo các công cụ tuyển dụng tích hợp trực tiếp với hệ thống HireMate
            sessionPayload.put("tools", buildRecruitmentTools());
            sessionPayload.put("tool_choice", "auto");

            String requestBodyJson = objectMapper.writeValueAsString(sessionPayload);
            String url = openAiConfig.getBaseUrl() + "/realtime/sessions";

            log.info("Requesting OpenAI Realtime ephemeral session token from: {} for user: {}", url, user != null ? user.getEmail() : "anonymous");

            HttpClient httpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
            .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + openAiConfig.getApiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Failed to create OpenAI Realtime session. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new BadRequestException("Không thể khởi tạo phiên trò chuyện giọng nói với OpenAI (Mã lỗi: " + response.statusCode() + "). Chi tiết: " + extractErrorMessage(response.body()));
            }

            JsonNode root = objectMapper.readTree(response.body());
            String sessionId = root.path("id").asText("");
            JsonNode clientSecretNode = root.path("client_secret");
            String clientSecret = clientSecretNode.path("value").asText("");
            long expiresAt = clientSecretNode.path("expires_at").asLong(0);

            if (clientSecret.isBlank()) {
                throw new BadRequestException("OpenAI không trả về client secret hợp lệ cho WebRTC.");
            }

            log.info("Successfully issued ephemeral WebRTC token for session: {}", sessionId);

            return VoiceSessionResponse.builder()
                    .sessionId(sessionId)
                    .clientSecret(clientSecret)
                    .expiresAt(expiresAt)
                    .model(model)
                    .voice(voice)
                    .instructions(instructions)
                    .candidateName(candidateName)
                    .build();

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating OpenAI Realtime session", e);
            throw new BadRequestException("Lỗi kết nối tới dịch vụ Voice AI: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> buildRecruitmentTools() {
        List<Map<String, Object>> tools = new ArrayList<>();

        // Tool 1: Tìm kiếm việc làm
        tools.add(Map.of(
                "type", "function",
                "name", "search_jobs",
                "description", "Tìm kiếm các việc làm đang mở tuyển trên nền tảng HireMate theo từ khóa, chuyên môn hoặc địa điểm",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "keyword", Map.of("type", "string", "description", "Từ khóa công việc (ví dụ: Java, Frontend, React, Kế toán, Marketing)"),
                                "location", Map.of("type", "string", "description", "Địa điểm làm việc (ví dụ: Hà Nội, Hồ Chí Minh, Đà Nẵng, Remote)")
                        )
                )
        ));

        // Tool 2: Lấy chi tiết công việc
        tools.add(Map.of(
                "type", "function",
                "name", "get_job_detail",
                "description", "Lấy thông tin mô tả chi tiết, quyền lợi và yêu cầu tuyển dụng của một công việc theo jobId",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "jobId", Map.of("type", "number", "description", "Mã số định danh của công việc")
                        ),
                        "required", List.of("jobId")
                )
        ));

        // Tool 3: Lấy danh sách việc làm đã ứng tuyển của ứng viên
        tools.add(Map.of(
                "type", "function",
                "name", "get_my_applications",
                "description", "Lấy danh sách các công việc mà ứng viên hiện tại đã nộp đơn và trạng thái xét duyệt/phỏng vấn",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of()
                )
        ));

        // Tool 4: Lấy hồ sơ cá nhân ứng viên
        tools.add(Map.of(
                "type", "function",
                "name", "get_candidate_profile",
                "description", "Lấy thông tin hồ sơ, kỹ năng, kinh nghiệm và chức danh của ứng viên hiện tại",
                "parameters", Map.of(
                        "type", "object",
                        "properties", Map.of()
                )
        ));

        return tools;
    }

    private String extractErrorMessage(String body) {
        try {
            JsonNode n = objectMapper.readTree(body);
            if (n.has("error") && n.get("error").has("message")) {
                return n.get("error").get("message").asText();
            }
        } catch (Exception ignored) {}
        return body != null && body.length() > 200 ? body.substring(0, 200) + "..." : body;
    }
}
