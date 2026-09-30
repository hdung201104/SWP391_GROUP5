package com.hiremate.repository;

import com.hiremate.entity.InterviewDetail;
import org.springframework.data.jpa.repository.JpaRepository;
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

    /** Đếm số câu hỏi đã có trong một phiên phỏng vấn */
    long countBySession_SessionId(Long sessionId);
}
