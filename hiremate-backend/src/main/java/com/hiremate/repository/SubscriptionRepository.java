package com.hiremate.repository;

import com.hiremate.entity.Subscription;
import com.hiremate.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(Long userId, SubscriptionStatus status);
    List<Subscription> findByUser_UserIdAndStatus(Long userId, SubscriptionStatus status);
    List<Subscription> findAllByOrderByCreatedAtDesc();
    long countByStatus(SubscriptionStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Subscription s JOIN FETCH s.plan p " +
           "WHERE s.user.userId = :userId " +
           "AND s.status = :status " +
           "AND s.endDate > :now " +
           "AND p.targetRole = 'CANDIDATE' " +
           "ORDER BY s.createdAt DESC")
    List<Subscription> findActiveCandidateSubscriptions(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("status") SubscriptionStatus status,
            @org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now
    );

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Subscription s JOIN FETCH s.plan p JOIN FETCH s.user u WHERE s.status = :status ORDER BY s.createdAt DESC")
    List<Subscription> findByStatusWithDetails(@org.springframework.data.repository.query.Param("status") SubscriptionStatus status);

    boolean existsByPlan_PlanId(Long planId);
}

