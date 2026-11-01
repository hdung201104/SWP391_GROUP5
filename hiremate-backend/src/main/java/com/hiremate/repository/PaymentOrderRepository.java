package com.hiremate.repository;

import com.hiremate.entity.PaymentOrder;
import com.hiremate.enums.PaymentOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    Optional<PaymentOrder> findByOrderCode(String orderCode);
    List<PaymentOrder> findAllByOrderByCreatedAtDesc();
    List<PaymentOrder> findByStatusOrderByCreatedAtDesc(PaymentOrderStatus status);
    List<PaymentOrder> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
    long countByStatus(PaymentOrderStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentOrder p WHERE p.status = com.hiremate.enums.PaymentOrderStatus.APPROVED")
    java.math.BigDecimal sumTotalRevenue();

    boolean existsByPlan_PlanId(Long planId);
    boolean existsByVoucher_VoucherId(Long voucherId);
}
