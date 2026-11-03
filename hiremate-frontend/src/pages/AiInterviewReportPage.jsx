import React, { useState, useEffect, useRef } from 'react';
import interviewApi from '../api/interviewApi';

const HIREMATE_LOGO_URL = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80';

/**
 * Danh mục Từ Khóa Chuyên Ngành Đa Lĩnh Vực (Industry Taxonomy Dictionary)
 * Giúp nhận diện chính xác thuật ngữ của từng vị trí (Marketing, Kế toán, HR, BA, Sales, IT...)
 * Thay thế triệt để các chuỗi IT hardcode.
/**
 * Làm sạch chuỗi Tên vị trí:
 * Xóa bỏ các nhãn [TECHNICAL], [HR], [CUSTOM], [BEHAVIORAL]...
 * Xóa tiền tố cấp bậc bị lặp ở đầu (ví dụ: "Middle Senior BrSE" -> "Senior BrSE", "Junior Middle Backend" -> "Middle Backend")
 */
export const cleanTopicName = (rawTopic = '') => {
  if (!rawTopic || typeof rawTopic !== 'string') return 'Chuyên Viên';

  // 1. Xóa bỏ các nhãn trong ngoặc vuông
  let cleaned = rawTopic.replace(/\[.*?\]/g, '').trim();

  // 2. Chuẩn hóa khoảng trắng thừa
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 3. Xử lý trường hợp lặp tiền tố cấp bậc ở đầu chuỗi (ví dụ: "Middle Senior...", "Junior Middle...")
  cleaned = cleaned.replace(/^(intern|fresher|junior|middle)\s+(senior|lead|principal|middle)\b/i, (match, p1, p2) => {
    return p2.charAt(0).toUpperCase() + p2.slice(1);
  });

  return cleaned.trim() || 'Chuyên Viên';
};

/**
 * Danh mục Từ Khóa Chuyên Ngành Đa Lĩnh Vực (Industry Taxonomy Dictionary)
 * Giúp nhận diện chính xác thuật ngữ của từng vị trí (BrSE, QA, Backend, Frontend, Marketing, HR, BA, Sales...)
 */
export const INDUSTRY_TAXONOMY = {
  brse: {
    categoryName: 'Kỹ Sư Cầu Nối (BrSE) & Quản Trị Dự Án IT',
    keywords: [
      'Basic Design (Kihon Sekkei)', 'Detail Design (Shosai Sekkei)', 'Q&A Spec',
      'Hou-Ren-So', 'Quản lý thay đổi (Change Request)', 'Impact Analysis',
      'UAT', 'Offshore Coordination', 'System Architecture', 'SQL & API Spec'
    ],
    metricsTerm: 'Tỷ lệ giao hàng đúng hạn (On-time Delivery %), Tỷ lệ lỗi sau bàn giao (Leakage Bug %), Hiệu suất xử lý Q&A Spec',
    coreConcepts: 'Phân tích yêu cầu khách hàng Nhật, Thiết kế tài liệu kỹ thuật (Kihon/Shosai Sekkei), Điều phối Offshore & văn hóa Hou-Ren-So',
    troubleshootConcepts: 'Xử lý lệch hiểu spec giữa khách Nhật và dev, Quản lý rủi ro chậm tiến độ (Schedule Delay), Đàm phán Change Request',
  },
  qa: {
    categoryName: 'Kiểm Thử Phần Mềm (QA/QC)',
    keywords: [
      'Test Case', 'Automation Testing', 'Selenium/Playwright', 'API Testing (Postman)',
      'Regression Testing', 'Bug Life Cycle', 'Performance/Load Testing', 'Jira',
      'Integration Testing', 'CI/CD Test Pipeline', 'Test Plan', 'Security Testing'
    ],
    metricsTerm: 'Độ bao phủ kiểm thử (Test Coverage %), Số lượng bug phát hiện, Thời gian thực thi test suite',
    coreConcepts: 'Xây dựng kịch bản kiểm thử, Tự động hóa quy trình kiểm tra hồi quy, Quản lý vòng đời lỗi',
    troubleshootConcepts: 'Cô lập nguyên nhân lỗi chập chờn (Flaky Tests), Tối ưu thời gian chạy bộ test tự động',
  },
  frontend: {
    categoryName: 'Frontend Engineering',
    keywords: [
      'React', 'Vue', 'TypeScript', 'State Management (Redux/Zustand)', 'CSS/Tailwind',
      'Responsive Web', 'DOM Performance', 'REST/GraphQL', 'Next.js', 'Web Vitals',
      'Component Lifecycle', 'Vite/Webpack', 'Accessibility (a11y)'
    ],
    metricsTerm: 'Thời gian tải trang (LCP < 2.5s, FID < 100ms), Tỷ lệ render time, Kích thước bundle KB',
    coreConcepts: 'Kiến trúc Component tái sử dụng, Quản trị trạng thái tập trung, Tối ưu trải nghiệm UX/UI',
    troubleshootConcepts: 'Khắc phục hiện tượng re-render thừa, Tối ưu bộ nhớ trên trình duyệt, Xử lý tương thích đa thiết bị',
  },
  backend: {
    categoryName: 'Backend & Kiến Trúc Hệ Thống',
    keywords: [
      'Microservices', 'RESTful API', 'Database', 'Transaction ACID', 'Indexing',
      'Redis Cache', 'Docker', 'CI/CD', 'Kafka/RabbitMQ', 'Query Optimization',
      'High Availability', 'Spring Boot/Node.js/Go', 'Security (JWT/OAuth2)'
    ],
    metricsTerm: 'Độ trễ API (p99 latency < 50ms), Thông lượng (TPS/RPS), Tỷ lệ uptime (99.9%)',
    coreConcepts: 'Thiết kế kiến trúc phân tán, Quản trị cơ sở dữ liệu & Caching, Bảo mật API & Xác thực',
    troubleshootConcepts: 'Xử lý tắc nghẽn truy vấn, Khắc phục Deadlock DB, Phân tích đánh đổi giữa tính nhất quán và tính sẵn sàng',
  },
  data: {
    categoryName: 'Data & Trí Tuệ Nhân Tạo (AI/ML)',
    keywords: [
      'Python', 'SQL', 'ETL Pipeline', 'Pandas/NumPy', 'Machine Learning',
      'Data Warehousing', 'BigQuery/Snowflake', 'Model Evaluation', 'Feature Engineering',
      'Data Cleaning', 'Dashboard (PowerBI/Tableau)', 'Deep Learning'
    ],
    metricsTerm: 'Độ chính xác mô hình (Accuracy, F1-score > 0.85), Thời gian xử lý batch pipeline, Độ trễ suy luận',
    coreConcepts: 'Xây dựng luồng trích xuất dữ liệu, Huấn luyện & tối ưu mô hình máy học, Trực quan hóa dữ liệu',
    troubleshootConcepts: 'Khắc phục hiện tượng overfitting, Xử lý mất mát dữ liệu hoặc trôi dạt phân phối (Data Drift)',
  },
  ba: {
    categoryName: 'Business Analyst (Phân Tích Nghiệp Vụ)',
    keywords: [
      'User Story', 'BRD/SRS', 'Use Case', 'BPMN/Flowchart', 'UML',
      'Requirement Elicitation', 'Stakeholder Management', 'Acceptance Criteria',
      'Gap Analysis', 'Agile/Scrum', 'Backlog Refinement', 'Wireframe', 'UAT'
    ],
    metricsTerm: 'Độ bao phủ yêu cầu (%), Tỷ lệ thay đổi scope (Scope Creep %), Tỷ lệ chấp thuận UAT',
    coreConcepts: 'Khai thác & phân tích yêu cầu nghiệp vụ, Viết tài liệu đặc tả, Quản lý kỳ vọng đối tác',
    troubleshootConcepts: 'Giải quyết mâu thuẫn yêu cầu giữa các bên, Tối ưu luồng quy trình nghiệp vụ phức tạp',
  },
  marketing: {
    categoryName: 'Marketing & Truyền Thông',
    keywords: [
      'SEO', 'SEM', 'Content Strategy', 'Conversion Rate (CR)', 'CAC', 'LTV',
      'ROAS', 'Google Analytics', 'A/B Testing', 'Social Media Ads', 'Lead Generation',
      'Phễu Chuyển Đổi', 'Target Audience', 'Brand Awareness', 'CTR', 'Inbound Marketing'
    ],
    metricsTerm: 'Conversion Rate (%), CAC, ROAS, CTR (%), CPL, Tỷ lệ rời bỏ (Churn Rate)',
    coreConcepts: 'Chiến lược nội dung, Phễu chuyển đổi, Đo lường hiệu quả chiến dịch',
    troubleshootConcepts: 'Tối ưu chi phí chuyển đổi, Giảm tỷ lệ thoát trang (Bounce Rate), Xử lý khủng hoảng truyền thông',
  },
  accounting: {
    categoryName: 'Tài Chính & Kế Toán',
    keywords: [
      'Báo cáo tài chính', 'Bảng cân đối kế toán', 'Dòng tiền (Cashflow)', 'Thuế GTGT',
      'Thuế TNDN', 'Chuẩn mực VAS/IFRS', 'Quyết toán thuế', 'Kiểm soát nội bộ',
      'Khấu hao tài sản', 'EBITDA', 'Công nợ', 'Đối chiếu sổ sách', 'Chi phí dở dang'
    ],
    metricsTerm: 'Biên lợi nhuận (%), Dòng tiền thuần, Tỷ lệ nợ/Vốn chủ sở hữu, Số ngày thu tiền bình quân',
    coreConcepts: 'Lập báo cáo tài chính, Kiểm soát dòng tiền, Tuân thủ chuẩn mực kế toán và luật thuế',
    troubleshootConcepts: 'Xử lý chênh lệch số dư, Kiểm soát rủi ro truy thu thuế, Tối ưu dòng tiền hoạt động',
  },
  sales: {
    categoryName: 'Kinh Doanh & Bán Hàng (Sales/BD)',
    keywords: [
      'Sales Funnel', 'Chốt hợp đồng (Closing)', 'Xử lý từ chối (Objection Handling)',
      'CRM', 'Doanh số (Quota)', 'Cold Outreach', 'B2B/B2C', 'Upsell/Cross-sell',
      'Đàm phán giá', 'Lead Nurturing', 'Khách hàng tiềm năng', 'Pipeline Management'
    ],
    metricsTerm: 'Doanh số thực đạt so với KPI (%), Tỷ lệ chốt đơn (Win Rate %), Giá trị đơn trung bình (AOV)',
    coreConcepts: 'Quản trị phễu khách hàng, Kỹ năng đàm phán & chốt hợp đồng, Chăm sóc khách hàng sau bán',
    troubleshootConcepts: 'Xử lý khi khách hàng phàn nàn về giá, Khôi phục quan hệ khách hàng có nguy cơ rời bỏ',
  },
  hr: {
    categoryName: 'Nhân Sự & Tuyển Dụng (HR)',
    keywords: [
      'Quy trình tuyển dụng (Recruitment)', 'Headhunting', 'C&B (Lương & Phúc lợi)', 'KPI/OKRs',
      'Đào tạo (L&D)', 'Đánh giá năng lực 360', 'Quan hệ lao động', 'Onboarding',
      'Giữ chân nhân tài (Retention)', 'Văn hóa doanh nghiệp', 'Luật lao động', 'Employer Branding'
    ],
    metricsTerm: 'Time-to-hire (ngày), Cost-per-hire, Tỷ lệ thôi việc (Turnover Rate %), Điểm eNPS',
    coreConcepts: 'Quy trình tuyển dụng & đánh giá, Xây dựng khung năng lực, Quản trị hiệu suất làm việc',
    troubleshootConcepts: 'Xử lý xung đột nội bộ, Giảm thiểu tỷ lệ thôi việc, Đàm phán mức lương cạnh tranh',
  },
  general: {
    categoryName: 'Chuyên Môn Doanh Nghiệp',
    keywords: [
      'Quy trình làm việc (SOP)', 'Mục tiêu đo lường (KPI)', 'Quản trị rủi ro',
      'Phối hợp liên phòng ban', 'Tối ưu chi phí', 'Đánh giá hiệu suất',
      'Giải pháp thực tế', 'Tiến độ dự án', 'Kế hoạch hành động', 'Lập kế hoạch'
    ],
    metricsTerm: 'Tiến độ hoàn thành (%), % Cải thiện chi phí, Mức độ hài lòng của khách hàng',
    coreConcepts: 'Chuẩn hóa quy trình, Phối hợp làm việc nhóm hiệu quả, Đạt mục tiêu chiến lược của tổ chức',
    troubleshootConcepts: 'Nhận diện nguyên nhân gốc rễ vấn đề, Đề xuất giải pháp dự phòng và kiểm soát rủi ro',
  }
};

/**
 * Tự động nhận diện nhóm ngành từ topic phỏng vấn
 * CHỈ phân loại dựa trên cleanTopicName(topic) - Tuyệt đối KHÔNG nối questions.q vào để tránh dính chữ 'tuyển dụng' của hội đồng
 */
export const detectIndustryCategory = (topic = '') => {
  const clean = cleanTopicName(topic).toLowerCase();

  // 1. brse: /brse|cầu nối|bridge|nhật|japanese/i
  if (/brse|cầu nối|bridge|nhật|japanese/i.test(clean)) return 'brse';

  // 2. qa: /\bqa\b|\bqc\b|tester|kiểm thử|automation test|selenium/i
  if (/\bqa\b|\bqc\b|tester|kiểm thử|automation test|selenium/i.test(clean)) return 'qa';

  // 3. frontend: /frontend|front-end|react|vue|angular|ui\/ux|next\.js/i
  if (/frontend|front-end|react|vue|angular|ui\/ux|next\.js/i.test(clean)) return 'frontend';

  // 4. backend: /backend|back-end|java|spring|node|golang|dotnet|\.net|c#|microservice/i
  if (/backend|back-end|java|spring|node|golang|dotnet|\.net|c#|microservice/i.test(clean)) return 'backend';

  // 5. data: /\bdata\b|dữ liệu|machine learning|\bai\b|python|deep learning/i
  if (/\bdata\b|dữ liệu|machine learning|\bai\b|python|deep learning/i.test(clean)) return 'data';

  // 6. ba: /business analyst|\bba\b|phân tích nghiệp vụ|product owner|product manager|\bpm\b|scrum/i
  if (/business analyst|\bba\b|phân tích nghiệp vụ|product owner|product manager|\bpm\b|scrum/i.test(clean)) return 'ba';

  // 7. marketing: /marketing|seo|sem|content|brand|truyền thông/i
  if (/marketing|seo|sem|content|brand|truyền thông/i.test(clean)) return 'marketing';

  // 8. accounting: /kế toán|kiểm toán|accounting|audit|thuế|finance|tài chính/i
  if (/kế toán|kiểm toán|accounting|audit|thuế|finance|tài chính/i.test(clean)) return 'accounting';

  // 9. sales: /sales|kinh doanh|bán hàng|account executive|\bbd\b/i
  if (/sales|kinh doanh|bán hàng|account executive|\bbd\b/i.test(clean)) return 'sales';

  // 10. hr: /nhân sự|\bhr\b|human resources|talent acquisition|c&b/i (Không dùng từ khóa chung 'tuyển dụng' đơn lẻ)
  if (/nhân sự|\bhr\b|human resources|talent acquisition|c&b/i.test(clean)) return 'hr';

  // 11. Các từ khóa kỹ sư lập trình chung:
  if (/fullstack|full-stack|software|engineer|developer|lập trình/i.test(clean)) return 'backend';

  return 'general';
};

/**
 * Trích xuất độ phủ từ khóa (Keyword Gap Analysis)
 * 🟢 Đã nêu vs 🔴 Còn thiếu
 */
export const extractKeywordGap = (taxonomy, questions = []) => {
  const allAnswersText = (questions || []).map(q => q.answer || '').join(' ').toLowerCase();
  const taxKeywords = taxonomy?.keywords || [];

  const mentioned = [];
  const missing = [];

  taxKeywords.forEach((kw) => {
    const rawClean = kw.replace(/\(.*?\)/g, '').trim().toLowerCase();
    if (rawClean && allAnswersText.includes(rawClean)) {
      mentioned.push(kw);
    } else {
      missing.push(kw);
    }
  });

  return { mentioned, missing };
};

/**
 * Phân loại toán học Tốc độ nói (WPM)
 * Tuyệt đối không hiển thị con số ảo khi < 20 từ.
 * Phân loại chuẩn xác theo toán học: < 100 WPM, 100 - 150 WPM, > 150 WPM.
 */
export const computeWpmClassification = (totalWords, avgWpm) => {
  if (!avgWpm || Number(avgWpm) <= 0) {
    return {
      displayVal: 'Chưa đo WPM',
      badgeText: 'Không ghi nhận âm thanh qua Micro',
      assessment: 'Phiên này chưa ghi nhận tốc độ phát biểu qua Micro (hoặc ứng viên đã trả lời bằng cách nhập văn bản). Hệ thống không chấm điểm WPM ảo.',
      isReliable: false,
      colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
    };
  }

  if (totalWords < 20) {
    return {
      displayVal: 'Chưa đủ dữ liệu',
      badgeText: 'Chưa đủ dữ liệu (< 20 từ)',
      assessment: 'Ứng viên nói quá ngắn (< 20 từ) trong cả buổi phỏng vấn, chưa đủ dữ liệu toán học để tính tốc độ nói thực tế.',
      isReliable: false,
      colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
    };
  }

  const wpm = Math.round(Number(avgWpm));

  if (wpm < 100) {
    return {
      displayVal: `${wpm} WPM`,
      badgeText: 'Nói hơi chậm / Ngắt quãng nhiều (Cần tăng sự lưu loát)',
      assessment: `Tốc độ nói thực tế ${wpm} WPM nằm dưới mức khuyến nghị (< 100 từ/phút). Có hiện tượng ngập ngừng hoặc câu bị đứt đoạn. Cần luyện tập diễn đạt trôi chảy hơn.`,
      isReliable: true,
      colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
    };
  }

  if (wpm <= 150) {
    return {
      displayVal: `${wpm} WPM`,
      badgeText: 'Tốc độ nói đạt chuẩn tự nhiên (100 - 150 từ/phút)',
      assessment: `Tốc độ nói thực tế ${wpm} WPM nằm trong ngưỡng chuẩn vàng (100 - 150 từ/phút). Nhịp điệu tự nhiên, người phỏng vấn dễ nắm bắt trọn vẹn thông điệp.`,
      isReliable: true,
      colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    };
  }

  return {
    displayVal: `${wpm} WPM`,
    badgeText: 'Tốc độ nói hơi nhanh (Cần nhấn nhá rõ ý hơn)',
    assessment: `Tốc độ nói thực tế ${wpm} WPM vượt ngưỡng 150 từ/phút. Cần chủ động ngắt nghỉ giữa các luận điểm để người nghe kịp thẩm thấu.`,
    isReliable: true,
    colorClass: 'text-indigo-800 bg-indigo-50 border-indigo-200',
  };
};

/**
 * Làm sạch từng phần S, T, A, R:
 * Loại bỏ nhãn đầu câu ([S], Bối cảnh:...) và loại bỏ chữ bị dính của ô sau (; Nhiệm vụ:, ; Hành động:...)
 * Giữ nguyên chữ cái đầu tiên của câu (không cắt nhầm 'T' trong 'Tái', 'A' trong 'A/B', 'T' trong 'Tăng').
 */
export const cleanStarPart = (str) => {
  if (!str) return '';
  return str
    .replace(/^(?:\s*(?:\[[STARstar]\]|\([STARstar]\)|(?:S|T|A|R)\s*[:\-\—]|Bối cảnh|Nhiệm vụ|Hành động|Kết quả|Situation|Task|Action|Result)\s*[:\-\—]?\s*)+/i, '')
    .replace(/;\s*(?:Nhiệm vụ|Hành động|Kết quả|Bối cảnh|Task|Action|Result|Situation).*$/i, '')
    .replace(/(?:\[[STARstar]\]|\([STARstar]\))\s*[:\-\—]?.*$/i, '')
    .replace(/\s*;\s*$/, '')
    .trim();
};

/**
 * Helper: Bóc tách nhận xét chuyên môn và telemetry phong thái từ chuỗi text
 */
export const parseFeedbackSection = (text) => {
  if (!text) return { critique: 'Chưa có nhận xét.', telemetry: null };
  const splitPattern = /\[Phong thái &(?: Telemetry| Ngữ điệu)[^\]]*\]:\s*/i;
  const parts = text.split(splitPattern);
  const critique = parts[0]?.trim() || text;
  const telemetry = parts[1]?.trim() || null;
  return { critique, telemetry };
};

/**
 * Helper: Phân tích cấu trúc câu trả lời mẫu theo mô hình STAR (Situation, Task, Action, Result)
 * Đảm bảo 4 ô S, T, A, R hiển thị sạch sẽ, không dính nhãn ô sau.
 */
export const parseStarModelAnswer = (text) => {
  if (!text) return { raw: '', hasStar: false, s: '', t: '', a: '', r: '' };
  const clean = text.split(/\[Phong thái &(?: Telemetry| Ngữ điệu)/i)[0].trim();

  const regexS = /(?:\[S\]|\(S\)|\bS\b\s*[:\-\—]|(?:bối cảnh|situation)\s*[:\-\—])([\s\S]*?)(?=(?:\[T\]|\(T\)|\bT\b\s*[:\-\—]|(?:nhiệm vụ|mục tiêu|task)\s*[:\-\—]|$))/i;
  const regexT = /(?:\[T\]|\(T\)|\bT\b\s*[:\-\—]|(?:nhiệm vụ|mục tiêu|task)\s*[:\-\—])([\s\S]*?)(?=(?:\[A\]|\(A\)|\bA\b\s*[:\-\—]|(?:hành động|công nghệ|giải pháp|action)\s*(?:&[^:\-\—]+)?[:\-\—]|$))/i;
  const regexA = /(?:\[A\]|\(A\)|\bA\b\s*[:\-\—]|(?:hành động|công nghệ|giải pháp|action)\s*(?:&[^:\-\—]+)?[:\-\—])([\s\S]*?)(?=(?:\[R\]|\(R\)|\bR\b\s*[:\-\—]|(?:kết quả|hiệu quả|số liệu|result)\s*(?:&[^:\-\—]+)?[:\-\—]|$))/i;
  const regexR = /(?:\[R\]|\(R\)|\bR\b\s*[:\-\—]|(?:kết quả|hiệu quả|số liệu|result)\s*(?:&[^:\-\—]+)?[:\-\—])([\s\S]*?)$/i;

  const matchS = clean.match(regexS);
  const matchT = clean.match(regexT);
  const matchA = clean.match(regexA);
  const matchR = clean.match(regexR);

  if (matchS || matchT || matchA || matchR) {
    const s = cleanStarPart(matchS ? matchS[1] : '');
    const t = cleanStarPart(matchT ? matchT[1] : '');
    const a = cleanStarPart(matchA ? matchA[1] : '');
    const r = cleanStarPart(matchR ? matchR[1] : '');

    if (s || t || a || r) {
      return { raw: clean, hasStar: true, s, t, a, r };
    }
  }

  const sentences = clean.split(/(?<=\.)\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    let s = '', t = '', a = '', r = '';
    sentences.forEach((sent) => {
      const lower = sent.toLowerCase();
      if (/kết quả|nhờ đó|đạt được|hiệu suất|vận hành|giảm \d+|tăng \d+|doanh thu|tiết kiệm/i.test(lower)) {
        r += (r ? ' ' : '') + sent;
      } else if (/triển khai|áp dụng|xây dựng|thực hiện|sử dụng|công cụ|kỹ thuật|giải pháp/i.test(lower)) {
        a += (a ? ' ' : '') + sent;
      } else if (/nhiệm vụ|mục tiêu|trách nhiệm|đảm nhận|vai trò chính/i.test(lower)) {
        t += (t ? ' ' : '') + sent;
      } else {
        s += (s ? ' ' : '') + sent;
      }
    });

    if (s || t || a || r) {
      return {
        raw: clean,
        hasStar: true,
        s: cleanStarPart(s || (sentences[0] || 'Bối cảnh dự án thực tế.')),
        t: cleanStarPart(t || 'Trách nhiệm phân tích và xử lý bài toán cốt lõi.'),
        a: cleanStarPart(a || 'Lựa chọn phương án và triển khai giải pháp phù hợp.'),
        r: cleanStarPart(r || 'Đạt hiệu quả đo lường và hoàn thành mục tiêu đặt ra.'),
      };
    }
  }

  return { raw: clean, hasStar: false, s: '', t: '', a: '', r: '' };
};

/**
 * Làm sạch chuỗi debug EMA
 */
export const cleanWeaknessText = (text) => {
  if (!text) return '';
  return text
    .replace(/EMA\s+Weakness\s+Score:\s*[\d\.\/]+[^\n\r]*?Chi\s*tiết\s*:\s*/gi, '')
    .replace(/EMA\s+Weakness\s+Score:\s*[\d\.\/]+[^\n\r]*?\.\s*/gi, '')
    .replace(/EMA\s+Weakness\s+Score:\s*[\d\.\/]+[^\.\n\r]*/gi, '')
    .replace(/^Chi\s*tiết\s*:\s*/i, '')
    .trim();
};

/**
 * Làm giàu nhận xét chuyên môn và câu trả lời mẫu bám sát vị trí công việc (JD/Role)
 */
export const enrichFeedbackAndModelAnswer = (
  qText = '',
  ansText = '',
  rawCritique = '',
  rawModel = '',
  targetPosition = 'Chuyên viên',
  taxonomy = INDUSTRY_TAXONOMY.general
) => {
  const cleanQ = (qText || '').trim();
  const cleanAns = (ansText || '').trim();
  const lowerQ = cleanQ.toLowerCase();
  const words = cleanAns ? cleanAns.split(/\s+/).filter(Boolean).length : 0;

  let qType = 'Chuyên Môn';
  if (/chào|giới thiệu|bản thân|kinh nghiệm|điểm mạnh/i.test(lowerQ)) {
    qType = 'Chào Hỏi & Tổng Quan';
  } else if (/xử lý|sự cố|khó khăn|thử thách|thất bại|xung đột|khủng hoảng/i.test(lowerQ)) {
    qType = 'Xử Lý Tình Huống';
  } else if (/quyết định|chiến lược|lựa chọn|đánh đổi|tại sao/i.test(lowerQ)) {
    qType = 'Quyết Định Chuyên Môn';
  } else if (/áp lực|deadline|trách nhiệm|khách hàng khó tính/i.test(lowerQ)) {
    qType = 'Câu Hỏi Thách Thức';
  }

  let enrichedCritique = (rawCritique || '').trim();
  const isCritiqueGeneric =
    !enrichedCritique ||
    enrichedCritique.length < 80 ||
    /Chưa có nhận xét/i.test(enrichedCritique) ||
    /Nội dung bước đầu nêu được ý chính/i.test(enrichedCritique);

  if (isCritiqueGeneric) {
    if (words < 15) {
      enrichedCritique =
        `• Điểm ghi nhận: Đã mở lời phản hồi câu hỏi của hội đồng tuyển dụng.\n` +
        `• Lỗ hổng cốt lõi: Câu trả lời quá ngắn (${words} từ), chưa cung cấp đủ dữ liệu chuyên môn về vị trí ${targetPosition}. Hoàn toàn thiếu vắng các thuật ngữ (${taxonomy.keywords.slice(0, 3).join(', ')}), không nêu được quy trình thực hiện và thiếu minh chứng số liệu.\n` +
        `• Chỉ dẫn cải thiện: Áp dụng công thức STAR: Nêu rõ bối cảnh tình huống -> Trách nhiệm được giao -> Các bước giải quyết cụ thể -> Kết quả đo lường bằng con số.`;
    } else if (qType === 'Chào Hỏi & Tổng Quan') {
      enrichedCritique =
        `• Điểm ghi nhận: Đã xác định được nội dung giới thiệu kinh nghiệm cá nhân.\n` +
        `• Lỗ hổng cốt lõi: Trình bày còn mang tính liệt kê chung chung, chưa làm nổi bật được thế mạnh chuyên môn cốt lõi của vị trí ${targetPosition} và thiếu các dự án tiêu biểu có số liệu đo lường.\n` +
        `• Chỉ dẫn cải thiện: Tập trung vào 3 trọng điểm: (1) Số năm kinh nghiệm & định hướng chuyên môn, (2) Dự án/thành tựu tâm đắc nhất, (3) Giá trị cụ thể bạn sẽ mang lại cho tổ chức.`;
    } else if (qType === 'Xử Lý Tình Huống') {
      enrichedCritique =
        `• Điểm ghi nhận: Đã nắm bắt được tình huống bài toán cần giải quyết.\n` +
        `• Lỗ hổng cốt lõi: Chưa phân tích được nguyên nhân gốc rễ (Root Cause), thiếu các giải pháp dự phòng và chưa chỉ ra được các đánh đổi thực tế trong quá trình xử lý.\n` +
        `• Chỉ dẫn cải thiện: Trình bày theo 3 bước: Xác định nguyên nhân gốc rễ -> Phương án hành động chi tiết -> Số liệu đo lường hiệu quả sau khi khắc phục.`;
    } else {
      enrichedCritique =
        `• Điểm ghi nhận: Trả lời đúng hướng trọng tâm câu hỏi phỏng vấn.\n` +
        `• Lỗ hổng cốt lõi: Thiếu các thuật ngữ chuyên sâu ngành ${taxonomy.categoryName} (${taxonomy.keywords.slice(0, 3).join(', ')}). Lập luận còn mang tính lý thuyết, thiếu các minh chứng định lượng (${taxonomy.metricsTerm}).\n` +
        `• Chỉ dẫn cải thiện: Bổ sung công cụ nghiệp vụ cụ thể và đo lường kết quả theo mô hình STAR.`;
    }
  }

  let enrichedModel = (rawModel || '').trim();
  const isModelDefective =
    !enrichedModel ||
    enrichedModel.length < 80 ||
    /Gợi ý câu trả lời chuẩn theo mô hình STAR/i.test(enrichedModel);

  if (isModelDefective) {
    const kw1 = taxonomy.keywords[0] || 'Chuyên môn';
    const kw2 = taxonomy.keywords[1] || 'Quy trình';
    const kw3 = taxonomy.keywords[2] || 'Giải pháp';

    if (qType === 'Chào Hỏi & Tổng Quan') {
      enrichedModel =
        `[S] Bối cảnh: Tôi có hơn 3 năm kinh nghiệm làm việc chuyên sâu trong lĩnh vực ${taxonomy.categoryName}, tham gia trực tiếp các dự án quan trọng về ${kw1} và ${kw2}.\n` +
        `[T] Nhiệm vụ: Trong vai trò ${targetPosition}, tôi chịu trách nhiệm chính về việc tối ưu quy trình vận hành, nâng cao chất lượng đầu ra và đảm bảo mục tiêu kế hoạch.\n` +
        `[A] Hành động & Phương pháp: Tôi đã chuẩn hóa quy trình làm việc, ứng dụng các công cụ chuyên ngành (${kw1}, ${kw3}) và thiết lập cơ chế kiểm soát chất lượng chặt chẽ theo tiêu chuẩn ngành.\n` +
        `[R] Kết quả & Số liệu: Đội ngũ của tôi đã nâng cao hơn 30% hiệu suất hoàn thành công việc, giảm thiểu 25% sai sót quy trình và liên tục vượt chỉ tiêu KPI được giao.`;
    } else if (qType === 'Xử Lý Tình Huống') {
      enrichedModel =
        `[S] Bối cảnh: Trong một dự án quan trọng, hệ thống quy trình bất ngờ gặp sự cố phát sinh ảnh hưởng trực tiếp đến tiến độ và trải nghiệm của khách hàng/đối tác.\n` +
        `[T] Nhiệm vụ: Tôi được giao nhiệm vụ cô lập vấn đề, tìm ra nguyên nhân gốc rễ và đưa ra giải pháp khắc phục khẩn cấp trong vòng 24 giờ.\n` +
        `[A] Hành động & Phương pháp: Tôi nhanh chóng rà soát dữ liệu, áp dụng phương pháp ${kw1} và phối hợp với các bên liên quan để triển khai phương án thay thế ${kw2}, đồng thời thiết lập rào chắn rủi ro.\n` +
        `[R] Kết quả & Số liệu: Sự cố được giải quyết triệt để trong 8 giờ, giảm thiểu 90% thiệt hại phát sinh và thiết lập thêm tài liệu SOP ngăn ngừa tái diễn.`;
    } else {
      enrichedModel =
        `[S] Bối cảnh: Khi đối mặt với yêu cầu nâng cao hiệu suất nghiệp vụ ${targetPosition} trong điều kiện tài nguyên và thời gian hạn hẹp.\n` +
        `[T] Nhiệm vụ: Trực tiếp xây dựng chiến lược hành động, phân bổ nguồn lực hợp lý và đảm bảo các chỉ số đo lường (${taxonomy.metricsTerm}).\n` +
        `[A] Hành động & Phương pháp: Tôi đã áp dụng các phương pháp cốt lõi (${kw1}, ${kw2}), thiết kế các mốc kiểm tra định kỳ và chủ động xử lý các rủi ro phát sinh.\n` +
        `[R] Kết quả & Số liệu: Đạt 100% mục tiêu đề ra, tiết kiệm hơn 20% chi phí vận hành và nhận được đánh giá xuất sắc từ ban lãnh đạo.`;
    }
  }

  const strategyGuide = `Nêu rõ bối cảnh thực tế -> Xác định trách nhiệm cá nhân -> Lựa chọn công cụ chuyên môn (${taxonomy.keywords.slice(0, 3).join(', ')}) -> Khẳng định hiệu quả bằng số liệu định lượng (${taxonomy.metricsTerm}).`;

  return { qType, critique: enrichedCritique, modelAnswer: enrichedModel, strategyGuide };
};

/**
 * Tính toán 4 Trụ Cột Năng Lực Tuyển Dụng Xác Thực
 * Trụ Cột 4: "Phong Thái Khuôn Mặt, Ngữ Điệu & Độ Lưu Loát (20%)"
 * Tích hợp đầy đủ: WPM, Fillers, Pitch Hz, Eye Contact (nếu có Camera)
 */
export const computeAuthenticCompetencies = (
  session,
  questions = [],
  totalScore = 0,
  telemetry = {},
  totalWords = 0,
  meaningfulAnswersCount = 0
) => {
  const isSessionTooShort = totalWords < 30 || meaningfulAnswersCount < 2;

  // 1. Trụ Cột 4: Phong Thái Khuôn Mặt, Ngữ Điệu & Độ Lưu Loát (20%)
  const hasCam = Boolean(
    telemetry?.isCameraUsed &&
    telemetry?.avgEyeContact != null &&
    Number(telemetry.avgEyeContact) > 0 &&
    telemetry?.postureStatus !== 'Chưa bật camera'
  );
  const eye = hasCam ? Number(telemetry.avgEyeContact) : null;

  const hasMic = Boolean(
    telemetry?.avgWpm != null &&
    Number(telemetry.avgWpm) > 0
  );
  const wpm = hasMic ? Number(telemetry.avgWpm) : null;
  const fillers = Number(telemetry?.totalFillers ?? 0);
  const pitch = (telemetry?.avgPitchHz != null && Number(telemetry.avgPitchHz) > 0) ? Number(telemetry.avgPitchHz) : null;

  let verbalCommScore = 60;
  if (isSessionTooShort) {
    verbalCommScore = Math.min(25, Math.max(10, Math.round(totalWords * 0.6)));
  } else {
    // Đánh giá dựa trên độ dài và dung lượng từ thực tế
    if (totalWords >= 120) verbalCommScore += 10;
    else if (totalWords >= 60) verbalCommScore += 5;

    // Chỉ tính điểm WPM nếu THỰC SỰ có thu âm qua Micro
    if (hasMic && wpm != null) {
      if (wpm >= 100 && wpm <= 150) verbalCommScore += 8;
      else if (wpm < 85 || wpm > 165) verbalCommScore -= 8;
    }

    // Từ đệm
    if (fillers <= 2 && totalWords >= 40) verbalCommScore += 5;
    else if (fillers >= 6) verbalCommScore -= 10;

    // Tần số Pitch thật
    if (pitch != null) {
      if (pitch >= 100 && pitch <= 240) verbalCommScore += 5;
      else if (pitch > 260) verbalCommScore -= 5;
    }

    // Camera thật
    if (hasCam && eye != null) {
      if (eye >= 75) verbalCommScore += 6;
      else if (eye < 50) verbalCommScore -= 8;
    }

    verbalCommScore = Math.max(25, Math.min(95, verbalCommScore));
  }

  // Nếu phiên quá ngắn, phạt triệt để cả 4 trụ cột
  if (isSessionTooShort) {
    const clampedBase = Math.min(25, Math.max(10, Math.round(totalWords * 0.7)));
    return {
      domainKnowledge: clampedBase,
      problemSolving: Math.min(25, Math.max(10, clampedBase - 2)),
      structureSTAR: Math.min(20, Math.max(8, clampedBase - 4)),
      deliveryTone: verbalCommScore,
    };
  }

  const rawComps = session?.competencies;
  if (rawComps && rawComps.domainKnowledge > 0 && rawComps.problemSolving > 0) {
    return {
      domainKnowledge: Math.max(10, Math.min(100, Math.round(rawComps.domainKnowledge))),
      problemSolving: Math.max(10, Math.min(100, Math.round(rawComps.problemSolving))),
      structureSTAR: Math.max(10, Math.min(100, Math.round(rawComps.structureSTAR ?? rawComps.starStructureScore ?? 50))),
      deliveryTone: Math.max(10, Math.min(100, Math.round(rawComps.deliveryTone ?? rawComps.communicationScore ?? verbalCommScore))),
    };
  }

  const qList = Array.isArray(questions) && questions.length > 0 ? questions : (session?.questions || []);
  if (qList.length > 0) {
    let domainSum = 0;
    let problemSum = 0;
    let starSum = 0;
    let deliverySum = 0;

    qList.forEach((q) => {
      const baseQ = q.score != null && q.score > 0 ? q.score : (totalScore > 0 ? totalScore : 40);
      domainSum += q.domainScore != null ? q.domainScore : baseQ;
      problemSum += q.problemScore != null ? q.problemScore : baseQ;
      starSum += q.starScore != null ? q.starScore : Math.round(baseQ * 0.85);
      deliverySum += q.deliveryScore != null ? q.deliveryScore : verbalCommScore;
    });

    const n = qList.length;
    return {
      domainKnowledge: Math.max(10, Math.min(100, Math.round(domainSum / n))),
      problemSolving: Math.max(10, Math.min(100, Math.round(problemSum / n))),
      structureSTAR: Math.max(10, Math.min(100, Math.round(starSum / n))),
      deliveryTone: Math.max(10, Math.min(100, Math.round(deliverySum / n))),
    };
  }

  const base = totalScore > 0 ? totalScore : 30;
  return {
    domainKnowledge: base,
    problemSolving: Math.max(10, base - 3),
    structureSTAR: Math.max(10, base - 6),
    deliveryTone: verbalCommScore,
  };
};

/**
 * AiInterviewReportPage - Báo Cáo Đánh Giá Phỏng Vấn AI Sắc Nét & AI Face/Voice Biometrics
 * Bố cục 3 Tab:
 * - Tab 1: Ma Trận Năng Lực & Độ Phủ Từ Khóa
 * - Tab 2: Khuôn Mặt, Biểu Cảm & Ngữ Điệu Giọng Nói (AI Biometrics)
 * - Tab 3: Giải Phẫu Từng Câu Hỏi & Lộ Trình Cải Thiện
 */
export default function AiInterviewReportPage({
  user,
  sessionData = null,
  sessionIdProp = null,
  onBack = null,
  onRetry = null,
}) {
  const [session, setSession] = useState(sessionData);
  const [loading, setLoading] = useState(!sessionData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'biometrics' | 'questions'
  const [questionFilter, setQuestionFilter] = useState('all'); // 'all' | 'high' | 'low'
  const [playingQuestionIdx, setPlayingQuestionIdx] = useState(null);
  const [playingCandidateIdx, setPlayingCandidateIdx] = useState(null);
  const candidateAudioRef = useRef(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const getSessionIdFromUrl = () => {
    if (sessionIdProp) return sessionIdProp;
    const hash = window.location.hash || '';
    const searchPart = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(searchPart);
    return params.get('id') || params.get('sessionId') || null;
  };

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData);
      setLoading(false);
      return;
    }

    const sid = getSessionIdFromUrl();
    if (!sid) {
      try {
        const userHistoryCacheKey = user?.userId
          ? `hiremate_interview_history_${user.userId}`
          : 'hiremate_interview_history_guest';
        const cachedHistory = JSON.parse(localStorage.getItem(userHistoryCacheKey) || '[]');
        if (Array.isArray(cachedHistory) && cachedHistory.length > 0) {
          setSession(cachedHistory[0]);
          setLoading(false);
          return;
        }
      } catch (e) {}

      setError('Không tìm thấy mã phiên phỏng vấn cần xem báo cáo.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const numericId = parseInt(sid.toString().replace(/\D/g, ''), 10);

    interviewApi
      .getSessionResult(numericId || sid)
      .then((res) => {
        const raw = res?.data || res;
        const d = raw?.data || raw;
        if (d) {
          const rawTel = d.telemetryReport || d.telemetry || {};
          const sessionLevel = rawTel.level || d.level || 'Middle';

          let sessionDuration = rawTel.durationFormatted;
          if (!sessionDuration && d.startedAt && d.completedAt) {
            const start = new Date(d.startedAt).getTime();
            const end = new Date(d.completedAt).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              const diffSec = Math.round((end - start) / 1000);
              sessionDuration = String(Math.floor(diffSec / 60)).padStart(2, '0') + ':' + String(diffSec % 60).padStart(2, '0');
            }
          }
          if (!sessionDuration && rawTel.actualDurationSeconds) {
            const diffSec = Number(rawTel.actualDurationSeconds);
            sessionDuration = String(Math.floor(diffSec / 60)).padStart(2, '0') + ':' + String(diffSec % 60).padStart(2, '0');
          }
          if (!sessionDuration) {
            sessionDuration = '5 phút';
          }

          const qCount = d.details?.length || d.questionCount || 0;
          const finalScore = Math.round(d.overallScore || 0);
          const grade = qCount === 0 ? 'Chưa Hoàn Tất' : finalScore >= 85 ? 'Xuất Sắc' : finalScore >= 70 ? 'Đạt Yêu Cầu' : finalScore >= 50 ? 'Cần Rèn Luyện Thêm' : 'Không Đạt Yêu Cầu';

          const mappedTelemetry = {
            isCameraUsed: Boolean(rawTel.isCameraUsed),
            isMicrophoneUsed: Boolean(rawTel.isMicrophoneUsed || (rawTel.avgWpm && Number(rawTel.avgWpm) > 0)),
            avgEyeContact: rawTel.avgEyeContact ?? null,
            avgPitchHz: rawTel.avgPitchHz ?? null,
            avgWpm: rawTel.avgWpm ?? null,
            totalFillers: rawTel.totalFillers ?? 0,
            emotionSummary: rawTel.emotionSummary || rawTel.dominantEmotion || 'Chưa bật camera',
            dominantEmotion: rawTel.dominantEmotion || rawTel.emotionSummary || 'Chưa bật camera',
            postureStatus: rawTel.postureStatus || rawTel.postureSummary || 'Chưa bật camera',
            postureSummary: rawTel.postureSummary || rawTel.postureStatus || 'Chưa bật camera',
            emotions: rawTel.emotions || { confident: 0, smiling: 0, focused: 0, tense: 0 },
            level: sessionLevel,
            durationSeconds: rawTel.actualDurationSeconds ?? rawTel.durationSeconds ?? null,
            durationFormatted: sessionDuration,
          };

          const mapped = {
            id: 'HM-' + (d.sessionId || sid),
            sessionId: d.sessionId || sid,
            date: d.startedAt ? d.startedAt.split('T')[0] : new Date().toISOString().split('T')[0],
            topic: cleanTopicName(d.targetPosition || 'Chuyên viên'),
            level: sessionLevel,
            duration: sessionDuration,
            totalScore: finalScore,
            grade: grade,
            questionsCount: qCount,
            planName: d.planName || 'Free Candidate',
            maxQuestions: d.maxQuestions || 3,
            maxDurationSeconds: d.maxDurationSeconds || 300,
            isIncomplete: qCount === 0 || qCount < (d.maxQuestions || 3),
            aiSummary: d.overallFeedback || 'Đã hoàn thành phiên phỏng vấn với HireMate AI.',
            weaknessSummary: d.weaknessSummary || '',
            competencies: {
              domainKnowledge: Math.round(d.domainKnowledgeScore ?? finalScore ?? 0),
              problemSolving: Math.round(d.problemSolvingScore ?? finalScore ?? 0),
              structureSTAR: Math.round(d.starStructureScore ?? (finalScore > 0 ? Math.round(finalScore * 0.85) : 0)),
              deliveryTone: Math.round(d.deliveryToneScore ?? d.communicationScore ?? (finalScore > 0 ? finalScore : 0)),
            },
            deliveryFeedback: d.deliveryFeedback || null,
            telemetryReport: mappedTelemetry,
            questions: (d.details || []).map((detail, idx) => {
              const ans = detail.candidateAnswerText || '';
              const wCount = ans.trim() ? ans.trim().split(/\s+/).filter(Boolean).length : 0;
              const feedbackStr = detail.aiFeedback || '';

              let qWpm = mappedTelemetry.avgWpm;
              let qPitch = mappedTelemetry.avgPitchHz;
              let qEye = mappedTelemetry.avgEyeContact;

              const wpmMatch = feedbackStr.match(/Tốc độ nói:\s*(\d+)\s*WPM/i) || feedbackStr.match(/WPM:\s*(\d+)/i);
              if (wpmMatch) qWpm = Number(wpmMatch[1]);

              const pitchMatch = feedbackStr.match(/Pitch\):\s*(\d+)\s*Hz/i) || feedbackStr.match(/(?:Tông giọng|Pitch):\s*(\d+)\s*Hz/i);
              if (pitchMatch) qPitch = Number(pitchMatch[1]);

              const eyeMatch = feedbackStr.match(/Eye Contact\):\s*(\d+)%/i) || feedbackStr.match(/(?:Giao tiếp mắt|Eye Contact):\s*(\d+)%/i);
              if (eyeMatch) qEye = Number(eyeMatch[1]);

              return {
                q: detail.questionText || `Lượt đối đáp #${idx + 1}`,
                audioUrl: detail.audioUrl || null,
                score: Math.round(detail.aiEvaluationScore || 0),
                domainScore: Math.round(detail.aiEvaluationScore || 0),
                problemScore: Math.round(detail.aiEvaluationScore || 0),
                starScore: Math.round((detail.aiEvaluationScore || 0) * 0.85),
                deliveryScore: Math.round(d.deliveryToneScore ?? d.communicationScore ?? detail.aiEvaluationScore ?? 20),
                answer: ans || '(Ứng viên đã trả lời)',
                words: wCount,
                wpm: qWpm,
                pitchHz: qPitch,
                eyeContact: qEye,
                criticalFeedback: {
                  flaws: detail.aiFeedback || '',
                  interviewerImpression: detail.tone || '',
                },
                modelAnswer: detail.aiSuggestedAnswer || '',
              };
            }),
          };
          setSession(mapped);
        } else {
          setError('Không thể lấy chi tiết báo cáo từ máy chủ.');
        }
      })
      .catch((err) => {
        console.warn('Load session report error:', err);
        try {
          const userHistoryCacheKey = user?.userId
            ? `hiremate_interview_history_${user.userId}`
            : 'hiremate_interview_history_guest';
          const cachedHistory = JSON.parse(localStorage.getItem(userHistoryCacheKey) || '[]');
          const found = cachedHistory.find(
            (c) => String(c.id).includes(sid) || String(c.sessionId) === String(sid)
          );
          if (found) {
            setSession(found);
            return;
          }
        } catch (e) {}
        setError('Không thể tải báo cáo phiên phỏng vấn. Vui lòng kiểm tra lại kết nối.');
      })
      .finally(() => setLoading(false));
  }, [sessionData, sessionIdProp]);

  // Phát âm thanh giọng đọc TTS
  const playModelAudio = (text, qIdx) => {
    if (!text) return;
    if (playingQuestionIdx === qIdx) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingQuestionIdx(null);
      return;
    }

    setPlayingQuestionIdx(qIdx);
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setPlayingQuestionIdx(null);
        utterance.onerror = () => setPlayingQuestionIdx(null);
        window.speechSynthesis.speak(utterance);
        showToast('🔊 Đang đọc phát biểu mẫu chuẩn STAR...');
      } else {
        showToast('Trình duyệt chưa hỗ trợ Text-to-Speech.');
        setPlayingQuestionIdx(null);
      }
    } catch (e) {
      console.warn('TTS error:', e);
      setPlayingQuestionIdx(null);
    }
  };

  // Phát lại bài trả lời / file ghi âm giọng thật của ứng viên
  const playCandidateAnswer = (item, qIdx) => {
    // 1. Nếu đang phát đúng câu này -> Dừng lại
    if (playingCandidateIdx === qIdx) {
      if (candidateAudioRef.current) {
        try { candidateAudioRef.current.pause(); } catch (e) {}
        candidateAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingCandidateIdx(null);
      return;
    }

    // 2. Dừng mọi âm thanh khác đang phát (bao gồm câu mẫu)
    if (candidateAudioRef.current) {
      try { candidateAudioRef.current.pause(); } catch (e) {}
      candidateAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayingQuestionIdx(null);

    // 3. Ưu tiên 1: Phát file ghi âm giọng thật của ứng viên (Cloudinary CDN / Local)
    if (item.audioUrl) {
      setPlayingCandidateIdx(qIdx);
      try {
        const playbackUrl = interviewApi.getAudioPlaybackUrl(item.audioUrl);
        const audio = new Audio(playbackUrl);
        candidateAudioRef.current = audio;
        audio.onended = () => {
          setPlayingCandidateIdx(null);
          candidateAudioRef.current = null;
        };
        audio.onerror = (err) => {
          console.warn('Cannot play cloud audio, fallback to TTS:', err);
          candidateAudioRef.current = null;
          fallbackCandidateTts(item.answer, qIdx);
        };
        audio.play().then(() => {
          showToast('🎧 Đang phát lại bản ghi âm giọng nói thật của bạn...');
        }).catch((err) => {
          console.warn('Audio play prevented or failed:', err);
          fallbackCandidateTts(item.answer, qIdx);
        });
      } catch (err) {
        fallbackCandidateTts(item.answer, qIdx);
      }
      return;
    }

    // 4. Ưu tiên 2: Đọc lại văn bản câu trả lời bằng TTS nếu không có file âm thanh
    fallbackCandidateTts(item.answer, qIdx);
  };

  const fallbackCandidateTts = (text, qIdx) => {
    if (!text) {
      setPlayingCandidateIdx(null);
      return;
    }
    setPlayingCandidateIdx(qIdx);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setPlayingCandidateIdx(null);
      utterance.onerror = () => setPlayingCandidateIdx(null);
      window.speechSynthesis.speak(utterance);
      showToast('🔊 Đang đọc lại câu trả lời của bạn...');
    } else {
      showToast('Trình duyệt chưa hỗ trợ phát âm thanh.');
      setPlayingCandidateIdx(null);
    }
  };

  const copyToClipboard = (text, label = 'Nội dung') => {
    if (!navigator.clipboard) {
      showToast('⚠️ Không thể truy cập clipboard.');
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(`✨ Đã sao chép ${label} vào clipboard!`);
      })
      .catch(() => {
        showToast('⚠️ Lỗi sao chép.');
      });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = '#/ai-interview';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#32247b]/10 border-2 border-[#32247b] border-t-transparent animate-spin mb-4" />
        <h2 className="text-sm font-bold text-slate-800">Đang tổng hợp Báo Cáo Phỏng Vấn AI...</h2>
        <p className="text-xs text-slate-500 mt-1">Đang phân tích 4 trụ cột năng lực, sinh trắc học khuôn mặt &amp; ngữ điệu giọng nói</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-xl">
          <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
          <h2 className="text-base font-bold text-slate-900">Không Thể Tải Báo Cáo Phỏng Vấn</h2>
          <p className="text-xs text-slate-600">{error || 'Phiên phỏng vấn không tồn tại hoặc đã bị xóa.'}</p>
          <button
            onClick={handleBack}
            className="w-full py-2.5 rounded-xl bg-[#32247b] text-white text-xs font-bold hover:bg-[#261a63] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay Lại Studio</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOÁN HỌC & CHỈ SỐ THỰC TẾ
  // =========================================================================
  const questions = session.questions || [];
  const totalQ = questions.length;
  const targetMaxQ = session.maxQuestions || 3;
  const isSessionIncomplete = session.isIncomplete || totalQ < targetMaxQ;

  const totalWords = questions.reduce((sum, q) => {
    const txt = (q.answer || '').trim();
    return sum + (txt ? txt.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  const meaningfulAnswersCount = questions.filter((q) => {
    const txt = (q.answer || '').trim();
    return txt.split(/\s+/).filter(Boolean).length >= 5;
  }).length;

  const avgWordsPerQ = totalQ > 0 ? Math.round(totalWords / totalQ) : 0;
  const avgWordEvaluation =
    avgWordsPerQ === 0
      ? 'Chưa có câu trả lời'
      : avgWordsPerQ < 15
        ? 'Quá ngắn (Thiếu chiều sâu)'
        : avgWordsPerQ <= 45
          ? 'Vừa đủ (Cần thêm số liệu)'
          : 'Chi tiết (Đầy đủ luận điểm)';

  const telemetry = session.telemetryReport || {
    isCameraUsed: false,
    avgEyeContact: null,
    avgPitchHz: null,
    avgWpm: null,
    totalFillers: 0,
    emotionSummary: 'Chưa bật camera',
    postureStatus: 'Chưa bật camera',
    emotions: { confident: 0, smiling: 0, focused: 0, tense: 0 },
  };

  const hasCameraUsed = Boolean(
    telemetry?.isCameraUsed !== false &&
    telemetry?.avgEyeContact != null &&
    Number(telemetry.avgEyeContact) > 0 &&
    telemetry?.postureStatus !== 'Chưa bật camera' &&
    telemetry?.postureStatus !== 'Không có dữ liệu (Camera tắt)'
  );

  const hasMicrophoneUsed = Boolean(
    telemetry?.avgWpm != null &&
    Number(telemetry.avgWpm) > 0
  );

  const hasPitchData = Boolean(
    telemetry?.avgPitchHz != null &&
    Number(telemetry.avgPitchHz) > 0
  );

  const wpmInfo = computeWpmClassification(totalWords, telemetry.avgWpm);
  const cleanTopic = cleanTopicName(session.topic);
  const industryCategoryKey = detectIndustryCategory(cleanTopic);
  const taxonomy = INDUSTRY_TAXONOMY[industryCategoryKey] || INDUSTRY_TAXONOMY.general;
  const keywordGap = extractKeywordGap(taxonomy, questions);

  const lowestQuestion = questions.length > 0
    ? questions.reduce((min, q, idx) => {
        const qScore = q.score != null ? Number(q.score) : 0;
        const minScore = min.score != null ? Number(min.score) : 0;
        return qScore < minScore ? { ...q, index: idx + 1 } : min;
      }, { ...questions[0], index: 1 })
    : null;
  const lowestQWords = lowestQuestion?.answer ? lowestQuestion.answer.trim().split(/\s+/).filter(Boolean).length : 0;

  let totalScore = Math.round(session.totalScore || 0);
  const isVeryShortSession = totalWords < 30 || meaningfulAnswersCount < 2;
  if (isVeryShortSession) {
    totalScore = Math.min(25, Math.max(10, totalScore));
  }

  const grade =
    totalScore >= 85
      ? 'Xuất Sắc'
      : totalScore >= 70
        ? 'Đạt Yêu Cầu'
        : totalScore >= 50
          ? 'Cần Rèn Luyện Thêm'
          : 'Không Đạt Yêu Cầu';

  const gradeColor =
    totalScore >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : totalScore >= 70
        ? 'text-teal-700 bg-teal-50 border-teal-200'
        : totalScore >= 50
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-rose-700 bg-rose-50 border-rose-200';

  const gaugeStroke =
    totalScore >= 85
      ? '#059669'
      : totalScore >= 70
        ? '#0d9488'
        : totalScore >= 50
          ? '#d97706'
          : '#e11d48';

  const comps = computeAuthenticCompetencies(
    session,
    questions,
    totalScore,
    telemetry,
    totalWords,
    meaningfulAnswersCount
  );

  const cleanedWeakness = cleanWeaknessText(session.weaknessSummary);

  // Xử lý phân bổ cảm xúc
  const rawEmotions = telemetry.emotions || { confident: 0, smiling: 0, focused: 0, tense: 0 };
  const totalEmotionCounts = (rawEmotions.confident || 0) + (rawEmotions.smiling || 0) + (rawEmotions.focused || 0) + (rawEmotions.tense || 0);

  let emotionPcts;
  if (totalEmotionCounts > 0) {
    emotionPcts = {
      confident: Math.round(((rawEmotions.confident || 0) / totalEmotionCounts) * 100),
      focused: Math.round(((rawEmotions.focused || 0) / totalEmotionCounts) * 100),
      smiling: Math.round(((rawEmotions.smiling || 0) / totalEmotionCounts) * 100),
      tense: Math.round(((rawEmotions.tense || 0) / totalEmotionCounts) * 100),
    };
  } else if (hasCameraUsed) {
    const emoSummary = (telemetry.emotionSummary || telemetry.dominantEmotion || '').toLowerCase();
    if (emoSummary.includes('mỉm cười') || emoSummary.includes('smiling') || emoSummary.includes('vui vẻ') || emoSummary.includes('tích cực')) {
      emotionPcts = { smiling: 55, confident: 30, focused: 15, tense: 0 };
    } else if (emoSummary.includes('căng thẳng') || emoSummary.includes('tense') || emoSummary.includes('lo lắng') || emoSummary.includes('bối rối')) {
      emotionPcts = { tense: 55, focused: 25, confident: 15, smiling: 5 };
    } else if (emoSummary.includes('tập trung') || emoSummary.includes('focused') || emoSummary.includes('nghiêm túc')) {
      emotionPcts = { focused: 55, confident: 30, smiling: 10, tense: 5 };
    } else if (emoSummary.includes('tự tin') || emoSummary.includes('confident')) {
      emotionPcts = { confident: 55, focused: 25, smiling: 15, tense: 5 };
    } else {
      emotionPcts = { confident: 45, focused: 35, smiling: 15, tense: 5 };
    }
  } else {
    emotionPcts = {
      confident: 0,
      focused: 0,
      smiling: 0,
      tense: 0,
    };
  }

  const authenticStrengths = [];
  if (isVeryShortSession || totalScore < 40) {
    authenticStrengths.push(
      'Chưa ghi nhận được ưu điểm chuyên môn rõ nét do phiên phỏng vấn kết thúc quá sớm hoặc câu trả lời quá ngắn.'
    );
  } else {
    if (comps.domainKnowledge >= 70) {
      authenticStrengths.push(
        `Nắm bắt tốt các thuật ngữ và nguyên lý ngành ${taxonomy.categoryName}. Thể hiện được kiến thức nền tảng vững vàng.`
      );
    }
    if (comps.problemSolving >= 70) {
      authenticStrengths.push(
        'Tư duy giải quyết vấn đề mạch lạc, biết phân tích nguyên nhân gốc rễ và đề xuất phương án xử lý thực tế.'
      );
    }
    if (wpmInfo.isReliable && telemetry.avgWpm >= 100 && telemetry.avgWpm <= 150) {
      authenticStrengths.push(
        `Tốc độ trình bày đạt chuẩn tự nhiên (${telemetry.avgWpm} từ/phút), phát âm rõ ràng, nhịp điệu ổn định.`
      );
    }
    if (telemetry.totalFillers <= 2 && totalWords >= 40) {
      authenticStrengths.push(
        `Kiểm soát tốt ngôn từ diễn đạt, hạn chế tối đa các từ đệm ngập ngừng (chỉ ${telemetry.totalFillers} lần trong suốt buổi).`
      );
    }
    if (hasCameraUsed && telemetry.avgEyeContact >= 70) {
      authenticStrengths.push(
        `Tương tác ánh mắt qua webcam tốt (${telemetry.avgEyeContact}%), duy trì sự tập trung trực diện tạo cảm giác tự tin.`
      );
    }
    if (totalQ >= targetMaxQ && totalScore >= 60) {
      authenticStrengths.push(
        `Hoàn thành trọn vẹn ${totalQ} câu hỏi đối thoại chuyên sâu, duy trì sự tập trung và tinh thần cầu thị.`
      );
    }
    if (authenticStrengths.length === 0) {
      authenticStrengths.push('Đã có nỗ lực phản hồi các câu hỏi phỏng vấn trong buổi đối thoại.');
    }
  }

  const authenticFlaws = [];
  if (isSessionIncomplete) {
    authenticFlaws.push(
      `Phiên phỏng vấn kết thúc sớm: Mới thực hiện ${totalQ}/${targetMaxQ} câu hỏi, chưa đủ dữ liệu đánh giá đầy đủ các vòng chuyên môn.`
    );
  }
  if (cleanedWeakness) {
    authenticFlaws.push(`Lỗ hổng cốt lõi: ${cleanedWeakness}`);
  } else if (comps.domainKnowledge < 70) {
    authenticFlaws.push(
      `Thiếu hụt kiến thức công nghệ thực tế: Chưa gọi tên và phân tích được các khái niệm cốt lõi của vị trí ${cleanTopic} (như ${keywordGap.missing.slice(0, 3).join(', ') || 'các công cụ chuyên ngành'}).`
    );
  }
  if (comps.problemSolving < 70) {
    authenticFlaws.push(
      'Tư duy xử lý tình huống còn sơ sài: Chưa chỉ rõ nguyên nhân gốc rễ (Root Cause) và thiếu các phương án giải pháp dự phòng.'
    );
  }
  if (comps.structureSTAR < 70) {
    authenticFlaws.push(
      `Chưa áp dụng mô hình STAR: Thiếu số liệu đo lường định lượng (${taxonomy.metricsTerm}) để chứng minh kết quả giải pháp thực tế.`
    );
  }
  if (comps.deliveryTone < 50 || isVeryShortSession) {
    authenticFlaws.push(
      'Phong thái diễn đạt chưa đạt chuẩn: Câu trả lời quá ngắn hoặc ngắt quãng, thiếu sự liên kết logic giữa các luận điểm.'
    );
  }

  const filteredQuestions = questions.filter((q) => {
    if (questionFilter === 'high') return (q.score ?? 0) >= 60;
    if (questionFilter === 'low') return (q.score ?? 0) < 60;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#1e1b4b] pb-20 font-sans print:bg-white print:p-0">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-3 rounded-2xl bg-[#32247b]/95 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-xl border border-white/20 animate-bounce print:hidden">
          <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs print:static print:border-b-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#32247b] text-slate-700 hover:text-[#32247b] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs print:hidden"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Quay Lại Studio</span>
            </button>
            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block print:hidden" />
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-[#32247b] text-xs font-mono font-bold border border-purple-200">
                {session.id || 'HM-REPORT'}
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                Báo Cáo Đánh Giá: {cleanTopic}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => copyToClipboard(window.location.href, 'Liên kết báo cáo')}
              title="Sao chép liên kết"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span className="hidden sm:inline">In Báo Cáo</span>
            </button>
            <button
              onClick={() => { window.location.hash = '#/ai-interview'; }}
              className="px-3.5 py-1.5 rounded-xl bg-[#32247b] hover:bg-[#251963] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Luyện Phiên Mới</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ===================================================================== */}
        {/* HEADER TỔNG QUAN                                                      */}
        {/* ===================================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 relative overflow-hidden font-sans">
          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8">
            
            {/* Vòng tròn Điểm Tổng Kết */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f1f5f9" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={gaugeStroke}
                    strokeWidth="9"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(100, Math.max(0, totalScore)) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
                    {totalScore}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">/ 100 Điểm</span>
                </div>
              </div>

              <div className={`mt-3 px-3.5 py-1 rounded-full text-xs font-bold border tracking-wide shadow-2xs ${gradeColor}`}>
                {grade}
              </div>
            </div>

            {/* Thông Tin Phiên & Nhận Xét AI */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                  <span className="px-3 py-1 rounded-xl bg-purple-100/80 text-[#32247b] text-xs font-bold border border-purple-200/60">
                    {cleanTopic}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-semibold border border-indigo-100">
                    Ngành: {taxonomy.categoryName}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                    Cấp độ: {session.level || 'Middle'}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                    Thời lượng: {session.duration || '15 phút'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${hasCameraUsed ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                    <span className="material-symbols-outlined text-xs">{hasCameraUsed ? 'videocam' : 'videocam_off'}</span>
                    <span>{hasCameraUsed ? 'Webcam Bật (Face Biometrics)' : 'Camera Tắt (Audio Only)'}</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Báo Cáo Đánh Giá Năng Lực Phỏng Vấn AI
                </h2>
              </div>

              {/* Nhận xét chung */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-white border border-purple-100 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5 text-[#32247b] font-bold">
                  <span className="material-symbols-outlined text-base text-amber-500">psychology</span>
                  <span>Nhận Xét Từ Hội Đồng Tuyển Dụng AI:</span>
                </div>
                <p className="italic text-slate-700 font-normal">
                  "{session.aiSummary}"
                </p>
                {cleanedWeakness && (
                  <div className="mt-2.5 pt-2 border-t border-purple-200/50 text-xs text-rose-800 flex items-start gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-sm text-rose-600 shrink-0 mt-0.5">warning</span>
                    <span><strong>Lỗ hổng trọng yếu:</strong> {cleanedWeakness}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 MINI STAT CARDS (THANH CHỈ SỐ THỰC TẾ) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            {/* Card 1: Tiến độ hoàn thành */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Tiến Độ Hoàn Thành
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
                {totalQ} / {targetMaxQ} <span className="text-xs font-normal text-slate-500">câu</span>
              </div>
              <span className={`text-[10px] font-semibold block ${isSessionIncomplete ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isSessionIncomplete ? 'Dừng sớm • Chưa đủ vòng' : 'Hoàn thành 100%'}
              </span>
            </div>

            {/* Card 2: Độ dài câu trả lời TB */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                2. Độ Dài Câu Trả Lời TB
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-700 font-mono">
                {avgWordsPerQ} <span className="text-xs font-normal text-slate-500">từ / câu</span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium block">
                {avgWordEvaluation}
              </span>
            </div>

            {/* Card 3: Tốc độ nói WPM */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Tốc Độ Trình Bày
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-teal-700 font-mono">
                {wpmInfo.displayVal}
              </div>
              <span className="text-[10px] text-slate-600 font-medium block truncate" title={wpmInfo.badgeText}>
                {wpmInfo.badgeText}
              </span>
            </div>

            {/* Card 4: Từ đệm & Độ trôi chảy */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                4. Từ Đệm &amp; Độ Trôi Chảy
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-amber-700 font-mono">
                {telemetry.totalFillers} <span className="text-xs font-normal text-slate-500">từ đệm</span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium block">
                {telemetry.totalFillers <= 2 ? 'Lưu loát • Kiểm soát tốt' : telemetry.totalFillers <= 5 ? 'Chấp nhận được' : 'Ngắt quãng nhiều'}
              </span>
            </div>
          </div>

          {/* 2 HỘP ĐỐI CHIẾU NHANH (ĐIỂM SÁNG vs LỖ HỔNG) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                <span>Điểm Sáng Ghi Nhận:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                {authenticStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                <span className="material-symbols-outlined text-base text-rose-600">cancel</span>
                <span>Lỗ Hổng Cốt Lõi Cần Khắc Phục Ngay:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                {authenticFlaws.map((flaw, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold shrink-0 mt-0.5">✕</span>
                    <span className="leading-relaxed">{flaw}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SEGMENTED 3-TAB SELECTOR (CHUẨN 3 TAB CHUYÊN NGHIỆP)                  */}
        {/* ===================================================================== */}
        <div className="flex border-b border-slate-200 gap-2 print:hidden overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 sm:px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#32247b] text-[#32247b] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">analytics</span>
            <span>1. Ma Trận Năng Lực &amp; Độ Phủ Từ Khóa</span>
          </button>

          <button
            onClick={() => setActiveTab('biometrics')}
            className={`px-4 sm:px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'biometrics'
                ? 'border-[#32247b] text-[#32247b] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">face</span>
            <span>2. Khuôn Mặt, Biểu Cảm &amp; Ngữ Điệu (AI Biometrics)</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 sm:px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'questions'
                ? 'border-[#32247b] text-[#32247b] bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">quiz</span>
            <span>3. Giải Phẫu Từng Câu Hỏi &amp; Lộ Trình Cải Thiện ({totalQ})</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: MA TRẬN 4 TRỤ CỘT NĂNG LỰC & ĐỘ PHỦ TỪ KHÓA CHUYÊN NGÀNH       */}
        {/* ===================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 4 Thẻ Trụ Cột Năng Lực Tuyển Dụng (2x2 Grid) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#32247b] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">assessment</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Ma Trận 4 Trụ Cột Năng Lực Tuyển Dụng
                    </h3>
                    <p className="text-xs text-slate-500">
                      Đo lường năng lực chuyên môn, giải quyết vấn đề, cấu trúc STAR và phong thái sinh trắc học
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-purple-50 text-[#32247b] text-xs font-bold border border-purple-200">
                  Chuẩn Khảo Thí Tuyển Dụng
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Kiến Thức Chuyên Môn Ngành (35%) */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-indigo-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        1. Kiến Thức Chuyên Môn Ngành
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-mono font-bold">
                      35% trọng số
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${comps.domainKnowledge >= 70 ? 'text-emerald-700' : comps.domainKnowledge >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {comps.domainKnowledge >= 70 ? '✓ Đạt chuẩn kiến thức' : comps.domainKnowledge >= 50 ? '△ Cần bổ sung thuật ngữ' : '✕ Chưa đạt chuẩn'}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {comps.domainKnowledge} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          comps.domainKnowledge >= 70 ? 'bg-indigo-600' : comps.domainKnowledge >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(6, Math.min(100, comps.domainKnowledge))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                    {comps.domainKnowledge >= 70 ? (
                      <p>Ứng viên nắm vững thuật ngữ và các khái niệm cốt lõi của vị trí {cleanTopic}. Thể hiện sự tự tin khi giải thích quy trình nghiệp vụ.</p>
                    ) : (
                      <p className="text-rose-900/90 font-medium">
                        <strong>Nhận xét:</strong> Thiếu vắng các thuật ngữ chuyên môn cốt lõi của vị trí {cleanTopic} (như {keywordGap.missing.slice(0, 3).join(', ') || 'các tiêu chuẩn chuyên ngành'}). Câu trả lời còn chung chung, mang tính suy đoán thay vì kiến thức thực chiến.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Tư Duy Giải Quyết Vấn Đề (25%) */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-cyan-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        2. Tư Duy Giải Quyết Vấn Đề
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 text-[11px] font-mono font-bold">
                      25% trọng số
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${comps.problemSolving >= 70 ? 'text-emerald-700' : comps.problemSolving >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {comps.problemSolving >= 70 ? '✓ Phân tích logic tốt' : comps.problemSolving >= 50 ? '△ Cần đào sâu giải pháp' : '✕ Tư duy rời rạc'}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {comps.problemSolving} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          comps.problemSolving >= 70 ? 'bg-cyan-600' : comps.problemSolving >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(6, Math.min(100, comps.problemSolving))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                    {comps.problemSolving >= 70 ? (
                      <p>Có khả năng phân tích nguyên nhân gốc rễ (Root Cause) rõ ràng, nêu được phương án dự phòng và hiểu các đánh đổi thực tế.</p>
                    ) : (
                      <p className="text-rose-900/90 font-medium">
                        <strong>Nhận xét:</strong> Chưa phân tích được nguyên nhân gốc rễ khi đối mặt tình huống sự cố. Thiếu phương án dự phòng và chưa nêu được các đánh đổi nghiệp vụ (Trade-offs).
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Cấu Trúc STAR & Dẫn Chứng Thực Tế (20%) */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-amber-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        3. Cấu Trúc STAR & Dẫn Chứng Thực Tế
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-mono font-bold">
                      20% trọng số
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${comps.structureSTAR >= 70 ? 'text-emerald-700' : comps.structureSTAR >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {comps.structureSTAR >= 70 ? '✓ Cấu trúc bài bản' : comps.structureSTAR >= 50 ? '△ Thiếu số liệu thực chứng' : '✕ Chưa áp dụng STAR'}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {comps.structureSTAR} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          comps.structureSTAR >= 70 ? 'bg-amber-500' : comps.structureSTAR >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(6, Math.min(100, comps.structureSTAR))}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                    {comps.structureSTAR >= 70 ? (
                      <p>Trình bày mạch lạc theo đúng 4 phần: Bối cảnh (S) - Nhiệm vụ (T) - Hành động (A) - Kết quả (R) kèm số liệu minh chứng.</p>
                    ) : (
                      <p className="text-rose-900/90 font-medium">
                        <strong>Nhận xét:</strong> Trình bày còn gộp chung lý thuyết, không tách bạch hành động cá nhân và kết quả. Hoàn toàn vắng bóng các số liệu đo lường định lượng ({taxonomy.metricsTerm}).
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Phong Thái Khuôn Mặt, Ngữ Điệu & Độ Lưu Loát (20%) */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        4. Phong Thái Khuôn Mặt, Ngữ Điệu &amp; Độ Lưu Loát
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-mono font-bold">
                      20% trọng số
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${comps.deliveryTone >= 70 ? 'text-emerald-700' : comps.deliveryTone >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {comps.deliveryTone >= 70 ? '✓ Phong thái tự tin & lưu loát' : comps.deliveryTone >= 50 ? '△ Cần ổn định nhịp điệu' : '✕ Chưa đạt chuẩn lưu loát'}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {comps.deliveryTone} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          comps.deliveryTone >= 70 ? 'bg-emerald-600' : comps.deliveryTone >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(6, Math.min(100, comps.deliveryTone))}%` }}
                      />
                    </div>
                  </div>

                  {/* Hiển thị rõ cả 2 nhóm chỉ số: Ngữ điệu giọng nói & Nhận diện khuôn mặt */}
                  <div className="pt-2 border-t border-slate-200/60 text-xs space-y-2">
                    {isVeryShortSession ? (
                      <p className="text-rose-900/90 font-medium">
                        <strong>Chưa đủ dữ liệu:</strong> Phiên kết thúc quá sớm ({totalWords} từ), chưa đủ dữ liệu giọng nói và biểu cảm để chấm điểm phong thái.
                      </p>
                    ) : (
                      <>
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1 text-slate-700">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-indigo-600">graphic_eq</span>
                            <span>Ngữ điệu &amp; Độ lưu loát giọng nói:</span>
                          </div>
                          <p className="pl-4">
                            {hasMicrophoneUsed ? (
                              <>
                                Tốc độ: <strong>{telemetry.avgWpm} WPM</strong>
                                {hasPitchData && (
                                  <>
                                    {' '}• Âm sắc F0: <strong>{telemetry.avgPitchHz} Hz</strong> ({Number(telemetry.avgPitchHz) >= 100 && Number(telemetry.avgPitchHz) <= 240 ? 'Âm sắc ổn định' : 'Hơi căng thẳng'})
                                  </>
                                )}
                                {' '}• Từ đệm: <strong>{telemetry.totalFillers} lần</strong>.
                              </>
                            ) : (
                              <span className="text-slate-500 italic">Chưa ghi nhận âm thanh qua Micro (hoặc ứng viên trả lời bằng văn bản).</span>
                            )}
                          </p>
                        </div>

                        <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1 text-slate-700">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-teal-600">face</span>
                            <span>Nhận diện khuôn mặt &amp; Ánh mắt:</span>
                          </div>
                          <p className="pl-4">
                            {hasCameraUsed ? (
                              <>
                                Giao tiếp mắt: <strong>{telemetry.avgEyeContact}%</strong> • Biểu cảm: <strong>{telemetry.emotionSummary || 'Tự tin'}</strong> • Góc mặt: <strong>{telemetry.postureStatus || 'Nhìn thẳng ổn định'}</strong>.
                              </>
                            ) : (
                              <span className="text-amber-700 italic">Camera đang tắt (Chỉ chấm điểm dựa trên ngữ điệu và độ lưu loát giọng nói).</span>
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG TÓM TẮT NHANH SINH TRẮC HỌC KHUÔN MẶT & NGỮ ĐIỆU GIỌNG NÓI */}
            <div className="bg-gradient-to-r from-teal-50/70 via-indigo-50/60 to-purple-50/50 rounded-3xl border border-teal-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Tóm Tắt Nhanh Quét Sinh Trắc Học (AI Face &amp; Voice Biometrics)
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Dữ liệu âm thanh Micro và luồng camera phân tích tự động trong suốt phiên đối thoại
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('biometrics')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#32247b] hover:bg-[#251963] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Xem Chi Tiết AI Biometrics</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white/90 rounded-2xl border border-teal-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tốc Độ Phát Biểu</span>
                  <div className="text-sm font-extrabold text-teal-800 font-mono">
                    {hasMicrophoneUsed ? `${telemetry.avgWpm} WPM` : 'Chưa đo WPM'}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium block truncate">{wpmInfo.badgeText}</span>
                </div>

                <div className="p-3 bg-white/90 rounded-2xl border border-teal-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ngữ Điệu F0</span>
                  <div className="text-sm font-extrabold text-indigo-700 font-mono">
                    {hasPitchData ? `${telemetry.avgPitchHz} Hz` : 'Chưa đo Pitch'}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium block">
                    {hasPitchData
                      ? (Number(telemetry.avgPitchHz) >= 100 && Number(telemetry.avgPitchHz) <= 240 ? 'Âm sắc ổn định' : 'Hơi đều / Căng thẳng')
                      : 'Không có dữ liệu F0'}
                  </span>
                </div>

                <div className="p-3 bg-white/90 rounded-2xl border border-teal-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Từ Đệm Ngập Ngừng</span>
                  <div className="text-sm font-extrabold text-amber-700 font-mono">{telemetry.totalFillers} lần</div>
                  <span className="text-[10px] text-slate-600 font-medium block">
                    {totalWords < 20 ? 'Chưa đủ dữ liệu' : telemetry.totalFillers <= 2 ? 'Rất lưu loát' : 'Cần hạn chế từ đệm'}
                  </span>
                </div>

                <div className="p-3 bg-white/90 rounded-2xl border border-teal-100 shadow-2xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Ánh Mắt &amp; Camera</span>
                  {hasCameraUsed ? (
                    <>
                      <div className="text-sm font-extrabold text-teal-700 font-mono">{telemetry.avgEyeContact}%</div>
                      <span className="text-[10px] text-slate-600 font-medium block truncate">{telemetry.emotionSummary || 'Tự tin'}</span>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold text-amber-700">Camera Tắt</div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {hasMicrophoneUsed ? 'Chỉ đo Micro' : 'Chưa đo âm thanh'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* KHUNG PHÂN TÍCH TỪ KHÓA CHUYÊN NGÀNH (KEYWORD GAP ANALYSIS) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">key</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Phân Tích Độ Phủ Từ Khóa Chuyên Ngành ({taxonomy.categoryName})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Đối chiếu thuật ngữ chuyên môn trong câu trả lời thực tế của bạn với tiêu chuẩn tuyển dụng vị trí {cleanTopic}
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  Keyword Gap Analysis
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 🟢 Từ khóa chuyên ngành bạn đã nêu được */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
                      <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                      <span>Từ Khóa Chuyên Ngành Bạn Đã Nêu Được:</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold">
                      {keywordGap.mentioned.length} từ
                    </span>
                  </div>

                  {keywordGap.mentioned.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {keywordGap.mentioned.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{kw}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/80 border border-emerald-200/60 text-xs text-emerald-900 italic">
                      Chưa ghi nhận thuật ngữ chuyên môn cốt lõi nào trong các câu trả lời. Bạn đang trả lời bằng các từ ngữ chung chung hoặc suy đoán cảm tính.
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-800 leading-relaxed pt-2 border-t border-emerald-200/60">
                    💡 <strong>Ý nghĩa tuyển dụng:</strong> Sử dụng chính xác thuật ngữ ngành giúp bạn chứng minh kinh nghiệm thực chiến và tạo sự tin cậy với người phỏng vấn.
                  </p>
                </div>

                {/* 🔴 Từ khóa cốt lõi còn thiếu (Missing Keywords) */}
                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                      <span className="material-symbols-outlined text-base text-rose-600">error_outline</span>
                      <span>Từ Khóa Cốt Lõi Còn Thiếu (Missing Keywords):</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-mono font-bold">
                      {keywordGap.missing.length} từ
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {keywordGap.missing.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-medium shadow-2xs flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-rose-800 leading-relaxed pt-2 border-t border-rose-200/60">
                    ⚠️ <strong>Khuyến nghị từ AI:</strong> Hãy chủ động lồng ghép các từ khóa cốt lõi trên vào phần Bối cảnh và Hành động của mô hình STAR ở phiên phỏng vấn tiếp theo.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: KHUÔN MẶT, BIỂU CẢM & NGỮ ĐIỆU GIỌNG NÓI (AI BIOMETRICS)        */}
        {/* ===================================================================== */}
        {activeTab === 'biometrics' && (
          <div className="space-y-6 animate-fadeIn font-sans">
            
            {/* Header Tab 2 */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-2">
              <div className="flex items-center gap-2.5 text-[#32247b]">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#32247b] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">sensors</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Phân Tích Sinh Trắc Học Giọng Nói &amp; Nhận Diện Khuôn Mặt (AI Biometrics)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hệ thống đo lường khách quan tốc độ nói, ngữ điệu âm sắc, tiếp xúc mắt và phân bổ cảm xúc
                  </p>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* KHỐI A: PHÂN TÍCH NGỮ ĐIỆU GIỌNG NÓI & ĐỘ LƯU LOÁT                */}
            {/* ================================================================= */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">record_voice_over</span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Khối A: Phân Tích Ngữ Điệu Giọng Nói &amp; Độ Lưu Loát (AI Voice &amp; Fluency Analytics)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Phân tích tần số âm thanh, tốc độ phát biểu và khả năng kiểm soát từ đệm thu âm qua Micro
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  Microphone Stream
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Tốc Độ Trình Bày & Nhịp Điệu (avgWpm) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-teal-600">speed</span>
                      1. Tốc Độ Trình Bày &amp; Nhịp Điệu
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-xs font-mono font-bold">
                      {hasMicrophoneUsed ? `${telemetry.avgWpm} WPM` : 'Chưa đo WPM'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Chậm (&lt;100)</span>
                      <span className="text-emerald-700 font-bold">Chuẩn Vàng (100 - 150 WPM)</span>
                      <span>Nhanh (&gt;150)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          hasMicrophoneUsed
                            ? (telemetry.avgWpm >= 100 && telemetry.avgWpm <= 150 ? 'bg-emerald-600' : 'bg-amber-500')
                            : 'bg-slate-300'
                        }`}
                        style={{ width: hasMicrophoneUsed ? `${Math.min(100, Math.max(10, (telemetry.avgWpm / 180) * 100))}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pt-1">
                    {wpmInfo.assessment}
                  </p>
                </div>

                {/* 2. Ngữ Điệu & Độ Ổn Định Âm Sắc (avgPitchHz) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-indigo-600">graphic_eq</span>
                      2. Ngữ Điệu &amp; Độ Ổn Định Âm Sắc
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-mono font-bold">
                      {hasPitchData ? `${telemetry.avgPitchHz} Hz` : 'Chưa có dữ liệu F0'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Trầm ấm (&lt;120Hz)</span>
                      <span className="text-indigo-700 font-bold">Ổn Định (100 - 240 Hz)</span>
                      <span>Cao độ (&gt;240Hz)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                        style={{ width: hasPitchData ? `${Math.min(100, Math.max(15, (telemetry.avgPitchHz / 280) * 100))}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pt-1">
                    {!hasPitchData
                      ? 'Phiên này chưa ghi nhận được tần số âm sắc F0 qua Micro (do ứng viên tắt micro hoặc trả lời bằng văn bản). Hệ thống không chấm điểm ngữ điệu ảo.'
                      : totalWords < 20
                        ? 'Chưa đủ dữ liệu lời nói (< 20 từ) để đo lường tần số âm sắc giọng nói.'
                        : Number(telemetry.avgPitchHz) >= 100 && Number(telemetry.avgPitchHz) <= 240
                          ? 'Âm sắc giọng nói nằm trong ngưỡng ổn định (100 - 240 Hz), ngữ điệu rõ ràng, thể hiện sự tự tin và điềm tĩnh khi diễn đạt.'
                          : 'Ngữ điệu giọng nói có dấu hiệu căng thẳng hoặc hơi đều. Nên chủ động nhấn giọng vào các từ khóa hành động và số liệu kết quả để tăng tính thuyết phục.'}
                  </p>
                </div>

                {/* 3. Độ Lưu Loát & Kiểm Soát Từ Đệm (totalFillers) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-amber-600">record_voice_over</span>
                      3. Độ Lưu Loát &amp; Kiểm Soát Từ Đệm
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-mono font-bold">
                      {telemetry.totalFillers} từ đệm
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {totalWords < 20
                      ? `Chưa đủ dữ liệu đàm thoại (${totalWords} từ) để phát hiện từ đệm ngập ngừng.`
                      : telemetry.totalFillers === 0
                        ? `Rất lưu loát! Không phát hiện từ đệm ngập ngừng ("à, ừm, kiểu như") trong các câu trả lời.`
                        : telemetry.totalFillers <= 2
                          ? `Rất lưu loát! Bạn chỉ dùng ${telemetry.totalFillers} lần từ đệm ("à, ừm"), kiểm soát tốt cấu trúc câu trả lời.`
                          : telemetry.totalFillers <= 5
                            ? `Mức độ lưu loát khá (${telemetry.totalFillers} lần từ đệm). Đôi chỗ còn xuất hiện từ đệm ngập ngừng khi bạn chuyển ý hoặc suy nghĩ phương án.`
                            : `Ngắt quãng nhiều (${telemetry.totalFillers} lần dùng từ đệm "à, ừm, kiểu như"). Hãy tập dừng lại 2 giây suy nghĩ dàn ý trước khi mở lời thay vì phát âm từ đệm.`}
                  </p>

                  <div className="pt-2 border-t border-slate-200/70 text-[11px] text-amber-900 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-xs text-amber-600">tips_and_updates</span>
                    <span>Bí quyết: 1 giây im lặng chuyên nghiệp luôn tốt hơn 1 từ đệm ngập ngừng.</span>
                  </div>
                </div>

                {/* 4. Độ Sâu & Sự Mạch Lạc Câu Trả Lời (avgWordsPerQ) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-purple-600">format_quote</span>
                      4. Độ Sâu &amp; Khả Năng Triển Khai Ý
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 text-xs font-mono font-bold">
                      {avgWordsPerQ} từ / câu
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {avgWordsPerQ < 15
                      ? `Câu trả lời trung bình quá ngắn (${avgWordsPerQ} từ/câu). Bạn chỉ nói ngắn cụt lủn hoặc tóm tắt ý sơ sài, chưa đủ chiều sâu để chứng minh năng lực thực tế.`
                      : avgWordsPerQ <= 45
                        ? `Độ dài trung bình đạt mức cơ bản (${avgWordsPerQ} từ/câu). Cần mở rộng thêm phần Hành động kỹ thuật (Action) và dẫn chứng số liệu (Result) để câu trả lời thêm sức nặng.`
                        : `Độ dài trung bình đạt ${avgWordsPerQ} từ/câu (khá chi tiết về mặt dung lượng lời nói). Hãy đảm bảo câu trả lời chứa đựng thuật ngữ chuyên môn và số liệu định lượng theo mô hình STAR thay vì chỉ nói nhiều về mặt số lượng từ.`}
                  </p>

                  <div className="pt-2 border-t border-slate-200/70 text-[11px] text-purple-900 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-xs text-purple-600">task_alt</span>
                    <span>Chuẩn khuyến nghị: 60 - 120 từ/câu cho các câu hỏi tình huống &amp; chuyên môn.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* KHỐI B: AI QUÉT KHUÔN MẶT, ÁNH MẮT & BIỂU CẢM                     */}
            {/* ================================================================= */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">face</span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Khối B: AI Quét Khuôn Mặt, Ánh Mắt &amp; Biểu Cảm (AI Face &amp; Gaze Biometrics)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Theo dõi độ tập trung ánh mắt, biểu cảm khuôn mặt và góc mặt qua Camera webcam
                    </p>
                  </div>
                </div>
                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${hasCameraUsed ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {hasCameraUsed ? 'AI Face Tracking Active' : 'Camera Inactive'}
                </span>
              </div>

              {hasCameraUsed ? (
                /* TRƯỜNG HỢP CÓ BẬT CAMERA */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Giao tiếp ánh mắt */}
                    <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-teal-950 flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-teal-600">visibility</span>
                          1. Giao Tiếp Ánh Mắt
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-xs font-mono font-bold">
                          {telemetry.avgEyeContact}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-teal-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-600 transition-all duration-700"
                          style={{ width: `${Math.min(100, Math.max(10, telemetry.avgEyeContact))}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {telemetry.avgEyeContact >= 70
                          ? `Tập trung trực diện rất tốt (${telemetry.avgEyeContact}% thời lượng). Bạn duy trì ánh mắt vào ống kính camera, tạo cảm giác tự tin và chuyên nghiệp.`
                          : telemetry.avgEyeContact >= 50
                            ? `Mức độ tập trung khá (${telemetry.avgEyeContact}%). Đôi lúc có thói quen đảo mắt xuống bàn hoặc nhìn lệch khung hình khi suy nghĩ.`
                            : `Ánh mắt thường xuyên nhìn lệch khỏi camera (${telemetry.avgEyeContact}%). Hãy tập thói quen nhìn thẳng vào ống kính webcam khi trả lời.`}
                      </p>
                    </div>

                    {/* 2. Biểu cảm chủ đạo & phân bổ */}
                    <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-purple-950 flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-purple-600">mood</span>
                          2. Biểu Cảm Chủ Đạo
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold">
                          {telemetry.emotionSummary || 'Tự tin & Thân thiện'}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Tự tin (Confident):</span>
                          <span className="font-mono font-bold text-purple-900">{emotionPcts.confident}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-purple-200 overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${emotionPcts.confident}%` }} />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-600">Tập trung (Focused):</span>
                          <span className="font-mono font-bold text-indigo-900">{emotionPcts.focused}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-indigo-200 overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${emotionPcts.focused}%` }} />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-600">Thân thiện (Smiling):</span>
                          <span className="font-mono font-bold text-teal-900">{emotionPcts.smiling}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-teal-200 overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full" style={{ width: `${emotionPcts.smiling}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* 3. Tư thế góc mặt qua webcam */}
                    <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-indigo-950 flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-indigo-600">accessibility_new</span>
                          3. Góc Mặt &amp; Khung Hình
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">
                          {telemetry.postureStatus || 'Nhìn thẳng ổn định'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        Khuôn mặt và hai vai được giữ cân đối giữa khung hình webcam. Góc mặt trực diện, không bị nghiêng lệch hay cúi gằm mặt xuống bàn khi đối thoại.
                      </p>

                      <div className="pt-2 border-t border-indigo-200/70 text-[11px] text-indigo-900 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-xs text-indigo-600">check_circle</span>
                        <span>Khoảng cách đến ống kính phù hợp (50 - 70 cm).</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TRƯỜNG HỢP CAMERA TẮT */
                <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">videocam_off</span>
                    </div>
                    <div>
                      <h5 className="text-sm sm:text-base font-extrabold text-amber-950">
                        Camera Đang Tắt Trong Phiên Phỏng Vấn Này
                      </h5>
                      <p className="text-xs text-amber-900">
                        Chế độ phỏng vấn hoàn toàn tập trung vào dữ liệu âm thanh giọng nói qua Micro
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/90 p-4 rounded-xl border border-amber-200/70">
                    Hệ thống AI Face Tracking <strong>không chấm điểm Ánh mắt &amp; Biểu cảm khuôn mặt</strong> do bạn chưa bật Camera. Điểm Phong thái ở phiên này được tính 100% dựa trên <strong>Ngữ điệu giọng nói, Tốc độ WPM và Độ lưu loát qua Micro</strong>. Hãy bật Camera (hoặc Quét khuôn mặt AI) ở phiên tiếp theo để mở khóa trọn bộ phân tích biểu cảm!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-amber-200 text-slate-700 space-y-1">
                      <strong className="text-amber-900 font-bold block">Bước 1: Cấp quyền Webcam</strong>
                      <span>Nhấp vào biểu tượng camera trên thanh địa chỉ trình duyệt để cho phép.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-amber-200 text-slate-700 space-y-1">
                      <strong className="text-amber-900 font-bold block">Bước 2: Căn chỉnh ngang mắt</strong>
                      <span>Đặt webcam ngang tầm mắt để ánh nhìn luôn trực diện tự nhiên.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-amber-200 text-slate-700 space-y-1">
                      <strong className="text-amber-900 font-bold block">Bước 3: Mở khóa Face Analytics</strong>
                      <span>AI sẽ chấm điểm tiếp xúc mắt, nụ cười và phân bổ cảm xúc tức thì.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: GIẢI PHẪU CHI TIẾT TỪNG CÂU HỎI & LỘ TRÌNH ÔN TẬP              */}
        {/* ===================================================================== */}
        {activeTab === 'questions' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header Bộ Lọc Câu Hỏi */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#32247b] text-lg">question_answer</span>
                  Chi Tiết Từng Câu Hỏi &amp; Mẫu Chuẩn STAR
                </h3>
                <p className="text-xs text-slate-500">Đối chiếu câu trả lời của bạn với câu trả lời mẫu điểm 10, chỉ số Telemetry và 4 ô S-T-A-R</p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setQuestionFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    questionFilter === 'all'
                      ? 'bg-white text-[#32247b] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({totalQ})
                </button>
                <button
                  onClick={() => setQuestionFilter('high')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    questionFilter === 'high'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-100/60'
                  }`}
                >
                  Đạt (≥60đ)
                </button>
                <button
                  onClick={() => setQuestionFilter('low')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    questionFilter === 'low'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-800 hover:bg-rose-100/60'
                  }`}
                >
                  Cần cải thiện (&lt;60đ)
                </button>
              </div>
            </div>

            {/* Danh Sách Từng Câu Hỏi - KHUNG ĐỐI CHIẾU 2 CỘT HIỆN ĐẠI */}
            <div className="space-y-6">
              {filteredQuestions.map((item, idx) => {
                const score = item.score ?? 0;
                const scoreBadge =
                  score >= 80
                    ? { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Xuất sắc' }
                    : score >= 60
                      ? { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'Đạt yêu cầu' }
                      : { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Cần cải thiện' };

                const qText = item.q || item.questionText || '';
                const ansText = (item.answer || '').trim();
                const rawCritique = item.criticalFeedback?.flaws || item.aiFeedback || '';
                const rawModel = item.modelAnswer || item.aiSuggestedAnswer || '';
                const targetPos = cleanTopic;

                const { qType, critique, modelAnswer, strategyGuide } = enrichFeedbackAndModelAnswer(
                  qText,
                  ansText,
                  rawCritique,
                  rawModel,
                  targetPos,
                  taxonomy
                );

                const parsedCritique = parseFeedbackSection(critique);
                const parsedStar = parseStarModelAnswer(modelAnswer);
                const wordCount = ansText ? ansText.split(/\s+/).filter(Boolean).length : 0;

                const qWpm = (item.wpm && Number(item.wpm) > 0) ? Number(item.wpm) : (hasMicrophoneUsed ? Number(telemetry.avgWpm) : null);
                const qPitch = (item.pitchHz && Number(item.pitchHz) > 0) ? Number(item.pitchHz) : (hasPitchData ? Number(telemetry.avgPitchHz) : null);
                const qEye = (item.eyeContact != null && Number(item.eyeContact) > 0) ? Number(item.eyeContact) : (hasCameraUsed ? Number(telemetry.avgEyeContact) : null);

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-[#32247b]/30 transition-all p-5 sm:p-7 space-y-5 font-sans"
                  >
                    {/* Header: Số thứ tự câu, Thể loại, Nội dung câu hỏi & Điểm số */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1.5 sm:max-w-[78%]">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#32247b]/10 text-[#32247b] text-xs font-mono font-bold">
                            Câu #{idx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                            {qType}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {qText}
                        </h4>
                      </div>

                      {/* Badge Điểm số */}
                      <div className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 border ${scoreBadge.bg}`}>
                        <span className="text-sm">{score}</span>
                        <span className="text-[10px] font-sans opacity-80">/ 100đ</span>
                        <span className="w-1 h-1 rounded-full bg-current opacity-40 ml-0.5" />
                        <span className="text-[10px] font-sans font-medium">{scoreBadge.text}</span>
                      </div>
                    </div>

                    {/* KHUNG ĐỐI CHIẾU 2 CỘT */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* ============================================== */}
                      {/* CỘT TRÁI: THỰC TẾ CỦA BẠN                      */}
                      {/* ============================================== */}
                      <div className="space-y-4 flex flex-col justify-between">
                        {/* 1. Lời đáp của bạn & Dải Telemetry */}
                        <div className="rounded-2xl bg-slate-50/90 p-4 border-l-4 border-slate-400 space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                              <span>Lời đáp thực tế của bạn:</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Nút bấm nghe lại giọng nói thật hoặc TTS */}
                              {ansText && (
                                <button
                                  type="button"
                                  onClick={() => playCandidateAnswer(item, idx)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                    playingCandidateIdx === idx
                                      ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                                      : item.audioUrl
                                      ? 'bg-indigo-50 hover:bg-indigo-100 text-[#32247b] border border-indigo-200'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  }`}
                                  title={item.audioUrl ? 'Nghe lại file ghi âm giọng nói thật của bạn' : 'Nghe AI đọc lại câu trả lời'}
                                >
                                  <span className="material-symbols-outlined text-xs">
                                    {playingCandidateIdx === idx ? 'stop' : item.audioUrl ? 'headphones' : 'volume_up'}
                                  </span>
                                  <span>
                                    {playingCandidateIdx === idx
                                      ? '⏹ Dừng Nghe'
                                      : item.audioUrl
                                      ? '🎧 Nghe Giọng Của Bạn'
                                      : '🔊 Nghe Lại'}
                                  </span>
                                  {item.audioUrl && (
                                    <span className="text-[9px] bg-indigo-600 text-white px-1 rounded-sm ml-0.5">
                                      Cloud Audio
                                    </span>
                                  )}
                                </button>
                              )}

                              {wordCount === 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                  Không có câu trả lời
                                </span>
                              ) : wordCount < 15 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                  Quá ngắn ({wordCount} từ)
                                </span>
                              ) : wordCount < 40 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium">
                                  {wordCount} từ • Hơi vắn tắt
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                                  {wordCount} từ • Chi tiết
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed pl-1 font-medium">
                            {ansText ? `"${ansText}"` : '(Ứng viên không nói hoặc nội dung thu âm quá ngắn)'}
                          </p>

                          {/* Trình phát Audio Player cho giọng thật trên đám mây */}
                          {item.audioUrl && (
                            <div className="pt-2">
                              <audio
                                controls
                                src={interviewApi.getAudioPlaybackUrl(item.audioUrl)}
                                className="w-full h-8 rounded-lg outline-none"
                              />
                            </div>
                          )}

                          {/* DẢI BADGE TELEMETRY SINH TRẮC HỌC CHO TỪNG CÂU HỎI */}
                          <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium shadow-2xs">
                              <span className="material-symbols-outlined text-xs text-indigo-600">record_voice_over</span>
                              <span>Độ dài: <strong>{wordCount} từ</strong></span>
                            </span>
                            {qWpm != null && qWpm > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium shadow-2xs text-teal-800">
                                <span className="material-symbols-outlined text-xs text-teal-600">speed</span>
                                <span>Tốc độ: <strong>{qWpm} WPM</strong></span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium shadow-2xs text-slate-400">
                                <span className="material-symbols-outlined text-xs text-slate-400">keyboard</span>
                                <span>Văn bản (Không đo WPM)</span>
                              </span>
                            )}
                            {qPitch != null && qPitch > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium shadow-2xs text-indigo-800">
                                <span className="material-symbols-outlined text-xs text-indigo-600">graphic_eq</span>
                                <span>Ngữ điệu: <strong>{qPitch} Hz</strong></span>
                              </span>
                            )}
                            {hasCameraUsed && qEye != null && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium shadow-2xs text-teal-800">
                                <span className="material-symbols-outlined text-xs text-teal-600">visibility</span>
                                <span>Ánh mắt: <strong>{qEye}%</strong></span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. Nhận xét thẳng thắn của AI */}
                        <div className="rounded-2xl bg-amber-50/60 p-4 border-l-4 border-amber-500 space-y-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                            <span className="material-symbols-outlined text-base text-amber-600">psychology</span>
                            <span>Nhận xét thẳng thắn từ Giám khảo AI:</span>
                          </div>

                          <div className="text-slate-800 leading-relaxed text-xs whitespace-pre-line space-y-1 pl-1 font-normal">
                            {parsedCritique.critique}
                          </div>
                        </div>
                      </div>

                      {/* ============================================== */}
                      {/* CỘT PHẢI: CHUẨN MỰC ĐIỂM 10 (MÔ HÌNH STAR)     */}
                      {/* ============================================== */}
                      <div className="rounded-2xl bg-[#faf9fe] p-4 sm:p-5 border-l-4 border-[#32247b] space-y-3.5 flex flex-col justify-between">
                        {/* Header Mẫu Điểm 10 */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-100">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-[#32247b] font-bold">stars</span>
                            <h5 className="text-xs sm:text-sm font-bold text-[#32247b]">
                              Gợi Ý Câu Trả Lời Mẫu Điểm 10
                            </h5>
                          </div>

                          <div className="flex items-center gap-1.5 print:hidden">
                            <button
                              onClick={() => playModelAudio(modelAnswer, idx)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                playingQuestionIdx === idx
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-white hover:bg-purple-100 text-[#32247b] border border-purple-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">
                                {playingQuestionIdx === idx ? 'stop' : 'volume_up'}
                              </span>
                              <span>{playingQuestionIdx === idx ? 'Dừng' : 'Nghe Mẫu'}</span>
                            </button>

                            <button
                              onClick={() => copyToClipboard(modelAnswer, 'Câu trả lời mẫu')}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-100 text-slate-700 hover:text-[#32247b] text-xs font-bold flex items-center gap-1 border border-purple-200 transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">content_copy</span>
                              <span>Sao Chép</span>
                            </button>
                          </div>
                        </div>

                        {/* Chiến lược ghi điểm */}
                        {strategyGuide && (
                          <div className="p-2.5 rounded-xl bg-purple-100/60 text-[11px] text-[#32247b] space-y-0.5">
                            <strong className="block font-bold">💡 Chiến lược ghi điểm cho câu hỏi này:</strong>
                            <p className="leading-relaxed text-slate-700">{strategyGuide}</p>
                          </div>
                        )}

                        {/* 4 Ô S - T - A - R ĐÃ LÀM SẠCH CHUỖI HIỂN THỊ */}
                        {parsedStar.hasStar ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            {/* [S] Bối cảnh */}
                            <div className="p-3 rounded-xl bg-white shadow-2xs space-y-1 border border-sky-100">
                              <span className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-md bg-sky-600 text-white font-mono text-[9px] flex items-center justify-center font-bold">S</span>
                                Bối Cảnh (Situation)
                              </span>
                              <p className="text-slate-700 leading-relaxed text-[11px]">{parsedStar.s || 'Nêu rõ hoàn cảnh dự án.'}</p>
                            </div>

                            {/* [T] Nhiệm vụ */}
                            <div className="p-3 rounded-xl bg-white shadow-2xs space-y-1 border border-indigo-100">
                              <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-md bg-indigo-600 text-white font-mono text-[9px] flex items-center justify-center font-bold">T</span>
                                Nhiệm Vụ (Task)
                              </span>
                              <p className="text-slate-700 leading-relaxed text-[11px]">{parsedStar.t || 'Trách nhiệm cụ thể được giao.'}</p>
                            </div>

                            {/* [A] Hành động */}
                            <div className="p-3 rounded-xl bg-white shadow-2xs space-y-1 border border-amber-100">
                              <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-md bg-amber-600 text-white font-mono text-[9px] flex items-center justify-center font-bold">A</span>
                                Hành Động (Action)
                              </span>
                              <p className="text-slate-700 leading-relaxed text-[11px]">{parsedStar.a || 'Công cụ và các bước xử lý trực tiếp.'}</p>
                            </div>

                            {/* [R] Kết quả */}
                            <div className="p-3 rounded-xl bg-white shadow-2xs space-y-1 border border-emerald-100">
                              <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-md bg-emerald-600 text-white font-mono text-[9px] flex items-center justify-center font-bold">R</span>
                                Kết Quả (Result)
                              </span>
                              <p className="text-slate-700 leading-relaxed text-[11px]">{parsedStar.r || 'Số liệu đo lường định lượng.'}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-white text-xs text-slate-800 leading-relaxed whitespace-pre-line border border-purple-100">
                            {modelAnswer}
                          </div>
                        )}

                        {/* Badges Từ khóa của riêng câu hỏi này */}
                        <div className="pt-2 border-t border-purple-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500 font-semibold">Từ khóa trọng tâm:</span>
                          {taxonomy.keywords.slice(0, 3).map((kw, kIdx) => (
                            <span key={kIdx} className="px-2 py-0.5 rounded-md bg-purple-100 text-[#32247b] font-medium text-[10px]">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-300">filter_alt_off</span>
                  <p className="text-xs text-slate-500">Không có câu hỏi nào thuộc bộ lọc này.</p>
                </div>
              )}
            </div>

            {/* KHUNG KẾ HOẠCH CẢI THIỆN TRỰC TIẾP TỪ PHIÊN PHỎNG VẤN NÀY (ACTIONABLE STUDY PLAN Ở CUỐI TAB 3) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-[#32247b] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">alt_route</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Kế Hoạch Cải Thiện Trực Tiếp Từ Phiên Phỏng Vấn Này
                    </h3>
                    <p className="text-xs text-slate-500">
                      3 trọng tâm hành động cấp thiết được may đo dựa trên dữ liệu đối thoại và câu trả lời thực tế của bạn
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  Kế Hoạch Thực Chiến
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* THẺ 1: TRỌNG TÂM 01 (Khắc Phục Ngay Câu Hỏi Điểm Thấp Nhất) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 hover:border-[#32247b] transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#32247b] text-white text-[11px] font-mono font-bold">
                        TRỌNG TÂM 01
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        Khắc Phục Câu Yếu Nhất
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      Sửa Lỗi Trực Tiếp Ở Câu Hỏi Điểm Thấp Nhất (Câu #{lowestQuestion ? lowestQuestion.index : 1} - Đạt {lowestQuestion ? (lowestQuestion.score ?? 0) : 0}/100đ)
                    </h4>

                    {lowestQuestion && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1.5 text-slate-700">
                        <div className="font-semibold text-slate-900 line-clamp-2">
                          "{lowestQuestion.q || lowestQuestion.questionText || 'Câu hỏi'}"
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Thực tế bạn đã nói: <strong className="text-rose-700 font-mono">{lowestQWords} từ</strong>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                      <p className="font-medium text-slate-800">
                        Để đạt 80+ điểm cho câu hỏi này ở vị trí <strong>{cleanTopic}</strong>, bạn cần trình bày rõ 3 ý:
                      </p>
                      <ul className="space-y-1 pl-1 text-[11px]">
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#32247b] font-bold">1.</span>
                          <span><strong>Bối cảnh &amp; Nguyên nhân:</strong> Nêu rõ bài toán/sự cố thực tế tại dự án.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#32247b] font-bold">2.</span>
                          <span><strong>Phương pháp &amp; Công cụ:</strong> Áp dụng chuẩn chuyên ngành ({taxonomy.keywords.slice(0, 3).join(', ')}).</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#32247b] font-bold">3.</span>
                          <span><strong>Kết quả đo lường:</strong> Dẫn chứng con số định lượng ({taxonomy.metricsTerm}).</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 text-[11px] text-emerald-800 font-medium flex items-start gap-1">
                    <span className="material-symbols-outlined text-xs text-emerald-600 shrink-0 mt-0.5">task_alt</span>
                    <span><strong>Mục tiêu:</strong> Trả lời lại câu này đạt tối thiểu <strong>60 - 120 từ</strong>, đủ 4 phần S - T - A - R.</span>
                  </div>
                </div>

                {/* THẺ 2: TRỌNG TÂM 02 (Bổ Sung Kiến Thức & Thuật Ngữ Cốt Lõi) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 hover:border-[#32247b] transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#32247b] text-white text-[11px] font-mono font-bold">
                        TRỌNG TÂM 02
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        Thuật Ngữ Cốt Lõi
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      Ôn Tập Kiến Thức Chuyên Môn Ngành {taxonomy.categoryName}
                    </h4>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        Thuật ngữ cốt lõi cần bổ sung (bỏ sót trong buổi phỏng vấn):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(keywordGap.missing.length > 0 ? keywordGap.missing.slice(0, 5) : taxonomy.keywords.slice(0, 5)).map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-rose-800 text-[11px] font-medium shadow-2xs"
                          >
                            • {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 text-[11px] leading-relaxed pt-1">
                      <p>
                        <strong>Trọng tâm lý thuyết:</strong> {taxonomy.coreConcepts}.
                      </p>
                      <p>
                        <strong>Tình huống xử lý:</strong> {taxonomy.troubleshootConcepts}.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 text-[11px] text-emerald-800 font-medium flex items-start gap-1">
                    <span className="material-symbols-outlined text-xs text-emerald-600 shrink-0 mt-0.5">task_alt</span>
                    <span><strong>Mục tiêu:</strong> Hiểu rõ bản chất và lồng ghép ít nhất <strong>3 - 4 thuật ngữ chuyên ngành</strong> vào câu trả lời.</span>
                  </div>
                </div>

                {/* THẺ 3: TRỌNG TÂM 03 (Chỉnh Sửa Cách Diễn Đạt & Phản Xạ Dựa Trên Số Liệu Thật) */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 hover:border-[#32247b] transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#32247b] text-white text-[11px] font-mono font-bold">
                        TRỌNG TÂM 03
                      </span>
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        Lưu Loát &amp; Phong Thái
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      Cải Thiện Độ Lưu Loát &amp; Phong Thái Trả Lời Thực Tế
                    </h4>

                    {avgWordsPerQ < 25 ? (
                      <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                          ⚠️ <strong>Độ dài trung bình hiện tại quá ngắn ({avgWordsPerQ} từ/câu):</strong> Bạn đang trả lời cụt lủn hoặc bỏ dở ý, chưa đủ dữ liệu để chứng minh năng lực.
                        </div>
                        <p className="text-[11px] text-slate-600">
                          <strong>Quy tắc 3 câu hoàn chỉnh:</strong> (1) Mở đầu nêu bối cảnh &amp; vai trò ➔ (2) Thân bài nêu giải pháp kỹ thuật cụ thể ➔ (3) Kết bài nêu kết quả số liệu.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                          Tốc độ nói thực tế: <strong>{wpmInfo.displayVal}</strong> • Từ đệm: <strong>{telemetry.totalFillers} lần</strong>.
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {telemetry.totalFillers > 2
                            ? `Cần giảm thiểu ${telemetry.totalFillers} từ đệm ("à, ừm"). Tập dừng 1-2 giây im lặng chuyên nghiệp để dàn ý trước khi nói.`
                            : 'Khả năng kiểm soát từ đệm tốt. Tiếp tục duy trì nhịp thở đều đặn và tương tác mắt trực diện vào camera webcam.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 text-[11px] text-emerald-800 font-medium flex items-start gap-1">
                    <span className="material-symbols-outlined text-xs text-emerald-600 shrink-0 mt-0.5">task_alt</span>
                    <span><strong>Mục tiêu:</strong> Duy trì độ dài <strong>&gt; 50 từ/câu</strong>, tốc độ nói <strong>100 - 150 WPM</strong> và <strong>&lt; 2 từ đệm</strong>.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-900">Bạn đã sẵn sàng nâng cao phản xạ phỏng vấn?</h4>
            <p className="text-[11px] text-slate-500">Tập luyện thêm các phiên mới với JD doanh nghiệp thực tế tại HireMate AI Studio.</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Quay Lại Studio
            </button>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(session)}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-[#32247b] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Luyện tập lại vị trí này để AI so sánh và tính toán độ tiến bộ so với lần thi này"
              >
                <span className="material-symbols-outlined text-sm text-[#32247b]">replay</span>
                <span>Luyện Tập Lại Vị Trí Này</span>
              </button>
            )}
            <button
              onClick={() => { window.location.hash = '#/ai-interview'; }}
              className="px-5 py-2.5 rounded-xl bg-[#32247b] hover:bg-[#251963] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Bắt Đầu Phiên Mới</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
