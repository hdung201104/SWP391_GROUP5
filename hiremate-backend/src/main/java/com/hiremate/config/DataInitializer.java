package com.hiremate.config;

import com.hiremate.entity.Job;
import com.hiremate.entity.User;
import com.hiremate.enums.JobApprovalStatus;
import com.hiremate.enums.JobStatus;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.JobRepository;
import com.hiremate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final com.hiremate.repository.PaymentOrderRepository paymentOrderRepository;
    private final com.hiremate.repository.SubscriptionPlanRepository subscriptionPlanRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initAdminUser();
        initDefaultSubscriptionPlans();
        initPendingJobsForModeration();
        initPaymentOrders();
    }

    private void initDefaultSubscriptionPlans() {
        try {
            if (subscriptionPlanRepository.count() == 0) {
                List<com.hiremate.entity.SubscriptionPlan> defaultPlans = List.of(
                        // 1. Candidate Plans
                        com.hiremate.entity.SubscriptionPlan.builder()
                                .planName("Ứng viên Miễn phí (Candidate Free)")
                                .targetRole("CANDIDATE")
                                .planType("INTERVIEW_PRACTICE")
                                .price(java.math.BigDecimal.ZERO)
                                .durationDays(365)
                                .quotaLimit(2)
                                .description("Gói trải nghiệm phỏng vấn AI cơ bản [PERMS:{\"interviewLimit\":2,\"atsScanLimit\":3,\"canViewFullFeedback\":false,\"supportLevel\":\"Cơ bản\"}]")
                                .isActive(true)
                                .build(),
                        com.hiremate.entity.SubscriptionPlan.builder()
                                .planName("Ứng viên Chuyên nghiệp (Candidate Pro)")
                                .targetRole("CANDIDATE")
                                .planType("INTERVIEW_PRACTICE")
                                .price(new java.math.BigDecimal("99000"))
                                .durationDays(30)
                                .quotaLimit(20)
                                .description("Luyện phỏng vấn AI không giới hạn chủ đề, chấm điểm chi tiết [PERMS:{\"interviewLimit\":20,\"atsScanLimit\":30,\"canViewFullFeedback\":true,\"supportLevel\":\"Ưu tiên\"}]")
                                .isActive(true)
                                .build(),
                        com.hiremate.entity.SubscriptionPlan.builder()
                                .planName("Đột phá Sự nghiệp (Candidate Premium)")
                                .targetRole("CANDIDATE")
                                .planType("COMBO")
                                .price(new java.math.BigDecimal("199000"))
                                .durationDays(90)
                                .quotaLimit(100)
                                .description("Gói tối ưu sự nghiệp toàn diện, phỏng vấn AI chuyên sâu không giới hạn [PERMS:{\"interviewLimit\":100,\"atsScanLimit\":100,\"canViewFullFeedback\":true,\"supportLevel\":\"VIP 24/7\"}]")
                                .isActive(true)
                                .build(),

                        // 2. Recruiter Plans
                        com.hiremate.entity.SubscriptionPlan.builder()
                                .planName("Nhà tuyển dụng Khởi đầu (Recruiter Starter)")
                                .targetRole("RECRUITER")
                                .planType("JOB_POSTING")
                                .price(java.math.BigDecimal.ZERO)
                                .durationDays(30)
                                .quotaLimit(3)
                                .description("Dành cho doanh nghiệp trải nghiệm đăng tin tuyển dụng miễn phí [PERMS:{\"jobLimit\":3,\"cvViewLimit\":15,\"aiFilter\":false,\"badge\":\"Tiêu chuẩn\"}]")
                                .isActive(true)
                                .build(),
                        com.hiremate.entity.SubscriptionPlan.builder()
                                .planName("Doanh nghiệp Tăng trưởng (Recruiter Business)")
                                .targetRole("RECRUITER")
                                .planType("JOB_POSTING")
                                .price(new java.math.BigDecimal("499000"))
                                .durationDays(30)
                                .quotaLimit(15)
                                .description("Đăng 15 tin tuyển dụng chất lượng cao, AI gợi ý ứng viên tự động [PERMS:{\"jobLimit\":15,\"cvViewLimit\":100,\"aiFilter\":true,\"badge\":\"Doanh nghiệp xác thực\"}]")
                                .isActive(true)
                                .build(),
                        com.hiremate.entity.SubscriptionPlan.builder()
                                .planName("Tập đoàn Cao cấp (Recruiter Enterprise)")
                                .targetRole("RECRUITER")
                                .planType("COMBO")
                                .price(new java.math.BigDecimal("1499000"))
                                .durationDays(90)
                                .quotaLimit(50)
                                .description("Tuyển dụng không giới hạn, Top tin tuyển dụng nổi bật và AI Matching nâng cao [PERMS:{\"jobLimit\":50,\"cvViewLimit\":500,\"aiFilter\":true,\"badge\":\"Doanh nghiệp VIP\"}]")
                                .isActive(true)
                                .build()
                );
                subscriptionPlanRepository.saveAll(defaultPlans);
                log.info(">> [DataInitializer] Đã khởi tạo thành công 6 gói dịch vụ phân hạng chuẩn cho Ứng viên & Nhà tuyển dụng.");
            }
        } catch (Exception e) {
            log.warn(">> [DataInitializer] Lỗi khởi tạo gói dịch vụ mặc định: {}", e.getMessage());
        }
    }

    private void initAdminUser() {
        try {
            if (userRepository.findByEmail("admin@hiremate.ai").isEmpty()) {
                User admin = User.builder()
                        .email("admin@hiremate.ai")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .fullName("Quản trị viên Hệ thống")
                        .phone("0988888888")
                        .role(UserRole.ADMIN)
                        .status(UserStatus.ACTIVE)
                        .isEmailVerified(true)
                        .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80")
                        .bio("Quản trị viên chính thức của nền tảng tuyển dụng thông minh HireMate AI")
                        .build();
                userRepository.save(admin);
                log.info(">> [DataInitializer] Đã khởi tạo tài khoản Admin mặc định: admin@hiremate.ai / admin123");
            }
        } catch (Exception e) {
            log.warn(">> [DataInitializer] Lỗi khởi tạo admin: {}", e.getMessage());
        }
    }

    private void initPendingJobsForModeration() {
        try {
            long pendingCount = jobRepository.countByApprovalStatus(JobApprovalStatus.PENDING);
            if (pendingCount == 0) {
                List<Job> allJobs = jobRepository.findAll();
                if (!allJobs.isEmpty()) {
                    // Đặt tin thứ 2 (hoặc tin đầu) thành PENDING để Admin có thể thử nghiệm tính năng Duyệt / Từ chối bài đăng thực tế
                    Job testJob = allJobs.size() > 1 ? allJobs.get(1) : allJobs.get(0);
                    testJob.setApprovalStatus(JobApprovalStatus.PENDING);
                    jobRepository.save(testJob);
                    log.info(">> [DataInitializer] Đã chuyển bài đăng ID #{} ({}) về trạng thái PENDING để Admin kiểm duyệt.",
                            testJob.getJobId(), testJob.getTitle());
                }
            }
        } catch (Exception e) {
            log.warn(">> [DataInitializer] Lỗi cập nhật bài đăng PENDING: {}", e.getMessage());
        }
    }

    private void initPaymentOrders() {
        try {
            if (paymentOrderRepository.count() == 0) {
                List<User> users = userRepository.findAll();
                List<com.hiremate.entity.SubscriptionPlan> plans = subscriptionPlanRepository.findAll();
                if (users.isEmpty() || plans.isEmpty()) {
                    return;
                }

                User candidate = users.stream()
                        .filter(u -> u.getRole() == UserRole.CANDIDATE)
                        .findFirst()
                        .orElse(users.get(0));

                User candidate2 = users.stream()
                        .filter(u -> u.getRole() == UserRole.CANDIDATE && !u.getUserId().equals(candidate.getUserId()))
                        .findFirst()
                        .orElse(candidate);

                User recruiter = users.stream()
                        .filter(u -> u.getRole() == UserRole.RECRUITER)
                        .findFirst()
                        .orElse(users.get(0));

                User recruiter2 = users.stream()
                        .filter(u -> u.getRole() == UserRole.RECRUITER && !u.getUserId().equals(recruiter.getUserId()))
                        .findFirst()
                        .orElse(recruiter);

                com.hiremate.entity.SubscriptionPlan starterPlan = plans.stream()
                        .filter(p -> p.getPlanName().contains("Starter") || p.getPrice().compareTo(java.math.BigDecimal.ZERO) > 0)
                        .findFirst()
                        .orElse(plans.get(0));

                com.hiremate.entity.SubscriptionPlan practicePlan = plans.stream()
                        .filter(p -> p.getPlanName().contains("Practice") || p.getPlanName().contains("Candidate"))
                        .findFirst()
                        .orElse(starterPlan);

                com.hiremate.entity.SubscriptionPlan elitePlan = plans.stream()
                        .filter(p -> p.getPlanName().contains("Elite") || p.getPlanName().contains("Pro"))
                        .findFirst()
                        .orElse(starterPlan);

                // 1. Đơn hàng 1: Thành công
                com.hiremate.entity.PaymentOrder o1 = com.hiremate.entity.PaymentOrder.builder()
                        .orderCode("ORD-MB-829104")
                        .user(recruiter)
                        .plan(starterPlan)
                        .amount(starterPlan.getPrice())
                        .status(com.hiremate.enums.PaymentOrderStatus.APPROVED)
                        .adminNote("Kích hoạt tự động qua cổng VietQR Napas247 MBBank")
                        .approvedAt(java.time.LocalDateTime.now().minusHours(2))
                        .build();

                // 2. Đơn hàng 2: Đang chờ thanh toán
                com.hiremate.entity.PaymentOrder o2 = com.hiremate.entity.PaymentOrder.builder()
                        .orderCode("ORD-MB-654321")
                        .user(recruiter2)
                        .plan(elitePlan)
                        .amount(elitePlan.getPrice())
                        .status(com.hiremate.enums.PaymentOrderStatus.PENDING)
                        .adminNote("Khách đang quét mã VietQR, chờ webhook đối soát")
                        .build();

                // 3. Đơn hàng 3: Ứng viên mua gói luyện phỏng vấn AI
                com.hiremate.entity.PaymentOrder o3 = com.hiremate.entity.PaymentOrder.builder()
                        .orderCode("ORD-MB-771829")
                        .user(candidate)
                        .plan(practicePlan)
                        .amount(practicePlan.getPrice())
                        .status(com.hiremate.enums.PaymentOrderStatus.APPROVED)
                        .adminNote("Nâng cấp gói luyện phỏng vấn AI - MBBank xác nhận")
                        .approvedAt(java.time.LocalDateTime.now().minusDays(1))
                        .build();

                // 4. Đơn hàng 4: Đã hủy do hết hạn quét mã
                com.hiremate.entity.PaymentOrder o4 = com.hiremate.entity.PaymentOrder.builder()
                        .orderCode("ORD-MB-341209")
                        .user(candidate2)
                        .plan(starterPlan)
                        .amount(starterPlan.getPrice())
                        .status(com.hiremate.enums.PaymentOrderStatus.REJECTED)
                        .adminNote("Giao dịch quá thời hạn quét mã QR 15 phút")
                        .build();

                paymentOrderRepository.saveAll(List.of(o1, o2, o3, o4));
                log.info(">> [DataInitializer] Đã khởi tạo 4 đơn hàng giao dịch mẫu thực tế trong bảng payment_orders.");
            }
        } catch (Exception e) {
            log.warn(">> [DataInitializer] Lỗi khởi tạo đơn hàng thanh toán: {}", e.getMessage());
        }
    }
}
