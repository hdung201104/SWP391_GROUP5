import React, { useState, useEffect, useRef } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { interviewApi } from '../api/interviewApi';

// ============================================================================
// ĐA DẠNG LĨNH VỰC TUYỂN DỤNG & PHỎNG VẤN (KINH TẾ, MARKETING, SALES, HR, IT...)
// ============================================================================
const DOMAINS = [
  {
    id: 'kinh-te',
    icon: 'payments',
    label: 'Kinh tế - Tài chính & Kế toán',
    desc: 'Phân tích tài chính, kế toán kiểm toán, ngân hàng & thẩm định đầu tư',
    color: '#2D3A31',
    tag: 'Tài chính & Kinh tế',
  },
  {
    id: 'marketing',
    icon: 'campaign',
    label: 'Marketing & Truyền thông số',
    desc: 'Digital marketing, SEO, brand, growth, truyền thông & sáng tạo nội dung',
    color: '#C27B66',
    tag: 'Tiếp thị & Truyền thông',
  },
  {
    id: 'sales',
    icon: 'handshake',
    label: 'Kinh doanh & Phát triển thị trường',
    desc: 'B2B enterprise sales, account management, đàm phán thương mại & đối tác',
    color: '#D4A373',
    tag: 'Sales & Bán hàng',
  },
  {
    id: 'hr',
    icon: 'group',
    label: 'Nhân sự & Quản trị nguồn lực (HR)',
    desc: 'Tuyển dụng tài năng TA, C&B đãi ngộ, đào tạo & văn hóa doanh nghiệp',
    color: '#8C9A84',
    tag: 'Nhân sự & Tuyển dụng',
  },
  {
    id: 'van-hanh',
    icon: 'local_shipping',
    label: 'Logistics, Chuỗi cung ứng & Vận hành',
    desc: 'Quản trị chuỗi cung ứng SCM, kho vận, xuất nhập khẩu & TMĐT',
    color: '#588157',
    tag: 'Logistics & Vận hành',
  },
  {
    id: 'quan-tri',
    icon: 'monitoring',
    label: 'Quản trị kinh doanh & Phân tích BA',
    desc: 'Business Analyst, quản lý dự án PMP/Agile & hoạch định chiến lược',
    color: '#3A5A40',
    tag: 'Quản trị & Phân tích',
  },
  {
    id: 'it-software',
    icon: 'terminal',
    label: 'Công nghệ thông tin & Phần mềm',
    desc: 'Backend, Frontend, Fullstack, Cloud DevOps, AI & Data Science',
    color: '#476C5E',
    tag: 'Công nghệ phần mềm',
  },
  {
    id: 'thiet-ke',
    icon: 'draw',
    label: 'Thiết kế & Sáng tạo (UI/UX & Creative)',
    desc: 'UI/UX Product Design, thiết kế thương hiệu & đồ họa truyền thông',
    color: '#B5838D',
    tag: 'Thiết kế & Sáng tạo',
  },
];

const TOPICS_BY_DOMAIN = {
  'kinh-te': [
    'Phân tích Báo cáo Tài chính & Dòng tiền Doanh nghiệp',
    'Quản trị Dòng tiền & Ngân sách Vốn lưu động (Working Capital)',
    'Định giá Doanh nghiệp & Thẩm định Dự án Đầu tư (DCF/NPV/IRR)',
    'Kế toán Quản trị & Kiểm toán Nội bộ Doanh nghiệp',
    'Thẩm định Tín dụng & Quản trị Rủi ro Ngân hàng Thương mại',
    'Xây dựng Mô hình Tài chính (Financial Modeling & Forecasting)',
  ],
  'marketing': [
    'Chiến lược Digital Marketing Đa kênh (Omnichannel Growth)',
    'Tối ưu Hiệu quả Quảng cáo & Chỉ số CAC / LTV / ROAS',
    'Xây dựng Định vị & Quản trị Tài sản Thương hiệu (Brand Equity)',
    'Content Marketing, SEO & Chiến lược Inbound Marketing',
    'Quy trình Xử lý Khủng hoảng Truyền thông (Crisis Management)',
    'Kế hoạch Tung Sản phẩm Mới ra Thị trường (Go-to-Market Strategy)',
  ],
  'sales': [
    'Bán hàng B2B Doanh nghiệp Lớn & Quản lý Phễu Bán hàng (Enterprise Sales)',
    'Nghệ thuật Đàm phán Thương mại & Xử lý Từ chối (Objection Handling)',
    'Key Account Management & Duy trì Khách hàng VIP',
    'Kỹ năng Khảo sát Nhu cầu, Thuyết trình Giải pháp & Demo Pitching',
    'Chiến lược Cold Outreach & Khai phá Khách hàng Tiềm năng Mới',
    'Phát triển Hệ thống Đại lý & Kênh Phân phối Thương mại',
  ],
  'hr': [
    'Chiến lược Thu hút & Săn Đón Nhân tài Cấp cao (Talent Acquisition)',
    'Thiết kế Hệ thống Lương thưởng & Đãi ngộ Toàn diện (C&B 3P Model)',
    'Xử lý Tranh chấp Lao động & Tuân thủ Bộ luật Lao động Việt Nam',
    'Xây dựng Văn hóa Doanh nghiệp & Nâng cao Gắn kết Nhân viên',
    'Chiến lược Đào tạo & Phát triển Năng lực Nhân sự (L&D Strategy)',
    'Xây dựng & Đánh giá Hiệu suất Theo Khung KPI & OKRs',
  ],
  'van-hanh': [
    'Tối ưu Hóa Chuỗi Cung ứng Toàn cầu & Giảm Thiểu Rủi ro Đứt gãy (SCM)',
    'Quản trị Tồn kho Tinh gọn theo Mô hình EOQ, JIT & Safety Stock',
    'Vận hành Kho Bãi & Xử lý Đơn hàng Fulfillment Sàn Thương mại Điện tử',
    'Nghiệp vụ Xuất Nhập khẩu & Logistics Vận tải Quốc tế (Incoterms 2020)',
    'Cải tiến Quy trình Vận hành Doanh nghiệp Tinh gọn (Lean Six Sigma)',
    'Quản trị Quan hệ Nhà cung cấp (Procurement & Vendor Management)',
  ],
  'quan-tri': [
    'Phân tích Nghiệp vụ Doanh nghiệp & Đặc tả Yêu cầu (BA - BRD/SRS)',
    'Quản lý Dự án Theo Phương pháp Agile / Scrum & PMP Chuẩn mực',
    'Nghiên cứu Thị trường & Phân tích Động thái Đối thủ Cạnh tranh',
    'Hoạch định Chiến lược Tái cấu trúc & Mở rộng Quy mô Doanh nghiệp',
    'Chuẩn hóa Quy trình Vận hành Chuẩn (SOP) & Quản trị Rủi ro',
    'Phân tích Dữ liệu Kinh doanh & Xây dựng Dashboard Quản trị (BI/Tableau)',
  ],
  'it-software': [
    'Kiến trúc Vi dịch vụ Microservices & Distributed Systems (Java/Go)',
    'React 18, Next.js & Tối ưu Trải nghiệm Ứng dụng Web Phức tạp',
    'Cloud Native, Docker, Kubernetes & Hạ tầng DevOps CI/CD',
    'Thiết kế Cơ sở Dữ liệu Phân tán & Tối ưu Truy vấn SQL / NoSQL',
    'Bảo mật Ứng dụng Web & Xác thực Phân quyền (OAuth2 / JWT / SSO)',
    'Generative AI, LLM Application Development & Vector Search (RAG)',
  ],
  'thiet-ke': [
    'Quy trình Thiết kế UI/UX Trải nghiệm Sản phẩm theo Design Thinking',
    'Xây dựng & Quản trị Design System Đa nền tảng (Figma Tokens)',
    'Nghiên cứu Người dùng Chuyên sâu (User Research & Usability Testing)',
    'Thiết kế Bộ Nhận diện Thương hiệu & Truyền thông Tiếp thị',
    'Motion Design & Tương tác Vi mô (Micro-interactions for Web/Mobile)',
    'Information Architecture & Tối ưu Phễu Trải nghiệm Người dùng (CRO)',
  ],
};

const LEVELS = [
  { id: 'intern',  label: 'Intern / Fresher', sub: '0-1 năm kinh nghiệm', color: '#8C9A84' },
  { id: 'junior',  label: 'Junior',           sub: '1-2 năm kinh nghiệm', color: '#588157' },
  { id: 'middle',  label: 'Middle',           sub: '2-4 năm kinh nghiệm', color: '#2D3A31' },
  { id: 'senior',  label: 'Senior',           sub: '4-7 năm kinh nghiệm', color: '#C27B66' },
  { id: 'lead',    label: 'Lead / Manager',   sub: '7+ năm kinh nghiệm',  color: '#8C5E58' },
];


// ============================================================================
// HỆ THỐNG GIỌNG ĐỌC AI TỰ NHIÊN (NATURAL NEURAL TTS ENGINE)
// ============================================================================
const getBestVietnameseVoice = (voices, preferredGender = 'female') => {
  if (!voices || voices.length === 0) return null;

  // Lọc các giọng tiếng Việt khả dụng trên máy (vi-VN, vi_VN)
  const viVoices = voices.filter(
    (v) => v.lang && (v.lang.toLowerCase().includes('vi') || v.lang.toLowerCase().replace('_', '-').startsWith('vi-'))
  );

  if (viVoices.length === 0) {
    const namedVi = voices.filter((v) => /vietnam|tiếng việt/i.test(v.name));
    if (namedVi.length > 0) return namedVi[0];
    return null;
  }

  if (preferredGender === 'male') {
    // Ưu tiên Microsoft NamMinh Online (Natural) hoặc giọng Nam chuẩn
    const naturalMale = viVoices.find((v) => /namminh|nam|male|man/i.test(v.name));
    if (naturalMale) return naturalMale;
  } else {
    // Ưu tiên Microsoft HoaiMy Online (Natural) hoặc Google Tiếng Việt
    const naturalFemale = viVoices.find((v) => /hoaimy|natural|online/i.test(v.name) && !/namminh|nam/i.test(v.name));
    if (naturalFemale) return naturalFemale;
    const googleVi = viVoices.find((v) => /google/i.test(v.name));
    if (googleVi) return googleVi;
  }

  // Fallback: Tìm giọng Natural/Online bất kỳ
  const anyNatural = viVoices.find((v) => /natural|online/i.test(v.name));
  if (anyNatural) return anyNatural;

  // Fallback: Giọng Google tiếng Việt
  const googleVi = viVoices.find((v) => /google/i.test(v.name));
  if (googleVi) return googleVi;

  return viVoices[0];
};

const cleanTextForSpeech = (text) => {
  if (!text) return '';
  return text
    .replace(/[*_#`~>]/g, '') // Lược bỏ markdown ký tự đặc biệt
    .replace(/^(\d+[\.\)]|Câu\s*\d+[:\.]|Q\d+[:\.])\s*/i, '') // Lược bỏ số thứ tự "Câu 1:" để câu nói tự nhiên
    .replace(/\s+/g, ' ')
    .trim();
};

// ============================================================================
// BỘ SINH CÂU HỎI THÔNG MINH ĐA CHIỀU (FALLBACK KHI GEMINI CHƯA PHẢN HỒI)
// ============================================================================
const generateFallbackQuestions = (topicName, domainId, levelId = 'middle') => {
  const t = topicName || 'Chuyên môn nghiệp vụ';
  const tLower = t.toLowerCase();

  // 1. LĨNH VỰC CÔNG NGHỆ THÔNG TIN & PHẦN MỀM
  if (domainId === 'it-software') {
    if (/backend|java|spring|api|microservice/i.test(tLower)) {
      return [
        `Hãy giới thiệu ngắn gọn về bản thân và kiến trúc backend phức tạp nhất bạn từng xây dựng liên quan đến: ${t}?`,
        `Khi hệ thống gặp tải đột biến dẫn đến nghẽn Connection Pool và tăng latency ở tầng CSDL, bạn sẽ chẩn đoán và xử lý tối ưu như thế nào?`,
        `Trong các bài toán xử lý đồng thời (Concurrency) và Transaction, bạn so sánh Optimistic Locking và Pessimistic Locking trong bối cảnh nào?`,
        `Chia sẻ một sự cố Production nghiêm trọng (như Memory Leak, Deadlock hoặc CPU 100%) bạn từng trực tiếp khắc phục và bài học rút ra?`,
        `Tại sao bạn lại chọn kiến trúc hiện tại cho ${t} thay vì các giải pháp thay thế khác? Quyết định đánh đổi (Trade-off) lớn nhất là gì?`
      ];
    }
    if (/frontend|react|vue|web|ui/i.test(tLower)) {
      return [
        `Trình bày về một dự án Web Frontend phức tạp nhất bạn từng triển khai với: ${t}?`,
        `Làm thế nào để bạn kiểm soát và tối ưu hóa các chỉ số Core Web Vitals (LCP, FID, CLS) khi ứng dụng có nhiều tương tác thời gian thực?`,
        `Bạn giải quyết bài toán quản lý State toàn cục và chống re-render dư thừa trong các component lớn như thế nào?`,
        `Khi đối mặt với yêu cầu hỗ trợ đa thiết bị và xử lý kết nối mạng chập chờn (Offline-first/PWA), bạn xây dựng kiến trúc UI ra sao?`,
        `Kể về một tình huống bạn tối ưu hóa kích thước bundle và thời gian tải trang ban đầu thành công?`
      ];
    }
    if (/devops|cloud|kubernetes|docker|ci\/cd/i.test(tLower)) {
      return [
        `Mô tả luồng triển khai CI/CD và chiến lược quản lý hạ tầng Infrastructure as Code (IaC) bạn áp dụng cho: ${t}?`,
        `Khi triển khai Zero-Downtime Deployment (Blue/Green hoặc Canary), bạn xử lý vấn đề tương thích ngược của Database Schema ra sao?`,
        `Trình bày giải pháp thiết lập cảnh báo, thu thập log và Distributed Tracing để phát hiện lỗi dịch vụ trong vòng 2 phút?`,
        `Một sự cố mất an toàn bảo mật hoặc gián đoạn dịch vụ hạ tầng đám mây bạn từng xử lý và giải pháp ngăn ngừa tái diễn?`,
        `Phương pháp tối ưu hóa chi phí hạ tầng Cloud (FinOps) mà vẫn đảm bảo tính sẵn sàng cao (High Availability)?`
      ];
    }
    return [
      `Hãy giới thiệu về năng lực cốt lõi và kinh nghiệm thực chiến tiêu biểu nhất của bạn với chủ đề: ${t}?`,
      `Khi thiết kế giải pháp cho bài toán ${t}, bạn ưu tiên các tiêu chuẩn chất lượng và kiến trúc bền vững như thế nào?`,
      `Mô tả một quyết định kỹ thuật gây tranh cãi trong team liên quan đến ${t} và cách bạn thuyết phục các bên liên quan?`,
      `Cách bạn kiểm thử, tự động hóa và đảm bảo chất lượng trước khi release một tính năng trọng yếu ra thị trường?`,
      `Xu hướng công nghệ mới nhất đang tác động và định hình lại tương lai của ${t} trong 2 năm tới là gì?`
    ];
  }

  // 2. LĨNH VỰC KINH TẾ & TÀI CHÍNH
  if (domainId === 'kinh-te') {
    return [
      `Hãy phân tích quy trình bạn đánh giá sức khỏe tài chính và rủi ro thanh khoản của một doanh nghiệp khi thực hiện: ${t}?`,
      `Khi biên lợi nhuận bị xói mòn và chi phí vốn gia tăng do lạm phát, bạn sẽ tham mưu giải pháp tái cấu trúc dòng tiền nào cho Ban Điều hành?`,
      `Chia sẻ một tình huống thực tế bạn phát hiện sai lệch số liệu hoặc rủi ro kiểm toán trọng yếu khi triển khai: ${t}?`,
      `Bạn ứng dụng các chỉ số định lượng (NPV, IRR, WACC, DCF) ra sao để thẩm định tính khả thi của một quyết định đầu tư lớn?`,
      `Nếu có sự xung đột giữa mục tiêu tăng trưởng doanh thu ngắn hạn và an toàn vốn dài hạn, bạn sẽ cân bằng bài toán này như thế nào?`
    ];
  }

  // 3. LĨNH VỰC MARKETING & TRUYỀN THÔNG SỐ
  if (domainId === 'marketing') {
    return [
      `Mô tả cấu trúc phễu chuyển đổi (Full-funnel) và phương pháp đo lường ROI/ROAS của bạn khi thực thi chiến dịch: ${t}?`,
      `Khi chi phí quảng cáo (CAC) tăng vọt 40% nhưng KPI doanh số giữ nguyên, bạn sẽ điều chỉnh phân bổ ngân sách và thông điệp ra sao?`,
      `Làm thế nào bạn phối hợp ăn ý giữa đội ngũ Sáng tạo (Creative Storytelling) và đội ngũ Dữ liệu (Performance Analytics)?`,
      `Kể về một chiến dịch truyền thông không đạt kỳ vọng hoặc gặp phản hồi tiêu cực từ cộng đồng và cách bạn xử lý khủng hoảng?`,
      `Chiến lược giữ chân khách hàng (Retention & LTV) được bạn tích hợp thế nào trong kế hoạch tổng thể của: ${t}?`
    ];
  }

  // 4. LĨNH VỰC SALES & PHÁT TRIỂN THỊ TRƯỜNG
  if (domainId === 'sales') {
    return [
      `Quy trình từng bước của bạn để thẩm định chân dung khách hàng mục tiêu và mở rộng phễu khách hàng tiềm năng cho: ${t}?`,
      `Khi khách hàng doanh nghiệp lớn từ chối ký hợp đồng vì rào cản ngân sách hoặc đối thủ cạnh tranh chào giá thấp hơn, bạn xử lý ra sao?`,
      `Chia sẻ về một thương vụ đàm phán kéo dài, phức tạp với nhiều người ra quyết định (Stakeholders) mà bạn chốt thành công?`,
      `Bạn xây dựng mối quan hệ tin cậy dài hạn với khách hàng VIP để tạo ra doanh thu định kỳ (Cross-sell/Up-sell) bằng cách nào?`,
      `Bí quyết để bạn liên tục duy trì động lực và hoàn thành 100% chỉ tiêu doanh số cá nhân ngay cả trong các quý thị trường trầm lắng?`
    ];
  }

  // 5. LĨNH VỰC NHÂN SỰ & QUẢN TRỊ NGUỒN LỰC (HR)
  if (domainId === 'hr') {
    return [
      `Chiến lược của bạn để xây dựng thương hiệu tuyển dụng và thu hút nhân tài chất lượng cao trong lĩnh vực: ${t}?`,
      `Khi xảy ra tranh chấp quyền lợi hoặc bất đồng gay gắt giữa nhân viên và quản lý cấp cao, quy trình hòa giải của bạn là gì?`,
      `Phương pháp bạn thiết kế khung năng lực, chính sách đãi ngộ (C&B) và lộ trình thăng tiến để giữ chân nhân sự chủ chốt?`,
      `Làm thế nào để đo lường định lượng mức độ gắn kết văn hóa và hiệu suất làm việc thông qua hệ thống OKRs/KPIs?`,
      `Chia sẻ kinh nghiệm thực tế của bạn khi dẫn dắt một đợt tái cấu trúc tổ chức hoặc thay đổi quy chế làm việc lớn?`
    ];
  }

  // 6. CÁC LĨNH VỰC KHÁC (VẬN HÀNH, QUẢN TRỊ, THIẾT KẾ)
  return [
    `Hãy giới thiệu tổng quan về triết lý làm việc và những thành tựu thực tế nổi bật nhất của bạn trong chủ đề: ${t}?`,
    `Khi quy trình vận hành hoặc dự án gặp sự cố phát sinh ngoài tầm kiểm soát, các bước xử lý ưu tiên của bạn là gì?`,
    `So sánh phương án bạn đề xuất cho ${t} với các giải pháp khác. Đâu là điểm đánh đổi (Trade-offs) và rủi ro cần phòng ngừa?`,
    `Chia sẻ một bài học kinh nghiệm sâu sắc nhất sau một lần ra quyết định chưa hoàn hảo và cách bạn cải tiến bản thân?`,
    `Bạn sẽ xây dựng bộ chỉ số đo lường hiệu quả (Metrics/KPIs) và kế hoạch 90 ngày đầu tiên cho vị trí này như thế nào?`
  ];
};

const getPersona = (domainId) => {
  switch (domainId) {
    case 'kinh-te':
      return {
        name: 'Alexander Vance, CFA',
        roleTitle: 'Hội Đồng Thẩm Định Tài Chính & Ngân Hàng',
        company: 'HireMate Financial Advisory',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
        focus: 'Thẩm định tài chính, dòng tiền DCF & kiểm soát rủi ro kiểm toán',
        accentColor: '#2D3A31',
        greeting: 'Chào bạn, tôi sẽ phụ trách phỏng vấn chuyên sâu năng lực tài chính & kế toán của bạn hôm nay.',
      };
    case 'marketing':
      return {
        name: 'Elena Rostova',
        roleTitle: 'VP of Global Growth & Brand Strategy',
        company: 'HireMate Brand Lab',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
        focus: 'Full-funnel Omnichannel, CAC/LTV & Performance Growth',
        accentColor: '#C27B66',
        greeting: 'Chào bạn, chúng ta sẽ cùng phân tích các chiến dịch tiếp thị số và chỉ số tăng trưởng thực chiến.',
      };
    case 'sales':
      return {
        name: 'Marcus Sterling',
        roleTitle: 'Senior Director of Enterprise B2B Partnerships',
        company: 'HireMate Commercial Group',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
        focus: 'Đàm phán thương vụ lớn, Key Account & Pipeline Quota',
        accentColor: '#D4A373',
        greeting: 'Rất vui được gặp bạn! Hãy chia sẻ các thương vụ và phương pháp chốt hợp đồng lớn của bạn.',
      };
    case 'hr':
      return {
        name: 'Sarah Jenkins, SHRM-SCP',
        roleTitle: 'Chief People & Talent Officer',
        company: 'HireMate Talent Network',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
        focus: 'Chiến lược nhân sự, C&B, văn hóa doanh nghiệp & Talent Retention',
        accentColor: '#8C9A84',
        greeting: 'Chào bạn, tôi quan tâm đến tư duy phát triển con người và khả năng quản trị tổ chức của bạn.',
      };
    case 'van-hanh':
      return {
        name: 'Captain Arthur Hayes',
        roleTitle: 'Head of Global Logistics & Supply Chain',
        company: 'HireMate SCM Alliance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        focus: 'Tối ưu kho vận, thông quan quốc tế & chuỗi cung ứng linh hoạt',
        accentColor: '#588157',
        greeting: 'Chào bạn, chúng ta sẽ tập trung vào hiệu suất kho vận và quản trị chuỗi cung ứng thực tế.',
      };
    default:
      return {
        name: 'Dr. Synthia AI',
        roleTitle: 'Principal AI Talent Assessor & Systems Architect',
        company: 'HireMate AI Core Engine v4.5',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        focus: 'Kiến trúc giải pháp, thuật toán & phương pháp luận STAR',
        accentColor: '#C27B66',
        greeting: 'Chào bạn! Tôi là Synthia AI, đồng hành cùng bạn để nâng tầm kỹ năng phỏng vấn chuyên nghiệp.',
      };
  }
};

const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

export default function AiInterviewStudioPage({ user }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  const [view, setView] = useState('setup'); // 'setup' | 'live' | 'result' | 'history'
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('middle');
  const [interviewGoal, setInterviewGoal] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [systemConfig, setSystemConfig] = useState({
    interviewMaxQuestions: 5,
    interviewResponseSeconds: 120,
    interviewerPersona: 'TECH_LEAD',
    aiInterviewDifficulty: 'STANDARD',
  });

  // Live Interview State
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [liveTelemetryTab, setLiveTelemetryTab] = useState('metrics'); // 'metrics' | 'timeline' | 'notes'
  const [timerSec, setTimerSec] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [done, setDone] = useState(false);

  // Result & History State
  const [result, setResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [histFilter, setHistFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [selectedVoiceType, setSelectedVoiceType] = useState('female'); // 'female' | 'male'
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isAdaptiveUpdating, setIsAdaptiveUpdating] = useState(false);
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [liveStageMode, setLiveStageMode] = useState('chatgpt'); // 'chatgpt' | 'studio'
  const timerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Auto-scroll conversational chat feed
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueHistory, isAiTyping]);

  const topic = customTopic.trim() || selectedTopic;

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  // Fetch real interview history from Supabase via backend
  const fetchRealHistory = () => {
    interviewApi.getHistory()
      .then((res) => {
        const data = res?.data || [];
        if (data && data.length > 0) {
          const mapped = data.map((item) => ({
            id: 'HM-' + item.sessionId,
            sessionId: item.sessionId,
            date: item.startedAt ? item.startedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            topic: item.targetPosition || 'Chuyên viên nghiệp vụ',
            domain: 'Phỏng vấn chuyên sâu',
            domainId: 'it-software',
            level: 'Middle',
            duration: '15 phút',
            totalScore: Math.round(item.overallScore || 0),
            grade: (item.overallScore || 0) >= 90 ? 'Xuất Sắc' : (item.overallScore || 0) >= 80 ? 'Khá Tốt' : (item.overallScore || 0) >= 65 ? 'Đạt Yêu Cầu' : 'Cần Cải Thiện',
            gradeColor: (item.overallScore || 0) >= 90 ? '#588157' : (item.overallScore || 0) >= 80 ? '#2D3A31' : (item.overallScore || 0) >= 65 ? '#D4A373' : '#C27B66',
            questionsCount: item.details?.length || 5,
            competencies: {
              domainKnowledge: Math.min(98, Math.max(0, Math.round(item.overallScore || 0) + 3)),
              problemSolving: Math.min(98, Math.max(0, Math.round(item.overallScore || 0) - 2)),
              structureSTAR: Math.min(98, Math.max(0, Math.round(item.overallScore || 0) - 6)),
              deliveryTone: Math.min(98, Math.max(0, Math.round(item.overallScore || 0) + 1)),
            },
            aiSummary: item.overallFeedback || 'Đã hoàn thành phiên phỏng vấn trên HireMate.',
            weaknessSummary: item.weaknessSummary,
            strengths: ['Tinh thần cầu tiến và phản xạ nhanh với câu hỏi tình huống.'],
            criticalFlaws: item.weaknessSummary ? [item.weaknessSummary] : ['Cần cấu trúc câu trả lời theo mô hình STAR.'],
            improvementPlan: item.recommendedTasks
              ? (typeof item.recommendedTasks === 'string' ? JSON.parse(item.recommendedTasks || '[]') : item.recommendedTasks)
              : ['Luyện tập lại các câu hỏi khó để nâng cao điểm số.'],
            questions: (item.details || []).map((d) => ({
              q: d.questionText,
              score: Math.round(d.aiEvaluationScore || 0),
              answer: d.candidateAnswerText || '(Ứng viên không nhập câu trả lời)',
              criticalFeedback: {
                flaws: d.aiFeedback || 'Cần bổ sung thêm ví dụ thực tế.',
                interviewerImpression: d.tone || 'Ứng viên nghiêm túc thực hiện phỏng vấn.'
              },
              modelAnswer: d.aiSuggestedAnswer || 'Gợi ý câu trả lời chuẩn theo mô hình STAR.',
              goldenKeywords: ['STAR Method', 'Chuyên môn', 'Kỹ năng thực chiến']
            }))
          }));
          setHistoryList(mapped);
        }
      })
      .catch((err) => {
        console.warn('Could not load history from backend:', err);
      });
  };

  useEffect(() => {
    fetchRealHistory();
    interviewApi.getConfig()
      .then((res) => {
        if (res?.data) {
          setSystemConfig(res.data);
          if (res.data.interviewMaxQuestions) {
            setNumQuestions(res.data.interviewMaxQuestions);
          }
        }
      })
      .catch((err) => console.warn('Could not load interview config:', err));
  }, []);

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  // Load Natural Web Speech Voices (Microsoft Natural / Google Vietnamese)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const syncVoices = () => {
      const v = window.speechSynthesis.getVoices() || [];
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };
    syncVoices();
    window.speechSynthesis.onvoiceschanged = syncVoices;
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Web Speech Synthesis (AI Voice Reading với Natural Neural Voices)
  const speakQuestionText = (text) => {
    if (isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = cleanTextForSpeech(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'vi-VN';

      const bestVoice = getBestVietnameseVoice(availableVoices, selectedVoiceType);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      }

      // Tốc độ đĩnh đạc, âm sắc tự nhiên, ngắt nghỉ như người phỏng vấn thật
      utterance.rate = 0.93;
      utterance.pitch = selectedVoiceType === 'male' ? 0.95 : 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 3800);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
  };

  const testVoiceSample = (gender) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('⚠️ Trình duyệt của bạn không hỗ trợ Speech Synthesis.');
      return;
    }
    window.speechSynthesis.cancel();
    const sampleText = gender === 'male'
      ? 'Xin chào bạn. Tôi là chuyên gia phỏng vấn Nam Minh. Rất hân hạnh được đồng hành và đánh giá chuyên môn cùng bạn hôm nay.'
      : 'Xin chào bạn. Tôi là chuyên gia phỏng vấn Hoài My. Rất hân hạnh được đồng hành cùng bạn trong buổi phỏng vấn ngày hôm nay.';

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = 'vi-VN';
    const bestVoice = getBestVietnameseVoice(availableVoices, gender);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    }
    utterance.rate = 0.93;
    utterance.pitch = gender === 'male' ? 0.95 : 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utterance);
    showToast(`Đang phát thử ${gender === 'male' ? 'Giọng Nam Trầm Ấm (Nam Minh)' : 'Giọng Nữ Tự Nhiên (Hoài My)'}`);
  };

  // Toggle Microphone & Web Speech Recognition
  const toggleMic = () => {
    if (isMicOn) {
      setIsMicOn(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      showToast('Đã dừng micro thu âm.');
    } else {
      setIsMicOn(true);
      showToast('🎤 Đang lắng nghe giọng nói của bạn...');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = 'vi-VN';
          recognizer.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) {
              setCurrentAnswer((prev) => (prev ? prev + ' ' + transcript : transcript));
            }
          };
          recognizer.onerror = () => {};
          recognizer.start();
          recognitionRef.current = recognizer;
        } catch (e) {}
      }
    }
  };

  // Scaffold insert for STAR method
  const insertStarScaffold = (type) => {
    let snippet = '';
    if (type === 'S') snippet = '\n[📍 Bối cảnh / Tình huống (Situation)]: Tại doanh nghiệp / dự án ... tôi gặp tình huống ...';
    if (type === 'T') snippet = '\n[🎯 Nhiệm vụ / Trọng trách (Task)]: Mục tiêu chính của tôi là phải giải quyết ...';
    if (type === 'A') snippet = '\n[⚡ Hành động cụ thể (Action)]: Tôi đã áp dụng các giải pháp chuyên môn gồm (1. Phân tích số liệu, 2. Triển khai phương án, 3. Kiểm soát rủi ro) ...';
    if (type === 'R') snippet = '\n[🏆 Kết quả định lượng (Result)]: Kết quả mang lại tăng trưởng +...%, tối ưu chi phí và bài học rút ra là ...';
    setCurrentAnswer((prev) => (prev ? prev + snippet : snippet.trim()));
  };

  // Detect STAR signals in real-time
  const detectStarSignals = (text) => {
    if (!text) return { s: false, t: false, a: false, r: false, score: 0 };
    const lower = text.toLowerCase();
    const hasS = lower.includes('tình huống') || lower.includes('bối cảnh') || lower.includes('dự án') || lower.includes('khi đó') || text.length > 50;
    const hasT = lower.includes('nhiệm vụ') || lower.includes('mục tiêu') || lower.includes('yêu cầu') || lower.includes('thách thức') || text.length > 120;
    const hasA = lower.includes('hành động') || lower.includes('triển khai') || lower.includes('sử dụng') || lower.includes('giải pháp') || lower.includes('thực hiện') || text.length > 220;
    const hasR = lower.includes('kết quả') || lower.includes('số liệu') || lower.includes('%') || lower.includes('đạt được') || lower.includes('tăng') || lower.includes('tiết kiệm') || text.length > 320;
    const count = [hasS, hasT, hasA, hasR].filter(Boolean).length;
    return { s: hasS, t: hasT, a: hasA, r: hasR, score: Math.round((count / 4) * 100) };
  };

  // Extract detected keywords in real time
  const getDetectedKeywords = (text, domainId) => {
    const defaultDict = ['STAR Method', 'Metrics', 'KPI', 'Phân tích', 'Tối ưu', 'Giải pháp'];
    const domainDict = {
      'kinh-te': ['Dòng tiền', 'Báo cáo tài chính', 'Kiểm toán', 'DCF', 'EBITDA', 'Vốn lưu động', 'Rủi ro tài chính', 'Power BI'],
      'marketing': ['CAC/LTV', 'Omnichannel', 'Phễu chuyển đổi', 'ROAS', 'SEO', 'Brand Identity', 'Performance Ads', 'Content Strategy'],
      'sales': ['B2B Enterprise', 'Lead Conversion', 'Deal Size', 'Pipeline', 'Cold Call', 'Đàm phán', 'CRM', 'Quota'],
      'hr': ['Talent Acquisition', 'C&B', 'KPI/OKR', 'Giữ chân nhân tài', 'Đào tạo nội bộ', 'Văn hóa DN', 'Headhunting'],
      'van-hanh': ['Supply Chain SCM', 'Kho vận', 'Logistics', 'Fulfillment', 'Lead Time', 'Xuất nhập khẩu', 'Tồn kho JIT'],
      'it-software': ['Clean Architecture', 'API RESTful', 'Concurrency', 'Microservices', 'CI/CD', 'Database Indexing', 'Latency'],
    };
    const dict = [...(domainDict[domainId] || []), ...defaultDict];
    if (!text) return [];
    const lower = text.toLowerCase();
    return dict.filter((kw) => lower.includes(kw.toLowerCase()));
  };

  // Candidate camera hook
  useEffect(() => {
    let stream = null;
    if (view === 'live' && isCamOn && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = s;
          }
        })
        .catch(() => {});
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [view, isCamOn]);

  const handleStart = async () => {
    const topic = customTopic.trim() || selectedTopic;
    if (!selectedDomain || !topic) {
      showToast('⚠️ Vui lòng chọn lĩnh vực và chủ đề phỏng vấn!');
      return;
    }

    setIsGeneratingQuestions(true);
    showToast('🤖 AI Agent đang thiết lập bộ câu hỏi phỏng vấn chuẩn hóa...');

    const levelObj = LEVELS.find((l) => l.id === selectedLevel);
    const levelLabel = levelObj?.label || 'Middle';

    let qs = [];
    let sessionId = null;

    // 1. Sinh bộ câu hỏi thực sự từ Gemini AI trên backend
    try {
      const genRes = await interviewApi.generateQuestions({
        targetPosition: topic,
        level: levelLabel,
        count: numQuestions,
      });

      if (genRes?.data && Array.isArray(genRes.data) && genRes.data.length > 0) {
        qs = genRes.data.map((q) => (typeof q === 'string' ? q.trim() : String(q)));
      }
    } catch (err) {
      console.warn('Backend generateQuestions failed, using intelligent domain fallback:', err);
    }

    // 2. Dự phòng thông minh đa chiều theo chuyên môn nếu Gemini chưa phản hồi
    if (!qs || qs.length === 0) {
      qs = generateFallbackQuestions(topic, selectedDomain.id, selectedLevel).slice(0, numQuestions);
    }

    // 3. Khởi tạo phiên phỏng vấn chính thức trên PostgreSQL (Supabase)
    try {
      const res = await interviewApi.startSession({
        targetPosition: topic,
        level: levelLabel,
        interviewType: 'TECHNICAL',
      });
      if (res?.data?.sessionId) {
        sessionId = res.data.sessionId;
        setCurrentSessionId(sessionId);
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || '';
      if (errMsg.includes('hạn ngạch') || errMsg.includes('miễn phí') || errMsg.includes('Career VIP') || errMsg.includes('lượt')) {
        showToast('⚠️ ' + errMsg);
        setIsGeneratingQuestions(false);
        setTimeout(() => {
          if (window.confirm(errMsg + '\n\nBạn có muốn chuyển đến trang Nâng Cấp Gói Dịch Vụ Career VIP ngay bây giờ không?')) {
            window.location.href = '/candidate/pricing';
          }
        }, 400);
        return;
      }
      console.warn('Backend startSession failed, running in local fallback:', err);
    }

    // Tạo lời mở đầu đàm thoại tự nhiên, ấm áp như ChatGPT Voice
    const persona = getPersona(selectedDomain?.id);
    const candidateName = user?.fullName || 'bạn';
    const firstQ = qs[0] || 'Hãy chia sẻ về bản thân và một dự án tiêu biểu gần đây mà bạn cảm thấy tâm đắc nhất?';
    
    let openingSpeech = firstQ;
    if (!/chào|xin chào/i.test(firstQ)) {
      openingSpeech = `Chào ${candidateName}! Tôi là ${persona.name}. Rất vui được gặp bạn trong buổi phỏng vấn vị trí ${topic} hôm nay. Buổi trao đổi này sẽ như một cuộc trò chuyện cởi mở giữa hai chúng ta để hiểu hơn về kinh nghiệm và cách bạn tư duy giải quyết vấn đề thực tế. Để bắt đầu một cách tự nhiên nhất: ${firstQ}`;
    }

    const initialTurns = [
      {
        id: 'turn-ai-0',
        sender: 'ai',
        speakerName: persona.name,
        roleTitle: persona.roleTitle,
        avatar: persona.avatar,
        text: openingSpeech,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        questionIdx: 0,
      }
    ];

    setDialogueHistory(initialTurns);
    setQuestions(qs);
    setAnswers({});
    setCurrentAnswer('');
    setCurrentIdx(0);
    setTimerSec(0);
    setTimerOn(true);
    setDone(false);
    setResult(null);
    setIsGeneratingQuestions(false);

    setView('live');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // AI đọc lời chào và câu hỏi đầu tiên bằng giọng tự nhiên
    setTimeout(() => {
      speakQuestionText(openingSpeech);
    }, 700);
  };

  const handleNext = async () => {
    stopSpeaking();
    const ansText = currentAnswer.trim();
    const upd = { ...answers, [currentIdx]: ansText };
    setAnswers(upd);
    setCurrentAnswer('');

    const persona = getPersona(selectedDomain?.id);

    // Ghi nhận lượt nói của ứng viên vào dòng đối đáp hội thoại
    const userTurn = {
      id: `turn-user-${currentIdx}-${Date.now()}`,
      sender: 'candidate',
      speakerName: user?.fullName || 'Bạn (Ứng viên)',
      avatar: user?.avatarUrl || null,
      text: ansText || '(Ứng viên đã trả lời bằng giọng nói)',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      questionIdx: currentIdx,
    };
    setDialogueHistory((prev) => [...prev, userTurn]);

    // Gửi câu trả lời về backend để chấm điểm chi tiết bằng Gemini AI
    if (currentSessionId) {
      setIsSubmittingAnswer(true);
      try {
        await interviewApi.submitAnswer(currentSessionId, {
          questionNumber: currentIdx + 1,
          questionText: questions[currentIdx],
          candidateAnswerText: ansText,
        });
      } catch (err) {
        console.warn('Backend submitAnswer failed:', err);
      } finally {
        setIsSubmittingAnswer(false);
      }
    }

    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setIsAiTyping(true);

      // Multi-turn Adaptive AI Agent:
      // Tự động phân tích câu trả lời vừa rồi để sinh câu hỏi phản biện thích ứng
      let nextQuestion = questions[nextIdx];
      if (currentSessionId && ansText.length > 10) {
        setIsAdaptiveUpdating(true);
        try {
          const adaptRes = await interviewApi.getNextAdaptiveQuestion(currentSessionId);
          if (adaptRes?.data && typeof adaptRes.data === 'string' && adaptRes.data.trim().length > 15) {
            nextQuestion = adaptRes.data.trim();
            setQuestions((prev) => {
              const copy = [...prev];
              copy[nextIdx] = nextQuestion;
              return copy;
            });
            showToast('🎯 AI vừa lắng nghe và đưa ra câu hỏi phản biện nối tiếp câu trả lời của bạn!');
          }
        } catch (err) {
          console.warn('Adaptive next question skipped:', err);
        } finally {
          setIsAdaptiveUpdating(false);
        }
      }

      // Tạo câu phản hồi và dẫn dắt tự nhiên như người thật nếu câu hỏi chưa có lời phản hồi
      let conversationalTurnText = nextQuestion;
      if (!/cảm ơn|tôi hiểu|rất thú vị|ấn tượng|ghi nhận/i.test(conversationalTurnText)) {
        const friendlyReactions = [
          'Cảm ơn bạn! Phần chia sẻ vừa rồi rất rõ ràng và sát với thực tế.',
          'Tôi hiểu giải pháp và cách tiếp cận bạn vừa lựa chọn.',
          'Một góc nhìn khá thú vị về cách bạn xử lý bài toán này.',
          'Cảm ơn bạn, tôi ghi nhận kinh nghiệm thực chiến của bạn trong tình huống vừa rồi.',
        ];
        const chosenReaction = friendlyReactions[currentIdx % friendlyReactions.length];
        conversationalTurnText = `${chosenReaction} ${nextQuestion}`;
      }

      const aiNextTurn = {
        id: `turn-ai-${nextIdx}-${Date.now()}`,
        sender: 'ai',
        speakerName: persona.name,
        roleTitle: persona.roleTitle,
        avatar: persona.avatar,
        text: conversationalTurnText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        questionIdx: nextIdx,
      };

      setTimeout(() => {
        setIsAiTyping(false);
        setDialogueHistory((prev) => [...prev, aiNextTurn]);
        setCurrentIdx(nextIdx);
        speakQuestionText(conversationalTurnText);
      }, 700);
    } else {
      setTimerOn(false);
      setDone(true);
      setIsAiTyping(true);
      await finishSessionAndBuildResult(upd);
    }
  };

  const finishSessionAndBuildResult = async (ans) => {
    setIsAiTyping(true);
    let backendResult = null;
    if (currentSessionId) {
      try {
        const compRes = await interviewApi.completeSession(currentSessionId);
        if (compRes?.data) {
          backendResult = compRes.data;
        }
      } catch (err) {
        console.warn('Backend completeSession failed, calculating fallback:', err);
      }
    }

    setIsAiTyping(false);
    const topic = customTopic.trim() || selectedTopic;
    let scoredQuestions = [];

    if (backendResult && backendResult.details && backendResult.details.length > 0) {
      // Use REAL evaluated answers from Gemini AI & Supabase
      scoredQuestions = backendResult.details.map((d) => {
        const sc = Math.round(d.aiEvaluationScore || 0);
        return {
          q: d.questionText,
          intent: 'Đánh giá năng lực chuyên môn và giải pháp thực tế từ Gemini AI.',
          score: sc,
          answer: d.candidateAnswerText || '(Ứng viên không nhập câu trả lời)',
          criticalFeedback: {
            flaws: d.aiFeedback || (sc >= 80 ? 'Câu trả lời đầy đủ, lập luận logic.' : 'Cần bổ sung chi tiết theo mô hình STAR.'),
            interviewerImpression: d.tone || (sc >= 80 ? 'Ứng viên tự tin, kiến thức vững vàng.' : 'Ứng viên có tiềm năng, cần rèn luyện cấu trúc trả lời.')
          },
          modelAnswer: d.aiSuggestedAnswer || `GỢI Ý CÂU TRẢ LỜI MẪU CHO: ${d.questionText}`,
          goldenKeywords: ['STAR Method', 'Problem Solving', 'Data-driven Decision', 'Best Practice']
        };
      });
    } else {
      // Local fallback calculation if backend/gemini unavailable
      scoredQuestions = questions.map((q, i) => {
        const userText = ans[i] || '';
        const len = userText.length;
        const sc = len === 0 ? 0 : Math.min(96, Math.max(20, 40 + Math.floor(len / 10)));
        return {
          q,
          intent: 'Đánh giá năng lực chuyên môn và phương pháp giải quyết tình huống thực tế.',
          score: sc,
          answer: userText || '(Ứng viên không nhập câu trả lời)',
          criticalFeedback: {
            flaws: len === 0
              ? 'Ứng viên không đưa ra câu trả lời cho câu hỏi này.'
              : sc >= 85
              ? 'Câu trả lời đầy đủ, lập luận chặt chẽ. Cần bổ sung thêm 1 chỉ số định lượng về ngân sách hoặc hiệu suất.'
              : sc >= 70
              ? 'Đã nêu được ý tưởng cơ bản nhưng còn thiếu mô hình STAR và số liệu thực chiến.'
              : 'Chưa chạm đúng trọng tâm câu hỏi. Thiếu các thuật ngữ chuyên môn quan trọng.',
            interviewerImpression: len === 0 ? 'Chưa thể đánh giá do thiếu câu trả lời.' : sc >= 80 ? 'Ứng viên tự tin.' : 'Cần rèn luyện thêm cách diễn đạt.',
          },
          modelAnswer: `GỢI Ý CÂU TRẢ LỜI MẪU THEO MÔ HÌNH STAR CHO CHỦ ĐỀ: ${topic}
- Tình huống (Situation): Bối cảnh thực tế tại doanh nghiệp quy mô tương ứng.
- Nhiệm vụ (Task): Trọng trách cốt lõi cần giải quyết đối với câu hỏi tình huống này.
- Hành động (Action): Triển khai quy trình 3 bước với công cụ chuyên sâu và sự phối hợp liên phòng ban.
- Kết quả (Result): Đo lường thành công bằng các chỉ số định lượng cụ thể (+25% hiệu suất, tiết kiệm chi phí, đạt KPI cam kết).`,
          goldenKeywords: ['STAR Method', 'KPI / Metrics', 'Problem Solving', 'Data-driven Decision'],
        };
      });
    }

    const total = backendResult?.overallScore != null
      ? Math.round(backendResult.overallScore)
      : (scoredQuestions.length > 0 ? Math.round(scoredQuestions.reduce((s, q) => s + q.score, 0) / scoredQuestions.length) : 0);

    const grade = total >= 90 ? 'Xuất Sắc' : total >= 80 ? 'Khá Tốt' : total >= 65 ? 'Đạt Yêu Cầu' : 'Cần Cải Thiện';
    const gc = total >= 90 ? '#588157' : total >= 80 ? '#2D3A31' : total >= 65 ? '#D4A373' : '#C27B66';

    const newResult = {
      id: 'HM-' + (backendResult?.sessionId || Math.floor(9000 + Math.random() * 999)),
      sessionId: backendResult?.sessionId,
      date: new Date().toISOString().split('T')[0],
      domain: selectedDomain?.label || 'Chuyên môn tuyển dụng',
      domainId: selectedDomain?.id,
      topic,
      level: LEVELS.find((l) => l.id === selectedLevel)?.label || selectedLevel,
      duration: fmt(timerSec),
      totalScore: total,
      grade,
      gradeColor: gc,
      questionsCount: scoredQuestions.length,
      competencies: {
        domainKnowledge: Math.min(98, Math.max(0, total + 3)),
        problemSolving: Math.min(98, Math.max(0, total - 2)),
        structureSTAR: Math.min(98, Math.max(0, total - 6)),
        deliveryTone: Math.min(98, Math.max(0, total + 1)),
      },
      aiSummary: backendResult?.overallFeedback || `Buổi phỏng vấn chủ đề "${topic}" hoàn thành. Ứng viên đạt điểm số ${total}/100 (${grade}).`,
      weaknessSummary: backendResult?.weaknessSummary,
      strengths: [
        'Tinh thần cầu tiến và phản xạ nhanh với các câu hỏi tình huống.',
        'Hiểu biết cơ bản về quy trình làm việc và thuật ngữ trong ngành.',
      ],
      criticalFlaws: backendResult?.weaknessSummary ? [backendResult.weaknessSummary] : [
        'Cần hạn chế nói lan man và áp dụng chặt chẽ mô hình STAR.',
        'Bổ sung số liệu định lượng (Metrics & KPIs) chứng minh kết quả.',
      ],
      improvementPlan: backendResult?.recommendedTasks 
        ? (typeof backendResult.recommendedTasks === 'string' ? JSON.parse(backendResult.recommendedTasks || '[]') : backendResult.recommendedTasks)
        : [
          'Đọc kỹ gợi ý câu trả lời mẫu chuẩn điểm 10 bên dưới.',
          'Luyện tập lại các câu hỏi bị chấm điểm dưới 75.',
        ],
      questions: scoredQuestions,
    };

    setResult(newResult);
    setHistoryList((prev) => [newResult, ...prev]);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also re-fetch history from database
    fetchRealHistory();
  };

  const tabs = [
    { id: 'setup', icon: 'tune', label: '1. Cấu Hình' },
    { id: 'live', icon: 'videocam', label: '2. Phòng Thi' },
    { id: 'result', icon: 'analytics', label: '3. Kết Quả' },
    { id: 'history', icon: 'history', label: '4. Lịch Sử' },
  ];

  const scoreColor = (sc) => (sc >= 85 ? '#2D3A31' : sc >= 70 ? '#C27B66' : '#8C5E58');

  // ==========================================================================
  // RENDER GIAO DIỆN
  // ==========================================================================
  return (
    <div className="bg-transparent text-botanical-forest font-sans min-h-screen flex flex-col pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] px-4 py-3 rounded-2xl card-botanical bg-white/95 border border-botanical-stone text-botanical-forest text-xs font-bold shadow-soft-xl flex items-center gap-2 backdrop-blur-xl animate-bounce">
          <span className="material-symbols-outlined text-base text-botanical-terracotta">verified</span>
          {toast}
        </div>
      )}

      {/* Sub-Navbar Điều Hướng 4 Bước */}
      <div className="w-full bg-white/90 border-b border-purple-100 sticky top-16 z-30 backdrop-blur-2xl px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-300 font-sans shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-2xl bg-[#32247b] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-xl">psychology</span>
            </div>
            <div>
              <span className="text-sm font-sans font-extrabold text-[#1e1b4b] tracking-wide block">AI Practice Studio</span>
            </div>
            <button
              onClick={() => { window.location.hash = '#/candidate-pricing'; }}
              className="ml-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-extrabold tracking-wider flex items-center gap-1 cursor-pointer shadow-sm transition-all hover:scale-105 border border-amber-300/40"
              title="Nâng cấp gói Candidate Pro AI để mở khóa 30+ lượt phỏng vấn thử"
            >
              <span className="material-symbols-outlined text-xs font-bold animate-bounce">workspace_premium</span>
              <span>Nâng Cấp Pro AI</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden font-sans text-xs">
            {tabs.map((tab) => {
              const isActive = view === tab.id;
              const locked = (tab.id === 'live' && view === 'setup') || (tab.id === 'result' && !result && view !== 'result');
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (locked) {
                      showToast('Vui lòng hoàn thành buổi phỏng vấn để xem kết quả!');
                      return;
                    }
                    if (tab.id === 'history') {
                      setSelectedHistorySession(null);
                    }
                    setView(tab.id);
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-[#32247b] text-white shadow-sm'
                      : locked
                      ? 'text-slate-300 cursor-not-allowed bg-transparent'
                      : 'text-[#1e1b4b] hover:text-[#5b48bd] hover:bg-purple-50/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. VIEW SETUP (CẤU HÌNH PHỎNG VẤN)                                    */}
      {/* ===================================================================== */}
      {view === 'setup' && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-7 font-sans">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#1e1b4b]">
              Chọn Lĩnh Vực & Ngành Nghề Bạn Muốn Luyện Tập
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed font-sans">
              HireMate AI hỗ trợ phỏng vấn đa chuyên ngành: từ Kinh tế, Tài chính, Ngân hàng, Marketing, B2B Sales đến Nhân sự HR và Công nghệ Phần mềm.
            </p>
          </div>

          {/* CHỌN LĨNH VỰC */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 space-y-4 shadow-sm transition-all duration-300 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold ${selectedDomain ? 'bg-[#32247b] text-white' : 'bg-[#f97316] text-white'}`}>
                  {selectedDomain ? '✓' : '1'}
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">Lựa Chọn Ngành Nghề Của Bạn</h2>
                  <p className="text-xs text-slate-500 font-medium">AI sẽ tự động nạp ngân hàng câu hỏi chuyên sâu theo đúng ngành bạn chọn.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              {DOMAINS.map((d) => {
                const isSel = selectedDomain?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDomain(d);
                      setSelectedTopic('');
                      setCustomTopic('');
                    }}
                    className={`p-4 rounded-2xl text-left flex flex-col justify-between gap-3 transition-all cursor-pointer border hover:-translate-y-0.5 relative overflow-hidden group ${
                      isSel 
                        ? 'bg-[#f8f7ff] border-[#32247b] shadow-md ring-2 ring-[#32247b]/20' 
                        : 'bg-white border-purple-100 hover:bg-[#f8f7ff] hover:border-[#5b48bd]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[28px] p-2 rounded-xl bg-purple-100 text-[#5b48bd]">
                        {d.icon}
                      </span>
                      {isSel && (
                        <span className="material-symbols-outlined text-sm font-bold text-white bg-[#32247b] rounded-full p-1">
                          check
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-sans font-extrabold text-[#1e1b4b] group-hover:text-[#5b48bd] leading-tight">
                        {d.label}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2 font-medium">
                        {d.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* CHỌN CHỦ ĐỀ HOẶC TỰ ĐIỀN */}
          {selectedDomain && (
            <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 space-y-5 shadow-sm animate-fadeIn transition-all duration-300 font-sans">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#32247b] text-white flex items-center justify-center text-sm font-extrabold">
                  2
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">
                    Chọn Chủ Đề Chuyên Môn Trong Ngành: <span className="text-[#f97316]">{selectedDomain.label}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Chọn một chủ đề phổ biến hoặc nhập nội dung tùy ý bạn muốn thử sức.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(TOPICS_BY_DOMAIN[selectedDomain.id] || []).map((t) => {
                  const isChecked = selectedTopic === t && !customTopic;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTopic(t);
                        setCustomTopic('');
                      }}
                      className={`p-3.5 rounded-2xl text-left text-xs font-sans font-bold border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isChecked
                          ? 'bg-[#32247b] text-white border-[#32247b] shadow-md'
                          : 'bg-[#f8f7ff] border-purple-100 text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd]'
                      }`}
                    >
                      <span>{t}</span>
                      {isChecked && (
                        <span className="material-symbols-outlined text-sm font-bold shrink-0 text-white">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* OR Custom Topic Input */}
              <div className="pt-2">
                <label className="text-xs font-sans font-bold text-[#1e1b4b] block mb-1.5">
                  Hoặc tự nhập chủ đề phỏng vấn theo mong muốn của bạn:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ví dụ: Lập kế hoạch tài chính năm 2026, Chiến lược SEO E-commerce, Kỹ năng đàm phán hợp đồng..."
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value);
                      setSelectedTopic('');
                    }}
                    className="w-full bg-[#f8f7ff] border border-purple-100 focus:border-[#5b48bd] focus:bg-white rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#1e1b4b] font-medium placeholder:text-slate-400 focus:outline-none transition-all shadow-sm"
                  />
                  {customTopic && (
                    <span className="absolute right-3 top-3 text-xs font-sans font-bold text-[#5b48bd] bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                      Tự điền
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* CHỌN CẤP ĐỘ KINH NGHIỆM */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 space-y-4 shadow-sm font-sans">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#32247b] text-white flex items-center justify-center text-sm font-extrabold">
                3
              </div>
              <div>
                <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">Chọn Trình Độ &amp; Cấp Bậc Phỏng Vấn</h2>
                <p className="text-xs text-slate-500 font-medium">Độ khó của câu hỏi và tiêu chuẩn đánh giá của AI sẽ điều chỉnh tương ứng.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {LEVELS.map((lvl) => {
                const isSelLvl = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelLvl
                        ? 'bg-[#32247b] text-white border-[#32247b] shadow-md'
                        : 'bg-[#f8f7ff] border-purple-100 text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd]'
                    }`}
                  >
                    <span className="text-xs font-sans font-extrabold">{lvl.label}</span>
                    <span className={`text-[10px] font-medium ${isSelLvl ? 'text-purple-200' : 'text-slate-500'}`}>
                      {lvl.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* MỤC TIÊU & YÊU CẦU CỤ THỂ */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 space-y-4 shadow-sm font-sans">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#32247b] text-white flex items-center justify-center text-sm font-extrabold">
                4
              </div>
              <div>
                <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">Mục Tiêu &amp; Yêu Cầu Phỏng Vấn Cụ Thể (Tùy chọn)</h2>
                <p className="text-xs text-slate-500 font-medium">Nhập mong muốn hoặc tình huống thực tế bạn muốn AI xoáy sâu phân tích kỹ lưỡng.</p>
              </div>
            </div>

            <div className="pt-1">
              <textarea
                rows={2}
                placeholder="Ví dụ: Tôi chuẩn bị phỏng vấn vào doanh nghiệp lớn, muốn tập trung hỏi kỹ về kỹ năng quản lý rủi ro và giải quyết xung đột nhóm..."
                value={interviewGoal}
                onChange={(e) => setInterviewGoal(e.target.value)}
                className="w-full bg-[#f8f7ff] border border-purple-100 focus:border-[#5b48bd] focus:bg-white rounded-2xl p-4 text-xs sm:text-sm text-[#1e1b4b] font-medium placeholder:text-slate-400 focus:outline-none transition-all shadow-sm resize-none"
              />
            </div>
          </section>

          {/* CHỌN SỐ CÂU HỎI */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 space-y-4 shadow-sm font-sans">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#32247b] text-white flex items-center justify-center text-sm font-extrabold">
                5
              </div>
              <div>
                <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">Số Lượng Câu Hỏi Cho Buổi Luyện Tập</h2>
                <p className="text-xs text-slate-500 font-medium">Mỗi câu hỏi phỏng vấn sẽ có phần phân tích chẩn đoán lỗi sai riêng biệt.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {[
                { count: 3, label: '3 Câu (Thử nghiệm nhanh ~10-15 phút)' },
                { count: 5, label: '5 Câu (Chuẩn mực chuyên sâu ~20-30 phút)' },
                { count: 7, label: '7 Câu (Phỏng vấn chuyên sâu ~35-45 phút)' },
              ].map((qOpt) => {
                const isSelCount = numQuestions === qOpt.count;
                const isDefault = (systemConfig?.interviewMaxQuestions || 5) === qOpt.count;
                return (
                  <button
                    key={qOpt.count}
                    onClick={() => setNumQuestions(qOpt.count)}
                    className={`px-5 py-3 rounded-2xl text-xs font-sans font-extrabold border transition-all cursor-pointer flex items-center gap-2 ${
                      isSelCount
                        ? 'bg-[#32247b] text-white border-[#32247b] shadow-md'
                        : 'bg-[#f8f7ff] border-purple-100 text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd]'
                    }`}
                  >
                    <span>{qOpt.label}</span>
                    {isDefault && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono ${
                        isSelCount ? 'bg-white/20 text-white' : 'bg-purple-100 text-[#5b48bd]'
                      }`}>
                        Mặc định HT
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#5b48bd]">timer</span>
              <span>Thời gian phản xạ mục tiêu được cấu hình: <strong>{systemConfig?.interviewResponseSeconds || 120} giây/câu</strong> (Độ khó: <strong>{systemConfig?.aiInterviewDifficulty || 'STANDARD'}</strong>).</span>
            </p>
          </section>

          {/* 6. CHỌN GIỌNG ĐỌC PHỎNG VẤN AI (NATURAL NEURAL TTS) */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 space-y-4 shadow-sm font-sans">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#32247b] text-white flex items-center justify-center text-sm font-extrabold">
                  6
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">Giọng Đọc Phỏng Vấn AI (Natural Neural Voice)</h2>
                  <p className="text-xs text-slate-500 font-medium">Hệ thống tự động sử dụng giọng đọc tự nhiên (Natural/Neural) chuẩn tiếng Việt.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-sans font-bold bg-purple-50 text-[#5b48bd] border border-purple-100 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">graphic_eq</span>
                Tốc độ chuẩn 0.93x (Đĩnh đạc, rõ nét)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Giọng Nữ */}
              <div
                onClick={() => setSelectedVoiceType('female')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedVoiceType === 'female'
                    ? 'bg-[#f5f3ff] border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-sm'
                    : 'bg-[#f8f7ff] border-purple-100 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🌸</span>
                    <div>
                      <h3 className="text-xs font-sans font-extrabold text-[#1e1b4b]">Giọng Nữ Tự Nhiên (Hoài My / Google)</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Truyền cảm, chuẩn âm sắc, ngắt nghỉ chuyên nghiệp</p>
                    </div>
                  </div>
                  {selectedVoiceType === 'female' && (
                    <span className="material-symbols-outlined text-[#5b48bd] text-lg font-bold">check_circle</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVoiceType('female');
                    testVoiceSample('female');
                  }}
                  className="self-start text-[11px] font-sans font-bold px-3 py-1 rounded-full bg-white hover:bg-purple-100 text-[#5b48bd] border border-purple-200 transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-xs">volume_up</span>
                  <span>Nghe thử giọng nữ</span>
                </button>
              </div>

              {/* Giọng Nam */}
              <div
                onClick={() => setSelectedVoiceType('male')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedVoiceType === 'male'
                    ? 'bg-[#f5f3ff] border-[#5b48bd] ring-2 ring-[#5b48bd]/20 shadow-sm'
                    : 'bg-[#f8f7ff] border-purple-100 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🎙️</span>
                    <div>
                      <h3 className="text-xs font-sans font-extrabold text-[#1e1b4b]">Giọng Nam Chuyên Nghiệp (Nam Minh Neural)</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Trầm ấm, đĩnh đạc, phong thái hội đồng tuyển dụng</p>
                    </div>
                  </div>
                  {selectedVoiceType === 'male' && (
                    <span className="material-symbols-outlined text-[#5b48bd] text-lg font-bold">check_circle</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVoiceType('male');
                    testVoiceSample('male');
                  }}
                  className="self-start text-[11px] font-sans font-bold px-3 py-1 rounded-full bg-white hover:bg-purple-100 text-[#5b48bd] border border-purple-200 transition-all flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-xs">volume_up</span>
                  <span>Nghe thử giọng nam</span>
                </button>
              </div>
            </div>
          </section>

          {/* START CTA BUTTON */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleStart}
              disabled={isGeneratingQuestions || !selectedDomain || (!selectedTopic && !customTopic)}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-[#32247b] hover:bg-[#271a66] text-white text-sm uppercase tracking-wider font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            >
              {isGeneratingQuestions ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthia AI Đang Soạn Câu Hỏi Thích Ứng...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">play_circle</span>
                  <span>Bắt Đầu Phỏng Vấn Với Synthia AI</span>
                </>
              )}
            </button>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 2. VIEW LIVE ROOM (PHÒNG THI AI STAGE)                                */}
      {/* ===================================================================== */}
      {view === 'live' && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
          {/* ROOM HEADER CARD */}
          <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-sans font-extrabold text-[#1e1b4b] tracking-wide">
                  {topic}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-extrabold bg-[#32247b] text-white">
                  {LEVELS.find((l) => l.id === selectedLevel)?.label || 'SENIOR'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  LIVE ROOM
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {selectedDomain?.label} • Phòng thi số <span className="font-mono text-[#1e1b4b] font-bold">#HM-{selectedDomain?.id?.toUpperCase()}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Stepper Dots & Progress */}
              <div className="flex items-center gap-2 bg-[#f8f7ff] px-4 py-2 rounded-full border border-purple-100">
                <span className="text-[11px] font-sans font-bold text-slate-600 mr-1">
                  Tiến độ:
                </span>
                <div className="flex items-center gap-1.5">
                  {questions.map((_, idx) => {
                    const isDone = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div 
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCurrent 
                            ? 'w-7 bg-[#f97316] shadow-sm' 
                            : isDone 
                            ? 'w-4 bg-[#32247b]' 
                            : 'w-2 bg-purple-200'
                        }`}
                        title={`Câu ${idx + 1}/${questions.length}`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-mono font-bold ml-2 text-[#1e1b4b]">
                  {currentIdx + 1}/{questions.length}
                </span>
              </div>

              {/* Timer & Action controls */}
              <div className="flex items-center gap-2.5 font-sans">
                <div 
                  className="flex items-center gap-1.5 font-mono text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#f8f7ff] border border-purple-100 text-[#1e1b4b] shadow-sm"
                  title={`Thời gian làm bài thực tế (Mục tiêu chuẩn: ${systemConfig?.interviewResponseSeconds || 120}s/câu)`}
                >
                  <span className="material-symbols-outlined text-sm animate-pulse text-[#f97316]">timer</span>
                  <span>{fmt(timerSec)}</span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">/{systemConfig?.interviewResponseSeconds || 120}s</span>
                </div>

                {/* Quick Switch Voice Type */}
                <button
                  onClick={() => {
                    const nextType = selectedVoiceType === 'female' ? 'male' : 'female';
                    setSelectedVoiceType(nextType);
                    showToast(`Đã đổi sang ${nextType === 'male' ? 'Giọng Nam (Nam Minh Neural)' : 'Giọng Nữ (Hoài My Neural)'}`);
                    if (!isMuted && questions[currentIdx]) {
                      speakQuestionText(questions[currentIdx]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-full border border-purple-100 bg-[#f8f7ff] hover:bg-purple-50 text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Bấm để đổi giọng đọc Nữ / Nam"
                >
                  <span className="text-sm">{selectedVoiceType === 'female' ? '🌸' : '🎙️'}</span>
                  <span className="hidden sm:inline">{selectedVoiceType === 'female' ? 'Giọng Nữ' : 'Giọng Nam'}</span>
                </button>

                {/* Mute AI Speech Toggle */}
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (!isMuted) stopSpeaking();
                    showToast(!isMuted ? 'Đã tắt giọng nói AI' : 'Đã bật giọng nói AI');
                  }}
                  className={`p-2 rounded-full border transition-all cursor-pointer ${
                    isMuted 
                      ? 'bg-orange-50 text-[#f97316] border-orange-200' 
                      : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-purple-50'
                  }`}
                  title={isMuted ? 'Bật giọng đọc AI' : 'Tắt tiếng AI'}
                >
                  <span className="material-symbols-outlined text-base">{isMuted ? 'volume_off' : 'volume_up'}</span>
                </button>

                {/* Quit / Exit Modal Trigger */}
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn tạm dừng và thoát buổi phỏng vấn này không? Toàn bộ tiến trình sẽ không được lưu.')) {
                      stopSpeaking();
                      setView('setup');
                      setTimerOn(false);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#f8f7ff] hover:bg-rose-50 text-[#1e1b4b] hover:text-rose-600 border border-purple-100 hover:border-rose-200 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Rời khỏi phòng phỏng vấn"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span className="hidden sm:inline">Rời Phòng</span>
                </button>
              </div>
            </div>
          </div>

          {!done ? (
            /* 2-COLUMN MAIN STAGE */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-sans">
              {/* LEFT STAGE: AI PERSONA & CANDIDATE WORKSPACE (8 Columns) */}
              <div className="lg:col-span-8 space-y-5">

                {/* 2.0 CHỌN CHẾ ĐỘ PHỎNG VẤN */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-sans font-extrabold text-[#1e1b4b]">Chế độ tương tác:</span>
                    <div className="flex items-center p-1 bg-[#f8f7ff] rounded-xl border border-purple-100">
                      <button
                        onClick={() => setLiveStageMode('chatgpt')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-sans font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                          liveStageMode === 'chatgpt'
                            ? 'bg-[#32247b] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#1e1b4b]'
                        }`}
                      >
                        <span className="text-sm">🎙️</span>
                        <span>Đàm Thoại Trực Tiếp (ChatGPT Voice)</span>
                      </button>
                      <button
                        onClick={() => setLiveStageMode('studio')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-sans font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                          liveStageMode === 'studio'
                            ? 'bg-[#32247b] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#1e1b4b]'
                        }`}
                      >
                        <span className="text-sm">📋</span>
                        <span>Bảng Điều Khiển (Studio Board)</span>
                      </button>
                    </div>
                  </div>

                  <span className="text-xs text-[#5b48bd] font-bold hidden sm:flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">record_voice_over</span>
                    <span>Hội thoại 2 chiều như người thật</span>
                  </span>
                </div>

                {/* CHẾ ĐỘ 1: ĐÀM THOẠI TRỰC TIẾP CHATGPT VOICE */}
                {liveStageMode === 'chatgpt' && (
                  <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden transition-all duration-300 font-sans">
                    {/* AI Presence Banner */}
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-purple-100 flex-wrap">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img 
                            src={getPersona(selectedDomain?.id).avatar} 
                            alt={getPersona(selectedDomain?.id).name}
                            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-purple-100 shadow-sm ring-2 ring-purple-500/10"
                          />
                          {isAiSpeaking && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#f97316] border-2 border-white flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-white">volume_up</span>
                              </span>
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-sans font-extrabold text-[#1e1b4b]">
                              {getPersona(selectedDomain?.id).name}
                            </h3>
                            <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full font-bold border bg-purple-100 text-[#5b48bd] border-purple-200">
                              AI INTERVIEWER
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {getPersona(selectedDomain?.id).roleTitle} • <span className="text-slate-400">{getPersona(selectedDomain?.id).company}</span>
                          </p>
                        </div>
                      </div>

                      {/* Live Voice Status Indicator & Equalizer */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#f8f7ff] px-3.5 py-1.5 rounded-full border border-purple-100">
                          <span className="text-[11px] font-sans font-bold text-slate-700">
                            {isAiSpeaking ? 'AI Đang Nói Chuyện' : isMicOn ? 'Đang Lắng Nghe Bạn...' : isAiTyping ? 'AI Đang Suy Nghĩ...' : 'Sẵn Sàng Trao Đổi'}
                          </span>
                          <div className="flex items-end gap-1 h-4 w-10">
                            {[40, 80, 50, 100, 65, 30].map((h, i) => (
                              <div 
                                key={i} 
                                className={`w-1 rounded-full transition-all duration-150 ${(isAiSpeaking || isMicOn) ? 'animate-bounce' : 'opacity-40'}`}
                                style={{ 
                                  height: (isAiSpeaking || isMicOn) ? `${h}%` : '30%',
                                  backgroundColor: isMicOn ? '#ef4444' : '#f97316',
                                  animationDelay: `${i * 100}ms`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conversational Dialogue Thread (2-way chat feed) */}
                    <div className="space-y-4 max-h-[460px] overflow-y-auto p-3 sm:p-5 rounded-2xl bg-[#f8f7ff]/80 border border-purple-100 shadow-inner scroll-smooth">
                      {dialogueHistory.map((turn) => {
                        const isAi = turn.sender === 'ai';
                        return (
                          <div 
                            key={turn.id} 
                            className={`flex gap-3 items-start animate-fadeIn ${isAi ? 'justify-start' : 'justify-end'}`}
                          >
                            {isAi && (
                              <img 
                                src={turn.avatar || getPersona(selectedDomain?.id).avatar} 
                                alt={turn.speakerName} 
                                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-purple-200 mt-1 shadow-2xs"
                              />
                            )}

                            <div className={`max-w-[88%] sm:max-w-[80%] space-y-1.5 ${isAi ? 'items-start' : 'items-end'}`}>
                              <div className={`flex items-center gap-2 text-[10px] font-sans font-bold ${isAi ? 'text-slate-500 justify-start' : 'text-slate-500 justify-end'}`}>
                                <span>{turn.speakerName}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">{turn.timestamp}</span>
                              </div>

                              <div 
                                className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                                  isAi 
                                    ? 'bg-white border border-purple-100 text-[#1e1b4b] rounded-tl-sm' 
                                    : 'bg-[#32247b] text-white rounded-tr-sm shadow-md'
                                }`}
                              >
                                <p className="whitespace-pre-line font-sans font-medium">{turn.text}</p>

                                {isAi && (
                                  <div className="pt-2 flex justify-end">
                                    <button
                                      onClick={() => speakQuestionText(turn.text)}
                                      disabled={isAiSpeaking}
                                      className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full bg-[#f8f7ff] hover:bg-purple-100 text-[#5b48bd] border border-purple-100 flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                                      title="Bấm để AI đọc lại đoạn này"
                                    >
                                      <span className="material-symbols-outlined text-xs">volume_up</span>
                                      <span>Nghe lại</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {!isAi && (
                              <div className="w-9 h-9 rounded-xl bg-[#32247b] text-white font-extrabold flex items-center justify-center shrink-0 mt-1 shadow-sm text-xs">
                                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isAiTyping && (
                        <div className="flex gap-3 items-start animate-fadeIn">
                          <img 
                            src={getPersona(selectedDomain?.id).avatar} 
                            alt="AI" 
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-purple-200 mt-1"
                          />
                          <div className="p-4 rounded-3xl rounded-tl-sm bg-white border border-purple-100 text-[#1e1b4b] shadow-xs flex items-center gap-2 text-xs font-sans font-bold">
                            <span className="animate-pulse">{getPersona(selectedDomain?.id).name} đang suy ngẫm câu trả lời của bạn...</span>
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-bounce"></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Real-time Voice Interaction & Composer HUD */}
                    <div className="bg-[#f8f7ff] rounded-2xl p-4 border border-purple-100 space-y-3 font-sans">
                      {/* Large Central Voice Mic Action */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-purple-100 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={toggleMic}
                            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-sans font-extrabold border transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                              isMicOn
                                ? 'bg-rose-600 text-white border-rose-600 animate-pulse shadow-rose-200 shadow-md ring-4 ring-rose-100'
                                : 'bg-[#32247b] hover:bg-[#271a66] text-white border-[#32247b]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{isMicOn ? 'mic' : 'mic_none'}</span>
                            <span>{isMicOn ? 'Đang Thu Âm (Bấm để Dừng)' : 'Bấm Micro Để Nói Chuyện'}</span>
                          </button>

                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            {isMicOn ? '🔴 Đang nhận diện giọng nói tiếng Việt...' : 'Nói tự nhiên như đang gọi thoại'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-sans font-bold text-slate-500">
                            Tiến trình: <strong className="text-[#1e1b4b]">{currentIdx + 1}/{questions.length}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Text input area with live voice transcript sync */}
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (currentAnswer.trim().length > 0 && !isSubmittingAnswer) {
                                handleNext();
                              }
                            }
                          }}
                          placeholder={isMicOn ? "🎤 Đang lắng nghe bạn nói... (chữ sẽ tự xuất hiện tại đây)" : "Nói qua Micro hoặc gõ câu trả lời của bạn tại đây... (Nhấn Enter để gửi)"}
                          className="w-full bg-white border border-purple-100 focus:border-[#5b48bd] rounded-2xl p-3.5 text-xs sm:text-sm text-[#1e1b4b] font-medium placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs resize-none"
                        />
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-xs text-[#5b48bd]">smart_toy</span>
                            AI đối đáp và dẫn dắt tự nhiên như ChatGPT Voice
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentAnswer.trim().length > 0 && (
                            <button
                              onClick={() => setCurrentAnswer('')}
                              className="text-xs font-sans px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold cursor-pointer"
                            >
                              Xóa nội dung
                            </button>
                          )}

                          <button
                            onClick={handleNext}
                            disabled={isSubmittingAnswer || currentAnswer.trim().length === 0}
                            className="px-6 py-2.5 rounded-full bg-[#32247b] hover:bg-[#271a66] text-white text-xs sm:text-sm font-sans font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingAnswer ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Đang gửi câu trả lời...</span>
                              </>
                            ) : (
                              <>
                                <span>Gửi &amp; Nghe AI Phản Hồi</span>
                                <span className="material-symbols-outlined text-base">send</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHẾ ĐỘ 2: BẢNG ĐIỀU KHIỂN CHUYÊN SÂU (STUDIO BOARD) */}
                {liveStageMode === 'studio' && (
                  <>
                {/* 2.1 AI INTERVIEWER PERSONA STAGE CARD */}
                <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all duration-300 font-sans">
                  {/* AI Persona Header Banner */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-purple-100">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img 
                          src={getPersona(selectedDomain?.id).avatar} 
                          alt={getPersona(selectedDomain?.id).name}
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-purple-100 shadow-sm ring-2 ring-purple-500/10"
                        />
                        {isAiSpeaking && (
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#f97316] border-2 border-white flex items-center justify-center">
                              <span className="material-symbols-outlined text-[10px] text-white">volume_up</span>
                            </span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-sans font-extrabold text-[#1e1b4b] tracking-wide">
                            {getPersona(selectedDomain?.id).name}
                          </h3>
                          <span 
                            className="text-[10px] font-sans px-2.5 py-0.5 rounded-full font-bold border bg-purple-100 text-[#5b48bd] border-purple-200"
                          >
                            AI ASSESSOR
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {getPersona(selectedDomain?.id).roleTitle} • <span className="text-slate-400">{getPersona(selectedDomain?.id).company}</span>
                        </p>
                      </div>
                    </div>

                    {/* Animated Neural Audio Equalizer */}
                    <div className="hidden sm:flex items-center gap-2 bg-[#f8f7ff] px-3.5 py-1.5 rounded-full border border-purple-100">
                      <span className="text-[11px] font-sans font-bold text-slate-600">
                        {isAiSpeaking ? 'AI Đang Nói' : 'AI Lắng Nghe'}
                      </span>
                      <div className="flex items-end gap-1 h-4 w-10">
                        {[40, 80, 50, 100, 65, 30].map((h, i) => (
                          <div 
                            key={i} 
                            className={`w-1 rounded-full transition-all duration-150 ${isAiSpeaking ? 'animate-bounce' : 'opacity-40'}`}
                            style={{ 
                              height: isAiSpeaking ? `${h}%` : '30%',
                              backgroundColor: '#f97316',
                              animationDelay: `${i * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Question Display Callout */}
                  <div className="py-4 space-y-3 font-sans">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#f97316] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#f97316]"></span>
                          CÂU HỎI SỐ #{currentIdx + 1} / {questions.length}
                        </span>
                        {currentIdx > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-purple-100 text-[#5b48bd] border border-purple-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">psychology</span>
                            <span>AI Phản Biện Thích Ứng (Adaptive Agent)</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline-flex items-center gap-1">
                          <span>{selectedVoiceType === 'female' ? '🌸 Hoài My' : '🎙️ Nam Minh'}</span>
                          <span>• 0.93x</span>
                        </span>
                      </div>

                      {/* Re-play AI Audio speech */}
                      <button
                        onClick={() => speakQuestionText(questions[currentIdx])}
                        disabled={isAiSpeaking}
                        className="text-xs font-sans px-3.5 py-1 rounded-full bg-[#f8f7ff] hover:bg-purple-50 border border-purple-100 text-[#1e1b4b] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                        title="Bấm để AI đọc lại câu hỏi"
                      >
                        <span className="material-symbols-outlined text-sm text-[#f97316]">record_voice_over</span>
                        <span>{isAiSpeaking ? 'Đang đọc...' : 'Nghe lại giọng AI'}</span>
                      </button>
                    </div>

                    <div className="p-5 sm:p-6 rounded-2xl bg-[#f8f7ff] border border-purple-100 shadow-sm relative text-[#1e1b4b]">
                      <span className="absolute -top-3.5 left-4 text-3xl font-serif text-purple-300 select-none">“</span>
                      <p className="text-base sm:text-lg font-sans font-bold text-[#1e1b4b] leading-relaxed tracking-wide">
                        {questions[currentIdx]}
                      </p>
                    </div>

                    {/* STAR Structural Recommendation Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                      <span className="text-slate-600 font-bold flex items-center gap-1 text-[11px] mr-1">
                        <span className="material-symbols-outlined text-[#f97316] text-sm">stars</span>
                        Khung STAR chuẩn mực:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-purple-100 text-[#1e1b4b] text-[11px] font-mono font-bold">
                        <strong className="text-[#f97316]">S:</strong> Bối cảnh thực tế
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-purple-100 text-[#1e1b4b] text-[11px] font-mono font-bold">
                        <strong className="text-[#5b48bd]">T:</strong> Nhiệm vụ cốt lõi
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-purple-100 text-[#1e1b4b] text-[11px] font-mono font-bold">
                        <strong className="text-[#10b981]">A:</strong> Hành động 3 bước
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-purple-100 text-[#1e1b4b] text-[11px] font-mono font-bold">
                        <strong className="text-[#f97316]">R:</strong> Kết quả &amp; KPI %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2.2 CANDIDATE WORKSPACE: VIDEO HUD & ANSWER COMPOSER */}
                <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-sm space-y-4 transition-all duration-300 font-sans">
                  
                  {/* Top Bar: Camera HUD & Mic status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
                      <label className="text-xs font-sans font-extrabold text-[#1e1b4b] uppercase tracking-wider">
                        Phòng Thi &amp; Không Gian Trả Lời Của Bạn
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Camera Toggle Button */}
                      <button
                        onClick={() => {
                          setIsCamOn(!isCamOn);
                          showToast(!isCamOn ? 'Đã bật camera phỏng vấn' : 'Đã tắt camera');
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isCamOn 
                            ? 'bg-[#32247b] text-white border-[#32247b] shadow-sm' 
                            : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-purple-50'
                        }`}
                        title="Bật/Tắt Camera"
                      >
                        <span className="material-symbols-outlined text-sm">{isCamOn ? 'videocam' : 'videocam_off'}</span>
                        <span>{isCamOn ? 'Cam ON' : 'Cam OFF'}</span>
                      </button>

                      {/* Microphone Voice Recognition Toggle */}
                      <button
                        onClick={toggleMic}
                        className={`px-4 py-1.5 rounded-full text-xs font-sans font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                          isMicOn
                            ? 'bg-[#f97316] text-white border-[#f97316] animate-pulse'
                            : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-purple-50'
                        }`}
                        title="Bật/Tắt Voice Speech Recognition"
                      >
                        <span className="material-symbols-outlined text-sm">{isMicOn ? 'mic' : 'mic_none'}</span>
                        <span>{isMicOn ? 'Đang Thu Âm...' : 'Bật Voice Speech'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Interactive Candidate Camera PIP preview & Voice waves */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center font-sans">
                    {/* Simulated / Real Candidate Feed */}
                    <div className="sm:col-span-5 relative rounded-2xl overflow-hidden bg-[#1e1b4b] border border-purple-100 aspect-video sm:aspect-auto sm:h-36 flex items-center justify-center shadow-sm group">
                      {isCamOn ? (
                        <>
                          <video 
                            ref={videoPreviewRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform -scale-x-100"
                          />
                          {/* Face tracking reticle overlay */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-20 h-24 border border-dashed border-purple-300 rounded-2xl relative animate-pulse">
                              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-purple-300"></span>
                              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-purple-300"></span>
                              <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-purple-300"></span>
                              <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-300"></span>
                            </div>
                          </div>
                          {/* HUD Badges */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1e1b4b]/80 backdrop-blur-md text-[9px] font-mono text-white font-bold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                            AI VISION: TRACKING
                          </div>
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-[#1e1b4b]/80 backdrop-blur-md text-[9px] font-mono text-white/80">
                            1080P • 60 FPS
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 space-y-1">
                          <span className="material-symbols-outlined text-3xl text-purple-300/40">videocam_off</span>
                          <p className="text-[11px] text-purple-200/60 font-mono">Camera đang tắt</p>
                        </div>
                      )}
                    </div>

                    {/* STAR Quick Scaffold Inserter Bar */}
                    <div className="sm:col-span-7 bg-[#f8f7ff] rounded-2xl p-3 border border-purple-100 space-y-2 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-sans text-[#1e1b4b] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#f97316]">auto_fix_high</span>
                          Chèn Mẫu Cấu Trúc Trả Lời (STAR):
                        </span>
                        <span className="text-[10px] text-slate-400">1-Click</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button 
                          onClick={() => insertStarScaffold('S')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-[11px] font-sans text-[#f97316] text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Bối cảnh / Tình huống (Situation)"
                        >
                          + [S] Tình huống
                        </button>
                        <button 
                          onClick={() => insertStarScaffold('T')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-[11px] font-sans text-[#5b48bd] text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Nhiệm vụ cốt lõi (Task)"
                        >
                          + [T] Nhiệm vụ
                        </button>
                        <button 
                          onClick={() => insertStarScaffold('A')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-[11px] font-sans text-[#10b981] text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Hành động 3 bước (Action)"
                        >
                          + [A] Hành động
                        </button>
                        <button 
                          onClick={() => insertStarScaffold('R')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-100 text-[11px] font-sans text-[#f97316] text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Kết quả số liệu (Result)"
                        >
                          + [R] Kết quả &amp; KPI
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Rich Textarea Workspace */}
                  <div className="space-y-2 font-sans">
                    <div className="relative">
                      <textarea
                        rows={7}
                        placeholder="Nhập hoặc nói câu trả lời chi tiết của bạn tại đây... Hãy làm rõ: Tình huống cụ thể, vai trò của bạn, các công cụ/quy trình đã dùng và số liệu kết quả định lượng đạt được."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        className="w-full bg-[#f8f7ff] border border-purple-100 focus:border-[#5b48bd] focus:bg-white rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-[#1e1b4b] font-semibold placeholder:text-slate-400 focus:outline-none leading-relaxed resize-none shadow-sm transition-all font-sans"
                      />
                      {currentAnswer && (
                        <button
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa câu trả lời hiện tại để viết lại?')) {
                              setCurrentAnswer('');
                            }
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all text-xs cursor-pointer border border-purple-100"
                          title="Xóa nội dung trả lời"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>

                    {/* Bottom Status Bar of Answer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 font-sans">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-600 font-bold">
                          {currentAnswer.length} ký tự
                        </span>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <div className="w-24 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                currentAnswer.length < 50 ? 'bg-amber-400' : currentAnswer.length < 200 ? 'bg-emerald-400' : 'bg-[#32247b]'
                              }`}
                              style={{ width: `${Math.min(100, (currentAnswer.length / 300) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-sans text-slate-500 font-semibold">
                            {currentAnswer.length < 50 ? 'Cần thêm ý' : currentAnswer.length < 200 ? 'Khá tốt' : '✓ Độ sâu tuyệt vời'}
                          </span>
                        </div>
                      </div>

                      {/* Next / Submit CTA Button */}
                      <button
                        onClick={handleNext}
                        disabled={isAiTyping}
                        className="rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm uppercase tracking-wider font-extrabold shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 bg-[#32247b] text-white hover:bg-[#271a66] transition-all font-sans"
                      >
                        {isAiTyping ? (
                          <>
                            <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                            <span>Đang Xử Lý...</span>
                          </>
                        ) : currentIdx < questions.length - 1 ? (
                          <>
                            <span>Chuyển Sang Câu Kế Tiếp</span>
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                          </>
                        ) : (
                          <>
                            <span>Hoàn Thành &amp; Chấm Điểm AI</span>
                            <span className="material-symbols-outlined text-base">auto_awesome</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                </>
                )}
              </div>

              {/* RIGHT STAGE: REAL-TIME TELEMETRY & COACHING MATRIX (4 Columns) */}
              <div className="lg:col-span-4 space-y-5 font-sans">
                
                {/* 2.3 REAL-TIME AI TELEMETRY PANEL */}
                <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-sm space-y-4 transition-all duration-300 font-sans">
                  
                  {/* Tab Selector inside Telemetry */}
                  <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                    <span className="text-xs font-sans font-extrabold text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#f97316]">query_stats</span>
                      Tín Hiệu Đo Lường Trực Tiếp
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold">
                      ACTIVE
                    </span>
                  </div>

                  {/* Meter 1: STAR Structure Completion Gauge */}
                  {(() => {
                    const starSignals = detectStarSignals(currentAnswer);
                    return (
                      <div className="bg-[#f8f7ff] rounded-2xl p-4 border border-purple-100 space-y-2.5 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-sans text-[#1e1b4b] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-[#f97316]">verified</span>
                            Chỉ số cấu trúc STAR
                          </span>
                          <span className="text-sm font-sans font-extrabold text-[#1e1b4b]">
                            {starSignals.score}%
                          </span>
                        </div>

                        <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-[#32247b]"
                            style={{
                              width: `${starSignals.score}%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono text-center">
                          <span className={`p-1 rounded-lg border ${starSignals.s ? 'bg-[#32247b] text-white border-[#32247b] font-bold' : 'bg-white border-purple-100 text-slate-400 font-semibold'}`}>
                            S {starSignals.s ? '✓' : '...'}
                          </span>
                          <span className={`p-1 rounded-lg border ${starSignals.t ? 'bg-[#32247b] text-white border-[#32247b] font-bold' : 'bg-white border-purple-100 text-slate-400 font-semibold'}`}>
                            T {starSignals.t ? '✓' : '...'}
                          </span>
                          <span className={`p-1 rounded-lg border ${starSignals.a ? 'bg-[#32247b] text-white border-[#32247b] font-bold' : 'bg-white border-purple-100 text-slate-400 font-semibold'}`}>
                            A {starSignals.a ? '✓' : '...'}
                          </span>
                          <span className={`p-1 rounded-lg border ${starSignals.r ? 'bg-[#32247b] text-white border-[#32247b] font-bold' : 'bg-white border-purple-100 text-slate-400 font-semibold'}`}>
                            R {starSignals.r ? '✓' : '...'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Meter 2: Detected Domain Keywords */}
                  {(() => {
                    const detectedKws = getDetectedKeywords(currentAnswer, selectedDomain?.id);
                    return (
                      <div className="bg-[#f8f7ff] rounded-2xl p-4 border border-purple-100 space-y-2 font-sans">
                        <span className="text-xs font-sans text-[#1e1b4b] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#5b48bd]">label</span>
                          Từ khóa chuyên môn bắt được ({detectedKws.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5 min-h-[38px]">
                          {detectedKws.length > 0 ? (
                            detectedKws.map((kw, idx) => (
                              <span 
                                key={idx} 
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-purple-100 text-[#5b48bd] border border-purple-200 shadow-sm"
                              >
                                ✓ {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Chưa phát hiện từ khóa chuyên ngành. Hãy nhắc đến các công cụ &amp; chỉ số thực tế.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Meter 3: Contextual AI Advice */}
                  <div className="bg-[#f8f7ff] rounded-2xl p-4 border border-purple-100 space-y-1.5 font-sans">
                    <span className="text-xs font-sans text-[#f97316] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      Lời khuyên từ {getPersona(selectedDomain?.id).name}:
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                      {getPersona(selectedDomain?.id).greeting} Hãy trả lời súc tích và kết thúc bằng một chỉ số định lượng cụ thể.
                    </p>
                  </div>
                </div>

                {/* 2.4 QUESTION NAVIGATOR & TIMELINE PREVIEW */}
                <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-sm space-y-3 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="text-xs font-sans font-extrabold text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#f97316]">format_list_numbered</span>
                      Lộ Trình Buổi Phỏng Vấn
                    </span>
                    <span className="bg-purple-100 text-[#5b48bd] border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold">
                      {questions.length} Câu
                    </span>
                  </div>

                  <div className="space-y-2 font-sans">
                    {questions.map((q, idx) => {
                      const isPast = idx < currentIdx;
                      const isNow = idx === currentIdx;
                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-2xl border text-xs transition-all flex items-start gap-2.5 font-sans ${
                            isNow 
                              ? 'bg-[#32247b] text-white border-[#32247b] font-bold shadow-sm' 
                              : isPast 
                              ? 'bg-[#f8f7ff] border-purple-100 text-[#1e1b4b] font-semibold' 
                              : 'bg-white border-purple-100 text-slate-400'
                          }`}
                        >
                          <span 
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                              isNow 
                                ? 'bg-[#f97316] text-white font-bold' 
                                : isPast 
                                ? 'bg-purple-100 text-[#5b48bd] font-bold' 
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isPast ? '✓' : idx + 1}
                          </span>
                          <span className="line-clamp-2 leading-snug">
                            {q}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* AI GRADING SPINNER & BRAINWAVE SIMULATION */
            <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center space-y-6 shadow-sm transition-all duration-300 my-8 font-sans">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#f97316] animate-spin" style={{ animationDuration: '8s' }}></div>
                <div className="w-full h-full rounded-full bg-[#f8f7ff] flex items-center justify-center border border-purple-100">
                  <span className="material-symbols-outlined text-5xl text-[#f97316] animate-pulse">psychology</span>
                </div>
              </div>
              
              <div className="space-y-2 max-w-lg mx-auto font-sans">
                <h3 className="text-2xl font-sans font-extrabold text-[#1e1b4b] tracking-wide">
                  Hệ Thống Synthia AI Đang Chấm Điểm Chuyên Sâu...
                </h3>
                <p className="text-sm text-slate-600 font-sans leading-relaxed">
                  Đang bóc tách từng luận điểm, đối chiếu khung năng lực STAR và tự động tổng hợp báo cáo chẩn đoán điểm mạnh &amp; điểm yếu.
                </p>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* 3. VIEW RESULT (KẾT QUẢ VỪA THI XONG)                                  */}
      {/* ===================================================================== */}
      {view === 'result' && result && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-7 animate-fadeIn font-sans">
          {/* Top Banner Điểm Số */}
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="w-28 h-28 rounded-full mx-auto flex flex-col items-center justify-center border-4 border-purple-100 bg-[#f8f7ff] shadow-sm">
              <span className="font-sans font-extrabold text-4xl text-[#1e1b4b]">
                {result.totalScore}
              </span>
              <span className="text-[10px] font-mono text-slate-500">/100 Điểm</span>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Đánh Giá Tổng Quan Từ AI</div>
              <div className="text-2xl sm:text-3xl font-sans font-extrabold mt-1 text-[#1e1b4b]">
                Xếp Loại: <span className="text-[#f97316]">{result.grade}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-600 font-medium">
              <span className="px-3.5 py-1 rounded-full bg-[#f8f7ff] border border-purple-100">Chủ đề: <strong className="text-[#1e1b4b] font-bold">{result.topic}</strong></span>
              <span className="px-3.5 py-1 rounded-full bg-[#f8f7ff] border border-purple-100">Thời gian: <strong className="text-[#1e1b4b] font-bold">{result.duration}</strong></span>
              <span className="px-3.5 py-1 rounded-full bg-[#f8f7ff] border border-purple-100">Cấp bậc: <strong className="text-[#1e1b4b] font-bold">{result.level}</strong></span>
            </div>

            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">{result.aiSummary}</p>

            <div className="pt-2 flex flex-wrap justify-center gap-3 font-sans">
              <button
                onClick={() => {
                  setSelectedHistorySession(result);
                  setView('history');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#32247b] hover:bg-[#271a66] text-white rounded-full px-6 py-2.5 text-xs uppercase font-extrabold shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-base">analytics</span>
                Xem Toàn Bộ Chi Tiết Lỗi Sai &amp; Câu Trả Lời Mẫu
              </button>
              <button
                onClick={() => {
                  setView('setup');
                }}
                className="bg-[#f8f7ff] hover:bg-purple-50 text-[#1e1b4b] border border-purple-100 rounded-full px-5 py-2.5 text-xs uppercase font-extrabold flex items-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Luyện Lại Chủ Đề Khác
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 4. VIEW HISTORY & BÁO CÁO CHI TIẾT LỖI SAI / GỢI Ý CÂU TRẢ LỜI MẪU     */}
      {/* ===================================================================== */}
      {view === 'history' && !selectedHistorySession && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 animate-fadeIn font-sans">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#5b48bd] border border-purple-200">
              <span className="material-symbols-outlined text-sm text-[#5b48bd]">history</span>
              <span className="text-[11px] font-extrabold uppercase">Nhật Ký Các Buổi Phỏng Vấn AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#1e1b4b]">
              Lịch Sử Bài Phỏng Vấn &amp; Đánh Giá Chi Tiết
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Chọn bất kỳ buổi phỏng vấn nào để mở <strong className="text-[#1e1b4b] font-bold">Trang Phân Tích Chuyên Sâu</strong>: chỉ rõ chi tiết lỗi sai từng câu, lý do bị trừ điểm và gợi ý câu trả lời mẫu điểm 10 theo mô hình STAR.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1 font-sans">
            {[
              { id: 'ALL', label: 'Tất cả lĩnh vực (' + historyList.length + ')' },
              { id: 'kinh-te', label: 'Kinh tế & Tài chính' },
              { id: 'marketing', label: 'Marketing & Digital' },
              { id: 'sales', label: 'B2B Sales' },
              { id: 'hr', label: 'Nhân sự HR' },
              { id: 'it-software', label: 'Công nghệ IT' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setHistFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold cursor-pointer border transition-all ${
                  histFilter === f.id
                    ? 'bg-[#32247b] text-white border-[#32247b] shadow-sm'
                    : 'bg-[#f8f7ff] text-[#1e1b4b] border-purple-100 hover:bg-purple-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Danh Sách Các Buổi Đã Thi */}
          <div className="space-y-4 font-sans">
            {historyList
              .filter((s) => histFilter === 'ALL' || s.domainId === histFilter || s.domain.toLowerCase().includes(histFilter.toLowerCase()))
              .map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 transition-all hover:border-[#5b48bd] space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 border-purple-100 bg-[#f8f7ff] font-sans font-extrabold text-xl text-[#1e1b4b] shadow-sm"
                      >
                        {session.totalScore}
                        <span className="text-[9px] font-mono font-normal opacity-70">/100</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-sans font-extrabold text-base text-[#1e1b4b]">{session.topic}</h3>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#5b48bd] border border-purple-200"
                          >
                            {session.grade}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="text-[#f97316] font-bold">{session.domain}</span>
                          <span>•</span>
                          <span>Cấp độ: {session.level}</span>
                          <span>•</span>
                          <span>Thời lượng: {session.duration}</span>
                          <span>•</span>
                          <span>{session.date}</span>
                          <span className="font-mono text-[#1e1b4b] font-bold">#{session.id}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-2 font-medium">
                          {session.aiSummary}
                        </p>
                      </div>
                    </div>

                    <div className="sm:shrink-0 flex sm:flex-col items-end justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedHistorySession(session);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-[#32247b] hover:bg-[#271a66] text-white rounded-full w-full sm:w-auto px-5 py-2.5 font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Mở Báo Cáo Chi Tiết Lỗi Sai</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Mini Progress Pills */}
                  <div className="pt-3 border-t border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                    <div className="bg-[#f8f7ff] rounded-2xl p-2.5 border border-purple-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Chuyên Môn Ngành:</div>
                      <div className="font-extrabold text-[#1e1b4b] mt-0.5">{session.competencies?.domainKnowledge || 80}%</div>
                    </div>
                    <div className="bg-[#f8f7ff] rounded-2xl p-2.5 border border-purple-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Tư Duy Giải Quyết:</div>
                      <div className="font-extrabold text-[#1e1b4b] mt-0.5">{session.competencies?.problemSolving || 75}%</div>
                    </div>
                    <div className="bg-[#f8f7ff] rounded-2xl p-2.5 border border-purple-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Cấu Trúc STAR:</div>
                      <div className="font-extrabold text-[#1e1b4b] mt-0.5">{session.competencies?.structureSTAR || 70}%</div>
                    </div>
                    <div className="bg-[#f8f7ff] rounded-2xl p-2.5 border border-purple-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Độ Tự Tin &amp; Phong Thái:</div>
                      <div className="font-extrabold text-[#1e1b4b] mt-0.5">{session.competencies?.deliveryTone || 80}%</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </main>
      )}

      {/* ===================================================================== */}
      {/* 4B. TRANG CHI TIẾT ĐÁNH GIÁ CHUYÊN SÂU & GỢI Ý CẢI THIỆN TỪNG CÂU       */}
      {/* ===================================================================== */}
      {view === 'history' && selectedHistorySession && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-7 animate-fadeIn font-sans">
          {/* Top Breadcrumb & Back */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => {
                setSelectedHistorySession(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-[#f8f7ff] hover:bg-purple-50 text-[#1e1b4b] border border-purple-100 rounded-full inline-flex items-center gap-2 px-5 py-2 text-xs font-extrabold transition-all cursor-pointer w-fit"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Quay Lại Danh Sách Lịch Sử
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedDomain(DOMAINS.find((d) => d.id === selectedHistorySession.domainId) || DOMAINS[0]);
                  setCustomTopic(selectedHistorySession.topic);
                  setSelectedLevel(selectedHistorySession.level.toLowerCase().includes('senior') ? 'senior' : 'middle');
                  setView('setup');
                }}
                className="bg-[#32247b] hover:bg-[#271a66] text-white rounded-full px-4 py-2 text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">model_training</span>
                Luyện Lại Chủ Đề Này
              </button>
              <button
                onClick={() => showToast('Đang tạo file PDF Báo cáo đánh giá chi tiết...')}
                className="bg-[#f8f7ff] hover:bg-purple-50 text-[#1e1b4b] border border-purple-100 rounded-full px-4 py-2 text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Xuất Báo Cáo PDF
              </button>
            </div>
          </div>

          {/* Banner Thông Tin Bài Phỏng Vấn */}
          <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-7 shadow-sm relative overflow-hidden font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-[#5b48bd] border border-purple-200">
                    {selectedHistorySession.grade}
                  </span>
                  <span className="text-xs font-mono text-slate-500">Mã hồ sơ: #{selectedHistorySession.id}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-[#1e1b4b]">
                  {selectedHistorySession.topic}
                </h1>
                <div className="flex flex-wrap gap-3 text-xs text-slate-600 font-medium">
                  <span>Ngành: <strong className="text-[#f97316] font-bold">{selectedHistorySession.domain}</strong></span>
                  <span>•</span>
                  <span>Cấp bậc: <strong className="text-[#1e1b4b] font-bold">{selectedHistorySession.level}</strong></span>
                  <span>•</span>
                  <span>Thời lượng: <strong className="text-[#1e1b4b] font-bold">{selectedHistorySession.duration}</strong></span>
                  <span>•</span>
                  <span>Ngày thi: <strong className="text-[#1e1b4b] font-bold">{selectedHistorySession.date}</strong></span>
                </div>
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shrink-0 border-4 border-purple-100 bg-[#f8f7ff] shadow-sm">
                <span className="font-sans font-extrabold text-3xl sm:text-4xl text-[#1e1b4b]">
                  {selectedHistorySession.totalScore}
                </span>
                <span className="text-[10px] font-mono text-slate-500">/100 ĐIỂM</span>
              </div>
            </div>
          </section>

          {/* 4 Trụ Cột Năng Lực Đo Lường Bằng AI */}
          <section className="space-y-3 font-sans">
            <h2 className="font-sans font-extrabold text-base text-[#1e1b4b] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f97316]">speed</span>
              Đánh Giá 4 Trụ Cột Năng Lực Cốt Lõi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  label: 'Kiến Thức Chuyên Môn',
                  score: selectedHistorySession.competencies?.domainKnowledge || 80,
                  desc: 'Độ chính xác thuật ngữ & nguyên lý ngành',
                  color: '#32247b',
                },
                {
                  label: 'Tư Duy Giải Quyết Vấn Đề',
                  score: selectedHistorySession.competencies?.problemSolving || 75,
                  desc: 'Tính khả thi & kinh nghiệm thực chiến',
                  color: '#5b48bd',
                },
                {
                  label: 'Cấu Trúc Trả Lời (STAR)',
                  score: selectedHistorySession.competencies?.structureSTAR || 70,
                  desc: 'Mạch lạc, có số liệu & minh chứng',
                  color: '#f97316',
                },
                {
                  label: 'Phong Thái & Thuyết Phục',
                  score: selectedHistorySession.competencies?.deliveryTone || 80,
                  desc: 'Tự tin, chuyên nghiệp & đĩnh đạc',
                  color: '#10b981',
                },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-2xl border border-purple-100 p-4 space-y-2 shadow-sm font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-extrabold text-[#1e1b4b]">{c.label}</span>
                    <span className="font-sans font-extrabold text-sm text-[#1e1b4b]">
                      {c.score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: c.score + '%', backgroundColor: c.color }} />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug font-medium">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bảng Đánh Giá Cốt Lõi: Điểm Mạnh, Lỗi Sai & Lộ Trình Cải Thiện */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
            {/* Điểm Mạnh */}
            <div className="bg-white rounded-3xl border border-purple-100 p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#10b981]">
                <span className="material-symbols-outlined text-lg">verified</span>
                <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-[#1e1b4b]">Điểm Sáng Nổi Bật</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                {(selectedHistorySession.strengths || [
                  'Nắm được các khái niệm chuyên môn nền tảng.',
                  'Tác phong trả lời tự tin, giao tiếp gãy gọn.',
                ]).map((st, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#10b981] font-bold">✓</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lỗi Sai & Thiếu Sót */}
            <div className="bg-orange-50/60 rounded-3xl border border-orange-200/80 p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#f97316]">
                <span className="material-symbols-outlined text-lg">warning</span>
                <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-[#f97316]">Lỗi Sai Cần Sửa Ngay</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed font-medium">
                {(selectedHistorySession.criticalFlaws || [
                  'Câu trả lời còn mang tính chung chung, thiếu số liệu định lượng.',
                  'Chưa tuân thủ cấu trúc STAR dẫn đến việc thiếu kết quả đo lường.',
                ]).map((fl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#f97316] font-bold">✕</span>
                    <span>{fl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lộ Trình Cải Thiện */}
            <div className="bg-white rounded-3xl border border-purple-100 p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#5b48bd]">
                <span className="material-symbols-outlined text-lg">route</span>
                <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-[#1e1b4b]">Hành Động Khắc Phục</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                {(selectedHistorySession.improvementPlan || [
                  'Học thuộc các từ khóa chuyên ngành theo gợi ý bên dưới.',
                  'Luyện lại câu hỏi tình huống với số liệu doanh thu/chi phí cụ thể.',
                ]).map((pl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#5b48bd] font-bold">→</span>
                    <span>{pl}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Phân Tích Chi Tiết Từng Câu Hỏi & Gợi Ý Câu Trả Lời Mẫu */}
          <section className="space-y-6 pt-2 font-sans">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans font-extrabold text-lg text-[#1e1b4b] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f97316]">quiz</span>
                  Phân Tích Chi Tiết Từng Câu Hỏi &amp; Gợi Ý Trả Lời Chuẩn Điểm 10
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Dưới đây là lời phân tích chi tiết của AI: chỉ rõ vì sao bạn bị trừ điểm và cách trả lời chuẩn mực giúp ghi điểm tối đa với nhà tuyển dụng.
                </p>
              </div>
              <span className="bg-purple-100 text-[#5b48bd] border border-purple-200 px-3 py-1 rounded-full text-xs font-bold">
                {selectedHistorySession.questions.length} Câu Hỏi
              </span>
            </div>

            <div className="space-y-6">
              {selectedHistorySession.questions.map((item, idx) => {
                const c = scoreColor(item.score);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm font-sans"
                  >
                    {/* Header Câu Hỏi */}
                    <div className="p-5 sm:p-6 border-b border-purple-100 bg-[#f8f7ff] space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 shadow-sm bg-[#32247b] text-white"
                          >
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-sans uppercase tracking-wider text-slate-500 font-bold">
                            Mục tiêu đánh giá: <strong className="text-[#1e1b4b]">{item.intent || 'Năng lực chuyên môn và xử lý tình huống'}</strong>
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-sans font-extrabold text-[#1e1b4b]">
                            {item.score}
                            <span className="text-xs font-normal text-slate-400">/100</span>
                          </div>
                          <div className="w-24 h-1.5 bg-purple-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: item.score + '%', backgroundColor: c }} />
                          </div>
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-sans font-extrabold text-[#1e1b4b] leading-relaxed pt-1">
                        "{item.q}"
                      </h3>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                      {/* 1. Câu Trả Lời Của Bạn */}
                      <div className="bg-[#f8f7ff] rounded-2xl p-4 border border-purple-100 space-y-1.5">
                        <div className="text-[11px] font-sans font-bold text-slate-600 uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-[#5b48bd]">person</span>
                          Câu Trả Lời Thực Tế Của Bạn:
                        </div>
                        <p className="text-xs sm:text-sm text-[#1e1b4b] leading-relaxed italic font-medium">
                          "{item.answer}"
                        </p>
                      </div>

                      {/* 2. AI Bóc Tách Lỗi Sai & Nguyên Nhân Bị Trừ Điểm */}
                      <div className="bg-orange-50/80 rounded-2xl p-4 border border-orange-200/80 space-y-2.5">
                        <div className="text-[11px] font-sans font-bold text-[#f97316] uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">error</span>
                          Phân Tích Chi Tiết Lỗi Sai &amp; Thiếu Sót (AI Diagnostic):
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {item.criticalFeedback?.flaws || 'Câu trả lời còn thiếu các ý then chốt và chưa áp dụng mô hình STAR để chứng minh kết quả.'}
                        </p>
                        {item.criticalFeedback?.interviewerImpression && (
                          <div className="text-[11px] text-slate-600 pt-1 border-t border-orange-200 flex items-start gap-1.5 font-medium">
                            <strong className="shrink-0 text-[#f97316]">Góc nhìn Nhà Tuyển Dụng:</strong>
                            <span>{item.criticalFeedback.interviewerImpression}</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Gợi Ý Câu Trả Lời Mẫu Chuẩn Điểm 10 (Model Answer) */}
                      <div className="bg-white rounded-2xl p-5 border border-purple-100 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-sans font-bold text-[#1e1b4b] uppercase flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#f97316]">auto_awesome</span>
                            Gợi Ý Cách Trả Lời Chuẩn Điểm 10 (Mô Hình STAR / Chuẩn Ngành):
                          </div>
                          <span className="bg-purple-100 text-[#5b48bd] border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            Model Answer
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-[#1e1b4b] leading-relaxed whitespace-pre-line font-sans bg-[#f8f7ff] p-4 rounded-xl border border-purple-100 font-medium">
                          {item.modelAnswer || 'Áp dụng mô hình STAR với số liệu định lượng cụ thể để thuyết phục người phỏng vấn.'}
                        </div>

                        {/* Từ khóa đắt giá */}
                        {item.goldenKeywords && item.goldenKeywords.length > 0 && (
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Thuật Ngữ Vàng Nên Đưa Vào:</span>
                            {item.goldenKeywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5b48bd] border border-purple-200 text-[10px] font-mono font-bold"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
              <button
                onClick={() => {
                  setSelectedHistorySession(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#f8f7ff] hover:bg-purple-50 text-[#1e1b4b] border border-purple-100 rounded-full w-full sm:w-auto px-6 py-3 text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Trở Về Danh Sách Lịch Sử
              </button>

              <button
                onClick={() => {
                  setSelectedDomain(DOMAINS.find((d) => d.id === selectedHistorySession.domainId) || DOMAINS[0]);
                  setCustomTopic(selectedHistorySession.topic);
                  setSelectedLevel(selectedHistorySession.level.toLowerCase().includes('senior') ? 'senior' : 'middle');
                  setView('setup');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#32247b] hover:bg-[#271a66] text-white rounded-full w-full sm:w-auto px-8 py-3 text-xs uppercase tracking-wider font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">replay</span>
                Luyện Lại Bài Phỏng Vấn Này Để Nâng Điểm
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
