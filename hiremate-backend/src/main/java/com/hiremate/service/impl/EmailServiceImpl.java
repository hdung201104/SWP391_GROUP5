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

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendBaseUrl;

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
                badgeBgColor = "#E8F5E9";
                badgeTextColor = "#1B5E20";
                mainHeadline = "Chúc mừng! Bạn đã nhận được lời mời phỏng vấn";
                mainMessage = String.format("Nhà tuyển dụng từ <strong>%s</strong> đã đánh giá hồ sơ và trân trọng mời bạn tham gia vòng phỏng vấn cho vị trí <strong>%s</strong>.", safeCompany, safeJob);
                extraTipHtml = """
                    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
                        🎯 <strong>Gợi ý từ HireMate AI:</strong> Bạn có thể sử dụng tính năng <em>AI Mock Interview</em> trên hệ thống để luyện tập trả lời câu hỏi và nhận phân tích tốc độ nói, độ rõ ràng trước buổi phỏng vấn thực tế!
                      </p>
                    </div>
                    """;
            }
            case OFFERED -> {
                subject = String.format("[HireMate AI] Chúc Mừng Nhận Offer: %s tại %s", safeJob, safeCompany);
                badgeText = "LỜI MỜI NHẬN VIỆC (OFFER)";
                badgeBgColor = "#FEF3C7";
                badgeTextColor = "#92400E";
                mainHeadline = "Chúc mừng! Bạn đã nhận được Đề nghị nhận việc";
                mainMessage = String.format("Xin chúc mừng bạn! <strong>%s</strong> đã quyết định gửi đề nghị nhận việc (Job Offer) cho vị trí <strong>%s</strong> đến bạn.", safeCompany, safeJob);
                extraTipHtml = """
                    <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #92400E; line-height: 1.5;">
                        🎉 Đây là thành quả xứng đáng cho năng lực của bạn! Vui lòng đăng nhập vào HireMate AI hoặc kiểm tra thông tin liên lạc để hoàn tất các thủ tục tiếp theo.
                      </p>
                    </div>
                    """;
            }
            case HIRED -> {
                subject = String.format("[HireMate AI] Chúc Mừng Gia Nhập Đội Ngũ: %s tại %s", safeJob, safeCompany);
                badgeText = "CHÍNH THỨC TRÚNG TUYỂN";
                badgeBgColor = "#ECFDF5";
                badgeTextColor = "#065F46";
                mainHeadline = "Chào mừng bạn gia nhập đội ngũ!";
                mainMessage = String.format("Bạn đã chính thức hoàn tất quá trình tuyển dụng và được tiếp nhận vào vị trí <strong>%s</strong> tại <strong>%s</strong>.", safeJob, safeCompany);
                extraTipHtml = "";
            }
            case SHORTLISTED, SCREENING -> {
                subject = String.format("[HireMate AI] Hồ Sơ Đang Được Xét Duyệt: %s", safeJob);
                badgeText = "HỒ SƠ ĐÃ VÀO VÒNG XEM XÉT";
                badgeBgColor = "#EFF6FF";
                badgeTextColor = "#1E40AF";
                mainHeadline = "Hồ sơ của bạn đã được đưa vào danh sách rút gọn";
                mainMessage = String.format("Hồ sơ ứng tuyển của bạn cho vị trí <strong>%s</strong> tại <strong>%s</strong> đã vượt qua bước lọc ban đầu và đang được nhà tuyển dụng xem xét chi tiết.", safeJob, safeCompany);
                extraTipHtml = "";
            }
            case REJECTED -> {
                subject = String.format("[HireMate AI] Thông Báo Kết Quả Tuyển Dụng: %s tại %s", safeJob, safeCompany);
                badgeText = "KẾT QUẢ TUYỂN DỤNG";
                badgeBgColor = "#F3F4F6";
                badgeTextColor = "#374151";
                mainHeadline = "Cập nhật về hồ sơ ứng tuyển của bạn";
                mainMessage = String.format("Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí <strong>%s</strong> tại <strong>%s</strong>. Sau khi cân nhắc kỹ lưỡng, nhà tuyển dụng rất tiếc chưa thể đồng hành cùng bạn cho vị trí <strong>%s</strong> ở thời điểm hiện tại.", safeJob, safeCompany, safeJob);
                extraTipHtml = """
                    <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #4B5563; line-height: 1.5;">
                        💪 Đừng nản lòng! Hồ sơ của bạn vẫn được lưu trên HireMate AI. Hãy tiếp tục nâng cấp kỹ năng qua AI Interview và khám phá hàng trăm cơ hội việc làm khác phù hợp với bạn.
                      </p>
                    </div>
                    """;
            }
            default -> {
                subject = String.format("[HireMate AI] Cập Nhật Trạng Thái Hồ Sơ: %s", safeJob);
                badgeText = "CẬP NHẬT TRẠNG THÁI";
                badgeBgColor = "#F4F4F5";
                badgeTextColor = "#27272A";
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
                <div style="background-color: #F9F8F4; border-left: 4px solid #C27B66; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
                  <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #8C9A84; margin-bottom: 6px;">
                    LỜI NHẮN TỪ NHÀ TUYỂN DỤNG
                  </span>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2D3A31;">%s</p>
                </div>
                """, sanitizedNotes);
        }

        String appLink = (frontendBaseUrl != null ? frontendBaseUrl.replaceAll("/+$", "") : "http://localhost:5173") + "/#/applications";

        String htmlContent = String.format("""
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
                          <!-- Status Badge -->
                          <div style="margin-bottom: 20px;">
                            <span style="display: inline-block; background-color: %s; color: %s; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 9999px;">
                              %s
                            </span>
                          </div>

                          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #2D3A31; line-height: 1.4;">
                            %s
                          </h2>

                          <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #556057;">
                            Xin chào <strong>%s</strong>,
                          </p>

                          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #556057;">
                            %s
                          </p>

                          <!-- Job & Company Card -->
                          <div style="background-color: #F9F8F4; border: 1px solid #E6E2DA; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
                            <div style="font-size: 12px; color: #8C9A84; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Thông tin vị trí</div>
                            <div style="font-size: 16px; font-weight: 700; color: #2D3A31; margin-bottom: 4px;">%s</div>
                            <div style="font-size: 14px; color: #C27B66; font-weight: 600;">Công ty: %s</div>
                          </div>

                          %s
                          %s

                          <!-- Call to Action Button -->
                          <div style="text-align: center; margin: 32px 0 16px 0;">
                            <a href="%s" style="display: inline-block; background-color: #2D3A31; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 2px 8px rgba(45, 58, 49, 0.15);">
                              Xem Chi Tiết Ứng Tuyển
                            </a>
                          </div>

                          <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #7F8A80; text-align: center;">
                            Bạn có thể truy cập hồ sơ trực tuyến bất kỳ lúc nào để theo dõi tiến trình tuyển dụng.
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
                          Thông báo tự động từ hệ thống quản lý tuyển dụng HireMate AI.
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
