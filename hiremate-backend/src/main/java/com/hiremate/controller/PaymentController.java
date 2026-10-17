package com.hiremate.controller;

import com.hiremate.dto.request.CreatePaymentOrderRequest;
import com.hiremate.dto.request.ValidateVoucherRequest;
import com.hiremate.dto.response.ApiResponse;
import com.hiremate.dto.response.PaymentOrderResponse;
import com.hiremate.dto.response.VoucherValidationResponse;
import com.hiremate.entity.SubscriptionPlan;
import com.hiremate.entity.User;
import com.hiremate.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/validate-voucher")
    public ResponseEntity<ApiResponse<VoucherValidationResponse>> validateVoucher(
            @RequestBody @Valid ValidateVoucherRequest request
    ) {
        VoucherValidationResponse response = paymentService.validateVoucher(request);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra voucher thành công", response));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> checkout(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreatePaymentOrderRequest request
    ) {
        PaymentOrderResponse response = paymentService.createPaymentOrder(user, request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo đơn hàng thanh toán thành công", response));
    }

    @GetMapping("/orders/{orderCode}/status")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> getOrderStatus(
            @PathVariable String orderCode
    ) {
        PaymentOrderResponse response = paymentService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.ok("Lấy trạng thái đơn hàng thành công", response));
    }

    @PostMapping("/orders/{orderCode}/cancel")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> cancelOrder(
            @AuthenticationPrincipal User user,
            @PathVariable String orderCode
    ) {
        PaymentOrderResponse response = paymentService.cancelOrder(user, orderCode);
        return ResponseEntity.ok(ApiResponse.ok("Hủy đơn hàng thành công", response));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<PaymentOrderResponse>>> getMyOrders(
            @AuthenticationPrincipal User user
    ) {
        List<PaymentOrderResponse> orders = paymentService.getMyOrders(user);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách đơn hàng", orders));
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<ApiResponse<com.hiremate.dto.response.SubscriptionResponse>> getMySubscription(
            @AuthenticationPrincipal User user
    ) {
        com.hiremate.dto.response.SubscriptionResponse response = paymentService.getMyActiveSubscription(user);
        return ResponseEntity.ok(ApiResponse.ok("Thông tin gói dịch vụ hiện tại", response));
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getPlans(
            @RequestParam(required = false) String role
    ) {
        List<SubscriptionPlan> plans = paymentService.getActivePlans(role);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách gói dịch vụ", plans));
    }

    @PostMapping("/payos-webhook")
    public ResponseEntity<java.util.Map<String, Object>> handlePayOSWebhook(
            @RequestBody java.util.Map<String, Object> webhookData
    ) {
        paymentService.processPayOSWebhook(webhookData);
        return ResponseEntity.ok(java.util.Map.of("code", "00", "desc", "success"));
    }

    @PostMapping("/simulate-transfer/{orderCode}")
    public ResponseEntity<ApiResponse<PaymentOrderResponse>> simulateTransfer(
            @PathVariable String orderCode
    ) {
        java.util.Map<String, Object> mockData = java.util.Map.of(
                "code", "00",
                "desc", "success",
                "data", java.util.Map.of("orderCode", orderCode)
        );
        PaymentOrderResponse response = paymentService.processPayOSWebhook(mockData);
        if (response == null) {
            throw new com.hiremate.exception.ResourceNotFoundException("Không tìm thấy đơn hàng để xử lý thanh toán: " + orderCode);
        }
        return ResponseEntity.ok(ApiResponse.ok("Giả lập nhận tiền PayOS và tự động kích hoạt gói thành công!", response));
    }
}
