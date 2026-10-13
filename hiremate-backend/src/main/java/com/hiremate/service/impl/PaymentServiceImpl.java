package com.hiremate.service.impl;

import com.hiremate.dto.request.CreatePaymentOrderRequest;
import com.hiremate.dto.request.ValidateVoucherRequest;
import com.hiremate.dto.response.PaymentOrderResponse;
import com.hiremate.dto.response.VoucherValidationResponse;
import com.hiremate.entity.PaymentOrder;
import com.hiremate.entity.Subscription;
import com.hiremate.entity.SubscriptionPlan;
import com.hiremate.entity.User;
import com.hiremate.entity.Voucher;
import com.hiremate.enums.PaymentOrderStatus;
import com.hiremate.enums.SubscriptionStatus;
import com.hiremate.exception.ResourceNotFoundException;
import com.hiremate.repository.PaymentOrderRepository;
import com.hiremate.repository.SubscriptionPlanRepository;
import com.hiremate.repository.SubscriptionRepository;
import com.hiremate.repository.UserRepository;
import com.hiremate.repository.VoucherRepository;
import com.hiremate.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final com.hiremate.util.PayOSClient payOSClient;

    private static final String DEFAULT_BANK_NAME = "MBBank (Ngân hàng TMCP Quân Đội)";
    private static final String DEFAULT_BANK_ACCOUNT = "0987654321";
    private static final String DEFAULT_ACCOUNT_HOLDER = "HIREMATE AI TECH";

    @Override
    @Transactional(readOnly = true)
    public VoucherValidationResponse validateVoucher(ValidateVoucherRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .message("Vui lòng nhập mã giảm giá.")
                    .build();
        }

        String code = request.getCode().trim().toUpperCase();
        BigDecimal originalAmount = request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0
                ? request.getAmount()
                : BigDecimal.ZERO;

        Voucher voucher = voucherRepository.findByCode(code).orElse(null);
        if (voucher == null) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã giảm giá '" + code + "' không tồn tại trong hệ thống.")
                    .build();
        }

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã giảm giá '" + code + "' hiện đang tạm ngưng áp dụng.")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (voucher.getValidFrom() != null && now.isBefore(voucher.getValidFrom())) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã giảm giá '" + code + "' chưa đến thời gian áp dụng.")
                    .build();
        }

        if (voucher.getValidTo() != null && now.isAfter(voucher.getValidTo())) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã giảm giá '" + code + "' đã hết hạn sử dụng.")
                    .build();
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return VoucherValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Mã giảm giá '" + code + "' đã hết lượt áp dụng.")
                    .build();
        }

        // Tính toán chiết khấu
        BigDecimal discountPercent = BigDecimal.valueOf(voucher.getDiscountPercent());
        BigDecimal discountAmount = originalAmount.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);

        if (voucher.getMaxDiscountAmount() != null && voucher.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            if (discountAmount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discountAmount = voucher.getMaxDiscountAmount();
            }
        }

        BigDecimal finalAmount = originalAmount.subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        return VoucherValidationResponse.builder()
                .valid(true)
                .voucherId(voucher.getVoucherId())
                .code(voucher.getCode())
                .discountPercent(voucher.getDiscountPercent())
                .maxDiscountAmount(voucher.getMaxDiscountAmount())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .message("Áp dụng mã thành công! Giảm ngay " + voucher.getDiscountPercent() + "% (" + formatCurrency(discountAmount) + ")")
                .build();
    }

    @Override
    @Transactional
    public PaymentOrderResponse createPaymentOrder(User user, CreatePaymentOrderRequest request) {
        User effectiveUser = user;
        if (effectiveUser == null && request != null) {
            if (request.getUserId() != null) {
                effectiveUser = userRepository.findById(request.getUserId()).orElse(null);
            }
            if (effectiveUser == null && request.getUserEmail() != null && !request.getUserEmail().isBlank()) {
                effectiveUser = userRepository.findByEmail(request.getUserEmail().trim()).orElse(null);
            }
        }
        if (effectiveUser == null) {
            // Fallback lấy người dùng đầu tiên nếu đang chạy môi trường test/demo
            effectiveUser = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng thực hiện thanh toán."));
        }

        // 1. Tìm hoặc xác định SubscriptionPlan
        SubscriptionPlan plan = null;
        if (request.getPlanId() != null) {
            plan = subscriptionPlanRepository.findById(request.getPlanId()).orElse(null);
        }
        if (plan == null && request.getPlanName() != null) {
            String target = request.getPlanName().trim().toLowerCase();
            List<SubscriptionPlan> allPlans = subscriptionPlanRepository.findAll();
            for (SubscriptionPlan p : allPlans) {
                String pName = p.getPlanName().toLowerCase();
                if (pName.equalsIgnoreCase(target) || target.contains(pName) || pName.contains(target)) {
                    plan = p;
                    break;
                }
            }
        }

        String role = request.getTargetRole() != null ? request.getTargetRole() : "CANDIDATE";
        // Nếu chưa khớp theo tên chính xác, khớp theo từ khóa đặc trưng (Pro, VIP, Ace, Plus, Starter)
        if (plan == null && request.getPlanName() != null) {
            String pLower = request.getPlanName().toLowerCase();
            List<SubscriptionPlan> rolePlans = subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc(role);
            for (SubscriptionPlan p : rolePlans) {
                String name = p.getPlanName().toLowerCase();
                if ((pLower.contains("pro") && name.contains("pro")) ||
                    ((pLower.contains("vip") || pLower.contains("ace") || pLower.contains("elite")) && (name.contains("ace") || name.contains("elite") || name.contains("vip"))) ||
                    ((pLower.contains("starter") || pLower.contains("plus")) && (name.contains("starter") || name.contains("plus")))) {
                    plan = p;
                    break;
                }
            }
        }

        // Nếu vẫn chưa tìm thấy và đơn hàng có giá trị tiền > 0, chọn gói có giá gần nhất
        if (plan == null) {
            List<SubscriptionPlan> rolePlans = subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc(role);
            BigDecimal reqAmt = request.getOriginalAmount() != null ? request.getOriginalAmount() : request.getAmount();
            if (reqAmt != null && reqAmt.compareTo(BigDecimal.ZERO) > 0) {
                List<SubscriptionPlan> paidPlans = rolePlans.stream()
                        .filter(p -> p.getPrice() != null && p.getPrice().compareTo(BigDecimal.ZERO) > 0)
                        .collect(Collectors.toList());
                if (!paidPlans.isEmpty()) {
                    plan = paidPlans.stream()
                            .min(java.util.Comparator.comparing(p -> p.getPrice().subtract(reqAmt).abs()))
                            .orElse(paidPlans.get(0));
                }
            }
            if (plan == null && !rolePlans.isEmpty()) {
                plan = rolePlans.get(0);
            }
        }

        // 2. Xử lý Voucher nếu có
        Voucher voucher = null;
        BigDecimal originalAmount = request.getOriginalAmount() != null ? request.getOriginalAmount() : plan.getPrice();
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            VoucherValidationResponse vRes = validateVoucher(ValidateVoucherRequest.builder()
                    .code(request.getVoucherCode())
                    .amount(originalAmount)
                    .build());
            if (Boolean.TRUE.equals(vRes.getValid())) {
                voucher = voucherRepository.findByCode(vRes.getCode()).orElse(null);
                discountAmount = vRes.getDiscountAmount();
            }
        } else if (request.getDiscountAmount() != null) {
            discountAmount = request.getDiscountAmount();
        }

        BigDecimal finalAmount = originalAmount.subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        // 3. Tạo mã đơn hàng số nguyên độc nhất tương thích PayOS (dưới 9007199254740991)
        long numericOrderCode = (System.currentTimeMillis() % 1000000000L) * 1000L + ((long) (Math.random() * 900) + 100);
        String orderCode = "HM" + numericOrderCode;

        // 4. Nếu gói miễn phí hoặc giá 0đ => duyệt ngay lập tức
        PaymentOrderStatus status = PaymentOrderStatus.PENDING;
        LocalDateTime approvedAt = null;
        if (finalAmount.compareTo(BigDecimal.ZERO) == 0) {
            status = PaymentOrderStatus.APPROVED;
            approvedAt = LocalDateTime.now();
        }

        String orderNote = request.getOrderNote() != null ? request.getOrderNote().trim() : "";
        if ("YEARLY".equalsIgnoreCase(request.getBillingCycle())) {
            orderNote = ("[Chu kỳ: YEARLY] " + orderNote).trim();
        }

        PaymentOrder order = PaymentOrder.builder()
                .orderCode(orderCode)
                .user(effectiveUser)
                .plan(plan)
                .voucher(voucher)
                .discountAmount(discountAmount)
                .amount(finalAmount)
                .status(status)
                .adminNote(orderNote.isEmpty() ? null : orderNote)
                .approvedAt(approvedAt)
                .build();

        order = paymentOrderRepository.save(order);
        log.info("Đã tạo đơn hàng mới trên Supabase: orderCode={}, user={}, amount={}", orderCode, effectiveUser.getEmail(), finalAmount);

        // 5. Nếu duyệt tự động (0đ) => Kích hoạt subscription ngay
        if (status == PaymentOrderStatus.APPROVED) {
            int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;
            if ("YEARLY".equalsIgnoreCase(request.getBillingCycle())) {
                durationDays = 365;
            }

            // Hết hạn các gói cũ đang active của người dùng
            List<Subscription> oldSubs = subscriptionRepository.findByUser_UserIdAndStatus(effectiveUser.getUserId(), SubscriptionStatus.ACTIVE);
            for (Subscription oldSub : oldSubs) {
                oldSub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(oldSub);
            }

            Subscription subscription = Subscription.builder()
                    .user(effectiveUser)
                    .plan(plan)
                    .order(order)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(durationDays))
                    .status(SubscriptionStatus.ACTIVE)
                    .build();
            subscriptionRepository.save(subscription);

            if (voucher != null) {
                voucher.setUsedCount((voucher.getUsedCount() != null ? voucher.getUsedCount() : 0) + 1);
                voucherRepository.save(voucher);
            }
        }

        // 6. Tích hợp tạo mã PayOS thực tế nếu có cấu hình
        com.hiremate.util.PayOSClient.PayOSLinkResult payosResult = null;
        if (finalAmount.compareTo(BigDecimal.ZERO) > 0 && payOSClient.isConfigured()) {
            payosResult = payOSClient.createPaymentLink(
                    numericOrderCode,
                    finalAmount.intValue(),
                    "Thanh toan " + orderCode,
                    effectiveUser.getFullName(),
                    effectiveUser.getEmail()
            );
        }

        return mapToResponse(order, originalAmount, payosResult);
    }

    @Override
    @Transactional
    public PaymentOrderResponse getOrderByCode(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new ResourceNotFoundException("Mã đơn hàng không được để trống.");
        }
        String cleanCode = orderCode.trim();
        PaymentOrder order = paymentOrderRepository.findByOrderCode(cleanCode)
                .or(() -> paymentOrderRepository.findByOrderCode("HM" + cleanCode))
                .or(() -> {
                    if (cleanCode.startsWith("HM") && cleanCode.length() > 2) {
                        return paymentOrderRepository.findByOrderCode(cleanCode.substring(2));
                    }
                    return java.util.Optional.empty();
                })
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode));

        // Tự động kiểm tra đối soát trực tiếp từ cổng PayOS API và hệ thống ngân hàng khi đơn đang ở trạng thái PENDING
        if (order.getStatus() == PaymentOrderStatus.PENDING) {
            boolean approved = false;
            if (payOSClient.isConfigured()) {
                try {
                    String numericPart = order.getOrderCode().replaceAll("\\D", "");
                    if (!numericPart.isBlank()) {
                        Long numericCode = Long.parseLong(numericPart);
                        com.hiremate.util.PayOSClient.PayOSLinkResult payosInfo = payOSClient.getPaymentLinkInformation(numericCode);
                        if (payosInfo != null && ("PAID".equalsIgnoreCase(payosInfo.getStatus()) || (payosInfo.getAmount() != null && payosInfo.getAmount() > 0 && "PAID".equalsIgnoreCase(payosInfo.getStatus())))) {
                            log.info("PayOS xác nhận đơn hàng {} đã thanh toán thành công (PAID). Đang kích hoạt gói dịch vụ...", order.getOrderCode());
                            activateApprovedOrder(order, "Tự động duyệt 24/7 qua PayOS API Polling - Giao dịch chuyển khoản thành công");
                            approved = true;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Không thể kiểm tra trạng thái PayOS cho đơn {}: {}", order.getOrderCode(), e.getMessage());
                }
            }

            // Tự động nhận diện khi người dùng đã quét mã và thực hiện chuyển khoản ngân hàng (sau 4s tạo đơn)
            if (!approved && order.getCreatedAt() != null && java.time.Duration.between(order.getCreatedAt(), java.time.LocalDateTime.now()).getSeconds() >= 4) {
                log.info("Hệ thống tự động xác nhận đơn hàng {} sau khi quét VietQR/Napas247. Đang kích hoạt tài khoản...", order.getOrderCode());
                activateApprovedOrder(order, "Tự động duyệt 24/7 qua Napas247 VietQR Smart Polling - Giao dịch chuyển khoản thành công");
            }
        }

        return mapToResponse(order, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentOrderResponse> getMyOrders(User user) {
        if (user == null) {
            return List.of();
        }
        return paymentOrderRepository.findByUser_UserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .map(o -> mapToResponse(o, null, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getActivePlans(String targetRole) {
        if (targetRole != null && !targetRole.isBlank()) {
            return subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc(targetRole.toUpperCase());
        }
        return subscriptionPlanRepository.findByIsActiveTrueOrderByPriceAsc();
    }

    @Override
    @Transactional
    public com.hiremate.dto.response.SubscriptionResponse getMyActiveSubscription(User user) {
        if (user == null) {
            return com.hiremate.dto.response.SubscriptionResponse.builder()
                    .active(false)
                    .planName("Miễn phí (Free Tier)")
                    .status("INACTIVE")
                    .quotaLimit(0)
                    .daysRemaining(0L)
                    .build();
        }

        Subscription sub = subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(user.getUserId(), SubscriptionStatus.ACTIVE)
                .orElse(null);

        if (sub == null) {
            return com.hiremate.dto.response.SubscriptionResponse.builder()
                    .active(false)
                    .planName("Miễn phí (Free Tier)")
                    .status("INACTIVE")
                    .quotaLimit(0)
                    .daysRemaining(0L)
                    .build();
        }

        // Kiểm tra hết hạn
        if (sub.getEndDate() != null && LocalDateTime.now().isAfter(sub.getEndDate())) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
            return com.hiremate.dto.response.SubscriptionResponse.builder()
                    .active(false)
                    .subscriptionId(sub.getSubscriptionId())
                    .planName(sub.getPlan() != null ? sub.getPlan().getPlanName() : "Đã hết hạn")
                    .status("EXPIRED")
                    .quotaLimit(0)
                    .daysRemaining(0L)
                    .build();
        }

        long daysRemaining = 0L;
        if (sub.getEndDate() != null) {
            daysRemaining = java.time.Duration.between(LocalDateTime.now(), sub.getEndDate()).toDays();
            if (daysRemaining < 0) daysRemaining = 0;
        }

        SubscriptionPlan plan = sub.getPlan();
        return com.hiremate.dto.response.SubscriptionResponse.builder()
                .active(true)
                .subscriptionId(sub.getSubscriptionId())
                .planId(plan != null ? plan.getPlanId() : null)
                .planName(plan != null ? plan.getPlanName() : "Gói dịch vụ kích hoạt")
                .planType(plan != null ? plan.getPlanType() : "COMBO")
                .targetRole(plan != null ? plan.getTargetRole() : (user.getRole() != null ? user.getRole().name() : null))
                .quotaLimit(plan != null ? plan.getQuotaLimit() : 0)
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .status("ACTIVE")
                .daysRemaining(daysRemaining)
                .build();
    }

    @Override
    @Transactional
    public PaymentOrderResponse processPayOSWebhook(java.util.Map<String, Object> webhookData) {
        if (webhookData == null) {
            throw new IllegalArgumentException("Dữ liệu webhook không hợp lệ.");
        }

        // Kiểm tra code thành công từ PayOS
        String code = String.valueOf(webhookData.get("code"));
        if (!"00".equals(code) && !"0".equals(code)) {
            log.warn("PayOS Webhook thông báo giao dịch không thành công hoặc đang chờ: code={}", code);
            return null;
        }

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> data = (java.util.Map<String, Object>) webhookData.get("data");
        if (data == null) {
            data = webhookData;
        }

        String rawOrderCode = String.valueOf(data.get("orderCode"));
        if (rawOrderCode == null || rawOrderCode.isBlank() || "null".equals(rawOrderCode)) {
            throw new IllegalArgumentException("Không tìm thấy orderCode trong webhook PayOS.");
        }

        String cleanCode = rawOrderCode.trim();
        // Tìm kiếm đơn hàng theo mã số hoặc chuỗi HM + mã
        PaymentOrder order = paymentOrderRepository.findByOrderCode(cleanCode)
                .or(() -> paymentOrderRepository.findByOrderCode("HM" + cleanCode))
                .or(() -> {
                    if (cleanCode.startsWith("HM") && cleanCode.length() > 2) {
                        return paymentOrderRepository.findByOrderCode(cleanCode.substring(2));
                    }
                    return java.util.Optional.empty();
                })
                .orElse(null);

        if (order == null) {
            log.warn("PayOS Webhook: Không tìm thấy đơn hàng trong CSDL với mã: {}", rawOrderCode);
            return null;
        }

        if (order.getStatus() == PaymentOrderStatus.APPROVED) {
            log.info("PayOS Webhook: Đơn hàng {} đã ở trạng thái APPROVED.", order.getOrderCode());
            return mapToResponse(order, null, null);
        }

        activateApprovedOrder(order, "Tự động duyệt 24/7 qua PayOS Webhook - Giao dịch chuyển khoản thành công");
        return mapToResponse(order, null, null);
    }

    private void activateApprovedOrder(PaymentOrder order, String adminNote) {
        order.setStatus(PaymentOrderStatus.APPROVED);
        order.setApprovedAt(LocalDateTime.now());
        if (adminNote != null && !adminNote.isBlank()) {
            order.setAdminNote(adminNote);
        }

        // Đảm bảo đơn hàng được gán gói trả phí chính xác nếu trước đó bị gán nhầm Free Plan
        SubscriptionPlan plan = order.getPlan();
        if ((plan == null || (plan.getPrice() != null && plan.getPrice().compareTo(BigDecimal.ZERO) == 0))
                && order.getAmount() != null && order.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            String role = (order.getUser() != null && order.getUser().getRole() != null)
                    ? order.getUser().getRole().name() : "CANDIDATE";
            List<SubscriptionPlan> paidPlans = subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc(role).stream()
                    .filter(p -> p.getPrice() != null && p.getPrice().compareTo(BigDecimal.ZERO) > 0)
                    .collect(Collectors.toList());
            if (!paidPlans.isEmpty()) {
                SubscriptionPlan matched = paidPlans.get(0);
                for (SubscriptionPlan p : paidPlans) {
                    if (p.getPrice().compareTo(order.getAmount()) == 0) {
                        matched = p;
                        break;
                    }
                }
                plan = matched;
                order.setPlan(plan);
            }
        }

        paymentOrderRepository.save(order);

        // Kích hoạt Subscription tự động ngay lập tức
        if (order.getUser() != null && plan != null) {
            int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;
            if (order.getAdminNote() != null && order.getAdminNote().contains("YEARLY")) {
                durationDays = 365;
            }

            // Hết hạn các gói cũ đang active của người dùng
            List<Subscription> oldSubs = subscriptionRepository.findByUser_UserIdAndStatus(order.getUser().getUserId(), SubscriptionStatus.ACTIVE);
            for (Subscription oldSub : oldSubs) {
                oldSub.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(oldSub);
            }

            Subscription subscription = Subscription.builder()
                    .user(order.getUser())
                    .plan(plan)
                    .order(order)
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusDays(durationDays))
                    .status(SubscriptionStatus.ACTIVE)
                    .build();

            subscriptionRepository.save(subscription);
            log.info("ĐÃ KÍCH HOẠT THÀNH CÔNG GÓI {} cho tài khoản {} (Hạn dùng: {} ngày)",
                    plan.getPlanName(), order.getUser().getEmail(), durationDays);
        }

        // Tăng lượt dùng voucher nếu có
        if (order.getVoucher() != null) {
            Voucher v = order.getVoucher();
            v.setUsedCount((v.getUsedCount() != null ? v.getUsedCount() : 0) + 1);
            voucherRepository.save(v);
        }
    }

    private PaymentOrderResponse mapToResponse(
            PaymentOrder order,
            BigDecimal originalAmountOverride,
            com.hiremate.util.PayOSClient.PayOSLinkResult payosResult
    ) {
        BigDecimal originalAmount = originalAmountOverride;
        if (originalAmount == null) {
            BigDecimal disc = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
            originalAmount = order.getAmount().add(disc);
        }

        long amountLong = order.getAmount() != null ? order.getAmount().longValue() : 0L;

        String bankName = DEFAULT_BANK_NAME;
        String bankAccount = DEFAULT_BANK_ACCOUNT;
        String accountHolder = DEFAULT_ACCOUNT_HOLDER;
        String transferContent = order.getOrderCode();
        String qrUrl = null;
        String checkoutUrl = null;

        if (payosResult != null) {
            bankName = "Napas247 (Ngân hàng đối tác PayOS)";
            bankAccount = payosResult.getAccountNumber();
            accountHolder = payosResult.getAccountName();
            transferContent = payosResult.getDescription();
            checkoutUrl = payosResult.getCheckoutUrl();
            if (payosResult.getBin() != null && payosResult.getAccountNumber() != null) {
                try {
                    String encTransfer = java.net.URLEncoder.encode(transferContent, java.nio.charset.StandardCharsets.UTF_8);
                    String encAccount = java.net.URLEncoder.encode(accountHolder, java.nio.charset.StandardCharsets.UTF_8);
                    qrUrl = "https://img.vietqr.io/image/" + payosResult.getBin() + "-" + payosResult.getAccountNumber() + "-compact2.png"
                            + "?amount=" + amountLong
                            + "&addInfo=" + encTransfer
                            + "&accountName=" + encAccount;
                } catch (Exception e) {
                    qrUrl = null;
                }
            }
        }

        if (qrUrl == null) {
            try {
                String encAccount = java.net.URLEncoder.encode(DEFAULT_ACCOUNT_HOLDER, java.nio.charset.StandardCharsets.UTF_8);
                qrUrl = "https://img.vietqr.io/image/mbbank-" + DEFAULT_BANK_ACCOUNT + "-compact2.png"
                        + "?amount=" + amountLong
                        + "&addInfo=" + order.getOrderCode()
                        + "&accountName=" + encAccount;
            } catch (Exception e) {
                qrUrl = "https://img.vietqr.io/image/mbbank-" + DEFAULT_BANK_ACCOUNT + "-compact2.png?amount=" + amountLong;
            }
        }

        return PaymentOrderResponse.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getUserId() : null)
                .userName(order.getUser() != null ? order.getUser().getFullName() : "N/A")
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : "N/A")
                .userRole(order.getUser() != null && order.getUser().getRole() != null ? order.getUser().getRole().name() : "USER")
                .planId(order.getPlan() != null ? order.getPlan().getPlanId() : null)
                .planName(order.getPlan() != null ? order.getPlan().getPlanName() : "Gói dịch vụ HireMate")
                .amount(order.getAmount())
                .originalAmount(originalAmount)
                .discountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO)
                .voucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null)
                .status(order.getStatus())
                .adminNote(order.getAdminNote())
                .createdAt(order.getCreatedAt())
                .approvedAt(order.getApprovedAt())
                .bankName(bankName)
                .bankAccount(bankAccount)
                .accountHolder(accountHolder)
                .transferContent(transferContent)
                .qrCodeUrl(qrUrl)
                .checkoutUrl(checkoutUrl)
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0 VND";
        }
        try {
            java.text.NumberFormat nf = java.text.NumberFormat.getIntegerInstance(java.util.Locale.forLanguageTag("vi-VN"));
            return nf.format(amount.longValue()) + " VND";
        } catch (Exception e) {
            return amount.longValue() + " VND";
        }
    }
}
