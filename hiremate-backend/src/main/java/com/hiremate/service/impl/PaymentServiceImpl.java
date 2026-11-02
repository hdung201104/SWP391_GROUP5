package com.hiremate.service.impl;

import com.hiremate.dto.VoucherRuleMeta;
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
import com.hiremate.exception.BadRequestException;
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
    private final com.hiremate.repository.RecruiterRepository recruiterRepository;
    private final com.hiremate.util.PayOSClient payOSClient;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.SystemSettingsService systemSettingsService;

    private static final String DEFAULT_BANK_NAME = "MBBank - Ngân hàng TMCP Quân Đội";
    private static final String DEFAULT_BANK_ACCOUNT = "VQRQAMWSJ4104";
    private static final String DEFAULT_ACCOUNT_HOLDER = "HOANG NGOC DUNG";

    @jakarta.annotation.PostConstruct
    public void seedDefaultVouchers() {
        java.util.List<Voucher> seedList = java.util.Arrays.asList(
                Voucher.builder()
                        .code("HIREMATE50")
                        .discountPercent(50)
                        .maxDiscountAmount(BigDecimal.valueOf(150000))
                        .usageLimit(100)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("CANDIDATE20")
                        .discountPercent(20)
                        .maxDiscountAmount(BigDecimal.valueOf(100000))
                        .usageLimit(150)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("FPTTALENT")
                        .discountPercent(30)
                        .maxDiscountAmount(BigDecimal.valueOf(200000))
                        .usageLimit(200)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("PROHR2026")
                        .discountPercent(30)
                        .maxDiscountAmount(BigDecimal.valueOf(300000))
                        .usageLimit(100)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("HRBOOST")
                        .discountPercent(25)
                        .maxDiscountAmount(BigDecimal.valueOf(250000))
                        .usageLimit(100)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("WELCOME2026")
                        .discountPercent(20)
                        .maxDiscountAmount(BigDecimal.valueOf(50000))
                        .usageLimit(300)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build(),
                Voucher.builder()
                        .code("SPRINGTECH")
                        .discountPercent(15)
                        .maxDiscountAmount(BigDecimal.valueOf(50000))
                        .usageLimit(200)
                        .usedCount(0)
                        .validFrom(LocalDateTime.now())
                        .validTo(LocalDateTime.now().plusDays(90))
                        .isActive(true)
                        .build()
        );
        for (Voucher seed : seedList) {
            if (voucherRepository.findByCode(seed.getCode()).isEmpty()) {
                voucherRepository.save(seed);
                log.info(">> [PaymentService] Seeded voucher '{}' into Supabase PostgreSQL.", seed.getCode());
            }
        }
    }

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

        // Đọc cấu hình quy tắc mở rộng (VoucherRuleMeta) từ Cấu hình Hệ thống bền vững
        VoucherRuleMeta meta = null;
        if (systemSettingsService != null && systemSettingsService.getSettings() != null
                && systemSettingsService.getSettings().getVoucherRules() != null) {
            meta = systemSettingsService.getSettings().getVoucherRules().get(code);
        }

        // 1. Kiểm tra vai trò áp dụng của mã giảm giá (Ưu tiên targetRole trong meta, fallback tiền tố cũ)
        if (request.getUserRole() != null && !request.getUserRole().isBlank()) {
            String role = request.getUserRole().trim().toUpperCase();
            if (meta != null && meta.getTargetRole() != null && !"ALL".equalsIgnoreCase(meta.getTargetRole())) {
                String targetRole = meta.getTargetRole().trim().toUpperCase();
                if ("RECRUITER".equals(targetRole) && "CANDIDATE".equals(role)) {
                    return VoucherValidationResponse.builder()
                            .valid(false)
                            .code(code)
                            .message("Mã ưu đãi '" + code + "' chỉ dành riêng cho tài khoản Nhà tuyển dụng.")
                            .build();
                }
                if ("CANDIDATE".equals(targetRole) && "RECRUITER".equals(role)) {
                    return VoucherValidationResponse.builder()
                            .valid(false)
                            .code(code)
                            .message("Mã ưu đãi '" + code + "' chỉ dành riêng cho tài khoản Ứng viên.")
                            .build();
                }
            } else {
                if ("CANDIDATE".equals(role) && (code.startsWith("RECRUITER") || code.startsWith("PROHR") || code.startsWith("HRBOOST"))) {
                    return VoucherValidationResponse.builder()
                            .valid(false)
                            .code(code)
                            .message("Mã ưu đãi '" + code + "' chỉ dành riêng cho tài khoản Nhà tuyển dụng.")
                            .build();
                }
                if ("RECRUITER".equals(role) && (code.startsWith("CANDIDATE") || code.startsWith("FPTTALENT"))) {
                    return VoucherValidationResponse.builder()
                            .valid(false)
                            .code(code)
                            .message("Mã ưu đãi '" + code + "' chỉ dành riêng cho tài khoản Ứng viên.")
                            .build();
                }
            }
        }

        // 2. Kiểm tra giá trị đơn hàng tối thiểu (minOrderAmount)
        if (meta != null && meta.getMinOrderAmount() != null && meta.getMinOrderAmount().compareTo(BigDecimal.ZERO) > 0) {
            if (originalAmount.compareTo(meta.getMinOrderAmount()) < 0) {
                return VoucherValidationResponse.builder()
                        .valid(false)
                        .code(code)
                        .message("Đơn hàng chưa đạt giá trị tối thiểu " + formatCurrency(meta.getMinOrderAmount()) + " để áp dụng mã ưu đãi này.")
                        .build();
            }
        }

        // 3. Kiểm tra phạm vi áp dụng gói dịch vụ (applicableScope == SPECIFIC)
        if (meta != null && "SPECIFIC".equalsIgnoreCase(meta.getApplicableScope())
                && meta.getApplicablePlanIds() != null && !meta.getApplicablePlanIds().isEmpty()) {
            if (request.getPlanId() == null || !meta.getApplicablePlanIds().contains(request.getPlanId())) {
                return VoucherValidationResponse.builder()
                        .valid(false)
                        .code(code)
                        .message("Mã giảm giá '" + code + "' không áp dụng cho gói dịch vụ này.")
                        .build();
            }
        }

        // 4. Chống spam: Mỗi tài khoản chỉ được sử dụng 1 mã thành công 1 lần
        if (request.getUserId() != null) {
            List<PaymentOrder> userOrders = paymentOrderRepository.findByUser_UserIdOrderByCreatedAtDesc(request.getUserId());
            boolean alreadyUsed = userOrders.stream()
                    .anyMatch(o -> o.getStatus() == PaymentOrderStatus.APPROVED && o.getVoucher() != null
                            && (voucher.getVoucherId().equals(o.getVoucher().getVoucherId()) || code.equalsIgnoreCase(o.getVoucher().getCode())));
            if (alreadyUsed) {
                return VoucherValidationResponse.builder()
                        .valid(false)
                        .code(code)
                        .message("Bạn đã sử dụng mã ưu đãi này cho một giao dịch trước đó (Mỗi tài khoản chỉ được áp dụng 1 lần).")
                        .build();
            }
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
            throw new BadRequestException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để thực hiện thanh toán.");
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

        String role = (request.getTargetRole() != null && !request.getTargetRole().isBlank())
                ? request.getTargetRole().trim().toUpperCase()
                : ((user != null && user.getRole() != null) ? user.getRole().name() : "CANDIDATE");
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

        boolean isAddon = Boolean.TRUE.equals(request.getIsAddon()) || (request.getPlanName() != null && (
                request.getPlanName().toLowerCase().contains("addon") ||
                request.getPlanName().toLowerCase().contains("add-on") ||
                request.getPlanName().toLowerCase().contains("credits") ||
                request.getPlanName().toLowerCase().contains("đẩy tin") ||
                request.getPlanName().toLowerCase().contains("nổi bật") ||
                request.getPlanName().toLowerCase().contains("huy hiệu")
        )) || (request.getPlanId() == null && request.getOrderNote() != null && (
                request.getOrderNote().toLowerCase().contains("addon") ||
                request.getOrderNote().toLowerCase().contains("credits") ||
                request.getOrderNote().toLowerCase().contains("đẩy tin") ||
                request.getOrderNote().toLowerCase().contains("nổi bật") ||
                request.getOrderNote().toLowerCase().contains("huy hiệu")
        ));

        // Nếu vẫn chưa tìm thấy và không phải là đơn hàng Add-on
        if (plan == null && !isAddon) {
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
        BigDecimal originalAmount = request.getOriginalAmount() != null ? request.getOriginalAmount() : (plan != null ? plan.getPrice() : request.getAmount());
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            String targetUserRole = effectiveUser.getRole() != null ? effectiveUser.getRole().name() : null;
            ValidateVoucherRequest valReq = ValidateVoucherRequest.builder()
                    .code(request.getVoucherCode())
                    .amount(originalAmount)
                    .userRole(targetUserRole)
                    .userId(effectiveUser.getUserId())
                    .planId(plan != null ? plan.getPlanId() : null)
                    .planName(plan != null ? plan.getPlanName() : null)
                    .build();
            VoucherValidationResponse vRes = validateVoucher(valReq);
            if (Boolean.TRUE.equals(vRes.getValid())) {
                voucher = voucherRepository.findByCode(vRes.getCode()).orElse(null);
                discountAmount = vRes.getDiscountAmount();
            } else {
                throw new BadRequestException(vRes.getMessage() != null ? vRes.getMessage() : "Mã giảm giá không hợp lệ hoặc không áp dụng cho tài khoản của bạn.");
            }
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
        if (request.getDurationMonths() != null && request.getDurationMonths() > 0) {
            orderNote = ("[Chu kỳ: " + request.getDurationMonths() + " THÁNG] " + orderNote).trim();
        } else if ("YEARLY".equalsIgnoreCase(request.getBillingCycle())) {
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

        // 5. Nếu duyệt tự động (0đ hoặc đã APPROVED) => Kích hoạt subscription ngay
        if (status == PaymentOrderStatus.APPROVED) {
            activateApprovedOrder(order, "Tự động kích hoạt đơn hàng miễn phí");
            if (voucher != null) {
                voucher.setUsedCount((voucher.getUsedCount() != null ? voucher.getUsedCount() : 0) + 1);
                voucherRepository.save(voucher);
            }
        } else if (status == PaymentOrderStatus.PENDING && finalAmount.compareTo(BigDecimal.ZERO) > 0) {
            try {
                String itemTitle = plan != null ? plan.getPlanName() : (request.getPlanName() != null ? request.getPlanName() : "Gói Add-on");
                notificationService.notifyAdmins(
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "Đơn thanh toán mới chờ xác nhận",
                        "Người dùng " + effectiveUser.getFullName() + " vừa tạo đơn thanh toán gói \"" + itemTitle + "\" (Mã GD: " + orderCode + ", " + String.format("%,d", finalAmount.longValue()) + "đ).",
                        order.getOrderId(),
                        "payment_orders"
                );
            } catch (Exception notifEx) {
                log.warn("Không thể gửi thông báo đơn hàng mới cho admin: {}", notifEx.getMessage());
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
            if (payOSClient.isConfigured()) {
                try {
                    String numericPart = order.getOrderCode().replaceAll("\\D", "");
                    if (!numericPart.isBlank()) {
                        Long numericCode = Long.parseLong(numericPart);
                        com.hiremate.util.PayOSClient.PayOSLinkResult payosInfo = payOSClient.getPaymentLinkInformation(numericCode);
                        if (payosInfo != null && ("PAID".equalsIgnoreCase(payosInfo.getStatus()) || (payosInfo.getAmount() != null && payosInfo.getAmount() > 0 && "PAID".equalsIgnoreCase(payosInfo.getStatus())))) {
                            log.info("PayOS xác nhận đơn hàng {} đã thanh toán thành công (PAID). Đang kích hoạt gói dịch vụ...", order.getOrderCode());
                            activateApprovedOrder(order, "Tự động duyệt 24/7 qua PayOS API Polling - Giao dịch chuyển khoản thành công");
                        }
                    }
                } catch (Exception e) {
                    log.warn("Không thể kiểm tra trạng thái PayOS cho đơn {}: {}", order.getOrderCode(), e.getMessage());
                }
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
    @org.springframework.cache.annotation.Cacheable(value = "subscriptionPlans", key = "#targetRole != null ? #targetRole.toUpperCase() : 'ALL'")
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
            return com.hiremate.dto.response.SubscriptionResponse.inactive();
        }

        Subscription sub = subscriptionRepository.findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(user.getUserId(), SubscriptionStatus.ACTIVE)
                .orElse(null);

        if (sub == null) {
            // Tự động kiểm tra đơn hàng APPROVED gần nhất để kích hoạt Subscription cho user nếu chưa được tạo
            List<PaymentOrder> orders = paymentOrderRepository.findByUser_UserIdOrderByCreatedAtDesc(user.getUserId());
            PaymentOrder latestApproved = orders.stream()
                    .filter(o -> o.getStatus() == PaymentOrderStatus.APPROVED && o.getPlan() != null)
                    .findFirst()
                    .orElse(null);

            if (latestApproved != null && latestApproved.getPlan() != null) {
                SubscriptionPlan approvedPlan = latestApproved.getPlan();
                int duration = (approvedPlan.getDurationDays() != null && approvedPlan.getDurationDays() > 0)
                        ? approvedPlan.getDurationDays() : 30;
                if (latestApproved.getAdminNote() != null && latestApproved.getAdminNote().contains("YEARLY")) {
                    duration = 365;
                }
                LocalDateTime start = latestApproved.getApprovedAt() != null ? latestApproved.getApprovedAt() : LocalDateTime.now();
                LocalDateTime end = start.plusDays(duration);

                if (LocalDateTime.now().isBefore(end)) {
                    sub = Subscription.builder()
                            .user(user)
                            .plan(approvedPlan)
                            .order(latestApproved)
                            .startDate(start)
                            .endDate(end)
                            .status(SubscriptionStatus.ACTIVE)
                            .build();
                    subscriptionRepository.save(sub);
                    log.info(">> [PaymentService] Tự động đồng bộ kích hoạt Subscription cho user {} từ đơn hàng APPROVED #{}", user.getEmail(), latestApproved.getOrderCode());
                }
            }
        }

        if (sub == null) {
            return com.hiremate.dto.response.SubscriptionResponse.inactive();
        }

        // Kiểm tra hết hạn
        if (sub.getEndDate() != null && LocalDateTime.now().isAfter(sub.getEndDate())) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);
            return com.hiremate.dto.response.SubscriptionResponse.expired(
                    sub.getSubscriptionId(),
                    sub.getPlan() != null ? sub.getPlan().getPlanName() : "Đã hết hạn"
            );
        }

        long daysRemaining = 0L;
        if (sub.getEndDate() != null) {
            daysRemaining = java.time.Duration.between(LocalDateTime.now(), sub.getEndDate()).toDays();
            if (daysRemaining < 0) daysRemaining = 0;
        }

        SubscriptionPlan plan = sub.getPlan();
        int effectiveQuota = (sub.getCustomQuota() != null && sub.getCustomQuota() > 0)
                ? sub.getCustomQuota()
                : (plan != null && plan.getQuotaLimit() != null ? plan.getQuotaLimit() : 0);
        com.hiremate.dto.response.SubscriptionResponse resp = com.hiremate.dto.response.SubscriptionResponse.of(
                sub.getSubscriptionId(),
                plan != null ? plan.getPlanId() : null,
                plan != null ? plan.getPlanName() : "Gói dịch vụ kích hoạt",
                plan != null ? plan.getPlanType() : "COMBO",
                plan != null ? plan.getTargetRole() : (user.getRole() != null ? user.getRole().name() : null),
                effectiveQuota,
                plan != null ? plan.getPrice() : java.math.BigDecimal.ZERO,
                sub.getStartDate(),
                sub.getEndDate(),
                "ACTIVE",
                daysRemaining,
                true
        );
        resp.setPlanDescription(plan != null ? plan.getDescription() : null);
        resp.setCustomQuota(sub.getCustomQuota());
        return resp;
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

        // Kiểm tra xem đơn hàng có phải là Add-on trước khi cập nhật note
        boolean isAddonOrder = (order.getPlan() != null && "ADDON".equalsIgnoreCase(order.getPlan().getPlanType()))
                || (order.getAdminNote() != null && (
                order.getAdminNote().toLowerCase().contains("addon") ||
                order.getAdminNote().toLowerCase().contains("credits") ||
                order.getAdminNote().toLowerCase().contains("đẩy tin") ||
                order.getAdminNote().toLowerCase().contains("nổi bật") ||
                order.getAdminNote().toLowerCase().contains("huy hiệu")
        ));

        if (adminNote != null && !adminNote.isBlank()) {
            if (order.getAdminNote() != null && !order.getAdminNote().isBlank()) {
                order.setAdminNote(order.getAdminNote() + " [" + adminNote + "]");
            } else {
                order.setAdminNote(adminNote);
            }
        }

        // Đảm bảo đơn hàng được gán gói trả phí chính xác nếu trước đó bị gán nhầm Free Plan (TUYỆT ĐỐI KHÔNG gán cho Add-on)
        SubscriptionPlan plan = order.getPlan();
        if (!isAddonOrder && (plan == null || (plan.getPrice() != null && plan.getPrice().compareTo(BigDecimal.ZERO) == 0))
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

        if (isAddonOrder && order.getUser() != null) {
            // Đơn hàng Add-on: TUYỆT ĐỐI KHÔNG làm hết hạn gói subscription hiện tại!
            Subscription activeSub = subscriptionRepository
                    .findFirstByUser_UserIdAndStatusOrderByCreatedAtDesc(order.getUser().getUserId(), SubscriptionStatus.ACTIVE)
                    .orElse(null);

            int addedCredits = 100;
            if (order.getAdminNote() != null && order.getAdminNote().contains("500")) {
                addedCredits = 500;
            } else if (order.getAdminNote() != null && order.getAdminNote().contains("100")) {
                addedCredits = 100;
            } else if (order.getPlan() != null && order.getPlan().getQuotaLimit() != null && order.getPlan().getQuotaLimit() > 0) {
                addedCredits = order.getPlan().getQuotaLimit();
            }

            // Lưu số dư Credits AI trực tiếp vào CSDL Recruiter
            if (recruiterRepository != null) {
                var recOpt = recruiterRepository.findById(order.getUser().getUserId());
                if (recOpt.isPresent()) {
                    var rec = recOpt.get();
                    int cur = rec.getAiCredits() != null ? rec.getAiCredits() : 0;
                    rec.setAiCredits(cur + addedCredits);
                    recruiterRepository.save(rec);
                    log.info(">> [PaymentService] Đã cộng {} AI credits vào tài khoản Recruiter ID #{} (tổng hiện tại: {})",
                            addedCredits, rec.getRecruiterId(), rec.getAiCredits());
                }
            }

            if (activeSub != null) {
                int curSubCredits = activeSub.getRemainingAiTests() != null ? activeSub.getRemainingAiTests() : 0;
                activeSub.setRemainingAiTests(curSubCredits + addedCredits);
                subscriptionRepository.save(activeSub);
                log.info(">> [PaymentService] Kích hoạt đơn Add-on {} ({} credits) thành công cho Recruiter {} (Gói: {})",
                        order.getOrderCode(), addedCredits, order.getUser().getEmail(), activeSub.getPlan().getPlanName());
            } else {
                SubscriptionPlan basicPlan = subscriptionPlanRepository.findByTargetRoleAndIsActiveTrueOrderByPriceAsc("RECRUITER").stream()
                        .findFirst().orElse(null);
                if (basicPlan != null) {
                    Subscription newSub = Subscription.builder()
                            .user(order.getUser())
                            .plan(basicPlan)
                            .order(order)
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(365))
                            .status(SubscriptionStatus.ACTIVE)
                            .customQuota(basicPlan.getQuotaLimit() != null ? basicPlan.getQuotaLimit() : 3)
                            .remainingJobPosts(basicPlan.getQuotaLimit() != null ? basicPlan.getQuotaLimit() : 3)
                            .remainingAiTests(addedCredits)
                            .build();
                    subscriptionRepository.save(newSub);
                }
            }

            try {
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "🎉 Kích hoạt Add-on thành công!",
                        "Bạn đã kích hoạt thành công gói tiện ích Add-on. Tài khoản của bạn đã được cộng thêm quyền lợi/credits tương ứng mà không làm gián đoạn gói đăng ký chính!",
                        order.getOrderId(),
                        "payment_orders"
                );
            } catch (Exception notifEx) {
                log.warn("Không thể gửi thông báo Add-on cho user {}: {}", order.getUser().getUserId(), notifEx.getMessage());
            }
        } else if (order.getUser() != null && plan != null) {
            int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;
            boolean isWeeklyOrShortTerm = durationDays <= 7 || (plan.getPlanName() != null && plan.getPlanName().toLowerCase().contains("plus"));
            if (order.getAdminNote() != null) {
                String note = order.getAdminNote().toUpperCase();
                if (note.contains("12 THÁNG") || note.contains("YEARLY") || note.contains("1 NĂM")) {
                    durationDays = 365;
                } else if (note.contains("6 THÁNG")) {
                    durationDays = 180;
                } else if (note.contains("3 THÁNG")) {
                    durationDays = 90;
                } else if (note.contains("1 THÁNG")) {
                    durationDays = 30;
                }
            } else if (!isWeeklyOrShortTerm && "YEARLY".equalsIgnoreCase(plan.getPlanType())) {
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

            try {
                notificationService.createNotification(
                        order.getUser().getUserId(),
                        com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                        "🎉 Nâng cấp tài khoản thành công!",
                        "Chúc mừng bạn đã nâng cấp thành công gói " + plan.getPlanName() + " (" + durationDays + " ngày). Toàn bộ đặc quyền AI cao cấp đã được kích hoạt!",
                        order.getOrderId(),
                        "payment_orders"
                );
            } catch (Exception notifEx) {
                log.warn("Không thể gửi thông báo nâng cấp gói cho user {}: {}", order.getUser().getUserId(), notifEx.getMessage());
            }
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

        com.hiremate.dto.response.AdminSettingsDTO settings = systemSettingsService != null ? systemSettingsService.getSettings() : null;
        String bankName = (settings != null && settings.getVietqrBankName() != null && !settings.getVietqrBankName().isBlank())
                ? settings.getVietqrBankName() : DEFAULT_BANK_NAME;
        String bankAccount = (settings != null && settings.getVietqrAccountNumber() != null && !settings.getVietqrAccountNumber().isBlank())
                ? settings.getVietqrAccountNumber() : DEFAULT_BANK_ACCOUNT;
        String accountHolder = (settings != null && settings.getVietqrAccountHolder() != null && !settings.getVietqrAccountHolder().isBlank())
                ? settings.getVietqrAccountHolder() : DEFAULT_ACCOUNT_HOLDER;
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
                String encAccount = java.net.URLEncoder.encode(accountHolder, java.nio.charset.StandardCharsets.UTF_8);
                String bankCode = "970422";
                String lowerBank = bankName.toLowerCase();
                if (lowerBank.contains("vietcombank") || lowerBank.contains("vcb")) bankCode = "vietcombank";
                else if (lowerBank.contains("techcombank") || lowerBank.contains("tcb")) bankCode = "techcombank";
                else if (lowerBank.contains("tpbank")) bankCode = "tpbank";
                else if (lowerBank.contains("bidv")) bankCode = "bidv";
                else if (lowerBank.contains("agribank")) bankCode = "agribank";
                else if (lowerBank.contains("acb")) bankCode = "acb";
                else if (lowerBank.contains("vpbank")) bankCode = "vpbank";
                else if (lowerBank.contains("mbbank") || lowerBank.contains("quân đội") || lowerBank.contains("970422")) bankCode = "970422";

                qrUrl = "https://img.vietqr.io/image/" + bankCode + "-" + bankAccount + "-compact2.png"
                        + "?amount=" + amountLong
                        + "&addInfo=" + order.getOrderCode()
                        + "&accountName=" + encAccount;
            } catch (Exception e) {
                qrUrl = "https://img.vietqr.io/image/mbbank-" + bankAccount + "-compact2.png?amount=" + amountLong;
            }
        }

        PaymentOrderResponse response = new PaymentOrderResponse();
        response.setOrderId(order.getOrderId());
        response.setOrderCode(order.getOrderCode());
        response.setUserId(order.getUser() != null ? order.getUser().getUserId() : null);
        response.setUserName(order.getUser() != null ? order.getUser().getFullName() : "N/A");
        response.setUserEmail(order.getUser() != null ? order.getUser().getEmail() : "N/A");
        response.setUserRole(order.getUser() != null && order.getUser().getRole() != null ? order.getUser().getRole().name() : "USER");
        response.setPlanId(order.getPlan() != null ? order.getPlan().getPlanId() : null);
        response.setPlanName(order.getPlan() != null ? order.getPlan().getPlanName() : "Gói dịch vụ HireMate");
        response.setAmount(order.getAmount());
        response.setOriginalAmount(originalAmount);
        response.setDiscountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO);
        response.setVoucherCode(order.getVoucher() != null ? order.getVoucher().getCode() : null);
        response.setStatus(order.getStatus());
        response.setAdminNote(order.getAdminNote());
        response.setCreatedAt(order.getCreatedAt());
        response.setApprovedAt(order.getApprovedAt());
        response.setBankName(bankName);
        response.setBankAccount(bankAccount);
        response.setAccountHolder(accountHolder);
        response.setTransferContent(transferContent);
        response.setQrCodeUrl(qrUrl);
        response.setCheckoutUrl(checkoutUrl);
        return response;
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

    @Override
    @Transactional
    public PaymentOrderResponse cancelOrder(User user, String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new ResourceNotFoundException("Mã đơn hàng không được để trống.");
        }
        String cleanCode = orderCode.trim();
        PaymentOrder order = paymentOrderRepository.findByOrderCode(cleanCode)
                .or(() -> paymentOrderRepository.findByOrderCode("HM" + cleanCode))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));

        if (order.getStatus() != PaymentOrderStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ thanh toán (PENDING).");
        }
        if (user != null && order.getUser() != null && !order.getUser().getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("Bạn không có quyền thao tác trên đơn hàng này.");
        }

        order.setStatus(PaymentOrderStatus.REJECTED);
        order.setAdminNote("Người dùng chủ động hủy đơn hàng.");
        paymentOrderRepository.save(order);
        log.info(">> [PaymentService] Đơn hàng {} đã được người dùng hủy thành công.", order.getOrderCode());

        return mapToResponse(order, null, null);
    }
}
