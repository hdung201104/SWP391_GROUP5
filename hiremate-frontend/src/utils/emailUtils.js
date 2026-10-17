/**
 * Utility functions for generating professional mailto links between Candidates and HR/Recruiters.
 * Complies with HireMate AI specifications:
 * Subject: [HireMate AI] Liên hệ ứng tuyển vị trí: {Tên_Công_Việc} - Ứng viên: {Tên_Ứng_Viên}
 */

/**
 * Generate mailto link for Candidate contacting HR
 */
export function createCandidateToHrMailto({
  hrEmail,
  hrName,
  companyName,
  jobTitle,
  candidateName,
  candidateEmail,
  candidatePhone,
}) {
  const to = hrEmail || 'tuyendung@fpt.com';
  const cleanJob = jobTitle || 'Vị trí Tuyển dụng';
  const cleanCandidate = candidateName || 'Ứng viên';
  const cleanHr = hrName || 'Bộ phận Tuyển dụng';
  const cleanCompany = companyName || 'Doanh nghiệp';

  const subject = `[HireMate AI] Liên hệ ứng tuyển vị trí: ${cleanJob} - Ứng viên: ${cleanCandidate}`;

  const body = `Kính gửi Anh/Chị ${cleanHr} - Bộ phận Tuyển dụng công ty ${cleanCompany},

Tôi tên là ${cleanCandidate}. Tôi gửi email này liên quan đến hồ sơ ứng tuyển vị trí "${cleanJob}" tại Quý công ty trên nền tảng HireMate AI.

Tôi rất quan tâm đến cơ hội nghề nghiệp này và mong muốn được kết nối, trao đổi thêm thông tin cùng Anh/Chị và Quý công ty về các bước tiếp theo trong quy trình tuyển dụng.

Thông tin liên hệ của tôi:
- Họ và tên: ${cleanCandidate}
${candidateEmail ? `- Email: ${candidateEmail}\n` : ''}${candidatePhone ? `- Số điện thoại: ${candidatePhone}\n` : ''}
Rất mong sớm nhận được phản hồi từ Anh/Chị.
Tôi xin chân thành cảm ơn!

Trân trọng,
${cleanCandidate}`;

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate mailto link for HR/Recruiter contacting Candidate
 */
export function createHrToCandidateMailto({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
  hrName,
  hrPosition,
}) {
  const to = candidateEmail || 'candidate@gmail.com';
  const cleanJob = jobTitle || 'Vị trí Tuyển dụng';
  const cleanCandidate = candidateName || 'Ứng viên';
  const cleanHr = hrName || 'Bộ phận Tuyển dụng';
  const cleanCompany = companyName || 'HireMate Partner';

  const subject = `[HireMate AI] Liên hệ ứng tuyển vị trí: ${cleanJob} - Ứng viên: ${cleanCandidate}`;

  const body = `Kính gửi Bạn ${cleanCandidate},

Bộ phận Tuyển dụng công ty ${cleanCompany} xin gửi lời chào trân trọng đến bạn.

Chúng tôi đã nhận được và xem xét hồ sơ ứng tuyển của bạn cho vị trí "${cleanJob}" trên hệ thống tuyển dụng HireMate AI.

Chúng tôi gửi email này để kết nối và trao đổi thêm với bạn về quy trình tuyển dụng cũng như các thông tin chi tiết tiếp theo. Bạn vui lòng phản hồi email này để chúng ta có thể thống nhất thời gian trao đổi phù hợp.

Chúc bạn luôn tràn đầy năng lượng và thành công!

Trân trọng,
${cleanHr}${hrPosition ? ` - ${hrPosition}` : ''}
Bộ phận Tuyển dụng & Đánh giá Nhân sự
${cleanCompany}`;

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Trigger default mail client
 */
export function openEmailClient(mailtoUrl) {
  if (!mailtoUrl) return;
  try {
    window.location.href = mailtoUrl;
  } catch (e) {
    window.open(mailtoUrl, '_self');
  }
}
