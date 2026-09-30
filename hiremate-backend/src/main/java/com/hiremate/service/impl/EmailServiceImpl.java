package com.hiremate.service.impl;

import com.hiremate.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:hiremate.ai.fpt@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Override
    public void sendOtpEmail(String toEmail, String otp, String purpose) {
        String subject;
        String purposeText;
        if ("REGISTER".equalsIgnoreCase(purpose)) {
            subject = "[HireMate AI] Mã Xác Nhận Đăng Ký Tài Khoản";
            purposeText = "xác nhận đăng ký tài khoản mới trên nền tảng tuyển dụng thông minh HireMate AI";
        } else if ("CHANGE_PASSWORD".equalsIgnoreCase(purpose)) {
            subject = "[HireMate AI] Mã Xác Thực Cập Nhật Mật Khẩu";
            purposeText = "xác thực yêu cầu cập nhật mật khẩu cho tài khoản HireMate AI của bạn";
        } else {
            subject = "[HireMate AI] Mã Khôi Phục Mật Khẩu";
            purposeText = "khôi phục mật khẩu đăng nhập cho tài khoản của bạn";
        }

        String htmlContent = """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F9F8F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3A31;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="table-layout: fixed;">
                <tr>
                  <td align="center" style="padding: 40px 16px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 580px; background-color: #FFFFFF; border: 1px solid #E6E2DA; border-radius: 24px; box-shadow: 0 4px 20px rgba(45, 58, 49, 0.06); overflow: hidden;">
                      
                      <!-- Header -->
                      <tr>
                        <td align="center" style="background-color: #2D3A31; padding: 32px 24px; color: #FFFFFF;">
                          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                            HireMate<span style="color: #C27B66; font-style: italic;">.AI</span>
                          </h1>
                          <p style="margin: 6px 0 0 0; font-size: 12px; color: #8C9A84; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                            Hệ Thống Tuyển Dụng &amp; Đánh Giá Nhân Tài AI
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding: 36px 32px;">
                          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #2D3A31;">
                            Mã xác nhận bảo mật của bạn
                          </h2>
                          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #556057;">
                            Xin chào, chúng tôi nhận được yêu cầu <strong>%s</strong> từ địa chỉ email này. Vui lòng sử dụng mã xác thực dưới đây để hoàn tất:
                          </p>

                          <!-- OTP Box -->
                          <div style="background-color: #F9F8F4; border: 1px dashed #8C9A84; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #8C9A84; margin-bottom: 8px;">
                              MÃ XÁC THỰC (OTP)
                            </span>
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #2D3A31; font-family: monospace;">
                              %s
                            </span>
                          </div>

                          <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #C27B66; font-weight: 500;">
                            ⏱ Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong> và chỉ sử dụng được 01 lần duy nhất.
                          </p>

                          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #7F8A80;">
                            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Mật khẩu và tài khoản của bạn sẽ không bị ảnh hưởng.
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="padding: 0 32px;">
                          <div style="border-top: 1px solid #E6E2DA;"></div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td align="center" style="padding: 24px 32px 32px 32px; font-size: 11px; color: #8C9A84; line-height: 1.5;">
                          © 2026 HireMate AI Platform &bull; FPT University SWP391 Project<br>
                          Email tự động được gửi từ hệ thống bảo mật HireMate AI Studio.
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(subject, purposeText, otp);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String fullName, String role) {
        String subject = "[HireMate AI] Chào Mừng Bạn Đến Với Nền Tảng Tuyển Dụng AI";
        String htmlContent = """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"><title>%s</title></head>
            <body style="background-color: #F9F8F4; font-family: sans-serif; color: #2D3A31; padding: 24px;">
              <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 20px; border: 1px solid #E6E2DA; padding: 32px;">
                <h2 style="color: #2D3A31;">Chào mừng %s!</h2>
                <p>Tài khoản của bạn với vai trò <strong>%s</strong> đã được kích hoạt thành công trên hệ thống HireMate AI.</p>
                <p>Bạn có thể đăng nhập ngay và trải nghiệm các tính năng tạo CV chuẩn ATS, luyện phỏng vấn AI và kết nối cơ hội việc làm.</p>
                <p style="color: #8C9A84; font-size: 12px;">HireMate AI Team</p>
              </div>
            </body>
            </html>
            """.formatted(subject, fullName, role);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    @Override
    public void sendPasswordChangedNotification(String toEmail) {
        String subject = "[HireMate AI] Thông Báo Mật Khẩu Đã Được Thay Đổi";
        String htmlContent = """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"><title>%s</title></head>
            <body style="background-color: #F9F8F4; font-family: sans-serif; color: #2D3A31; padding: 24px;">
              <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 20px; border: 1px solid #E6E2DA; padding: 32px;">
                <h2 style="color: #2D3A31;">Mật khẩu tài khoản đã thay đổi</h2>
                <p>Chúng tôi gửi thông báo để xác nhận rằng mật khẩu cho tài khoản <strong>%s</strong> vừa được cập nhật thành công.</p>
                <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với quản trị viên để bảo vệ tài khoản.</p>
              </div>
            </body>
            </html>
            """.formatted(subject, toEmail);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        if (mailSender == null) {
            log.warn(">> [EmailService] JavaMailSender bean chưa được khởi tạo. Không thể gửi email đến: {}", toEmail);
            return;
        }

        if (mailPassword == null || mailPassword.isBlank()) {
            log.warn(">> [EmailService] CẢNH BÁO: Chưa cấu hình SPRING_MAIL_PASSWORD trong application.yml hoặc biến môi trường.");
            log.warn(">> [EmailService] Thư xác thực sẽ không thể gửi qua SMTP nếu thiếu mật khẩu ứng dụng Gmail (App Password).");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, "HireMate AI Platform");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info(">> [EmailService] ĐÃ GỬI THÀNH CÔNG email thực tế đến: {}", toEmail);
        } catch (MessagingException e) {
            log.error(">> [EmailService] Lỗi tạo định dạng MIME email: {}", e.getMessage());
        } catch (Exception e) {
            log.error(">> [EmailService] Gửi email thất bại đến {}: {}", toEmail, e.getMessage());
        }
    }
}
