package com.hiremate.repository;

import com.hiremate.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findBySkillName(String skillName);
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
    boolean existsBySkillNameIgnoreCase(String skillName);
    java.util.List<Skill> findByCategoryIgnoreCase(String category);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT s.category FROM Skill s WHERE s.category IS NOT NULL ORDER BY s.category")
    java.util.List<String> findDistinctCategories();
}
