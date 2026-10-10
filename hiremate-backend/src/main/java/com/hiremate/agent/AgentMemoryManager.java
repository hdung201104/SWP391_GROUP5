package com.hiremate.agent;

import com.hiremate.entity.InterviewDetail;
import com.hiremate.entity.InterviewSession;
import com.hiremate.repository.InterviewDetailRepository;
import com.hiremate.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý bộ nhớ ngữ cảnh nhiều lượt (Stateful Context Memory) cho AI Agent.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentMemoryManager {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewDetailRepository detailRepository;

    private final Map<Long, AgentMemory> memoryCache = new ConcurrentHashMap<>();

    /**
     * Tải hoặc đồng bộ bộ nhớ ngữ cảnh của một phiên phỏng vấn.
     */
    public AgentMemory loadOrCreateMemory(Long sessionId) {
        return memoryCache.computeIfAbsent(sessionId, id -> {
            InterviewSession session = sessionRepository.findById(id).orElse(null);
            if (session == null) {
                return AgentMemory.builder().sessionId(id).build();
            }

            AgentMemory memory = AgentMemory.builder()
                    .sessionId(session.getSessionId())
                    .candidateId(session.getCandidate().getCandidateId())
                    .targetPosition(session.getTargetPosition())
                    .lastUpdated(LocalDateTime.now())
                    .build();

            // Load existing conversation turns from DB
            List<InterviewDetail> details = detailRepository.findBySession_SessionIdOrderByQuestionNumberAsc(id);
            for (InterviewDetail d : details) {
                memory.addTurn(
                        d.getQuestionNumber() != null ? d.getQuestionNumber() : 1,
                        d.getQuestionText(),
                        d.getCandidateAnswerText(),
                        d.getAiEvaluationScore(),
                        d.getAiFeedback()
                );
            }

            // Tải bộ nhớ dài hạn xuyên các phiên (Cross-Session Long-Term Memory từ PostgreSQL)
            if (session.getCandidate() != null) {
                try {
                    List<InterviewSession> pastSessions = sessionRepository
                            .findByCandidate_CandidateIdOrderByStartedAtDesc(session.getCandidate().getCandidateId());
                    for (InterviewSession ps : pastSessions) {
                        if (!ps.getSessionId().equals(id) && ps.getWeaknessSummary() != null && !ps.getWeaknessSummary().isBlank()) {
                            memory.getIdentifiedWeaknesses().add(ps.getWeaknessSummary());
                            if (memory.getIdentifiedWeaknesses().size() >= 3) break;
                        }
                    }
                } catch (Exception ex) {
                    log.warn(">> [AgentMemory] Không thể tải điểm yếu lịch sử: {}", ex.getMessage());
                }
            }

            log.info(">> [AgentMemory] Tải thành công bộ nhớ ngữ cảnh cho Session ID {} ({} lượt hỏi đáp, {} điểm yếu lịch sử)",
                    sessionId, memory.getConversationTurns().size(), memory.getIdentifiedWeaknesses().size());
            return memory;
        });
    }

    /**
     * Ghi nhận một lượt hội thoại mới vào bộ nhớ của Agent.
     */
    public void recordTurn(Long sessionId, int questionNumber, String question, String answer, Float score, String feedback) {
        AgentMemory memory = loadOrCreateMemory(sessionId);
        memory.addTurn(questionNumber, question, answer, score, feedback);

        // Phân loại chủ đề kỹ thuật để cập nhật hồ sơ năng lực (Domain Topic Breakdown)
        if (score != null) {
            String combined = ((question != null ? question : "") + " " + (answer != null ? answer : "")).toLowerCase();
            if (combined.contains("sql") || combined.contains("database") || combined.contains("index") || combined.contains("postgres") || combined.contains("b-tree")) {
                memory.updateTopicProficiency("Database & Storage", score);
            }
            if (combined.contains("thread") || combined.contains("concurrency") || combined.contains("lock") || combined.contains("async")) {
                memory.updateTopicProficiency("Concurrency & Multithreading", score);
            }
            if (combined.contains("docker") || combined.contains("kubernetes") || combined.contains("ci/cd") || combined.contains("k8s")) {
                memory.updateTopicProficiency("DevOps & Infrastructure", score);
            }
            if (combined.contains("microservice") || combined.contains("rest") || combined.contains("spring") || combined.contains("architecture")) {
                memory.updateTopicProficiency("System Architecture", score);
            }
        }
    }

    /**
     * Giải phóng bộ nhớ khi phiên phỏng vấn kết thúc.
     */
    public void evictMemory(Long sessionId) {
        memoryCache.remove(sessionId);
        log.info(">> [AgentMemory] Đã giải phóng bộ nhớ của Session ID {}", sessionId);
    }
}
