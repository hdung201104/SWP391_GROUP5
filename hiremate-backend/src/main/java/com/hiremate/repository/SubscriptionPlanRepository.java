package com.hiremate.repository;

import com.hiremate.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    List<SubscriptionPlan> findByIsActiveTrueOrderByPriceAsc();
    List<SubscriptionPlan> findByTargetRoleAndIsActiveTrueOrderByPriceAsc(String targetRole);
    java.util.Optional<SubscriptionPlan> findFirstByPlanNameIgnoreCaseAndIsActiveTrue(String planName);
    java.util.Optional<SubscriptionPlan> findFirstByTargetRoleAndPriceAndIsActiveTrue(String targetRole, java.math.BigDecimal price);
    List<SubscriptionPlan> findByTargetRoleAndIsActiveTrue(String targetRole);
}

