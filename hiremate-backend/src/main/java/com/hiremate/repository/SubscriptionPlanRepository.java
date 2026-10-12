package com.hiremate.repository;

import com.hiremate.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    List<SubscriptionPlan> findByIsActiveTrueOrderByPriceAsc();
    List<SubscriptionPlan> findByTargetRoleAndIsActiveTrueOrderByPriceAsc(String targetRole);
}
