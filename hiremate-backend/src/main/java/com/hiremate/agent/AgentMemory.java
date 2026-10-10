package com.hiremate.agent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Quản lý Trạng thái Ngữ cảnh & Bộ nhớ Nhiều lượt (Multi-Turn Episodic Memory) của AI Agent.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentMemory {

    private Long sessionId;
    private Long candidateId;
    private String targetPosition;

    @Builder.Default
    private List<MemoryTurn> conversationTurns = new ArrayList<>();

    @Builder.Default
    private List<String> verifiedSkills = new ArrayList<>();

    @Builder.Default
    private List<String> identifiedWeaknesses = new java.util.ArrayList<>();

    @Builder.Default
    private java.util.Map<String, Float> topicProficiency = new java.util.concurrent.ConcurrentHashMap<>();

    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public void addTurn(int questionNumber, String question, String answer, Float score, String feedback) {
        if (conversationTurns == null) {
            conversationTurns = new ArrayList<>();
        }
        conversationTurns.add(new MemoryTurn(questionNumber, question, answer, score, feedback, LocalDateTime.now()));
        this.lastUpdated = LocalDateTime.now();
    }

    public void updateTopicProficiency(String topic, float score) {
        if (topicProficiency == null) {
            topicProficiency = new java.util.concurrent.ConcurrentHashMap<>();
        }
        topicProficiency.merge(topic, score, (oldScore, newScore) -> Math.round(((oldScore * 0.6f) + (newScore * 0.4f)) * 10f) / 10f);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemoryTurn {
        private int questionNumber;
        private String question;
        private String candidateAnswer;
        private Float score;
        private String feedback;
        private LocalDateTime timestamp;
    }
}
