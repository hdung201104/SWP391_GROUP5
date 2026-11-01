package com.hiremate.repository;

import com.hiremate.entity.InterviewDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository cho InterviewDetail.
 * THAY ĐỔI: session_id nay là @ManyToOne relationship object.
 * LOẠI BỎ: mọi truy vấn liên quan đến question_id (question_bank đã xóa).
 */
@Repository
public interface InterviewDetailRepository extends JpaRepository<InterviewDetail, Long> {

    /** Lấy toàn bộ câu hỏi/đáp án của một phiên phỏng vấn, theo thứ tự số câu */
    List<InterviewDetail> findBySession_SessionIdOrderByQuestionNumberAsc(Long sessionId);

    /** Lấy toàn bộ chi tiết câu hỏi của một danh sách các phiên phỏng vấn (Batch fetch loại bỏ hoàn toàn N+1 queries) */
    @Query("SELECT d FROM InterviewDetail d JOIN FETCH d.session s WHERE s.sessionId IN :sessionIds ORDER BY d.questionNumber ASC")
    List<InterviewDetail> findBySession_SessionIdInOrderByQuestionNumberAsc(@Param("sessionIds") java.util.Collection<Long> sessionIds);

    /** Đếm số câu hỏi đã có trong một phiên phỏng vấn */
    long countBySession_SessionId(Long sessionId);

    /** Đếm số câu hỏi theo danh sách phiên phỏng vấn (Batch count để loại bỏ N+1 queries) */
    @Query("SELECT d.session.sessionId, COUNT(d.detailId) FROM InterviewDetail d WHERE d.session.sessionId IN :sessionIds GROUP BY d.session.sessionId")
    List<Object[]> countDetailsBySessionIds(@Param("sessionIds") java.util.Collection<Long> sessionIds);

    /** Xác thực quyền sở hữu file ghi âm audio của ứng viên */
    @Query("SELECT COUNT(d) > 0 FROM InterviewDetail d WHERE d.audioUrl = :audioUrl AND d.session.candidate.candidateId = :candidateId")
    boolean existsByAudioUrlAndCandidateId(@Param("audioUrl") String audioUrl, @Param("candidateId") Long candidateId);
}
