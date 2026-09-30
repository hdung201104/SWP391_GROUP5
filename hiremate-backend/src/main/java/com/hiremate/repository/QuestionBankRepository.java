package com.hiremate.repository;

import com.hiremate.entity.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findBySkillId(Long skillId);
    List<QuestionBank> findByCategory(String category);
    List<QuestionBank> findByIsActiveTrue();
}
