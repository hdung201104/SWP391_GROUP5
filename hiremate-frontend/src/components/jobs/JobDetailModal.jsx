import React, { useState } from 'react';
import { calculateJobDeadline } from '../../utils/jobTimeUtils';

// Helper for brand logos with reliable fallback
const getBrandLogo = (job) => {
  const name = (job?.companyName || job?.company?.companyName || '').toLowerCase();
  if (name.includes('fpt')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo.svg/1200px-FPT_logo.svg.png';
  }
  if (name.includes('vng')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VNG.png';
  }
  if (name.includes('viettel')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Viettel.png';
  }
  return job?.companyLogo || job?.company?.logoUrl || null;
};

// Helper for company initials
const getCompanyInitials = (name) => {
  if (!name) return 'CORP';
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
};

// Title casing helper
const formatJobTitle = (title) => {
  if (!title) return 'Vị Trí Tuyển Dụng';
  return title
    .split(' ')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
};

// Intelligently parse raw text into clean bullet points
const parseCleanBullets = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim().replace(/^[-*•\d+.]\s*/, '') : ''))
      .filter((l) => l.length > 0);
  }
  return String(raw)
    .replaceAll('\\n', '\n')
    .split('\n')
    .map((l) => l.trim().replace(/^[-*•\d+.]\s*/, ''))
    .filter((l) => l.length > 0);
};

// Smart role-based supplements when recruiter inputs are concise
const getRoleTemplate = (title = '') => {
  const lower = title.toLowerCase();
  if (lower.includes('test') || lower.includes('qa') || lower.includes('qc') || lower.includes('kiểm thử')) {
    return {
      descriptions: [
        'Tham gia nghiên cứu, thiết kế và phát triển kế hoạch kiểm thử (Test Plan, Test Strategy) cho các module sản phẩm.',
        'Xây dựng các kịch bản kiểm thử chi tiết (Test Cases, Test Scenarios) bao gồm Functional, Non-functional, UI/UX và API Testing.',
        'Thực hiện kiểm thử tính năng mới, kiểm thử hồi quy (Regression Testing) và xác nhận việc sửa lỗi của đội ngũ lập trình viên.',
        'Sử dụng các công cụ kiểm thử API (Postman / Swagger) và kiểm tra luồng dữ liệu cơ sở dữ liệu (SQL Queries).',
        'Ghi nhận, phân loại mức độ nghiêm trọng và theo dõi tiến độ xử lý lỗi trên hệ thống quản lý (Jira / Redmine / Trello).',
        'Phối hợp nhịp nhàng cùng Product Owner, Tech Lead và Developers theo quy trình Agile/Scrum để đảm bảo chất lượng phát hành.',
      ],
      requirements: [
        'Nắm vững quy trình kiểm thử phần mềm (STLC / SDLC), các kỹ thuật thiết kế Test Case (Equivalence Partitioning, Boundary Value Analysis).',
        'Có kinh nghiệm kiểm thử Web Application, Mobile App và kiểm thử RESTful API bằng Postman.',
        'Khả năng đọc hiểu câu lệnh truy vấn SQL (SELECT, JOIN) để kiểm tra tính toàn vẹn của dữ liệu.',
        'Tư duy logic tốt, cẩn thận, tỉ mỉ và có khả năng phát hiện lỗi giao diện cũng như luồng nghiệp vụ phức tạp.',
        'Ưu tiên ứng viên có kinh nghiệm viết Automation Test (Selenium, Cypress, Playwright) hoặc Performance Test (JMeter).',
        'Khả năng đọc hiểu tài liệu kỹ thuật Tiếng Anh; kỹ năng giao tiếp và làm việc nhóm tích cực.',
      ],
      recommendedSkills: ['Manual Testing', 'API Testing (Postman)', 'Test Case Design', 'Jira / Confluence', 'SQL Basics', 'Automation Testing'],
    };
  }

  if (lower.includes('front') || lower.includes('react') || lower.includes('vue') || lower.includes('angular') || lower.includes('web')) {
    return {
      descriptions: [
        'Phát triển giao diện người dùng web ứng dụng hiện đại, mượt mà và tối ưu hóa trải nghiệm người dùng (UX).',
        'Tích hợp RESTful API / GraphQL với hệ thống backend, quản lý state ứng dụng hiệu quả.',
        'Tối ưu hóa hiệu năng tải trang (Web Vitals), đảm bảo hiển thị hoàn hảo trên mọi kích thước màn hình (Responsive Design).',
        'Xây dựng các component UI tái sử dụng cao theo phong cách Design System chuẩn hóa.',
      ],
      requirements: [
        'Thành thạo JavaScript (ES6+), TypeScript, HTML5 và CSS3/SCSS.',
        'Kinh nghiệm thực chiến với các Framework hiện đại (React.js / Next.js / Vue.js).',
        'Hiểu biết sâu sắc về Responsive Web Design, Flexbox, CSS Grid và tối ưu hóa trình duyệt.',
        'Kinh nghiệm làm việc với Git, RESTful API và quản lý trạng thái (Redux / Zustand).',
      ],
      recommendedSkills: ['React.js', 'TypeScript', 'TailwindCSS', 'RESTful API', 'Git'],
    };
  }

  if (lower.includes('devops') || lower.includes('cloud') || lower.includes('sysadmin') || lower.includes('sre')) {
    return {
      descriptions: [
        'Thiết kế, xây dựng và tự động hóa hệ thống CI/CD pipelines cho các dự án phần mềm.',
        'Quản trị, vận hành và tối ưu hóa hạ tầng điện toán đám mây (AWS / GCP / Azure).',
        'Thiết lập hệ thống giám sát, cảnh báo tự động (Prometheus, Grafana, ELK Stack) bảo đảm 99.9% Uptime.',
        'Quản trị và điều phối các cụm Docker containers với Kubernetes (K8s).',
      ],
      requirements: [
        'Thành thạo hệ điều hành Linux và shell scripting (Bash / Python).',
        'Kinh nghiệm với Docker containerization và Kubernetes orchestration.',
        'Kinh nghiệm triển khai CI/CD (GitLab CI, GitHub Actions, Jenkins).',
        'Hiểu biết về bảo mật hệ thống, mạng máy tính (TCP/IP, DNS, SSL/TLS, VPN).',
      ],
      recommendedSkills: ['Docker', 'Kubernetes', 'CI/CD Pipelines', 'AWS / Cloud', 'Linux'],
    };
  }

  if (lower.includes('intern') || lower.includes('backend')) {
    return {
      descriptions: [
        'Intern backend',
        'Thiết kế, xây dựng các dịch vụ RESTful API và module chịu tải lớn, đảm bảo tính sẵn sàng cao (High Availability).',
        'Tối ưu hóa cơ sở dữ liệu quan hệ và phân tán, thiết lập giải pháp bộ nhớ đệm và xử lý luồng nghiệp vụ mượt mà.',
        'Phối hợp chặt chẽ cùng Technical Lead, Solution Architect và Product Owner trong mô hình phát triển Agile/Scrum.',
        'Thực hiện Code Review, viết Unit Test & Integration Test, bảo đảm chất lượng mã nguồn.',
      ],
      requirements: [
        'Java 21',
        'Spring Boot 3',
        'PostgreSQL',
        'Có kinh nghiệm thực tập hoặc dự án liên quan là một lợi thế.',
      ],
      recommendedSkills: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'Microservices'],
    };
  }

  // Mặc định công nghệ phần mềm
  return {
    descriptions: [
      `Tham gia nghiên cứu, thiết kế kiến trúc và phát triển hệ sinh thái phần mềm ${formatJobTitle(title)} hiệu năng cao.`,
      'Thiết kế, xây dựng các dịch vụ RESTful API và module chịu tải lớn, đảm bảo tính sẵn sàng cao (High Availability).',
      'Tối ưu hóa cơ sở dữ liệu quan hệ và phân tán, thiết lập giải pháp bộ nhớ đệm và xử lý luồng nghiệp vụ mượt mà.',
      'Phối hợp chặt chẽ cùng Technical Lead, Solution Architect và Product Owner trong mô hình phát triển Agile/Scrum.',
      'Thực hiện Code Review, viết Unit Test & Integration Test, bảo đảm chất lượng mã nguồn.',
    ],
    requirements: [
      'Nắm vững kiến thức chuyên sâu về cấu trúc dữ liệu, giải thuật, lập trình hướng đối tượng (OOP) và Design Patterns.',
      'Thành thạo thiết kế cơ sở dữ liệu quan hệ (PostgreSQL / MySQL), nắm vững cơ chế Indexing và truy vấn tối ưu.',
      'Có kinh nghiệm làm việc với RESTful API, Docker containerization và quản lý mã nguồn Git.',
      'Khả năng đọc hiểu tài liệu chuyên ngành Tiếng Anh tốt; tư duy giải quyết vấn đề logic, chủ động.',
    ],
    recommendedSkills: ['RESTful API', 'PostgreSQL', 'Docker', 'Git', 'Agile/Scrum'],
  };
};

export default function JobDetailModal({ job, onClose, onApply, onViewCompanyProfile }) {
  if (!job) return null;

  const [activeTab, setActiveTab] = useState('ALL');
  const [logoError, setLogoError] = useState(false);

  // Format salary
  const formatSalary = (min, max) => {
    if (job.salaryText) return job.salaryText;
    if (job.salary) return job.salary;
    const minNum = Number(min);
    const maxNum = Number(max);

    if (minNum >= 1000000 && maxNum >= 1000000) {
      const minMil = minNum / 1000000;
      const maxMil = maxNum / 1000000;
      const minStr = Number.isInteger(minMil) ? minMil : minMil.toFixed(0);
      const maxStr = Number.isInteger(maxMil) ? maxMil : maxMil.toFixed(0);
      return `${minStr} – ${maxStr} triệu VNĐ`;
    }
    if (minNum >= 1000000 && !max) {
      const minMil = minNum / 1000000;
      return `Từ ${Number.isInteger(minMil) ? minMil : minMil.toFixed(0)} triệu VNĐ`;
    }
    if (!min && maxNum >= 1000000) {
      const maxMil = maxNum / 1000000;
      return `Lên tới ${Number.isInteger(maxMil) ? maxMil : maxMil.toFixed(0)} triệu VNĐ`;
    }
    if (minNum && maxNum) {
      return `$${minNum.toLocaleString()} – $${maxNum.toLocaleString()} USD`;
    }
    return 'Lương thỏa thuận';
  };

  // Extract skills breakdown (70% Mandatory / 30% Preferred)
  const template = getRoleTemplate(job.title || '');

  const getSkillsBreakdown = () => {
    let mand = [];
    let pref = [];

    if (Array.isArray(job.mandatorySkills) && job.mandatorySkills.length > 0) {
      mand = job.mandatorySkills.filter(Boolean);
    }
    if (Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0) {
      pref = job.preferredSkills.filter(Boolean);
    }

    // Nếu chưa phân tách, xem mảng skills chung
    if (mand.length === 0 && pref.length === 0) {
      const allSkills = Array.isArray(job.skills) && job.skills.length > 0
        ? job.skills
        : (typeof job.requirements === 'string' && job.requirements.includes(','))
        ? job.requirements.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      if (allSkills.length > 0) {
        // Tách 70% mandatory, 30% preferred
        const splitIdx = Math.max(1, Math.ceil(allSkills.length * 0.7));
        mand = allSkills.slice(0, splitIdx);
        pref = allSkills.slice(splitIdx);
      } else {
        mand = template.recommendedSkills.slice(0, 3);
        pref = template.recommendedSkills.slice(3);
      }
    }

    // Nếu người dùng nhập quá ít kỹ năng ưu tiên, bổ sung gợi ý phù hợp theo chức danh
    if (pref.length === 0 && mand.length > 0) {
      const extra = template.recommendedSkills.filter(
        (s) => !mand.some((m) => m.toLowerCase().includes(s.toLowerCase()))
      );
      pref = extra.slice(0, 3);
    }

    return { mandatory: mand, preferred: pref };
  };

  const { mandatory: mandatorySkills, preferred: preferredSkills } = getSkillsBreakdown();

  // Bóc tách mô tả công việc (LUÔN giữ nguyên dữ liệu người dùng nhập)
  const getDescriptionBullets = () => {
    const userBullets = parseCleanBullets(job.description);
    if (userBullets.length >= 2) {
      return userBullets;
    }
    if (userBullets.length === 1) {
      // Giữ nguyên câu người dùng đã nhập làm bullet 1, bổ sung trách nhiệm chuẩn cho vị trí
      const supplemental = template.descriptions.filter(
        (d) => !d.toLowerCase().includes(userBullets[0].toLowerCase())
      );
      return [userBullets[0], ...supplemental.slice(0, 4)];
    }
    return template.descriptions;
  };

  // Bóc tách yêu cầu công việc (LUÔN giữ nguyên dữ liệu người dùng nhập)
  const getRequirementBullets = () => {
    const userBullets = parseCleanBullets(job.requirements);
    if (userBullets.length >= 2) {
      return userBullets;
    }
    if (userBullets.length === 1) {
      // Giữ nguyên yêu cầu người dùng nhập ở vị trí đầu tiên
      const supplemental = template.requirements.filter(
        (r) => !r.toLowerCase().includes(userBullets[0].toLowerCase())
      );
      return [userBullets[0], ...supplemental.slice(0, 4)];
    }
    return template.requirements;
  };

  const descriptionBullets = getDescriptionBullets();
  const requirementBullets = getRequirementBullets();

  // Bóc tách quyền lợi từ dữ liệu DB
  const getBenefitsBullets = () => {
    const userBullets = parseCleanBullets(job.benefits);
    if (userBullets.length > 0) {
      return userBullets;
    }
    return [
      `Thu nhập cạnh tranh: ${formatSalary(job.salaryMin, job.salaryMax)} kèm lương tháng 13 và thưởng hiệu quả dự án hàng năm.`,
      'Gói bảo hiểm sức khỏe VIP toàn diện (BHXH, BHYT theo luật và bảo hiểm chăm sóc sức khỏe định kỳ).',
      'Cung cấp thiết bị làm việc hiện đại cấu hình cao (Macbook / Laptop chuyên dụng) và màn hình phụ.',
      'Chế độ làm việc linh hoạt (Hybrid / WFH), 15 ngày phép năm hưởng nguyên lương.',
      'Tài trợ kinh phí thi các chứng chỉ quốc tế chuyên môn và ngân sách đào tạo nâng cao kỹ năng.',
      'Môi trường làm việc năng động, văn phòng hạng A với Pantry trà, cà phê máy và bánh kẹo miễn phí mỗi ngày.',
    ];
  };

  const benefitBullets = getBenefitsBullets();

  const handleOpenCompanyProfile = () => {
    if (onViewCompanyProfile) {
      onViewCompanyProfile(job);
    } else {
      window.location.hash = `#/company-profile?id=${job.companyId || job.company?.companyId || ''}`;
    }
  };

  const handleStartPracticeInterview = () => {
    onClose();
    window.location.hash = `#/ai-interview?jobId=${job.jobId || job.id || ''}`;
  };

  const logoUrl = getBrandLogo(job);
  const companyName = job.companyName || job.company?.companyName || 'Doanh Nghiệp Tuyển Dụng';
  const companyInitials = getCompanyInitials(companyName);
  const companyAddress = job.company?.address || job.location || 'Đà Nẵng & Hà Nội (Hybrid)';
  const jobCode = job.code || `JD-${job.companyShort || 'IT'}-${job.jobId || Math.floor(1000 + Math.random() * 9000)}`;
  
  // Tính toán thời hạn tuyển dụng và tình trạng hết hạn
  const deadlineInfo = calculateJobDeadline(job.deadlineDate || job.deadline);

  const aiMatchScore =
    job.aiMatchScore != null
      ? job.aiMatchScore
      : job.matchingScore != null
      ? Math.round(job.matchingScore)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-[#0f0c20]/65 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col text-[#221d47] animate-scale-up border border-purple-100">

        {/* TOP ACCENT LINE (Mindskills Signature Gradient) */}
        <div className={`h-1.5 w-full ${deadlineInfo.isExpired ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500' : 'bg-gradient-to-r from-[#221d47] via-[#5b48bd] to-[#7c3aed]'}`} />

        {/* ACTION BUTTONS: OPEN FULL-PAGE & CLOSE */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
          <button
            onClick={() => {
              onClose();
              window.location.hash = `#/jobs/${job.jobId || job.id || 101}`;
            }}
            aria-label="Mở trang bài đăng chi tiết đầy đủ"
            title="Mở giao diện chi tiết chuẩn (Full Page)"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-[#5b48bd] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
          </button>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#221d47] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* MODAL HEADER: Clean, Bright & On-Brand */}
        <div className="px-6 sm:px-8 pt-6 pb-5 bg-gradient-to-r from-purple-50/70 via-indigo-50/30 to-white border-b border-purple-100 shrink-0 pr-26">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Company Avatar with Error Fallback */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white border border-purple-200/80 flex items-center justify-center font-black text-xl text-[#5b48bd] shrink-0 shadow-sm overflow-hidden p-2">
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span>{companyInitials}</span>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#5b48bd] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
                  {job.domain || job.company?.industry || 'Công Nghệ Thông Tin'}
                </span>

                {/* DEADLINE STATUS BADGE IN HEADER */}
                {deadlineInfo.isExpired ? (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-3 py-0.5 rounded-full border border-rose-300 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>ĐÃ HẾT HẠN ỨNG TUYỂN</span>
                  </span>
                ) : deadlineInfo.isExpiringSoon ? (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-2xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>⏰ SẮP HẾT HẠN ({deadlineInfo.label})</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đang Mở Tuyển Dụng ({deadlineInfo.label})</span>
                  </span>
                )}

                <span className="text-[11px] text-slate-400 font-mono">
                  #{jobCode}
                </span>

                {aiMatchScore != null && (
                  <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300 text-[#5b48bd] font-black text-xs shadow-2xs">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">auto_awesome</span>
                    <span>Match AI: {aiMatchScore}%</span>
                  </div>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#221d47] leading-tight">
                {formatJobTitle(job.title)}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                <button
                  type="button"
                  onClick={handleOpenCompanyProfile}
                  className="font-bold text-[#5b48bd] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{companyName}</span>
                  <span className="material-symbols-outlined text-emerald-600 text-[15px]" title="Doanh nghiệp xác thực">verified</span>
                </button>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                  Đăng {job.postedTime || '14/10/2026'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">group</span>
                  {job.vacanciesCount ? `Chỉ tiêu: ${job.vacanciesCount} người` : 'Chỉ tiêu: 1 người'}
                </span>
                {job.recruiterName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-purple-700 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      HR: {job.recruiterName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-5 scrollbar-thin">

          {/* ======================================================== */}
          {/* PROMINENT EXPIRATION & DEADLINE ALERT BANNER            */}
          {/* ======================================================== */}
          {deadlineInfo.isExpired ? (
            <div className="flex items-start sm:items-center justify-between p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs shadow-sm gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-rose-600 text-xl font-bold">event_busy</span>
                </div>
                <div>
                  <div className="font-extrabold text-rose-800 text-sm flex items-center gap-1.5">
                    <span>HẠN NỘP HỒ SƠ ĐÃ KẾT THÚC</span>
                    <span className="text-[11px] font-normal text-rose-600">({deadlineInfo.label})</span>
                  </div>
                  <p className="text-rose-700 mt-0.5">
                    Tin tuyển dụng đã chính thức ngừng nhận hồ sơ mới từ ngày <strong>{deadlineInfo.formattedDate}</strong>. Hệ thống đã khóa chức năng nộp hồ sơ trực tuyến cho vị trí này.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] shrink-0 whitespace-nowrap shadow-xs">
                Đã Đóng Tuyển Dụng
              </span>
            </div>
          ) : deadlineInfo.isExpiringSoon ? (
            <div className="flex items-start sm:items-center justify-between p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs shadow-sm gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-xl font-bold animate-bounce">alarm</span>
                </div>
                <div>
                  <div className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                    <span>⏰ SẮP HẾT HẠN NỘP HỒ SƠ</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px]">
                      {deadlineInfo.label}
                    </span>
                  </div>
                  <p className="text-amber-800 mt-0.5">
                    Thời hạn nhận CV chỉ còn đến hết ngày <strong>{deadlineInfo.formattedDate}</strong>. Ứng viên quan tâm vui lòng gửi hồ sơ sớm để được thẩm định và ưu tiên lịch phỏng vấn!
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-extrabold text-[11px] shrink-0 whitespace-nowrap shadow-xs animate-pulse">
                Sắp Đóng Đơn
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/80 border border-purple-200 text-[#221d47] text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#5b48bd] text-lg">event_available</span>
                <span>
                  Thời hạn tiếp nhận hồ sơ: Còn <strong>{deadlineInfo.daysLeft} ngày</strong> (Hạn chót: <strong>{deadlineInfo.formattedDate}</strong>).
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đang Mở Nhận CV
              </span>
            </div>
          )}

          {/* KEY METRICS BAR: 4 Structured Metrics */}
          <div className="bg-[#f8f7ff] rounded-2xl p-4 sm:p-5 border border-purple-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-purple-100">
              {/* Mức Thu Nhập */}
              <div className="pt-2 md:pt-0 md:px-3 first:pl-0 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-emerald-600">payments</span>
                  <span>Mức Thu Nhập</span>
                </div>
                <div className="text-sm sm:text-base font-extrabold text-[#f97316] leading-tight">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </div>
                <p className="text-[11px] text-slate-500">Gross/Net + Thưởng dự án</p>
              </div>

              {/* Địa Điểm */}
              <div className="pt-2 md:pt-0 md:px-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">location_on</span>
                  <span>Địa Điểm</span>
                </div>
                <div className="text-sm font-bold text-[#221d47] leading-tight truncate">
                  {job.location || 'Đà Nẵng & Remote'}
                </div>
                <p className="text-[11px] text-slate-500">Linh hoạt Hybrid / WFH</p>
              </div>

              {/* Hình Thức */}
              <div className="pt-2 md:pt-0 md:px-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">work</span>
                  <span>Hình Thức</span>
                </div>
                <div className="text-sm font-bold text-[#221d47] leading-tight">
                  {job.employmentType === 'FULL_TIME'
                    ? 'Toàn thời gian (Full-time)'
                    : job.employmentType === 'INTERNSHIP'
                    ? 'Thực tập sinh (Internship)'
                    : job.employmentType || 'Toàn thời gian'}
                </div>
                <p className="text-[11px] text-slate-500">Cấp bậc: Chuyên viên / Intern</p>
              </div>

              {/* Hạn Nộp Hồ Sơ */}
              <div className="pt-2 md:pt-0 md:px-3 last:pr-0 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className={`material-symbols-outlined text-sm ${deadlineInfo.isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                    {deadlineInfo.isExpired ? 'event_busy' : 'event_available'}
                  </span>
                  <span>Hạn Nộp Hồ Sơ</span>
                </div>
                <div className={`text-sm sm:text-base font-extrabold leading-tight ${deadlineInfo.isExpired ? 'text-rose-600' : 'text-[#221d47]'}`}>
                  {deadlineInfo.formattedDate}
                </div>
                <p className={`text-[11px] font-bold ${deadlineInfo.isExpired ? 'text-rose-600' : deadlineInfo.isExpiringSoon ? 'text-amber-700 font-extrabold' : 'text-emerald-700'}`}>
                  {deadlineInfo.isExpired ? 'Đã hết hạn tiếp nhận' : deadlineInfo.label}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SKILLS CHIPS (CHUẨN 70% BẮT BUỘC / 30% ƯU TIÊN)          */}
          {/* ======================================================== */}
          <div className="p-4 rounded-2xl bg-[#faf9ff] border border-purple-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#221d47] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5b48bd] text-base">psychology</span>
                Tiêu Chuẩn Kỹ Năng &amp; Trọng Số So Khớp AI HireMate
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Thuật toán 70% Bắt buộc + 30% Ưu tiên
              </span>
            </div>

            {/* Kỹ Năng Bắt Buộc (70%) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#5b48bd] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5b48bd]" />
                <span>Kỹ Năng Bắt Buộc (70% Trọng Số):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mandatorySkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-[#5b48bd] border border-purple-200 shadow-2xs flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Kỹ Năng Ưu Tiên (30%) */}
            {preferredSkills.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Kỹ Năng Ưu Tiên / Điểm Cộng (30% Trọng Số):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {preferredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50/70 text-indigo-800 border border-indigo-200/80 shadow-2xs flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px] text-indigo-600">star</span>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* UNDERLINE NAVIGATION TABS */}
          <div className="border-b border-purple-100 flex items-center gap-6 text-xs font-bold pt-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: 'Tất Cả Thông Tin' },
              { id: 'JD', label: 'Mô Tả Công Việc' },
              { id: 'REQUIREMENTS', label: 'Yêu Cầu Tuyển Dụng' },
              { id: 'BENEFITS', label: 'Quyền Lợi & Đãi Ngộ' },
              { id: 'PROCESS', label: 'Quy Trình Tuyển Dụng' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#5b48bd] text-[#5b48bd] font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* JOB CONTENT (Clean editorial list, no clunky checkboxes) */}
          <div className="space-y-6 text-slate-700 text-xs sm:text-[13px] leading-relaxed">

            {/* MÔ TẢ CÔNG VIỆC */}
            {(activeTab === 'ALL' || activeTab === 'JD') && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold text-[#221d47] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#5b48bd]">description</span>
                  Trách Nhiệm &amp; Mô Tả Công Việc
                </h3>
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-purple-100">
                  {descriptionBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd] mt-2 shrink-0" />
                      <span className="flex-1 text-slate-800 font-medium leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* YÊU CẦU ỨNG VIÊN */}
            {(activeTab === 'ALL' || activeTab === 'REQUIREMENTS') && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold text-[#221d47] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-amber-600">verified</span>
                  Yêu Cầu Năng Lực &amp; Kinh Nghiệm
                </h3>
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-purple-100">
                  {requirementBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span className="flex-1 text-slate-800 font-medium leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* QUYỀN LỢI & ĐÃI NGỘ */}
            {(activeTab === 'ALL' || activeTab === 'BENEFITS') && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold text-[#221d47] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-600">card_giftcard</span>
                  Quyền Lợi &amp; Chế Độ Đãi Ngộ
                </h3>
                <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-purple-100">
                  {benefitBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <span className="flex-1 text-slate-800 font-medium leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* QUY TRÌNH 4 BƯỚC */}
            {(activeTab === 'ALL' || activeTab === 'PROCESS') && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold text-[#221d47] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#5b48bd]">route</span>
                  Quy Trình Tuyển Dụng (4 Giai Đoạn Chuẩn Hóa)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 text-center space-y-1">
                    <span className="w-6 h-6 mx-auto rounded-full bg-[#5b48bd] text-white text-[11px] font-black flex items-center justify-center">1</span>
                    <div className="font-bold text-[#221d47] text-[12px]">Nộp Hồ Sơ</div>
                    <div className="text-[10px] text-slate-400">AI chấm điểm so khớp</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 text-center space-y-1">
                    <span className="w-6 h-6 mx-auto rounded-full bg-[#5b48bd] text-white text-[11px] font-black flex items-center justify-center">2</span>
                    <div className="font-bold text-[#221d47] text-[12px]">Luyện Phỏng Vấn</div>
                    <div className="text-[10px] text-slate-400">Mock Interview AI Studio</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 text-center space-y-1">
                    <span className="w-6 h-6 mx-auto rounded-full bg-[#5b48bd] text-white text-[11px] font-black flex items-center justify-center">3</span>
                    <div className="font-bold text-[#221d47] text-[12px]">Phỏng Vấn Trực Tiếp</div>
                    <div className="text-[10px] text-slate-400">Hội đồng Tech Lead &amp; HR</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                    <span className="w-6 h-6 mx-auto rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center">4</span>
                    <div className="font-bold text-emerald-800 text-[12px]">Nhận Offer</div>
                    <div className="text-[10px] text-emerald-600">Gia nhập dự án thực tế</div>
                  </div>
                </div>
              </section>
            )}

            {/* COMPANY STRIP */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#221d47] to-[#3b2b8e] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center font-bold text-[#5b48bd] overflow-hidden">
                  {logoUrl && !logoError ? (
                    <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
                  ) : (
                    <span>{companyInitials}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{companyName}</span>
                    <span className="material-symbols-outlined text-xs text-sky-400">verified</span>
                  </div>
                  <div className="text-xs text-purple-200 flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    <span>{companyAddress}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCompanyProfile}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 border border-white/20 shadow-xs"
              >
                <span>Xem trang công ty</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 sm:px-8 py-3.5 bg-slate-50 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
            <span>Tin tuyển dụng chính thức đã qua thẩm định HireMate AI</span>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleStartPracticeInterview}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#5b48bd] bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span>
              <span>Luyện Phỏng Vấn Với AI</span>
            </button>

            {deadlineInfo.isExpired ? (
              <button
                type="button"
                disabled
                className="px-6 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-100/70 border border-rose-200 cursor-not-allowed flex items-center gap-1.5"
                title="Tin tuyển dụng này đã hết thời hạn nhận hồ sơ"
              >
                <span className="material-symbols-outlined text-sm">event_busy</span>
                <span>Đã Hết Hạn Nộp Hồ Sơ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onApply) onApply(job);
                }}
                className="px-6 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#221d47] to-[#5b48bd] hover:opacity-95 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Ứng tuyển ngay</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
