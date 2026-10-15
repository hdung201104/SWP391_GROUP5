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
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initAdminUser();
        initPendingJobsForModeration();
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
}
