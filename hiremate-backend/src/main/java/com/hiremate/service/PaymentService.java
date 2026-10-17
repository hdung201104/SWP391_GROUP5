package com.hiremate.service;

import com.hiremate.dto.request.CreatePaymentOrderRequest;
import com.hiremate.dto.request.ValidateVoucherRequest;
import com.hiremate.dto.response.PaymentOrderResponse;
import com.hiremate.dto.response.VoucherValidationResponse;
import com.hiremate.entity.SubscriptionPlan;
import com.hiremate.entity.User;

import java.util.List;

public interface PaymentService {
    VoucherValidationResponse validateVoucher(ValidateVoucherRequest request);
    PaymentOrderResponse createPaymentOrder(User user, CreatePaymentOrderRequest request);
    PaymentOrderResponse getOrderByCode(String orderCode);
    List<PaymentOrderResponse> getMyOrders(User user);
    List<SubscriptionPlan> getActivePlans(String targetRole);
    PaymentOrderResponse processPayOSWebhook(java.util.Map<String, Object> webhookData);
    com.hiremate.dto.response.SubscriptionResponse getMyActiveSubscription(User user);
    PaymentOrderResponse cancelOrder(User user, String orderCode);
}
