package com.hiremate.service.impl;

import com.hiremate.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.InternetAddress;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private com.hiremate.service.SystemSettingsService systemSettingsService;

    @Value("${spring.mail.username:hiremate.ai.fpt@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss - dd/MM/yyyy");

    private String getCurrentFormattedTime() {
        return ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(TIME_FORMATTER);
    }

    private String getBaseUrl() {
        if (frontendBaseUrl != null && !frontendBaseUrl.isBlank()) {
            return frontendBaseUrl.replaceAll("/+$", "");
        }
        return "http://localhost:3000";
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        String subject;
        String actionTitle;
        String purposeDescription;
        String securityNote;
        String requestTypeName;
        String timeStr = getCurrentFormattedTime();

        if ("REGISTER".equalsIgnoreCase(purpose)) {
            subject = "[HireMate AI] Mã OTP xác thực đăng ký tài khoản: " + otp;
            actionTitle = "Xác Thực Đăng Ký Tài Khoản Mới";
            requestTypeName = "Đăng ký tài khoản thành viên mới";
            purposeDescription = "kích hoạt và xác thực địa chỉ email cho tài khoản mới trên nền tảng tuyển dụng thông minh <strong>HireMate AI</strong>";
            securityNote = "Mã xác thực này chỉ có hiệu lực cho giao dịch đăng ký tài khoản. Tuyệt đối không cung cấp mã cho bất kỳ ai.";
        } else if ("CHANGE_PASSWORD".equalsIgnoreCase(purpose)) {
            subject = "[HireMate AI] Mã OTP xác nhận đổi mật khẩu: " + otp;
            actionTitle = "Xác Nhận Thay Đổi Mật Khẩu";
            requestTypeName = "Yêu cầu đổi mật khẩu đăng nhập";
            purposeDescription = "thay đổi mật khẩu đăng nhập cho tài khoản của bạn trên nền tảng <strong>HireMate AI</strong>";
            securityNote = "Nếu bạn không chủ động thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ ngay với quản trị viên.";
        } else {
            subject = "[HireMate AI] Mã OTP khôi phục mật khẩu tài khoản: " + otp;
            actionTitle = "Khôi Phục Mật Khẩu Đăng Nhập";
            requestTypeName = "Yêu cầu khôi phục mật khẩu quên";
            purposeDescription = "thiết lập lại mật khẩu đăng nhập cho tài khoản của bạn trên nền tảng <strong>HireMate AI</strong>";
            securityNote = "Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn và bạn có thể yên tâm bỏ qua email này.";
        }

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f3fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e1b4b; -webkit-font-smoothing: antialiased;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f4f3fb; padding: 36px 16px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e9e5ff; box-shadow: 0 10px 25px rgba(30, 27, 75, 0.07);">
                      
                      <!-- Header Brand Banner -->
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%%, #312e81 100%%); padding: 36px 24px; text-align: center;">
                          <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            HireMate<span style="color: #a78bfa;">.AI</span>
                          </div>
                          <div style="font-size: 11px; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                            HỆ THỐNG XÁC THỰC BẢO MẬT ĐỊNH DANH (IAM)
                          </div>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          <!-- Security Badge -->
                          <div style="margin-bottom: 18px;">
                            <span style="display: inline-block; background-color: #edeafd; color: #5b48bd; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px;">
                              BẢO MẬT TÀI KHOẢN • OTP 2FA
                            </span>
                          </div>

                          <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1.3;">
                            %s
                          </h2>

                          <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            Kính gửi Quý người dùng,
                          </p>

                          <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                            Hệ thống HireMate AI vừa ghi nhận yêu cầu %s cho địa chỉ email <strong>%s</strong>. Để hoàn tất quy trình xác thực, Quý khách vui lòng nhập mã OTP một lần dưới đây:
                          </p>

                          <!-- OTP Display Box -->
                          <div style="background: linear-gradient(180deg, #f8f7ff 0%%, #f1f0fb 100%%); border: 2px dashed #7c66dc; border-radius: 18px; padding: 26px 20px; text-align: center; margin-bottom: 24px;">
                            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #6d57d9; margin-bottom: 10px;">
                              MÃ XÁC THỰC BẢO MẬT (OTP)
                            </div>
                            <div style="font-size: 40px; font-weight: 900; letter-spacing: 14px; color: #312e81; font-family: 'Courier New', Courier, monospace; margin: 4px 0;">
                              %s
                            </div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 10px; font-weight: 500;">
                              ⏱ Hiệu lực trong <strong>10 phút</strong> &bull; Chỉ sử dụng <strong>01 lần duy nhất</strong>
                            </div>
                          </div>

                          <!-- Transaction Metadata Card -->
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="font-size: 12px; line-height: 1.6; color: #4b5563;">
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280; width: 140px;">Loại yêu cầu:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #1e1b4b;">%s</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280;">Tài khoản nhận:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #1e1b4b;">%s</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280;">Thời gian khởi tạo:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #1e1b4b;">%s (GMT+7)</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280;">Kênh bảo mật:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #059669;">HireMate Cloud Security Gateway (SSL/TLS 256-bit)</td>
                              </tr>
                            </table>
                          </div>

                          <!-- Enterprise Security Warning -->
                          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
                            <div style="font-size: 12px; font-weight: 700; color: #92400e; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                              ⚠️ NGUYÊN TẮC BẢO MẬT DOANH NGHIỆP:
                            </div>
                            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #78350f;">
                              %s Nhân viên HireMate AI tuyệt đối KHÔNG BAO GIỜ liên hệ yêu cầu bạn cung cấp mã OTP này qua điện thoại hoặc tin nhắn.
                            </p>
                          </div>

                          <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                            Nếu Quý khách không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc thông báo khẩn cấp tới <a href="mailto:security@hiremate.vn" style="color: #5b48bd; text-decoration: none; font-weight: 600;">security@hiremate.vn</a> để bảo vệ tài khoản.
                          </p>

                          <div style="font-size: 13px; color: #374151; line-height: 1.6;">
                            Trân trọng,<br>
                            <strong style="color: #1e1b4b; font-size: 14px;">Ban Quản Trị Hệ Thống HireMate AI</strong>
                          </div>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 32px;">
                          <div style="border-top: 1px solid #e5e7eb;"></div>
                        </td>
                      </tr>

                      <!-- Enterprise Footer -->
                      <tr>
                        <td align="center" style="padding: 24px 32px 32px 32px; font-size: 11px; color: #6b7280; line-height: 1.6; text-align: center;">
                          <p style="margin: 0 0 4px 0; font-weight: 700; color: #374151;">Hệ Thống Quản Trị Tuyển Dụng &amp; Định Danh HireMate AI Platform</p>
                          <p style="margin: 0 0 4px 0;">Công ty Cổ phần Nền tảng Nhân sự Thông minh HireMate AI &bull; Dự án SWP391 Đại học FPT</p>
                          <p style="margin: 0 0 10px 0;">Khu Giáo dục &amp; Đào tạo, Khu Công nghệ Cao Hòa Lạc, Km 29 Đại lộ Thăng Long, Hà Nội</p>
                          <p style="margin: 0; font-size: 10px; color: #9ca3af;">
                            Email tự động từ hệ thống bảo mật HireMate AI. Vui lòng không trả lời trực tiếp (No-reply).<br>
                            Hỗ trợ kỹ thuật: <a href="mailto:support@hiremate.vn" style="color: #5b48bd; text-decoration: none; font-weight: 600;">support@hiremate.vn</a> | Hotline: <strong>1900 6868</strong>
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """,
            subject,
            actionTitle,
            purposeDescription,
            toEmail,
            otp,
            requestTypeName,
            toEmail,
            timeStr,
            securityNote
        );

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String fullName, String role) {
        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Quý thành viên";
        String roleName = ("RECRUITER".equalsIgnoreCase(role) || "ROLE_RECRUITER".equalsIgnoreCase(role))
                ? "Nhà Tuyển Dụng (Recruiter)"
                : ("ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role))
                ? "Quản Trị Viên (System Admin)"
                : "Ứng Viên Tài Năng (Candidate)";
        String subject = "[HireMate AI] Chào Mừng " + safeName + " Đến Với Nền Tảng Tuyển Dụng Thông Minh AI";
        String timeStr = getCurrentFormattedTime();
        String loginUrl = getBaseUrl() + "/#/login";

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f3fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e1b4b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f4f3fb; padding: 36px 16px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e9e5ff; box-shadow: 0 10px 25px rgba(30, 27, 75, 0.07);">
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%%, #312e81 100%%); padding: 36px 24px; text-align: center;">
                          <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            HireMate<span style="color: #a78bfa;">.AI</span>
                          </div>
                          <div style="font-size: 11px; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                            NỀN TẢNG TUYỂN DỤNG &amp; ĐÁNH GIÁ NHÂN TÀI AI
                          </div>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          <div style="margin-bottom: 18px;">
                            <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px;">
                              🎉 KÍCH HOẠT TÀI KHOẢN THÀNH CÔNG
                            </span>
                          </div>

                          <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1.3;">
                            Chào Mừng %s Gia Nhập HireMate AI!
                          </h2>

                          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            Xin chào <strong>%s</strong>,
                          </p>

                          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                            Tài khoản của Quý khách với vai trò <strong>%s</strong> đã được khởi tạo và kích hoạt thành công trên nền tảng <strong>HireMate AI Platform</strong> vào lúc %s.
                          </p>

                          <!-- Key Features Card -->
                          <div style="background-color: #f8f7ff; border: 1px solid #e9e5ff; border-radius: 16px; padding: 22px; margin-bottom: 26px;">
                            <div style="font-size: 13px; font-weight: 800; color: #5b48bd; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
                              🚀 CÁC TÍNH NĂNG ĐỘT PHÁ SẴN SÀNG CHO BẠN:
                            </div>
                            <div style="font-size: 13px; color: #374151; line-height: 1.7;">
                              <p style="margin: 0 0 8px 0;"><strong>🤖 AI ATS CV Engine:</strong> Tự động bóc tách và chấm điểm tương thích CV theo chuẩn ATS quốc tế 4 trụ cột.</p>
                              <p style="margin: 0 0 8px 0;"><strong>🎙️ AI Mock Interview Copilot:</strong> Luyện phỏng vấn 1-1 bằng giọng nói thông minh với AI đa ngôn ngữ.</p>
                              <p style="margin: 0;"><strong>🎯 Smart Matchmaking:</strong> Kết nối chuẩn 70/30 giữa năng lực ứng viên và nhu cầu thực tế của doanh nghiệp.</p>
                            </div>
                          </div>

                          <!-- Call To Action Button -->
                          <div style="text-align: center; margin: 30px 0 20px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #5b48bd 0%%, #4338ca 100%%); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(91, 72, 189, 0.3);">
                              Đăng Nhập Khám Phá Ngay &rarr;
                            </a>
                          </div>

                          <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">
                            Cần hỗ trợ thiết lập tài khoản? Đội ngũ chuyên gia HireMate luôn sẵn sàng đồng hành cùng bạn 24/7.
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 32px;">
                          <div style="border-top: 1px solid #e5e7eb;"></div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 24px 32px 32px 32px; font-size: 11px; color: #6b7280; line-height: 1.6; text-align: center;">
                          <p style="margin: 0 0 4px 0; font-weight: 700; color: #374151;">HireMate AI Platform &bull; FPT University SWP391 Project</p>
                          <p style="margin: 0;">Email gửi tự động từ hệ thống. Hỗ trợ: support@hiremate.vn</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """,
            subject,
            safeName,
            safeName,
            roleName,
            timeStr,
            loginUrl
        );

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordChangedNotification(String toEmail) {
        String subject = "[HireMate AI] Cảnh Báo An Ninh: Mật khẩu tài khoản của bạn vừa được thay đổi";
        String timeStr = getCurrentFormattedTime();
        String resetUrl = getBaseUrl() + "/#/forgot-password";

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f3fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e1b4b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f4f3fb; padding: 36px 16px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e9e5ff; box-shadow: 0 10px 25px rgba(30, 27, 75, 0.07);">
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%%, #312e81 100%%); padding: 36px 24px; text-align: center;">
                          <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            HireMate<span style="color: #a78bfa;">.AI</span>
                          </div>
                          <div style="font-size: 11px; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                            TRUNG TÂM AN NINH &amp; GIÁM SÁT TÀI KHOẢN (SOC)
                          </div>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          <div style="margin-bottom: 18px;">
                            <span style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px;">
                              CẢNH BÁO AN NINH • THAY ĐỔI MẬT KHẨU
                            </span>
                          </div>

                          <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1.3;">
                            Mật Khẩu Tài Khoản Của Bạn Vừa Được Cập Nhật
                          </h2>

                          <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            Kính gửi Quý người dùng,
                          </p>

                          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                            Hệ thống bảo mật HireMate AI thông báo: Mật khẩu đăng nhập cho tài khoản <strong>%s</strong> vừa được cập nhật thành công vào lúc <strong>%s (GMT+7)</strong>.
                          </p>

                          <!-- Session Metadata Table -->
                          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="font-size: 12px; line-height: 1.6; color: #4b5563;">
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280; width: 140px;">Tài khoản cập nhật:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #1e1b4b;">%s</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280;">Thời gian thực hiện:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #1e1b4b;">%s (GMT+7)</td>
                              </tr>
                              <tr>
                                <td style="padding: 4px 0; color: #6b7280;">Trạng thái phiên:</td>
                                <td style="padding: 4px 0; font-weight: 600; color: #059669;">Cập nhật mật khẩu thành công</td>
                              </tr>
                            </table>
                          </div>

                          <!-- Urgent Security Alert -->
                          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 18px 20px; margin-bottom: 26px;">
                            <div style="font-size: 13px; font-weight: 800; color: #991b1b; margin-bottom: 6px; text-transform: uppercase;">
                              🚨 BẠN KHÔNG PHẢI LÀ NGƯỜI THỰC HIỆN HÀNH ĐỘNG NÀY?
                            </div>
                            <p style="margin: 0 0 14px 0; font-size: 12px; line-height: 1.6; color: #7f1d1d;">
                              Nếu bạn KHÔNG thực hiện đổi mật khẩu, rất có thể tài khoản của bạn đang bị xâm nhập trái phép. Vui lòng bấm ngay vào nút bên dưới để khôi phục quyền truy cập khẩn cấp hoặc gửi email thông báo tới <strong>security@hiremate.vn</strong> ngay lập tức.
                            </p>
                            <div style="text-align: center;">
                              <a href="%s" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 24px; border-radius: 10px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);">
                                Khôi Phục Quyền Truy Cập Khẩn Cấp
                              </a>
                            </div>
                          </div>

                          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6b7280;">
                            Nếu chính bạn vừa thực hiện thay đổi mật khẩu, Quý khách có thể hoàn toàn yên tâm sử dụng mật khẩu mới để đăng nhập.
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 32px;">
                          <div style="border-top: 1px solid #e5e7eb;"></div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 24px 32px 32px 32px; font-size: 11px; color: #6b7280; line-height: 1.6; text-align: center;">
                          <p style="margin: 0 0 4px 0; font-weight: 700; color: #374151;">Trung Tâm An Ninh Thông Tin HireMate AI Platform</p>
                          <p style="margin: 0;">Email cảnh báo an ninh tự động &bull; FPT University SWP391 Project</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """,
            subject,
            toEmail,
            timeStr,
            toEmail,
            timeStr,
            resetUrl
        );

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @org.springframework.scheduling.annotation.Async
    @Override
    public void sendApplicationStatusEmail(
            String toEmail,
            String candidateName,
            String jobTitle,
            String companyName,
            com.hiremate.enums.ApplicationStatus status,
            String notes
    ) {
        String safeName = (candidateName != null && !candidateName.isBlank()) ? candidateName : "Ứng viên";
        String safeJob = (jobTitle != null && !jobTitle.isBlank()) ? jobTitle : "Vị trí tuyển dụng";
        String safeCompany = (companyName != null && !companyName.isBlank()) ? companyName : "Nhà tuyển dụng";

        String subject;
        String badgeText;
        String badgeBgColor;
        String badgeTextColor;
        String mainHeadline;
        String mainMessage;
        String extraTipHtml;

        switch (status) {
            case INTERVIEWING -> {
                subject = String.format("[HireMate AI] Lời Mời Phỏng Vấn: %s tại %s", safeJob, safeCompany);
                badgeText = "THƯ MỜI PHỎNG VẤN";
                badgeBgColor = "#edeafd";
                badgeTextColor = "#5b48bd";
                mainHeadline = "Chúc mừng! Bạn đã nhận được lời mời tham gia phỏng vấn";
                mainMessage = String.format("Nhà tuyển dụng từ <strong>%s</strong> đã thẩm định hồ sơ của bạn và trân trọng mời bạn tham gia vòng phỏng vấn cho vị trí <strong>%s</strong>.", safeCompany, safeJob);
                extraTipHtml = """
                    <div style="background-color: #f8f7ff; border: 1px solid #e9e5ff; border-radius: 14px; padding: 18px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #5b48bd; line-height: 1.5;">
                        🎯 <strong>Đặc quyền HireMate AI:</strong> Bạn có thể sử dụng tính năng <em>AI Mock Interview Copilot</em> trên hệ thống để luyện trả lời câu hỏi chuyên môn và nhận phân tích tốc độ nói, độ rõ ràng trước buổi phỏng vấn thực tế!
                      </p>
                    </div>
                    """;
            }
            case OFFERED -> {
                subject = String.format("[HireMate AI] Chúc Mừng Nhận Lời Mời Nhận Việc (Job Offer): %s tại %s", safeJob, safeCompany);
                badgeText = "LỜI MỜI NHẬN VIỆC (JOB OFFER)";
                badgeBgColor = "#fef3c7";
                badgeTextColor = "#92400e";
                mainHeadline = "Xin chúc mừng! Bạn đã nhận được Đề nghị nhận việc";
                mainMessage = String.format("Xin chúc mừng bạn! <strong>%s</strong> đã quyết định gửi đề nghị nhận việc (Job Offer) cho vị trí <strong>%s</strong> đến bạn.", safeCompany, safeJob);
                extraTipHtml = """
                    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 18px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                        🎉 Đây là thành quả xứng đáng cho năng lực và sự nỗ lực của bạn! Vui lòng đăng nhập vào HireMate AI để xem chi tiết offer và hoàn tất các thủ tục xác nhận tiếp theo.
                      </p>
                    </div>
                    """;
            }
            case HIRED -> {
                subject = String.format("[HireMate AI] Chúc Mừng Chính Thức Trúng Tuyển: %s tại %s", safeJob, safeCompany);
                badgeText = "CHÍNH THỨC TRÚNG TUYỂN (HIRED)";
                badgeBgColor = "#ecfdf5";
                badgeTextColor = "#065f46";
                mainHeadline = "Chào mừng bạn chính thức gia nhập đội ngũ!";
                mainMessage = String.format("Bạn đã chính thức hoàn tất xuất sắc quá trình tuyển dụng và được tiếp nhận vào vị trí <strong>%s</strong> tại <strong>%s</strong>.", safeJob, safeCompany);
                extraTipHtml = "";
            }
            case SHORTLISTED, SCREENING -> {
                subject = String.format("[HireMate AI] Hồ Sơ Đang Được Xét Duyệt: %s tại %s", safeJob, safeCompany);
                badgeText = "HỒ SƠ ĐÃ VÀO VÒNG XEM XÉT";
                badgeBgColor = "#eff6ff";
                badgeTextColor = "#1e40af";
                mainHeadline = "Hồ sơ của bạn đã được đưa vào danh sách rút gọn";
                mainMessage = String.format("Hồ sơ ứng tuyển của bạn cho vị trí <strong>%s</strong> tại <strong>%s</strong> đã vượt qua bước lọc ATS ban đầu và đang được bộ phận nhân sự xem xét kỹ lưỡng.", safeJob, safeCompany);
                extraTipHtml = "";
            }
            case REJECTED -> {
                subject = String.format("[HireMate AI] Thông Báo Kết Quả Tuyển Dụng: %s tại %s", safeJob, safeCompany);
                badgeText = "KẾT QUẢ TUYỂN DỤNG";
                badgeBgColor = "#f3f4f6";
                badgeTextColor = "#374151";
                mainHeadline = "Cập nhật về hồ sơ ứng tuyển của bạn";
                mainMessage = String.format("Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí <strong>%s</strong> tại <strong>%s</strong>. Sau khi cân nhắc kỹ lưỡng các tiêu chí của đợt này, nhà tuyển dụng rất tiếc chưa thể đồng hành cùng bạn ở thời điểm hiện tại.", safeJob, safeCompany);
                extraTipHtml = """
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">
                        💪 Hồ sơ của bạn vẫn được lưu trữ trong Talent Pool của HireMate AI. Hãy tiếp tục nâng cấp kỹ năng qua AI Studio và khám phá thêm nhiều cơ hội việc làm hấp dẫn khác!
                      </p>
                    </div>
                    """;
            }
            default -> {
                subject = String.format("[HireMate AI] Cập Nhật Trạng Thái Hồ Sơ: %s", safeJob);
                badgeText = "CẬP NHẬT TRẠNG THÁI";
                badgeBgColor = "#f4f4f5";
                badgeTextColor = "#27272a";
                mainHeadline = "Hồ sơ ứng tuyển của bạn đã có cập nhật mới";
                mainMessage = String.format("Nhà tuyển dụng từ <strong>%s</strong> đã cập nhật trạng thái hồ sơ của bạn cho vị trí <strong>%s</strong> sang: <strong>%s</strong>.", safeCompany, safeJob, status.name());
                extraTipHtml = "";
            }
        }

        String notesHtml = "";
        if (notes != null && !notes.isBlank()) {
            String sanitizedNotes = notes
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("\n", "<br>");

            notesHtml = String.format("""
                <div style="background-color: #f8f7ff; border-left: 4px solid #5b48bd; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
                  <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #5b48bd; margin-bottom: 6px;">
                    LỜI NHẮN TỪ NHÀ TUYỂN DỤNG
                  </span>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e1b4b;">%s</p>
                </div>
                """, sanitizedNotes);
        }

        String appLink = getBaseUrl() + "/#/candidate/applications";

        String htmlContent = String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f3fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e1b4b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f4f3fb; padding: 36px 16px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e9e5ff; box-shadow: 0 10px 25px rgba(30, 27, 75, 0.07);">

                      <!-- Header -->
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #1e1b4b 0%%, #312e81 100%%); padding: 36px 24px; text-align: center;">
                          <div style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            HireMate<span style="color: #a78bfa;">.AI</span>
                          </div>
                          <div style="font-size: 11px; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;">
                            HỆ THỐNG QUẢN LÝ TUYỂN DỤNG THÔNG MINH
                          </div>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          <!-- Status Badge -->
                          <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; background-color: %s; color: %s; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px;">
                              %s
                            </span>
                          </div>

                          <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1.4;">
                            %s
                          </h2>

                          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                            Kính gửi <strong>%s</strong>,
                          </p>

                          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                            %s
                          </p>

                          <!-- Job & Company Card -->
                          <div style="background-color: #f8f7ff; border: 1px solid #e9e5ff; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                            <div style="font-size: 11px; color: #7c66dc; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px;">VỊ TRÍ TUYỂN DỤNG</div>
                            <div style="font-size: 17px; font-weight: 800; color: #1e1b4b; margin-bottom: 6px;">%s</div>
                            <div style="font-size: 14px; color: #5b48bd; font-weight: 600;">Doanh nghiệp: %s</div>
                          </div>

                          %s
                          %s

                          <!-- Call to Action Button -->
                          <div style="text-align: center; margin: 32px 0 16px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #5b48bd 0%%, #4338ca 100%%); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(91, 72, 189, 0.3);">
                              Xem Chi Tiết Tiến Trình Ứng Tuyển &rarr;
                            </a>
                          </div>

                          <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #6b7280; text-align: center;">
                            Bạn có thể truy cập hồ sơ trực tuyến bất kỳ lúc nào để theo dõi chi tiết phản hồi từ nhà tuyển dụng.
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 32px;">
                          <div style="border-top: 1px solid #e5e7eb;"></div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 24px 32px 32px 32px; font-size: 11px; color: #6b7280; line-height: 1.6; text-align: center;">
                          <p style="margin: 0 0 4px 0; font-weight: 700; color: #374151;">Hệ Thống Tuyển Dụng Thông Minh HireMate AI</p>
                          <p style="margin: 0;">Thông báo tự động &bull; FPT University SWP391 Project</p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """,
            subject,
            badgeBgColor,
            badgeTextColor,
            badgeText,
            mainHeadline,
            safeName,
            mainMessage,
            safeJob,
            safeCompany,
            notesHtml,
            extraTipHtml,
            appLink
        );

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendCustomEmail(String toEmail, String candidateName, String subject, String bodyHtml) {
        if (toEmail == null || toEmail.isBlank()) return;
        String emailSubject = (subject != null && !subject.isBlank()) ? subject : "[HireMate AI] Thông Báo Tuyển Dụng";
        String content = bodyHtml != null ? bodyHtml.replace("\n", "<br/>") : "";
        String html = String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin:0;padding:36px 16px;background-color:#f4f3fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e1b4b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e9e5ff;box-shadow:0 10px 25px rgba(30, 27, 75, 0.07);">
                <tr>
                  <td style="padding:32px 28px;background:linear-gradient(135deg,#1e1b4b 0%%,#312e81 100%%);color:#ffffff;text-align:center;">
                    <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;">HireMate<span style="color:#a78bfa;">.AI</span></div>
                    <div style="font-size:11px;font-weight:700;color:#c4b5fd;text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;">THÔNG BÁO TUYỂN DỤNG DOANH NGHIỆP</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 32px;">
                    <p style="font-size:15px;margin:0 0 18px 0;">Kính gửi <strong>%s</strong>,</p>
                    <div style="font-size:14px;line-height:1.7;color:#374151;">
                      %s
                    </div>
                    <div style="margin-top:30px;font-size:13px;color:#374151;line-height:1.6;">
                      Trân trọng,<br>
                      <strong style="color:#1e1b4b;">Ban Tuyển Dụng &amp; Đội Ngũ Nhân Sự</strong>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px;background-color:#f8f7ff;border-top:1px solid #e9e5ff;text-align:center;font-size:11px;color:#6b7280;">
                    Thư điện tử được gửi từ đối tác tuyển dụng qua nền tảng <strong>HireMate AI</strong>.
                  </td>
                </tr>
              </table>
            </body>
            </html>
        """, emailSubject, candidateName != null ? candidateName : "Quý ứng viên", content);

        sendHtmlEmail(toEmail, emailSubject, html);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        if (systemSettingsService != null && systemSettingsService.getSettings() != null) {
            Boolean autoEmail = systemSettingsService.getSettings().getAutoEmailNotify();
            if (Boolean.FALSE.equals(autoEmail)) {
                log.info(">> [EmailService] Bỏ qua gửi email đến {} do cấu hình autoEmailNotify đang TẮT trong Quản Trị Hệ Thống.", toEmail);
                return;
            }
        }

        if (mailSender == null) {
            log.warn(">> [EmailService] JavaMailSender bean chưa được khởi tạo. Không thể gửi email đến: {}", toEmail);
            return;
        }

        if (mailPassword == null || mailPassword.isBlank()) {
            log.warn(">> [EmailService] CẢNH BÁO: Chưa cấu hình SPRING_MAIL_PASSWORD trong application.yml hoặc biến môi trường.");
            return;
        }

        String safeSubject = (subject != null && !subject.isBlank()) ? subject : "[HireMate AI] Mã Xác Thực Bảo Mật";

        // Tự động kiểm tra và đồng bộ App Password Gmail hợp lệ
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl mailSenderImpl) {
            String curPass = mailSenderImpl.getPassword();
            if (curPass != null && (curPass.equals("Hoangdung1122") || curPass.length() != 16)) {
                mailSenderImpl.setPassword("fkrekdovjjglxnzm");
            }
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Single-part HTML email (multipart = false) triệt tiêu hoàn toàn lỗi MIME boundary và quoted-printable rác
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(fromEmail, "HireMate AI Platform", StandardCharsets.UTF_8.name()));
            helper.setReplyTo(new InternetAddress("support@hiremate.vn", "HireMate AI Support", StandardCharsets.UTF_8.name()));
            helper.setTo(toEmail);
            helper.setSubject(safeSubject);
            helper.setText(htmlContent, true);

            message.setHeader("X-Priority", "1");
            message.setHeader("X-MSMail-Priority", "High");
            message.setHeader("Importance", "High");
            message.setHeader("X-Mailer", "HireMate AI Enterprise Mailer 2.0");

            mailSender.send(message);
            log.info(">> [EmailService] ĐÃ GỬI THÀNH CÔNG email thực tế đến: {} [Tiêu đề: {}]", toEmail, safeSubject);
        } catch (jakarta.mail.AuthenticationFailedException authEx) {
            log.warn(">> [EmailService] Gmail SMTP xác thực thất bại. Tự động chuyển đổi sang App Password dự phòng...");
            if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl mailSenderImpl) {
                try {
                    mailSenderImpl.setPassword("fkrekdovjjglxnzm");
                    MimeMessage retryMsg = mailSender.createMimeMessage();
                    MimeMessageHelper retryHelper = new MimeMessageHelper(retryMsg, false, StandardCharsets.UTF_8.name());
                    retryHelper.setFrom(new InternetAddress(fromEmail, "HireMate AI Platform", StandardCharsets.UTF_8.name()));
                    retryHelper.setReplyTo(new InternetAddress("support@hiremate.vn", "HireMate AI Support", StandardCharsets.UTF_8.name()));
                    retryHelper.setTo(toEmail);
                    retryHelper.setSubject(safeSubject);
                    retryHelper.setText(htmlContent, true);
                    retryMsg.setHeader("X-Priority", "1");
                    retryMsg.setHeader("Importance", "High");
                    mailSender.send(retryMsg);
                    log.info(">> [EmailService] ĐÃ GỬI THÀNH CÔNG email thực tế đến: {} qua App Password dự phòng! [Tiêu đề: {}]", toEmail, safeSubject);
                    return;
                } catch (Exception retryEx) {
                    log.error(">> [EmailService] Thử lại bằng App Password dự phòng cũng thất bại: {}", retryEx.getMessage());
                }
            }
        } catch (MessagingException e) {
            log.error(">> [EmailService] Lỗi tạo định dạng MIME email: {}", e.getMessage());
        } catch (Exception e) {
            boolean isAuthFail = e instanceof org.springframework.mail.MailAuthenticationException
                    || (e.getCause() != null && e.getCause() instanceof jakarta.mail.AuthenticationFailedException)
                    || (e.getMessage() != null && (e.getMessage().contains("AuthenticationFailedException") || e.getMessage().contains("535") || e.getMessage().contains("534")));
            if (isAuthFail && mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl mailSenderImpl) {
                log.warn(">> [EmailService] Phát hiện lỗi xác thực mail ({}). Tự động dùng App Password dự phòng...", e.getMessage());
                try {
                    mailSenderImpl.setPassword("fkrekdovjjglxnzm");
                    MimeMessage retryMsg = mailSender.createMimeMessage();
                    MimeMessageHelper retryHelper = new MimeMessageHelper(retryMsg, false, StandardCharsets.UTF_8.name());
                    retryHelper.setFrom(new InternetAddress(fromEmail, "HireMate AI Platform", StandardCharsets.UTF_8.name()));
                    retryHelper.setReplyTo(new InternetAddress("support@hiremate.vn", "HireMate AI Support", StandardCharsets.UTF_8.name()));
                    retryHelper.setTo(toEmail);
                    retryHelper.setSubject(safeSubject);
                    retryHelper.setText(htmlContent, true);
                    retryMsg.setHeader("X-Priority", "1");
                    retryMsg.setHeader("Importance", "High");
                    mailSender.send(retryMsg);
                    log.info(">> [EmailService] ĐÃ GỬI THÀNH CÔNG email thực tế đến: {} qua App Password dự phòng!", toEmail);
                    return;
                } catch (Exception retryEx) {
                    log.error(">> [EmailService] Thử lại bằng App Password dự phòng thất bại: {}", retryEx.getMessage());
                }
            }
            log.error(">> [EmailService] Gửi email thất bại đến {}: {}", toEmail, e.getMessage());
        }
    }
}
