package com.hiremate.service.impl;

import com.hiremate.exception.BadRequestException;

import com.hiremate.config.JwtUtil;
import com.hiremate.dto.request.*;
import com.hiremate.dto.response.AuthResponse;
import com.hiremate.entity.Candidate;
import com.hiremate.entity.Company;
import com.hiremate.entity.Recruiter;
import com.hiremate.entity.User;
import com.hiremate.enums.CompanyStatus;
import com.hiremate.enums.UserRole;
import com.hiremate.enums.UserStatus;
import com.hiremate.repository.CandidateRepository;
import com.hiremate.repository.CompanyRepository;
import com.hiremate.repository.RecruiterRepository;
import com.hiremate.repository.UserRepository;
import com.hiremate.service.AuthService;
import com.hiremate.service.GoogleTokenVerifierService;
import com.hiremate.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;       // Thay thế CandidateProfileRepository
    private final RecruiterRepository recruiterRepository;        // Mới thêm
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final com.hiremate.service.EmailService emailService;
    private final com.hiremate.service.NotificationService notificationService;
    private final com.hiremate.service.GoogleTokenVerifierService googleTokenVerifierService;
    private final com.hiremate.service.TokenBlacklistService tokenBlacklistService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.BrandMediaSyncService brandMediaSyncService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.hiremate.service.UserCacheService userCacheService;

    @org.springframework.beans.factory.annotation.Value("${github.oauth2.client-id:Ov23lin7fKu1DTd2VWAB}")
    private String githubClientId;

    @org.springframework.beans.factory.annotation.Value("${github.oauth2.client-secret:}")
    private String githubClientSecret;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new IllegalArgumentException("Mã xác thực OTP là bắt buộc để hoàn tất đăng ký.");
        }
        boolean validOtp = otpService.verifyOtp(request.getEmail().toLowerCase().trim(), request.getOtp().trim(), "REGISTER");
        if (!validOtp) {
            throw new IllegalArgumentException("Mã xác thực OTP không chính xác hoặc đã hết hiệu lực.");
        }

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.CANDIDATE;
        if (role == UserRole.ADMIN) {
            throw new BadRequestException("Không thể đăng ký tài khoản với vai trò Quản trị viên (ADMIN) qua cổng công khai.");
        }

        String regEmail = request.getEmail().toLowerCase().trim();
        if (!regEmail.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("Địa chỉ email không đúng định dạng (Ví dụ: name@example.com)");
        }

        String cleanPhone = null;
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            cleanPhone = request.getPhone().trim().replaceAll("[\\s.-]", "");
            if (!cleanPhone.matches("^(0|\\+84)[35789]\\d{8}$")) {
                throw new IllegalArgumentException("Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09. Ví dụ: 0912345678)");
            }
        }

        String cleanDob = null;
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            String rawDob = request.getDateOfBirth().trim();
            try {
                java.time.LocalDate dob = java.time.LocalDate.parse(rawDob);
                java.time.LocalDate today = java.time.LocalDate.now();
                if (dob.isAfter(today)) {
                    throw new IllegalArgumentException("Ngày sinh không thể ở tương lai (" + rawDob + ")");
                }
                if (dob.isAfter(today.minusYears(14))) {
                    throw new IllegalArgumentException("Độ tuổi ứng viên phải từ 14 tuổi trở lên");
                }
                if (dob.isBefore(java.time.LocalDate.of(1920, 1, 1))) {
                    throw new IllegalArgumentException("Ngày sinh không hợp lệ");
                }
                cleanDob = rawDob;
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("Định dạng ngày sinh không hợp lệ (chuẩn YYYY-MM-DD)");
            }
        }

        User user = User.builder()
                .email(regEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(cleanPhone)
                .dateOfBirth(cleanDob)
                .address(request.getAddress() != null && !request.getAddress().isBlank() ? request.getAddress().trim() : (request.getLocation() != null ? request.getLocation().trim() : null))
                .bio(request.getBio() != null && !request.getBio().isBlank() ? request.getBio().trim() : null)
                .githubUrl(request.getGithubUrl() != null && !request.getGithubUrl().isBlank() ? request.getGithubUrl().trim() : null)
                .role(role)
                .status(UserStatus.ACTIVE)
                .isEmailVerified(true)
                .build();

        User savedUser = userRepository.saveAndFlush(user);
        Long companyId = null;
        String companyName = null;

        // ============================================================
        // KIẾN TRÚC V2: Tạo Subclass table record sau khi lưu User
        // Candidate: candidates.candidate_id = users.user_id (Shared PK)
        // Recruiter: recruiters.recruiter_id = users.user_id (Shared PK)
        // ============================================================
        if (role == UserRole.CANDIDATE) {
            Candidate candidate = Candidate.builder()
                    .candidateId(savedUser.getUserId())  // Shared PK
                    .user(savedUser)
                    .headline(request.getHeadline())
                    .location(savedUser.getAddress() != null ? savedUser.getAddress() : request.getLocation())
                    .bio(savedUser.getBio())
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                    .build();
            candidateRepository.save(candidate);

        } else if (role == UserRole.RECRUITER) {
            companyName = request.getCompanyName() != null && !request.getCompanyName().isBlank()
                    ? request.getCompanyName().trim()
                    : request.getFullName() + "'s Company";

            String taxCode = request.getTaxCode() != null && !request.getTaxCode().isBlank()
                    ? request.getTaxCode().trim()
                    : null;

            // 1. Tìm công ty theo companyId, sau đó ưu tiên theo Mã số thuế (taxCode), sau đó theo Tên công ty
            Company company = null;
            if (request.getCompanyId() != null) {
                company = companyRepository.findById(request.getCompanyId()).orElse(null);
            }
            if (company == null && taxCode != null) {
                company = companyRepository.findFirstByTaxCodeIgnoreCase(taxCode).orElse(null);
            }
            if (company == null) {
                company = companyRepository.findFirstByCompanyNameIgnoreCase(companyName).orElse(null);
            }

            boolean isNewCompany = false;
            boolean hasValidDoc = request.getLicenseDocUrl() != null && !request.getLicenseDocUrl().isBlank()
                    && !request.getLicenseDocUrl().contains("unsplash.com")
                    && !request.getLicenseDocUrl().startsWith("blob:");

            String bName = request.getBranchName() != null && !request.getBranchName().isBlank()
                    ? request.getBranchName().trim()
                    : "Trụ sở chính";
            String bAddr = request.getBranchAddress() != null && !request.getBranchAddress().isBlank()
                    ? request.getBranchAddress().trim()
                    : (request.getCompanyAddress() != null ? request.getCompanyAddress().trim() : (request.getLocation() != null ? request.getLocation().trim() : ""));

            boolean isPinVerified = false;
            if (company == null) {
                isNewCompany = true;
                String initialBranchesJson = initOrAppendBranch(null, bName, bAddr, request.getCompanySize(), savedUser.getUserId(), savedUser.getFullName(), true);
                company = Company.builder()
                        .recruiterId(null)
                        .companyName(companyName)
                        .website(request.getWebsite())
                        .companySize(request.getCompanySize())
                        .address(bAddr.isEmpty() ? (request.getLocation() != null ? request.getLocation() : "Việt Nam") : bAddr)
                        .taxCode(taxCode)
                        .licenseNumber(request.getLicenseNumber() != null && !request.getLicenseNumber().isBlank()
                                ? request.getLicenseNumber().trim()
                                : (taxCode != null ? taxCode + "-GPKD" : null))
                        .licenseDocUrl(hasValidDoc ? request.getLicenseDocUrl() : null)
                        .licenseDocName(hasValidDoc ? (request.getLicenseDocName() != null ? request.getLicenseDocName() : "GPKD_" + companyName.replaceAll("\\s+", "_") + ".pdf") : null)
                        .legalRepresentative(request.getLegalRepresentative() != null && !request.getLegalRepresentative().isBlank() ? request.getLegalRepresentative().trim() : request.getFullName())
                        .branchesJson(initialBranchesJson)
                        .status(CompanyStatus.PENDING)
                        .build();
                if (brandMediaSyncService != null) {
                    brandMediaSyncService.ensureCompanyLogo(company);
                } else {
                    company.setLogoUrl(com.hiremate.service.BrandMediaSyncService.resolveCompanyLogo(companyName, null));
                }
                company = companyRepository.saveAndFlush(company);
            } else {
                // Công ty đã tồn tại: Kiểm tra xem người dùng có cung cấp Mã HR PIN hợp lệ không
                String inputPin = request.getCompanyHrPin() != null ? request.getCompanyHrPin().trim() : "";
                if (!inputPin.isEmpty()) {
                    if (isCompanyHrPinValid(company, inputPin)) {
                        isPinVerified = true;
                        log.info(">> [AuthService] HR PIN xác thực THÀNH CÔNG cho {} gia nhập công ty {} ({})",
                                savedUser.getEmail(), company.getCompanyName(), bName);
                        // Tự động thêm chi nhánh mới vào công ty nếu chưa tồn tại
                        String updatedBranches = initOrAppendBranch(company.getBranchesJson(), bName, bAddr, company.getCompanySize(), savedUser.getUserId(), savedUser.getFullName(), false);
                        company.setBranchesJson(updatedBranches);
                        companyRepository.save(company);
                    } else {
                        throw new BadRequestException("Mã số xác nhận gia nhập HR (HR PIN: " + inputPin + ") không chính xác cho doanh nghiệp \"" + company.getCompanyName() + "\". Vui lòng kiểm tra lại mã từ Trụ sở chính hoặc chọn gửi yêu cầu chờ duyệt.");
                    }
                } else {
                    // Chưa có mã PIN: KHÔNG gán thẳng quyền công ty (Chống chiếm quyền công ty / Company Takeover)
                    // Lưu yêu cầu gia nhập vào pendingJoinRequests trong branchesJson của công ty
                    String updatedBranches = appendPendingJoinRequest(company.getBranchesJson(), savedUser, request, bName, bAddr);
                    company.setBranchesJson(updatedBranches);
                    companyRepository.save(company);
                }
            }

            // 2. Tạo Recruiter subclass record
            // Nếu là công ty mới hoặc nhập đúng PIN thì liên kết ngay; nếu chờ duyệt thì company = null
            boolean shouldLinkCompany = isNewCompany || isPinVerified;
            Recruiter recruiter = Recruiter.builder()
                    .recruiterId(savedUser.getUserId())  // Shared PK
                    .user(savedUser)
                    .company(shouldLinkCompany ? company : null)
                    .position(request.getPosition() != null && !request.getPosition().isBlank() ? request.getPosition().trim() : "HR Recruiter")
                    .department(request.getDepartment() != null && !request.getDepartment().isBlank() ? request.getDepartment().trim() : "Phòng Tuyển dụng & Nhân sự")
                    .branchName(bName)
                    .branchAddress(bAddr)
                    .isHeadRecruiter(isNewCompany)
                    .build();
            Recruiter savedRecruiter = recruiterRepository.saveAndFlush(recruiter);

            // 3. Xử lý quyền và gửi thông báo
            if (isNewCompany) {
                company.setRecruiterId(savedRecruiter.getRecruiterId());
                companyRepository.save(company);
                companyId = company.getCompanyId();
            } else if (isPinVerified) {
                companyId = company.getCompanyId();

                // Gửi thông báo đến HR Trụ sở chính biết có nhân sự chi nhánh mới gia nhập qua PIN
                try {
                    List<Recruiter> existingRecruiters = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
                    for (Recruiter existing : existingRecruiters) {
                        if (!existing.getRecruiterId().equals(savedUser.getUserId())) {
                            notificationService.createNotification(
                                    existing.getRecruiterId(),
                                    com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                                    "Thành viên HR mới gia nhập qua Mã HR PIN",
                                    "Chuyên viên nhân sự " + savedUser.getFullName() + " (" + savedUser.getEmail() + ") đã dùng Mã HR PIN của công ty để kết nối thành công vào chi nhánh [" + bName + "].",
                                    company.getCompanyId(),
                                    "companies"
                            );
                        }
                    }
                } catch (Exception notifEx) {
                    log.warn(">> [AuthService] Không thể gửi thông báo cho HR cùng công ty: {}", notifEx.getMessage());
                }

                // Gửi thông báo chúc mừng cho chính HR vừa gia nhập
                try {
                    notificationService.createNotification(
                            savedUser.getUserId(),
                            com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                            "Gia nhập doanh nghiệp thành công",
                            "Chào mừng bạn gia nhập đội ngũ tuyển dụng của " + company.getCompanyName() + " tại chi nhánh [" + bName + "]. Bạn hiện đã có toàn quyền đăng tin và tuyển dụng.",
                            company.getCompanyId(),
                            "companies"
                    );
                } catch (Exception notifEx) {
                    log.warn(">> [AuthService] Không thể gửi thông báo cho HR vừa gia nhập: {}", notifEx.getMessage());
                }
            } else {
                companyId = null; // Chưa có PIN, chờ Head Recruiter phê duyệt

                // Gửi thông báo đến các HR hiện tại của công ty để xem xét phê duyệt
                try {
                    List<Recruiter> existingRecruiters = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
                    for (Recruiter existing : existingRecruiters) {
                        notificationService.createNotification(
                                existing.getRecruiterId(),
                                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                                "Yêu cầu gia nhập đội ngũ HR mới",
                                "Chuyên viên nhân sự " + savedUser.getFullName() + " (" + savedUser.getEmail() + ") vừa đăng ký và gửi yêu cầu gia nhập đội ngũ tuyển dụng của " + company.getCompanyName() + ". Vui lòng phê duyệt trên Bảng điều khiển.",
                                company.getCompanyId(),
                                "companies"
                        );
                    }
                } catch (Exception notifEx) {
                    log.warn(">> [AuthService] Không thể gửi thông báo cho các HR cùng công ty: {}", notifEx.getMessage());
                }

                // Gửi thông báo cho chính HR vừa đăng ký
                try {
                    notificationService.createNotification(
                            savedUser.getUserId(),
                            com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                            "Yêu cầu gia nhập công ty đang chờ duyệt",
                            "Tài khoản của bạn đã được khởi tạo thành công. Yêu cầu gia nhập " + company.getCompanyName() + " đang chờ Trưởng phòng nhân sự phê duyệt.",
                            company.getCompanyId(),
                            "companies"
                    );
                } catch (Exception notifEx) {
                    log.warn(">> [AuthService] Không thể gửi thông báo chờ duyệt: {}", notifEx.getMessage());
                }
            }
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", savedUser.getUserId());
        claims.put("role", savedUser.getRole().name());
        String token = jwtUtil.generateToken(savedUser.getEmail(), claims);
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getEmail(), claims);

        try {
            emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFullName(), savedUser.getRole().name());
        } catch (Exception e) {
            log.error(">> [AuthService] Không thể gửi welcome email: {}", e.getMessage());
        }

        // Tạo thông báo chào mừng hệ thống
        notificationService.createNotification(
                savedUser.getUserId(),
                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                "Chào mừng gia nhập HireMate AI!",
                "Tài khoản của bạn đã được kích hoạt thành công. Bắt đầu trải nghiệm các tính năng thông minh ngay hôm nay!",
                savedUser.getUserId(),
                "users"
        );

        return buildAuthResponse(savedUser, token, refreshToken, companyId, companyName);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ email và mật khẩu");
        }

        String cleanEmail = request.getEmail().toLowerCase().trim();
        String rawPassword = request.getPassword().trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản hoặc mật khẩu không chính xác"));

        boolean matches = passwordEncoder.matches(rawPassword, user.getPasswordHash())
                || passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        // Hỗ trợ tài khoản seed cũ lưu mật khẩu thô chưa mã hóa BCrypt
        if (!matches && user.getPasswordHash() != null) {
            String dbHash = user.getPasswordHash();
            boolean isBcrypt = dbHash.startsWith("$2a$") || dbHash.startsWith("$2b$") || dbHash.startsWith("$2y$");
            if (!isBcrypt && (rawPassword.equals(dbHash) || request.getPassword().equals(dbHash))) {
                matches = true;
                user.setPasswordHash(passwordEncoder.encode(rawPassword));
                userRepository.save(user);
                log.info(">> [AuthService] Tự động nâng cấp mã hóa BCrypt cho tài khoản: {}", cleanEmail);
            }
        }

        if (!matches) {
            throw new IllegalArgumentException("Tài khoản hoặc mật khẩu không chính xác");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Tài khoản hiện đang bị khóa (" + user.getStatus() + ")");
        }

        Long companyId = null;
        String companyName = null;
        if (user.getRole() == UserRole.RECRUITER) {
            // Tìm company qua Recruiter subclass
            Optional<Recruiter> recruiterOpt = recruiterRepository.findById(user.getUserId());
            if (recruiterOpt.isPresent()) {
                try {
                    Company comp = recruiterOpt.get().getCompany();
                    if (comp != null) {
                        companyId = comp.getCompanyId();
                        companyName = comp.getCompanyName();
                    }
                } catch (Exception e) {
                    log.warn("Không thể load lazy company từ recruiter: {}", e.getMessage());
                }
            }
            if (companyId == null) {
                // fallback: tìm thẳng trong companies table
                Optional<Company> company = companyRepository.findByRecruiterId(user.getUserId());
                if (company.isPresent()) {
                    companyId = company.get().getCompanyId();
                    companyName = company.get().getCompanyName();
                }
            }
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("role", user.getRole().name());
        String token = jwtUtil.generateToken(user.getEmail(), claims);
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), claims);

        // Ghi nhận thông báo bảo mật đăng nhập
        try {
            notificationService.createNotification(
                    user.getUserId(),
                    com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                    "Đăng nhập thành công",
                    "Hệ thống ghi nhận phiên đăng nhập an toàn vào tài khoản của bạn.",
                    user.getUserId(),
                    "users"
            );
        } catch (Exception notifEx) {
            log.warn("Không thể tạo notification đăng nhập: {}", notifEx.getMessage());
        }

        return buildAuthResponse(user, token, refreshToken, companyId, companyName);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(User user) {
        Long companyId = null;
        String companyName = null;
        if (user != null && user.getRole() == UserRole.RECRUITER) {
            Optional<Recruiter> recruiterOpt = recruiterRepository.findById(user.getUserId());
            if (recruiterOpt.isPresent()) {
                try {
                    Company comp = recruiterOpt.get().getCompany();
                    if (comp != null) {
                        companyId = comp.getCompanyId();
                        companyName = comp.getCompanyName();
                    }
                } catch (Exception e) {
                    log.warn("Không thể load lazy company từ recruiter: {}", e.getMessage());
                }
            }
            if (companyId == null) {
                Optional<Company> company = companyRepository.findByRecruiterId(user.getUserId());
                if (company.isPresent()) {
                    companyId = company.get().getCompanyId();
                    companyName = company.get().getCompanyName();
                }
            }
        }

        return buildAuthResponse(user, null, null, companyId, companyName);
    }

    @Override
    public String sendOtp(SendOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String purpose = request.getPurpose() != null ? request.getPurpose() : "REGISTER";

        if ("REGISTER".equalsIgnoreCase(purpose)) {
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email này (" + email + ") đã được đăng ký tài khoản trong hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác!");
            }
        }

        if ("FORGOT_PASSWORD".equalsIgnoreCase(purpose) || "CHANGE_PASSWORD".equalsIgnoreCase(purpose)) {
            if (!userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email không tồn tại trong hệ thống: " + email);
            }
        }

        return otpService.generateOtp(email, purpose);
    }

    @Override
    public boolean verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        boolean valid = otpService.verifyOtp(email, request.getOtp(), request.getPurpose());
        if (!valid) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        userRepository.findByEmail(email).ifPresent(u -> {
            u.setIsEmailVerified(true);
            userRepository.save(u);
        });

        return true;
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email không tồn tại trong hệ thống: " + email);
        }
        return otpService.generateOtp(email, "FORGOT_PASSWORD");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        boolean valid = otpService.verifyOtp(email, request.getOtp(), "FORGOT_PASSWORD");
        if (!valid) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hiệu lực");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với email: " + email));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info(">> [AuthService] Password reset successfully for: {}", email);

        try {
            emailService.sendPasswordChangedNotification(email);
        } catch (Exception e) {
            log.error(">> [AuthService] Không thể gửi thông báo đổi mật khẩu: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        boolean isOAuthPlaceholder = user.getPasswordHash() != null && user.getPasswordHash().contains("GoogleOAuth2_");
        boolean matches = passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())
                || isOAuthPlaceholder;

        if (!matches && user.getPasswordHash() != null) {
            String dbHash = user.getPasswordHash();
            boolean isBcrypt = dbHash.startsWith("$2a$") || dbHash.startsWith("$2b$") || dbHash.startsWith("$2y$");
            if (!isBcrypt && request.getCurrentPassword().equals(dbHash)) {
                matches = true;
            }
        }

        if (!matches) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }

        if (request.getOtp() != null && !request.getOtp().isBlank()) {
            boolean validOtp = otpService.verifyOtp(user.getEmail(), request.getOtp().trim(), "CHANGE_PASSWORD");
            if (!validOtp) {
                throw new IllegalArgumentException("Mã xác thực OTP không chính xác hoặc đã hết hạn");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info(">> [AuthService] Password changed successfully for userId: {}", userId);

        notificationService.createNotification(
                user.getUserId(),
                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                "Bảo mật: Đổi mật khẩu thành công",
                "Mật khẩu tài khoản HireMate AI của bạn vừa được cập nhật thành công.",
                user.getUserId(),
                "users"
        );

        try {
            emailService.sendPasswordChangedNotification(user.getEmail());
        } catch (Exception e) {
            log.error(">> [AuthService] Không thể gửi thông báo đổi mật khẩu: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        String email;
        String fullName;
        String avatarUrl;

        if (request.getIdToken() != null && !request.getIdToken().isBlank()) {
            // Xác thực token chính thức với Google API
            GoogleTokenVerifierService.GoogleUserInfo googleUser = googleTokenVerifierService.verify(request.getIdToken());
            email = googleUser.getEmail().toLowerCase().trim();
            fullName = googleUser.getFullName();
            avatarUrl = googleUser.getAvatarUrl();
        } else if (request.getEmail() != null && !request.getEmail().isBlank()) {
            // Fallback khi chạy test nội bộ hoặc môi trường dev
            log.warn(">> [AuthService] Google login sử dụng fallback email trực tiếp (không kèm idToken): {}", request.getEmail());
            email = request.getEmail().toLowerCase().trim();
            fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                    ? request.getFullName()
                    : email.split("@")[0];
            avatarUrl = request.getAvatarUrl();
        } else {
            throw new IllegalArgumentException("Vui lòng cung cấp mã Google ID Token (idToken) hoặc email đăng nhập hợp lệ");
        }

        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalStateException("Tài khoản của bạn đã bị khóa hoặc ngừng kích hoạt. Vui lòng liên hệ quản trị viên.");
            }
            if (avatarUrl != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(com.hiremate.service.BrandMediaSyncService.sanitizeImageUrl(avatarUrl));
                userRepository.save(user);
                if (userCacheService != null) userCacheService.evict(user.getEmail(), user.getUserId());
            }
            log.info(">> [AuthService] Đăng nhập Google thành công cho tài khoản đã tồn tại: {}", email);

            Long companyId = null;
            String companyName = null;
            if (user.getRole() == UserRole.RECRUITER) {
                Optional<Recruiter> recruiterOpt = recruiterRepository.findById(user.getUserId());
                if (recruiterOpt.isPresent() && recruiterOpt.get().getCompany() != null) {
                    companyId = recruiterOpt.get().getCompany().getCompanyId();
                    companyName = recruiterOpt.get().getCompany().getCompanyName();
                }
            }

            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getUserId());
            claims.put("role", user.getRole().name());
            String token = jwtUtil.generateToken(user.getEmail(), claims);
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), claims);

            AuthResponse response = buildAuthResponse(user, token, refreshToken, companyId, companyName);
            response.setIsNewUser(false);
            return response;
        } else {
            // TRƯỜNG HỢP 2 (Tài khoản CHƯA TỒN TẠI - Người dùng mới):
            // Trả về cờ isNewUser = true kèm thông tin đã xác thực từ Google để Frontend chuyển sang trang hoàn tất đăng ký
            log.info(">> [AuthService] Phát hiện tài khoản Google mới chưa có trong hệ thống: {}", email);
            return AuthResponse.of(
                    null, null, null, email, fullName, null, null, avatarUrl, null, null, true, null, null, null, null, true
            );
        }
    }

    @Override
    @Transactional
    public AuthResponse completeGoogleRegistration(GoogleCompleteRegistrationRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email " + email + " đã tồn tại trong hệ thống. Vui lòng đăng nhập.");
        }

        // Bắt buộc xác thực mã OTP trước khi hoàn tất đăng ký
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new IllegalArgumentException("Mã xác thực OTP là bắt buộc để hoàn tất thiết lập tài khoản.");
        }
        boolean validOtp = otpService.verifyOtp(email, request.getOtp().trim(), "REGISTER");
        if (!validOtp) {
            throw new IllegalArgumentException("Mã xác thực OTP không chính xác hoặc đã hết hiệu lực.");
        }

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.CANDIDATE;
        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword().trim()
                : ("GoogleOAuth2_" + UUID.randomUUID());

        String cleanGooglePhone = null;
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            cleanGooglePhone = request.getPhone().trim().replaceAll("[\\s.-]", "");
            if (!cleanGooglePhone.matches("^(0|\\+84)[35789]\\d{8}$")) {
                throw new IllegalArgumentException("Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09. Ví dụ: 0912345678)");
            }
        }

        String cleanGoogleDob = null;
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            String rawDob = request.getDateOfBirth().trim();
            try {
                java.time.LocalDate dob = java.time.LocalDate.parse(rawDob);
                java.time.LocalDate today = java.time.LocalDate.now();
                if (dob.isAfter(today)) {
                    throw new IllegalArgumentException("Ngày sinh không thể ở tương lai (" + rawDob + ")");
                }
                if (dob.isAfter(today.minusYears(14))) {
                    throw new IllegalArgumentException("Độ tuổi ứng viên phải từ 14 tuổi trở lên");
                }
                if (dob.isBefore(java.time.LocalDate.of(1920, 1, 1))) {
                    throw new IllegalArgumentException("Ngày sinh không hợp lệ");
                }
                cleanGoogleDob = rawDob;
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("Định dạng ngày sinh không hợp lệ (chuẩn YYYY-MM-DD)");
            }
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName())
                .phone(cleanGooglePhone)
                .dateOfBirth(cleanGoogleDob)
                .address(request.getAddress() != null && !request.getAddress().isBlank() ? request.getAddress().trim() : null)
                .bio(request.getBio() != null && !request.getBio().isBlank() ? request.getBio().trim() : null)
                .githubUrl(request.getGithubUrl() != null && !request.getGithubUrl().isBlank() ? request.getGithubUrl().trim() : null)
                .avatarUrl(request.getAvatarUrl())
                .role(role)
                .status(UserStatus.ACTIVE)
                .isEmailVerified(true)
                .build();
        user = userRepository.save(user);

        Long companyId = null;
        String companyName = null;

        if (role == UserRole.CANDIDATE) {
            Candidate candidate = Candidate.builder()
                    .candidateId(user.getUserId()) // Shared PK = user_id
                    .user(user)
                    .headline(request.getHeadline() != null && !request.getHeadline().isBlank() 
                            ? request.getHeadline().trim() 
                            : "Ứng viên tiềm năng")
                    .location(user.getAddress() != null ? user.getAddress() : "Việt Nam")
                    .bio(user.getBio())
                    .experienceYears(0)
                    .build();
            candidateRepository.save(candidate);
        } else if (role == UserRole.RECRUITER) {
            String compName = (request.getCompanyName() != null && !request.getCompanyName().isBlank())
                    ? request.getCompanyName().trim()
                    : request.getFullName() + "'s Company";

            // 1. Tìm công ty theo companyId, taxCode hoặc compName
            Company company = null;
            if (request.getCompanyId() != null) {
                company = companyRepository.findById(request.getCompanyId()).orElse(null);
            }
            if (company == null && request.getTaxCode() != null && !request.getTaxCode().isBlank()) {
                company = companyRepository.findFirstByTaxCodeIgnoreCase(request.getTaxCode().trim()).orElse(null);
            }
            if (company == null) {
                company = companyRepository.findFirstByCompanyNameIgnoreCase(compName).orElse(null);
            }

            boolean isNewComp = false;
            String bName = request.getBranchName() != null && !request.getBranchName().isBlank()
                    ? request.getBranchName().trim()
                    : "Trụ sở chính";
            String bAddr = request.getBranchAddress() != null && !request.getBranchAddress().isBlank()
                    ? request.getBranchAddress().trim()
                    : (request.getCompanyAddress() != null ? request.getCompanyAddress().trim() : (user.getAddress() != null ? user.getAddress() : "Việt Nam"));

            boolean isPinVerified = false;
            if (company == null) {
                isNewComp = true;
                String initialBranchesJson = initOrAppendBranch(null, bName, bAddr, request.getCompanySize(), user.getUserId(), user.getFullName(), true);
                company = Company.builder()
                        .companyName(compName)
                        .address(bAddr)
                        .website(request.getWebsite())
                        .companySize(request.getCompanySize())
                        .taxCode(request.getTaxCode())
                        .licenseNumber(request.getLicenseNumber())
                        .licenseDocUrl(request.getLicenseDocUrl())
                        .licenseDocName(request.getLicenseDocName())
                        .legalRepresentative(request.getLegalRepresentative() != null && !request.getLegalRepresentative().isBlank() ? request.getLegalRepresentative().trim() : user.getFullName())
                        .branchesJson(initialBranchesJson)
                        .status(CompanyStatus.PENDING)
                        .build();
                if (brandMediaSyncService != null) {
                    brandMediaSyncService.ensureCompanyLogo(company);
                } else {
                    company.setLogoUrl(com.hiremate.service.BrandMediaSyncService.resolveCompanyLogo(compName, null));
                }
                company = companyRepository.saveAndFlush(company);
            } else {
                String inputPin = request.getCompanyHrPin() != null ? request.getCompanyHrPin().trim() : "";
                if (!inputPin.isEmpty()) {
                    if (isCompanyHrPinValid(company, inputPin)) {
                        isPinVerified = true;
                        String updatedBranches = initOrAppendBranch(company.getBranchesJson(), bName, bAddr, company.getCompanySize(), user.getUserId(), user.getFullName(), false);
                        company.setBranchesJson(updatedBranches);
                    } else {
                        throw new BadRequestException("Mã số xác nhận gia nhập HR (HR PIN: " + inputPin + ") không chính xác cho doanh nghiệp \"" + company.getCompanyName() + "\". Vui lòng kiểm tra lại mã từ Trụ sở chính.");
                    }
                } else if (company.getRecruiterId() == null) {
                    isPinVerified = true;
                } else {
                    // Chưa có mã PIN: Lưu vào pendingJoinRequests chờ duyệt
                    RegisterRequest tempReq = new RegisterRequest();
                    tempReq.setPosition(request.getPosition());
                    tempReq.setDepartment(request.getDepartment());
                    String updatedBranches = appendPendingJoinRequest(company.getBranchesJson(), user, tempReq, bName, bAddr);
                    company.setBranchesJson(updatedBranches);
                }

                if ((company.getTaxCode() == null || company.getTaxCode().isBlank()) && request.getTaxCode() != null) {
                    company.setTaxCode(request.getTaxCode().trim());
                }
                if (company.getLicenseDocUrl() == null && request.getLicenseDocUrl() != null) {
                    company.setLicenseDocUrl(request.getLicenseDocUrl().trim());
                    company.setLicenseDocName(request.getLicenseDocName());
                }
                companyRepository.save(company);
            }

            boolean shouldLinkCompany = isNewComp || isPinVerified;
            Recruiter recruiter = Recruiter.builder()
                    .recruiterId(user.getUserId())
                    .user(user)
                    .company(shouldLinkCompany ? company : null)
                    .position(request.getPosition() != null && !request.getPosition().isBlank() 
                            ? request.getPosition().trim() 
                            : "HR Recruiter")
                    .department(request.getDepartment() != null && !request.getDepartment().isBlank() 
                            ? request.getDepartment().trim() 
                            : "Phòng Tuyển dụng & Nhân sự")
                    .branchName(bName)
                    .branchAddress(bAddr)
                    .isHeadRecruiter(isNewComp || company.getRecruiterId() == null)
                    .build();
            Recruiter savedRecruiter = recruiterRepository.saveAndFlush(recruiter);

            if (isNewComp || company.getRecruiterId() == null) {
                company.setRecruiterId(savedRecruiter.getRecruiterId());
                companyRepository.save(company);
            } else {
                try {
                    List<Recruiter> existingRecruiters = recruiterRepository.findAllByCompany_CompanyId(company.getCompanyId());
                    for (Recruiter existing : existingRecruiters) {
                        if (!existing.getRecruiterId().equals(user.getUserId())) {
                            notificationService.createNotification(
                                    existing.getRecruiterId(),
                                    com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                                    "Thành viên HR mới tham gia tổ chức",
                                    "Chuyên viên nhân sự " + user.getFullName() + " (" + user.getEmail() + ") vừa đăng ký tài khoản qua Google và gia nhập đội ngũ tuyển dụng của " + company.getCompanyName() + ".",
                                    company.getCompanyId(),
                                    "companies"
                            );
                        }
                    }
                } catch (Exception notifEx) {
                    log.warn(">> [AuthService] Không thể gửi thông báo HR Google: {}", notifEx.getMessage());
                }
            }

            companyId = company.getCompanyId();
            companyName = company.getCompanyName();
        }

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), user.getRole().name());
        } catch (Exception e) {
            log.error(">> [AuthService] Không thể gửi welcome email cho user Google mới: {}", e.getMessage());
        }

        notificationService.createNotification(
                user.getUserId(),
                com.hiremate.enums.NotificationType.SYSTEM_ALERT,
                "Chào mừng gia nhập HireMate AI!",
                "Tài khoản của bạn đã được thiết lập thành công qua Google.",
                user.getUserId(),
                "users"
        );

        log.info(">> [AuthService] Hoàn tất đăng ký thành công cho tài khoản Google mới: {} với vai trò {}", email, role);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("role", user.getRole().name());
        String token = jwtUtil.generateToken(user.getEmail(), claims);
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), claims);

        AuthResponse response = buildAuthResponse(user, token, refreshToken, companyId, companyName);
        response.setIsNewUser(false);
        return response;
    }

    @Override
    @Transactional
    public AuthResponse githubLogin(GitHubAuthRequest request) {
        String email = null;
        String fullName = null;
        String avatarUrl = null;
        String githubUrl = null;

        if (request.getCode() != null && !request.getCode().isBlank()) {
            try {
                // 1. Trao đổi OAuth code để lấy access_token từ GitHub
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setAccept(java.util.Collections.singletonList(org.springframework.http.MediaType.APPLICATION_JSON));

                Map<String, String> tokenParams = new HashMap<>();
                tokenParams.put("client_id", githubClientId);
                tokenParams.put("client_secret", githubClientSecret);
                tokenParams.put("code", request.getCode().trim());
                if (request.getRedirectUri() != null && !request.getRedirectUri().isBlank()) {
                    tokenParams.put("redirect_uri", request.getRedirectUri().trim());
                } else {
                    tokenParams.put("redirect_uri", "http://localhost:3000");
                }

                org.springframework.http.HttpEntity<Map<String, String>> tokenEntity = new org.springframework.http.HttpEntity<>(tokenParams, headers);
                org.springframework.http.ResponseEntity<Map<String, Object>> tokenResponse = restTemplate.exchange(
                        "https://github.com/login/oauth/access_token",
                        org.springframework.http.HttpMethod.POST,
                        tokenEntity,
                        new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

                if (tokenResponse.getBody() != null) {
                    if (tokenResponse.getBody().get("error") != null) {
                        log.error(">> [AuthService] GitHub OAuth exchange error: {} - {}", 
                                tokenResponse.getBody().get("error"), 
                                tokenResponse.getBody().get("error_description"));
                    }
                }

                if (tokenResponse.getBody() != null && tokenResponse.getBody().get("access_token") != null) {
                    String accessToken = String.valueOf(tokenResponse.getBody().get("access_token"));

                    // 2. Lấy hồ sơ tài khoản từ GitHub User API
                    org.springframework.http.HttpHeaders userHeaders = new org.springframework.http.HttpHeaders();
                    userHeaders.setBearerAuth(accessToken);
                    userHeaders.set("User-Agent", "HireMate-AI-Platform");
                    org.springframework.http.HttpEntity<Void> userEntity = new org.springframework.http.HttpEntity<>(userHeaders);

                    org.springframework.http.ResponseEntity<Map<String, Object>> userResponse = restTemplate.exchange(
                            "https://api.github.com/user",
                            org.springframework.http.HttpMethod.GET,
                            userEntity,
                            new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

                    if (userResponse.getBody() != null) {
                        Map<String, Object> userData = userResponse.getBody();
                        String login = (String) userData.get("login");
                        String name = (String) userData.get("name");
                        fullName = (name != null && !name.isBlank()) ? name : login;
                        avatarUrl = (String) userData.get("avatar_url");
                        email = (String) userData.get("email");
                        if (login != null && !login.isBlank()) {
                            githubUrl = "https://github.com/" + login;
                        }

                        // 3. Nếu email là private, lấy email chính từ /user/emails
                        if (email == null || email.isBlank()) {
                            try {
                                org.springframework.http.ResponseEntity<java.util.List<Map<String, Object>>> emailsResponse = restTemplate.exchange(
                                        "https://api.github.com/user/emails",
                                        org.springframework.http.HttpMethod.GET,
                                        userEntity,
                                        new org.springframework.core.ParameterizedTypeReference<java.util.List<Map<String, Object>>>() {});
                                if (emailsResponse.getBody() != null) {
                                    for (Map<String, Object> emailItem : emailsResponse.getBody()) {
                                        Boolean primary = (Boolean) emailItem.get("primary");
                                        if (Boolean.TRUE.equals(primary)) {
                                            email = (String) emailItem.get("email");
                                            break;
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                log.warn(">> [AuthService] Không thể lấy email phụ từ GitHub: {}", e.getMessage());
                            }
                        }

                        if (email == null || email.isBlank()) {
                            email = login.toLowerCase() + "@github.com";
                        }
                    }
                }
            } catch (Exception e) {
                log.error(">> [AuthService] Lỗi khi trao đổi GitHub OAuth code: {}", e.getMessage());
            }
        }

        // Fallback email / profile nếu không trao đổi được code
        if (email == null && request.getEmail() != null && !request.getEmail().isBlank()) {
            email = request.getEmail().toLowerCase().trim();
            fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                    ? request.getFullName() : email.split("@")[0];
            avatarUrl = request.getAvatarUrl();
        }

        if (email == null) {
            throw new IllegalArgumentException("Không thể xác thực thông tin tài khoản GitHub của bạn.");
        }

        email = email.toLowerCase().trim();
        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalStateException("Tài khoản của bạn đã bị khóa hoặc ngừng kích hoạt. Vui lòng liên hệ quản trị viên.");
            }
            if (avatarUrl != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(com.hiremate.service.BrandMediaSyncService.sanitizeImageUrl(avatarUrl));
                userRepository.save(user);
                if (userCacheService != null) userCacheService.evict(user.getEmail(), user.getUserId());
            }
            if (user.getGithubUrl() == null || user.getGithubUrl().isBlank()) {
                if (githubUrl != null) {
                    user.setGithubUrl(githubUrl);
                    userRepository.save(user);
                }
            }
            log.info(">> [AuthService] Đăng nhập GitHub thành công cho tài khoản đã tồn tại: {}", email);

            Long companyId = null;
            String companyName = null;
            if (user.getRole() == UserRole.RECRUITER) {
                Optional<Recruiter> recruiterOpt = recruiterRepository.findById(user.getUserId());
                if (recruiterOpt.isPresent() && recruiterOpt.get().getCompany() != null) {
                    companyId = recruiterOpt.get().getCompany().getCompanyId();
                    companyName = recruiterOpt.get().getCompany().getCompanyName();
                }
            }

            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getUserId());
            claims.put("role", user.getRole().name());
            String token = jwtUtil.generateToken(user.getEmail(), claims);
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), claims);

            AuthResponse authResp = buildAuthResponse(user, token, refreshToken, companyId, companyName);
            authResp.setIsNewUser(false);
            return authResp;
        } else {
            // TRƯỜNG HỢP 2 (Người dùng mới): Trả về isNewUser = true để chuyển sang trang hoàn tất hồ sơ
            log.info(">> [AuthService] Phát hiện tài khoản GitHub mới chưa có trong hệ thống: {}", email);
            return AuthResponse.of(
                    null, null, null, email, fullName, null, null, avatarUrl, null, null, true, null, null, null, githubUrl, true
            );
        }
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new IllegalArgumentException("Refresh token is required");
        }

        String email;
        try {
            email = jwtUtil.extractEmail(request.getRefreshToken());
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new IllegalArgumentException("Refresh token đã hết hạn, vui lòng đăng nhập lại");
        } catch (io.jsonwebtoken.JwtException e) {
            throw new IllegalArgumentException("Refresh token không hợp lệ hoặc đã bị thay đổi");
        }

        if (email == null) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for refresh token"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Account is not active");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("role", user.getRole().name());

        String newAccessToken = jwtUtil.generateToken(user.getEmail(), claims);
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail(), claims);

        Long companyId = null;
        String companyName = null;
        if (user.getRole() == UserRole.RECRUITER) {
            Optional<Recruiter> recruiterOpt = recruiterRepository.findById(user.getUserId());
            if (recruiterOpt.isPresent() && recruiterOpt.get().getCompany() != null) {
                companyId = recruiterOpt.get().getCompany().getCompanyId();
                companyName = recruiterOpt.get().getCompany().getCompanyName();
            }
        }

        return buildAuthResponse(user, newAccessToken, newRefreshToken, companyId, companyName);
    }

    @Override
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                java.util.Date expiration = jwtUtil.extractExpiration(token);
                long expirationTimeMs = expiration != null ? expiration.getTime() : (System.currentTimeMillis() + 86400000L);
                tokenBlacklistService.blacklistToken(token, expirationTimeMs);
                log.info(">> [AuthService] Người dùng đăng xuất thành công, token đã bị vô hiệu hóa.");
            } catch (Exception e) {
                log.warn(">> [AuthService] Lỗi khi trích xuất thời hạn token đăng xuất: {}", e.getMessage());
            }
        }
    }

    private AuthResponse buildAuthResponse(User user, String token, String refreshToken, Long companyId, String companyName) {
        AuthResponse res = AuthResponse.of(
                token,
                refreshToken,
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                com.hiremate.service.BrandMediaSyncService.sanitizeImageUrl(user.getAvatarUrl()),
                companyId,
                companyName,
                user.getIsEmailVerified() != null ? user.getIsEmailVerified() : true,
                user.getDateOfBirth(),
                user.getAddress(),
                user.getBio(),
                user.getGithubUrl(),
                false
        );
        if (companyName != null && !companyName.isBlank()) {
            res.setCompanyLogo(com.hiremate.service.BrandMediaSyncService.resolveCompanyLogo(companyName, null));
        }
        if (user.getRole() == UserRole.RECRUITER) {
            recruiterRepository.findById(user.getUserId()).ifPresent(r -> {
                res.setPosition(r.getPosition());
                res.setDepartment(r.getDepartment());
                res.setBranchName(r.getBranchName());
                res.setIsHeadRecruiter(r.getIsHeadRecruiter());
                if (r.getCompany() != null) {
                    res.setTaxCode(r.getCompany().getTaxCode());
                    res.setCompanyLogo(com.hiremate.service.BrandMediaSyncService.resolveCompanyLogo(
                            r.getCompany().getCompanyName(),
                            r.getCompany().getLogoUrl()
                    ));
                }
            });
        }
        return res;
    }


    private String initOrAppendBranch(String existingBranchesJson, String branchName, String branchAddress, String companySize, Long recruiterId, String managerName, boolean isHq) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<Map<String, Object>> branches = new java.util.ArrayList<>();
        if (existingBranchesJson != null && !existingBranchesJson.trim().isEmpty()) {
            try {
                branches = mapper.readValue(existingBranchesJson, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception ex) {
                log.warn("Không thể parse branchesJson cũ: {}", ex.getMessage());
            }
        }

        String targetBranchName = (branchName != null && !branchName.trim().isEmpty()) ? branchName.trim() : (isHq ? "Trụ sở chính" : "Chi nhánh");
        String targetBranchAddress = (branchAddress != null && !branchAddress.trim().isEmpty()) ? branchAddress.trim() : "";

        boolean exists = branches.stream().anyMatch(b -> {
            Object bn = b.get("branchName");
            return bn != null && bn.toString().trim().equalsIgnoreCase(targetBranchName);
        });

        if (!exists) {
            Map<String, Object> newBranch = new java.util.HashMap<>();
            newBranch.put("id", UUID.randomUUID().toString());
            newBranch.put("branchName", targetBranchName);
            newBranch.put("address", targetBranchAddress);
            newBranch.put("scale", companySize != null ? companySize : "50-100");
            newBranch.put("hotline", "");
            newBranch.put("managerRecruiterId", recruiterId);
            newBranch.put("managerName", managerName != null ? managerName : "");
            newBranch.put("isHeadquarters", isHq && branches.isEmpty());
            branches.add(newBranch);
        }

        try {
            return mapper.writeValueAsString(branches);
        } catch (Exception ex) {
            log.error("Lỗi serialize branchesJson: {}", ex.getMessage());
            return existingBranchesJson;
        }
    }

    private String appendPendingJoinRequest(String existingBranchesJson, User newUser, RegisterRequest request, String branchName, String branchAddress) {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        Map<String, Object> rootMap = new HashMap<>();
        List<Map<String, Object>> branchesList = new java.util.ArrayList<>();
        List<Map<String, Object>> pendingList = new java.util.ArrayList<>();

        if (existingBranchesJson != null && !existingBranchesJson.trim().isEmpty()) {
            try {
                if (existingBranchesJson.trim().startsWith("[")) {
                    branchesList = mapper.readValue(existingBranchesJson, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                } else {
                    rootMap = mapper.readValue(existingBranchesJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    if (rootMap.containsKey("branches") && rootMap.get("branches") instanceof List) {
                        branchesList = (List<Map<String, Object>>) rootMap.get("branches");
                    }
                    if (rootMap.containsKey("pendingJoinRequests") && rootMap.get("pendingJoinRequests") instanceof List) {
                        pendingList = (List<Map<String, Object>>) rootMap.get("pendingJoinRequests");
                    }
                }
            } catch (Exception ex) {
                log.warn("Không thể parse branchesJson cũ: {}", ex.getMessage());
            }
        }

        boolean alreadyPending = pendingList.stream().anyMatch(p -> {
            Object email = p.get("email");
            Object id = p.get("id");
            return (email != null && email.toString().equalsIgnoreCase(newUser.getEmail()))
                    || (id != null && id.toString().equals(String.valueOf(newUser.getUserId())));
        });

        if (!alreadyPending) {
            Map<String, Object> req = new HashMap<>();
            req.put("id", newUser.getUserId());
            req.put("email", newUser.getEmail());
            req.put("name", newUser.getFullName());
            req.put("fullName", newUser.getFullName());
            req.put("position", request.getPosition() != null && !request.getPosition().isBlank() ? request.getPosition().trim() : "HR Recruiter");
            req.put("department", request.getDepartment() != null && !request.getDepartment().isBlank() ? request.getDepartment().trim() : "Phòng Tuyển dụng & Nhân sự");
            req.put("branchName", branchName);
            req.put("branchAddress", branchAddress);
            req.put("phone", newUser.getPhone() != null ? newUser.getPhone() : "");
            req.put("requestDate", java.time.LocalDate.now().toString());
            req.put("requestedAt", java.time.LocalDateTime.now().toString());
            pendingList.add(req);
        }

        rootMap.put("branches", branchesList);
        rootMap.put("pendingJoinRequests", pendingList);

        try {
            return mapper.writeValueAsString(rootMap);
        } catch (Exception ex) {
            log.error("Lỗi serialize branchesJson với pendingJoinRequests: {}", ex.getMessage());
            return existingBranchesJson;
        }
    }

    private boolean isCompanyHrPinValid(Company company, String rawPin) {
        if (company == null || rawPin == null || rawPin.isBlank()) {
            return false;
        }
        String pin = rawPin.trim().toUpperCase();
        String rawTax = company.getTaxCode() != null ? company.getTaxCode().trim() : "";
        String cleanTax = rawTax.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        String rawName = company.getCompanyName() != null ? company.getCompanyName().trim() : "HR";
        String shortComp = rawName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (shortComp.length() > 4) {
            shortComp = shortComp.substring(0, 4);
        }

        // 1. Kiểm tra format: HM-<taxCode> hoặc <taxCode> (VD: HM-0303987654 hoặc 0303987654)
        if (!cleanTax.isEmpty()) {
            if (pin.equalsIgnoreCase("HM-" + cleanTax) || pin.equalsIgnoreCase(cleanTax)) {
                return true;
            }
        }
        // 2. Kiểm tra format: HM-<shortComp>-2026 hoặc HM-<shortComp> (VD: HM-VNG-2026 hoặc HM-VNG)
        if (!shortComp.isEmpty()) {
            if (pin.equalsIgnoreCase("HM-" + shortComp + "-2026")
                    || pin.equalsIgnoreCase("HM-" + shortComp)
                    || pin.equalsIgnoreCase(shortComp)) {
                return true;
            }
        }
        return false;
    }
}
