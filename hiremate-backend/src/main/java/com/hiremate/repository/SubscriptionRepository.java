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
}
