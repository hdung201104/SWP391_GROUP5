import React, { useState, useEffect, useRef } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';

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
// DỮ LIỆU LỊCH SỬ PHỎNG VẤN ĐẦY ĐỦ CHI TIẾT LỖI SAI & GỢI Ý CÂU TRẢ LỜI MẪU
// ============================================================================
const MOCK_HISTORY = [
  {
    id: 'HM-9102',
    date: '2026-09-25',
    domain: 'Kinh tế - Tài chính & Kế toán',
    domainId: 'kinh-te',
    topic: 'Phân tích Báo cáo Tài chính & Dòng tiền Doanh nghiệp',
    level: 'Senior',
    duration: '26 phút',
    totalScore: 76,
    grade: 'Khá Tốt',
    gradeColor: '#D4A373',
    questionsCount: 5,
    competencies: {
      domainKnowledge: 82,
      problemSolving: 78,
      structureSTAR: 68,
      deliveryTone: 76,
    },
    aiSummary: 'Ứng viên nắm chắc các chỉ số tài chính căn bản (EBITDA, ROE, Current Ratio). Tuy nhiên, câu trả lời còn mang tính hàn lâm, chưa phân tích sâu dòng tiền tự do (FCFF) và thiếu dẫn chứng số liệu định lượng từ kinh nghiệm thực chiến.',
    strengths: [
      'Nắm vững bản chất liên kết giữa Bảng cân đối kế toán, Kết quả kinh doanh và Lưu chuyển tiền tệ.',
      'Giải thích chính xác sự khác biệt giữa Lợi nhuận kế toán và Dòng tiền thuần từ HĐKD (CFO).',
      'Thái độ phỏng vấn điềm tĩnh, tác phong chuyên nghiệp.',
    ],
    criticalFlaws: [
      'Bỏ qua yếu tố biến động chu kỳ chuyển đổi tiền mặt (CCC) khi phân tích suy giảm dòng tiền.',
      'Chưa áp dụng phương pháp STAR: các ví dụ dự án quá chung chung, không có con số % cải thiện cụ thể.',
      'Chưa nêu được phương án dự phòng thanh khoản khẩn cấp trong trường hợp đối tác chậm trả nợ.',
    ],
    improvementPlan: [
      'Luyện tập trả lời có số liệu định lượng cụ thể: nêu rõ doanh thu, biên lợi nhuận % và quy mô dòng tiền đã quản lý.',
      'Đào sâu vào phân tích chất lượng lợi nhuận (Quality of Earnings) và các khoản mục dồn tích (Accruals).',
      'Áp dụng triệt để khung STAR (Tình huống - Nhiệm vụ - Hành động - Kết quả) để câu trả lời gãy gọn.',
    ],
    questions: [
      {
        q: 'Hãy phân tích nguyên nhân tại sao một doanh nghiệp có lợi nhuận ròng tăng trưởng 30% qua các quý nhưng vẫn có nguy cơ vỡ nợ hoặc mất thanh khoản?',
        intent: 'Đo lường năng lực phân tích chất lượng lợi nhuận, dòng tiền kinh doanh (CFO) và quản trị vốn lưu động.',
        score: 72,
        answer: 'Doanh nghiệp có thể bị mất thanh khoản vì lợi nhuận trên giấy tờ khác với tiền mặt. Nếu bán hàng cho nợ nhiều thì doanh thu tăng nhưng tiền chưa về. Ngoài ra có thể doanh nghiệp lấy tiền ngắn hạn đi đầu tư dự án dài hạn hoặc mua nhiều hàng tồn kho.',
        criticalFeedback: {
          flaws: 'Câu trả lời đúng ý chính nhưng còn đơn giản, thiếu thuật ngữ tài chính chuyên sâu. Chưa đề cập đến Chu kỳ chuyển đổi tiền mặt (Cash Conversion Cycle - CCC), chưa phân tích tác động của các khoản Phải thu khách hàng (Accounts Receivable) và Hàng tồn kho (Inventory) lên Vốn lưu động ròng (Net Working Capital).',
          interviewerImpression: 'Nhà tuyển dụng sẽ đánh giá ứng viên mới ở mức Junior/Middle về tư duy phân tích, chưa thể hiện được tầm bao quát của một Senior Financial Analyst.',
        },
        modelAnswer: 'Để phân tích tình trạng "Lợi nhuận ảo - Mất thanh khoản thật", tôi sẽ bóc tách qua 3 lăng kính tài chính cốt lõi:\n\n1. Phân kỳ giữa Lợi nhuận kế toán (Net Income) và Dòng tiền kinh doanh (CFO):\nDoanh thu ghi nhận theo nguyên tắc dồn tích (Accrual Accounting). Nếu tăng trưởng 30% chủ yếu đến từ việc nới lỏng chính sách tín dụng thương mại (nợ 90-120 ngày), khoản Phải thu (DSO) sẽ tăng vọt, tiền mặt thực tế không về két. Nếu hệ số CFO / Net Income < 0.8 kéo dài, chất lượng lợi nhuận đang ở mức báo động.\n\n2. Ứ đọng Vốn lưu động (Working Capital Trap):\nTồn kho tăng cao (DIO kéo dài) làm chôn vốn lưu động. Doanh nghiệp phải tiếp tục trả chi phí cố định (lương, lãi vay, nhà cung cấp) bằng tiền mặt khiến cán cân thanh toán bị âm.\n\n3. Mất cân đối kỳ hạn (Maturity Mismatch):\nSử dụng nợ vay ngắn hạn để tài trợ cho tài sản cố định hoặc dự án dài hạn. Khi ngân hàng siết hạn mức tín dụng hoặc đến hạn đảo nợ, dòng tiền âm lập tức kích hoạt rủi ro vỡ nợ kỹ thuật (Technical Default).',
        goldenKeywords: ['Accrual Accounting', 'CFO / Net Income Ratio', 'Days Sales Outstanding (DSO)', 'Working Capital Trap', 'Cash Conversion Cycle', 'Maturity Mismatch'],
      },
      {
        q: 'Khi xây dựng mô hình chiết khấu dòng tiền (DCF), bạn lựa chọn suất chiết khấu (WACC) như thế nào và cách xử lý khi lãi suất phi rủi ro thị trường biến động mạnh?',
        intent: 'Kiểm tra kỹ năng định giá tài chính, hiểu biết về chi phí vốn bình quân (WACC) và độ nhạy của mô hình.',
        score: 78,
        answer: 'Tôi tính WACC bằng tỷ trọng nợ nhân chi phí nợ sau thuế cộng tỷ trọng vốn chủ nhân chi phí vốn chủ tính theo CAPM. Khi lãi suất biến động thì tôi cập nhật lại lợi suất trái phiếu chính phủ 10 năm và chạy bảng phân tích độ nhạy.',
        criticalFeedback: {
          flaws: 'Đã nắm đúng công thức chuẩn CAPM và WACC. Điểm trừ là chưa nói rõ cách ước lượng Hệ số Beta (Beta đòn bẩy vs không đòn bẩy khi so sánh ngang ngành) và phần bù rủi ro vốn cổ phần (Equity Risk Premium - ERP) tại thị trường mới nổi như Việt Nam.',
          interviewerImpression: 'Ứng viên nắm lý thuyết tốt, cần thể hiện thêm kinh nghiệm thực chiến khi tinh chỉnh các giả định định giá nhạy cảm.',
        },
        modelAnswer: 'Trong mô hình DCF, WACC là biến số nhạy cảm nhất quyết định giá trị doanh nghiệp. Quy trình xác định chuẩn của tôi gồm:\n\n1. Ước lượng Chi phí Vốn chủ sở hữu (Ke) qua CAPM mở rộng:\n- Risk-free Rate (Rf): Lấy lợi suất Trái phiếu Chính phủ kỳ hạn 10 năm (làm mượt bằng bình quân 6-12 tháng để tránh biến động giật cục).\n- Beta (β): Lấy bình quân Beta của nhóm doanh nghiệp tương đồng (Unlevered Beta), sau đó Re-lever theo cấu trúc vốn mục tiêu của doanh nghiệp.\n- Equity Risk Premium (ERP): Áp dụng phần bù rủi ro thị trường Việt Nam (thường dao động 7.5% - 9.0% kèm Country Risk Premium theo dữ liệu Damodaran).\n\n2. Chi phí nợ vay sau thuế (Kd): Lấy lãi suất biên thực tế của các khoản vay hiện hành trừ đi lá chắn thuế (1 - Tax Rate).\n\n3. Quản trị biến động lãi suất qua Sensitivity Analysis:\nTôi không dùng một con số WACC cố định mà xây dựng ma trận phân tích độ nhạy 2 chiều (Two-way Sensitivity Table) giữa WACC (bước nhảy ±0.5%) và Tốc độ tăng trưởng dài hạn (Terminal Growth g ±0.25%) để cung cấp khoảng định giá (Valuation Range) an toàn cho Hội đồng Đầu tư.',
        goldenKeywords: ['Unlevered Beta', 'Damodaran Country Risk Premium', 'CAPM Model', 'Two-way Sensitivity Analysis', 'Tax Shield', 'Terminal Growth Rate'],
      },
      {
        q: 'Bạn đã từng tối ưu chi phí hoặc cắt giảm công nợ tồn đọng thành công trong thực tế như thế nào? Hãy chia sẻ số liệu cụ thể.',
        intent: 'Kiểm tra năng lực hành động thực tế, phương pháp quản trị khoản phải thu và đo lường kết quả kinh doanh.',
        score: 65,
        answer: 'Ở công ty trước tôi có rà soát lại các khoản nợ của khách hàng lâu năm, sau đó phối hợp với phòng kinh doanh để thu tiền. Kết quả là thu hồi được nhiều nợ xấu và giảm bớt chi phí tài chính cho công ty.',
        criticalFeedback: {
          flaws: 'Đây là câu trả lời yếu nhất trong buổi phỏng vấn. Hoàn toàn thiếu mô hình STAR: Không có quy mô công ty, không có số ngày DSO ban đầu, không nêu quy trình phân loại tuổi nợ (Aging Report), không có con số tỷ lệ thu hồi hay số tiền cụ thể đã tiết kiệm được.',
          interviewerImpression: 'Nhà tuyển dụng cảm giác ứng viên chỉ phụ tá thực hiện hoặc phóng đại kết quả vì không nhớ nổi bất kỳ số liệu định lượng nào.',
        },
        modelAnswer: 'Tôi xin chia sẻ ca thực tế tôi trực tiếp dẫn dắt tại doanh nghiệp phân phối quy mô doanh thu 450 tỷ/năm:\n\n- Tình huống (Situation): Kỳ thu tiền bình quân (DSO) bị kéo dài lên tới 84 ngày (vượt chuẩn ngành là 45 ngày), công nợ quá hạn trên 90 ngày chiếm 32 tỷ đồng, làm phát sinh chi phí lãi vay ngắn hạn 350 triệu/tháng.\n\n- Nhiệm vụ (Task): Ban Giám đốc giao mục tiêu giảm DSO xuống dưới 55 ngày và thu hồi tối thiểu 70% nợ quá hạn trong vòng 2 quý.\n\n- Hành động (Action):\n1. Thiết lập Báo cáo Tuổi nợ tự động (Aging Report) cập nhật real-time theo tuần, phân loại rủi ro khách hàng thành 4 nhóm.\n2. Tái cấu trúc chính sách bán hàng: Thiết kế chiết khấu thanh toán sớm 1.5% nếu trả trong 10 ngày (2/10 Net 30).\n3. Đặt KPI gắn kết giữa Phòng Kế toán và Sales: Hoa hồng chỉ được chi trả khi công nợ được nghiệm thu về tài khoản.\n4. Trực tiếp tham gia cùng Trưởng phòng Kinh doanh đàm phán phương án trả góp có bảo lãnh thanh toán cho 5 khách hàng nợ lớn nhất.\n\n- Kết quả (Result): Sau 5 tháng, DSO giảm từ 84 ngày xuống còn 48 ngày. Thu hồi thành công 26.5 tỷ đồng (83% nợ quá hạn), giúp công ty tiết kiệm 210 triệu tiền lãi vay mỗi tháng và dòng tiền thuần CFO chuyển từ âm sang dương 18 tỷ đồng.',
        goldenKeywords: ['STAR Method', 'DSO Reduction', 'Aging Report 30-60-90', 'Cash Discount 2/10 Net 30', 'Credit Policy Restructuring', 'Working Capital Savings'],
      },
      {
        q: 'Làm thế nào để phát hiện các dấu hiệu "xào nấu" hoặc gian lận báo cáo tài chính (Financial Shenanigans)?',
        intent: 'Đánh giá sự nhạy bén nghiệp vụ, đạo đức nghề nghiệp và kỹ năng kiểm soát rủi ro gian lận.',
        score: 85,
        answer: 'Tôi kiểm tra sự chênh lệch bất thường giữa doanh thu và khoản phải thu. Nếu doanh thu tăng mà phải thu tăng nhanh hơn nhiều thì có thể có ghi nhận doanh thu ảo. Ngoài ra xem xét dòng tiền CFO âm liên tục dù lãi lớn, thay đổi chính sách khấu hao, vốn hóa chi phí bất thường.',
        criticalFeedback: {
          flaws: 'Rất tốt! Nêu trúng các dấu hiệu kinh điển như ghi nhận doanh thu non (Premature Revenue) và vốn hóa chi phí hoạt động (Capitalizing OpEx). Nếu nhắc thêm mô hình định lượng như Beneish M-Score hoặc Altman Z-score thì điểm số sẽ đạt 95+.',
          interviewerImpression: 'Tư duy sắc bén, phản xạ tốt, thể hiện kinh nghiệm thực chiến vững vàng trong công tác kiểm soát nội bộ.',
        },
        modelAnswer: 'Để nhận diện thủ thuật "xào nấu" Báo cáo tài chính, tôi áp dụng quy trình kiểm tra 4 tầng kết hợp chỉ số định lượng:\n\n1. So sánh tăng trưởng Doanh thu vs Phải thu khách hàng:\nNếu Doanh thu tăng 15% nhưng Phải thu tăng 60%, đặc biệt dồn vào tháng cuối năm tài chính, đây là dấu hiệu rõ ràng của "Channel Stuffing" (nhồi hàng cho đại lý) hoặc ghi nhận doanh thu khống.\n\n2. Phân tích Dòng tiền CFO vs Thu nhập hoạt động (Operating Income):\nDoanh nghiệp có thể "phù phép" lợi nhuận kế toán nhưng rất khó làm giả dòng tiền thực tế. Lợi nhuận tăng liên tục nhưng CFO âm kéo dài là "red flag" lớn nhất về thanh khoản giả tạo.\n\n3. Thủ thuật Vốn hóa chi phí (Capitalizing Expenses) & Thay đổi khấu hao:\nChiêu thức chuyển chi phí hoạt động (OpEx) thành tài sản dở dang (CapEx) hoặc kéo dài thời gian khấu hao tài sản cố định bất thường nhằm giảm chi phí khấu hao trong kỳ để thổi phồng lợi nhuận.\n\n4. Ứng dụng Mô hình Beneish M-Score:\nTôi tính toán 8 chỉ số định lượng (DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA). Nếu M-Score > -1.78, xác suất doanh nghiệp có hành vi thao túng báo cáo tài chính là rất cao.',
        goldenKeywords: ['Beneish M-Score', 'Channel Stuffing', 'Capitalizing OpEx', 'Accruals Quality', 'DSRI / AQI Indices', 'Quality of Earnings'],
      },
      {
        q: 'Bạn sử dụng công cụ gì để lập ngân sách và dự báo tài chính (Financial Budgeting)? Bạn xử lý xung đột ngân sách giữa các phòng ban như thế nào?',
        intent: 'Kiểm tra kỹ năng sử dụng công cụ (Excel/Power BI/ERP) và kỹ năng thương lượng quản trị điều hành.',
        score: 80,
        answer: 'Tôi dùng Excel nâng cao với các hàm Index/Match, Power Query và ERP SAP. Khi các phòng ban đòi thêm ngân sách thì tôi căn cứ vào KPI và chiến lược chung của công ty để phân bổ công bằng.',
        criticalFeedback: {
          flaws: 'Giải pháp hài hòa nhưng còn chung chung. Cần nêu rõ phương pháp lập ngân sách cụ thể (Zero-Based Budgeting hay Incremental Budgeting) và quy trình tổ chức các phiên Budget Review định kỳ.',
          interviewerImpression: 'Giao tiếp tốt, nắm công cụ, có tiềm năng quản lý.',
        },
        modelAnswer: 'Về công cụ: Tôi kết hợp hệ thống ERP (SAP/Oracle) để trích xuất dữ liệu thực tế (Actuals) qua Power BI để trực quan hóa Variance Analysis (so sánh Budget vs Actual), kết hợp mô hình tài chính động trên Excel có kịch bản Base/Best/Worst case.\n\nVề phương pháp xử lý xung đột ngân sách:\n1. Áp dụng Zero-Based Budgeting (ZBB) có chọn lọc: Yêu cầu mỗi phòng ban giải trình từng đồng chi phí dựa trên ROI dự kiến thay vì mặc định cộng thêm % so với năm cũ (Incremental Budgeting).\n2. Phân loại chi phí theo Value Driver: Tách bạch chi phí vận hành cốt lõi (Non-negotiable) và chi phí tăng trưởng thử nghiệm (Discretionary spending).\n3. Cơ chế Review & Phân bổ linh hoạt: Thiết lập quỹ dự phòng biến động (Contingency Reserve 5-10%) được giải ngân theo từng cột mốc Milestone của dự án, đảm bảo ngân sách đi đôi với tiến độ bàn giao kết quả thực tế.',
        goldenKeywords: ['Zero-Based Budgeting (ZBB)', 'Variance Analysis', 'Budget vs Actuals', 'Value Driver Modeling', 'Milestone-based Allocation', 'Power BI Dashboard'],
      },
    ],
  },
  {
    id: 'HM-9088',
    date: '2026-09-22',
    domain: 'Marketing & Truyền thông số',
    domainId: 'marketing',
    topic: 'Chiến lược Digital Marketing Đa Kênh & Tối Ưu CAC/LTV',
    level: 'Middle',
    duration: '24 phút',
    totalScore: 84,
    grade: 'Khá Tốt',
    gradeColor: '#D4A373',
    questionsCount: 5,
    competencies: {
      domainKnowledge: 88,
      problemSolving: 85,
      structureSTAR: 78,
      deliveryTone: 85,
    },
    aiSummary: 'Ứng viên có tư duy Data-driven Marketing rất tốt, hiểu rõ phễu chuyển đổi Full-funnel từ Top of Funnel (AOD) đến Retention. Cần cải thiện khả năng liên kết giữa chỉ số tiếp thị với mục tiêu P&L tổng thể của Ban Giám đốc.',
    strengths: [
      'Nắm rất vững các chỉ số hiệu quả chuyển đổi: CAC, LTV, ROAS, Churn rate, Conversion Rate.',
      'Tư duy Attribution Modeling đa kênh sắc sảo (First click vs Data-driven Attribution).',
      'Cách diễn đạt năng động, giàu năng lượng và tự tin.',
    ],
    criticalFlaws: [
      'Quá tập trung vào Paid Ads ngắn hạn mà chưa đề cập đầy đủ kênh Organic (SEO, Community, KOC).',
      'Chưa phân tích sâu bài toán LTV trong mô hình Subscription / Khách hàng trung thành.',
    ],
    improvementPlan: [
      'Bổ sung chiến lược Retention & CRM Marketing (Email automation, Loyalty program) để kéo dài LTV.',
      'Chuẩn bị sẵn các Case Study có số liệu cụ thể về tăng trưởng doanh số (GMV) và tối ưu chi phí quảng cáo.',
    ],
    questions: [
      {
        q: 'Khi chi phí thu hút khách hàng mới (CAC) trên Facebook & Google Ads tăng vọt 40% trong quý, bạn sẽ thực hiện các bước tối ưu nào để duy trì lợi nhuận?',
        intent: 'Đo lường năng lực tối ưu kênh quảng cáo, tư duy giải quyết vấn đề tăng chi phí và phối hợp đa kênh.',
        score: 86,
        answer: 'Tôi sẽ kiểm tra lại tệp đối tượng (Audience Fatigue), tối ưu lại Creative/Video quảng cáo vì thường quảng cáo bị bão hòa. Đồng thời chuyển dịch ngân sách sang kênh TikTok Ads hoặc Google Search có ROI cao hơn. Tiếp theo là tối ưu Landing Page để tăng tỷ lệ chuyển đổi.',
        criticalFeedback: {
          flaws: 'Phản xạ chuẩn xác về mặt kỹ thuật Ads. Điểm cần nâng cao: Chưa đề cập đến Retention Marketing (bán lại cho tệp khách cũ qua Zalo OA, Email để giảm phụ thuộc vào Paid traffic).',
          interviewerImpression: 'Senior Media Planner / Growth Marketer thực thụ, am hiểu sâu công cụ quảng cáo.',
        },
        modelAnswer: 'Khi đối mặt với bài toán CAC tăng vọt 40%, tôi sẽ triển khai kế hoạch "Phản ứng 3 giai đoạn":\n\n1. Khám sức khỏe Performance Funnel trong 48 giờ:\n- Đo lường Tần suất (Frequency) và CPM: Nếu Frequency > 3.5, đây là dấu hiệu Audience Fatigue. Tôi lập tức làm mới 100% Hooks và Angles sáng tạo (Creative Refresh), thử nghiệm định dạng UGC (User Generated Content) dạng ngắn.\n- Rà soát Conversion Rate (CR) trên Landing Page: Dùng Hotjar và Google Analytics 4 để tìm điểm rơi (Drop-off point). Thử nghiệm A/B Testing form đăng ký và tối ưu tốc độ tải trang trên di động (<2s).\n\n2. Tái cơ cấu phân bổ Ngân sách (Budget Reallocation):\nChuyển dịch 25-30% ngân sách từ các chiến dịch chuyển đổi lạnh (Cold Traffic) sang Retargeting đa kênh và kênh có ý định mua hàng cao (Google Search Intent / Shopee Ads).\n\n3. Đòn bẩy LTV & Kênh chuyển đổi 0 đồng (Owned Media):\nTăng tần suất khai thác tệp khách hàng sẵn có qua Zalo ZNS, Email Automation và Automation SMS. Chi phí tiếp cận khách hàng cũ chỉ bằng 1/5 CAC mới, qua đó nâng tỷ lệ LTV/CAC về ngưỡng an toàn 3:1.',
        goldenKeywords: ['Audience Fatigue', 'Creative Refresh', 'UGC Short Video', 'LTV/CAC Ratio ≥ 3:1', 'Owned Media & Zalo ZNS', 'Drop-off Optimization'],
      },
      {
        q: 'Bạn đo lường và chứng minh hiệu quả của chiến dịch Xây dựng Thương hiệu (Branding) với Giám đốc Tài chính (CFO) như thế nào?',
        intent: 'Kiểm tra khả năng kết nối giữa tiếp thị thương hiệu và giá trị tài chính thực tế.',
        score: 82,
        answer: 'Xây dựng thương hiệu khó đo bằng doanh thu ngay, nhưng tôi chứng minh bằng số lượng người tìm kiếm tên thương hiệu (Brand Search Volume), lượng truy cập trực tiếp (Direct Traffic) và chỉ số thảo luận mạng xã hội (Share of Voice).',
        criticalFeedback: {
          flaws: 'Hướng tiếp cận đúng đắn. Nên liên kết trực tiếp với việc Brand tốt giúp làm GIẢM chi phí CAC của Performance Marketing và tăng giá bán sản phẩm (Price Premium).',
          interviewerImpression: 'Tư duy logic, hiểu tâm lý của bộ phận tài chính.',
        },
        modelAnswer: 'Để thuyết phục CFO - người luôn tìm kiếm số liệu tài chính rõ ràng, tôi chứng minh giá trị của Branding qua "Hiệu ứng Gián tiếp lên Lợi nhuận" (Indirect Financial Impact):\n\n1. Chỉ số Brand Search Volume & Organic Traffic:\nThương hiệu được nhận biết tốt sẽ kéo lượng tìm kiếm từ khóa thương hiệu trên Google tăng trưởng. Lượng Organic/Direct traffic này có chi phí tiếp cận gần như bằng 0, giúp pha loãng Blended CAC của toàn bộ công ty.\n\n2. Giảm chi phí đấu thầu quảng cáo (Lower Performance CAC):\nCác chiến dịch Branding tạo ra độ tin cậy ban đầu (Familiarity Bias). Khi chạy Ads chuyển đổi, tỷ lệ nhấp (CTR) của tệp khách hàng đã nhận biết thương hiệu cao hơn 2.5 lần, giúp giảm điểm giá thầu (eCPM/CPC) của Meta/Google tới 20-30%.\n\n3. Năng lực định giá cao hơn (Price Premium) & Giảm tỷ lệ rời bỏ (Lower Churn):\nKhách hàng gắn kết với thương hiệu sẽ ít nhạy cảm về giá hơn, cho phép doanh nghiệp duy trì biên lợi nhuận gộp mà không cần xả khuyến mãi cắt máu.',
        goldenKeywords: ['Blended CAC Reduction', 'Brand Search Volume', 'Price Premium', 'Familiarity Bias', 'Direct Traffic Growth', 'Share of Voice (SOV)'],
      },
    ],
  },
  {
    id: 'HM-9065',
    date: '2026-09-18',
    domain: 'Kinh doanh & Phát triển thị trường',
    domainId: 'sales',
    topic: 'Đàm phán Hợp đồng Doanh nghiệp B2B & Xử lý Từ chối',
    level: 'Senior',
    duration: '28 phút',
    totalScore: 71,
    grade: 'Đạt Yêu Cầu',
    gradeColor: '#ffe04a',
    questionsCount: 5,
    competencies: {
      domainKnowledge: 75,
      problemSolving: 70,
      structureSTAR: 66,
      deliveryTone: 73,
    },
    aiSummary: 'Ứng viên có kỹ năng giao tiếp hoạt ngôn, tự tin. Tuy nhiên kỹ năng xử lý phản đối về giá (Price Objection) còn theo phản xạ giảm giá vội vã, chưa bảo vệ được biên lợi nhuận và chưa đào sâu vào mô hình ROI cho khách hàng B2B.',
    strengths: [
      'Giao tiếp lưu loát, năng động, phong thái đàm phán tự tin.',
      'Biết cách tìm hiểu sơ bộ sơ đồ quyền lực (Stakeholders) trong doanh nghiệp khách hàng.',
    ],
    criticalFlaws: [
      'Lỗi sai chí mạng: Sẵn sàng giảm giá ngay khi khách hàng chê đắt mà không đòi hỏi nhượng bộ đối ứng.',
      'Thiếu bảng tính bài toán hoàn vốn (Business Case & Payback Period) để thuyết phục CFO đối tác.',
    ],
    improvementPlan: [
      'Nắm vững nguyên tắc đàm phán thương mại: "Không bao giờ nhượng bộ đơn phương" (Never make unilateral concessions).',
      'Xây dựng kỹ năng định lượng hóa nỗi đau của khách hàng thành tiền thiệt hại (Cost of Inaction).',
    ],
    questions: [
      {
        q: 'Khách hàng doanh nghiệp B2B phản hồi: "Báo giá giải pháp bên em cao hơn 35% so với đối thủ A. Nếu không giảm xuống bằng giá họ thì bên anh không thể ký hợp đồng". Bạn sẽ xử lý tình huống này như thế nào?',
        intent: 'Đo lường bản lĩnh đàm phán giá, kỹ năng giữ biên lợi nhuận và chuyển hướng từ Chi phí sang Giá trị (Value-based Selling).',
        score: 68,
        answer: 'Đầu tiên tôi sẽ cảm ơn khách hàng đã thẳng thắn. Sau đó tôi giải thích tiền nào của nấy, bên em có đội hỗ trợ 24/7 và hệ thống ổn định hơn. Nếu khách hàng vẫn cương quyết thì tôi xin ý kiến sếp giảm giá 15-20% hoặc tặng thêm thời gian sử dụng để chốt deal.',
        criticalFeedback: {
          flaws: 'Đây là lỗi phổ biến của Sales khi đàm phán B2B: Biện minh chung chung "tiền nào của nấy" không có sức nặng định lượng, và vội vã hạ giá làm mất vị thế của sản phẩm.',
          interviewerImpression: 'Ứng viên dễ bị khách hàng B2B "ép giá", chưa có kỹ năng bảo vệ biên lợi nhuận của một Senior Sales Hunter.',
        },
        modelAnswer: 'Trong bán hàng B2B, phản đối về giá thực chất là dấu hiệu khách hàng CHƯA THẤY ĐỦ GIÁ TRỊ VƯỢT TRỘI so với chi phí bỏ ra. Quy trình xử lý 4 bước chuyên nghiệp của tôi:\n\n1. Đồng cảm & Thăm dò tiêu chuẩn so sánh (Isolate the Objection):\n"Em rất hiểu ngân sách đầu tư luôn là ưu tiên hàng đầu của Ban Giám đốc. Anh cho em hỏi ngoài yếu tố giá thầu ban đầu, hai giải pháp có tương đồng 100% về phạm vi triển khai (SLA cam kết, bảo mật dữ liệu, tích hợp ERP và chi phí phát sinh nâng cấp hàng năm) hay không?"\n\n2. Chuyển dịch từ Chi phí mua sắm sang Tổng chi phí sở hữu (TCO - Total Cost of Ownership):\nTôi sẽ trình bày Bảng phân tích TCO: "Đối thủ A giá chào thấp hơn 35%, nhưng không bao gồm phí bảo trì năm thứ 2 và giới hạn 5 API integration. Khi quy mô anh mở rộng, chi phí phát sinh thực tế sẽ cao hơn 50%. Giải pháp của bên em là trọn gói (All-inclusive), cam kết Uptime 99.9% có chế tài phạt bằng tiền mặt."\n\n3. Tính toán Thiệt hại nếu chậm trễ (Cost of Inaction & ROI):\nMinh họa bằng số liệu thực tế: "Với hệ thống của bên em, doanh nghiệp sẽ tiết kiệm 120 giờ công/tháng, tương đương 180 triệu chi phí nhân sự. Thời gian hoàn vốn đầu tư chỉ mất 4.2 tháng."\n\n4. Nguyên tắc Nhượng bộ Có Điều kiện (Give-Get Concession):\nNếu bắt buộc phải điều chỉnh giá để khớp ngân sách phê duyệt: "Nếu anh muốn giảm 15% chi phí, bên em sẵn lòng điều chỉnh bằng cách cắt bớt module đào tạo nâng cao onsite hoặc anh hỗ trợ thanh toán trước 100% hợp đồng năm thay vì thanh toán theo quý."',
        goldenKeywords: ['Total Cost of Ownership (TCO)', 'Value-based Selling', 'Give-Get Concession', 'Cost of Inaction', 'SLA Guarantee', 'Payback Period'],
      },
    ],
  },
  {
    id: 'HM-9042',
    date: '2026-09-12',
    domain: 'Nhân sự & Quản trị nguồn lực (HR)',
    domainId: 'hr',
    topic: 'Chiến lược Thu hút & Tuyển dụng Nhân tài (Talent Acquisition)',
    level: 'Middle',
    duration: '22 phút',
    totalScore: 88,
    grade: 'Xuất Sắc',
    gradeColor: '#588157',
    questionsCount: 5,
    competencies: {
      domainKnowledge: 90,
      problemSolving: 88,
      structureSTAR: 86,
      deliveryTone: 88,
    },
    aiSummary: 'Ứng viên thể hiện hiểu biết sâu sắc về Employer Branding, quy trình phỏng vấn theo khung năng lực STAR và cách tối ưu tỷ lệ Offer Acceptance Rate. Khả năng thấu hiểu tâm lý nhân sự và đối tác kinh doanh (Hiring Manager) rất tốt.',
    strengths: [
      'Áp dụng thành thạo mô hình Phỏng vấn dựa trên Hành vi (Behavioral Interviewing).',
      'Có số liệu cụ thể về Time-to-Hire, Cost-per-Hire và tỷ lệ Offer Acceptance.',
      'Tác phong chuẩn mực, thấu cảm và chuyên nghiệp.',
    ],
    criticalFlaws: [
      'Cần bổ sung chiến lược ứng dụng AI / ATS automation để giảm tải các tác vụ thủ công trong sàng lọc hồ sơ.',
    ],
    improvementPlan: [
      'Tìm hiểu thêm về luật lao động trong các tình huống tranh chấp thử việc hoặc bồi thường hợp đồng đào tạo.',
    ],
    questions: [
      {
        q: 'Làm thế nào để bạn thuyết phục một Hiring Manager đang đặt ra tiêu chuẩn "viển vông" (muốn ứng viên hoàn hảo về mọi mặt nhưng mức lương dưới chuẩn thị trường)?',
        intent: 'Kiểm tra kỹ năng tư vấn đối tác nội bộ (HR Business Partner), sử dụng dữ liệu thị trường và giải quyết xung đột.',
        score: 90,
        answer: 'Tôi không tranh cãi bằng cảm tính mà dùng Báo cáo Lương thị trường (Salary Guide) và dữ liệu phễu tuyển dụng thực tế (Talent Pool Data) để phân tích cho Hiring Manager thấy. Sau đó đề xuất điều chỉnh JD theo mô hình Must-have vs Nice-to-have.',
        criticalFeedback: {
          flaws: 'Câu trả lời rất xuất sắc! Đã thể hiện được vai trò tư vấn đối tác (Consultative Partner) thay vì chỉ là người nhận đơn vị trí tuyển dụng thụ động.',
          interviewerImpression: 'Tư duy HRBP hiện đại, biết sử dụng dữ liệu để đàm phán nội bộ.',
        },
        modelAnswer: 'Để giải quyết bài toán "Kỳ vọng trên mây - Ngân sách dưới đất", tôi áp dụng chiến lược tư vấn dựa trên dữ liệu (Data-backed Consulting):\n\n1. Khảo sát dữ liệu Thị trường Lao động thực tế:\nTôi chuẩn bị báo cáo ngắn gồm 3 nguồn dữ liệu: Báo cáo lương của Mercer/Navigos/Adecco, phân tích mức lương đề xuất của 5 đối thủ cạnh tranh trực tiếp, và số lượng nhân sự phù hợp hiện có trên LinkedIn Recruiter (Talent Availability).\n\n2. Phân loại lại Bộ tiêu chí Năng lực (Competency Prioritization):\nCùng ngồi lại với Hiring Manager phân chia JD rõ ràng:\n- Must-have (Bắt buộc phải có để hoàn thành công việc cốt lõi - tối đa 3-4 kỹ năng).\n- Nice-to-have (Có thể đào tạo nội bộ trong 3-6 tháng đầu tiên).\n\n3. Đưa ra 3 Giải pháp linh hoạt để Hiring Manager lựa chọn:\n- Phương án A: Giữ nguyên mức lương hiện tại -> Hạ bớt số năm kinh nghiệm yêu cầu, tập trung vào ứng viên có tiềm năng tăng trưởng cao (High-potential).\n- Phương án B: Giữ nguyên tiêu chuẩn hoàn hảo -> Đề xuất Ban Giám đốc phê duyệt tăng ngân sách lương hoặc bổ sung gói Thưởng ký hợp đồng (Sign-on Bonus) / Cổ phần thưởng ESOP.\n- Phương án C: Tuyển dụng chuyên gia tư vấn bán thời gian (Contractor) giải quyết bài toán trước mắt trong khi tiếp tục săn nhân sự full-time dài hạn.',
        goldenKeywords: ['Data-backed Consulting', 'Must-have vs Nice-to-have', 'Talent Availability Mapping', 'Salary Benchmarking', 'Competency Framework', 'Sign-on Bonus'],
      },
    ],
  },
  {
    id: 'HM-8995',
    date: '2026-09-08',
    domain: 'Công nghệ thông tin & Phần mềm',
    domainId: 'it-software',
    topic: 'Kiến trúc Vi dịch vụ Microservices & Distributed Systems',
    level: 'Senior',
    duration: '32 phút',
    totalScore: 92,
    grade: 'Xuất Sắc',
    gradeColor: '#588157',
    questionsCount: 5,
    competencies: {
      domainKnowledge: 95,
      problemSolving: 92,
      structureSTAR: 88,
      deliveryTone: 93,
    },
    aiSummary: 'Nắm rất sâu về hệ thống phân tán, cơ chế đồng thuận Raft/Paxos, CAP theorem và thiết kế chịu lỗi (Fault tolerance). Giải thích rõ ràng các trade-off trong thực tế.',
    strengths: [
      'Hiểu sâu kiến trúc Message Broker (Kafka) và cách đảm bảo Exactly-once semantics.',
      'Phân tích cặn kẽ giải pháp xử lý Distributed Transactions qua Saga Pattern.',
    ],
    criticalFlaws: [
      'Cần chú ý thêm về chi phí hạ tầng (Cloud FinOps) khi thiết kế cụm phân tán đa vùng (Multi-region).',
    ],
    improvementPlan: [
      'Bổ sung kiến thức về Zero-trust Security và mTLS giữa các microservices.',
    ],
    questions: [
      {
        q: 'Làm thế nào để xử lý bài toán giao dịch phân tán (Distributed Transaction) giữa nhiều microservices độc lập mà không dùng 2-Phase Commit (2PC)?',
        intent: 'Kiểm tra kiến trúc microservices nâng cao, Saga Pattern, tính nhất quán cuối cùng (Eventual Consistency).',
        score: 94,
        answer: '2PC gây chậm và khóa tài nguyên nên trong thực tế ta dùng Saga Pattern. Saga chia giao dịch thành chuỗi các local transaction. Nếu một bước lỗi thì kích hoạt các Compensating Transaction để hoàn tác ngược lại. Ta có thể chọn Choreography hoặc Orchestration.',
        criticalFeedback: {
          flaws: 'Câu trả lời cực kỳ chuẩn xác và có chiều sâu. Nêu bật được sự khác biệt giữa Choreography và Orchestration.',
          interviewerImpression: 'Trình độ Senior / Lead System Architect xuất sắc.',
        },
        modelAnswer: 'Để giải quyết Distributed Transactions mà vẫn đảm bảo tính khả dụng (Availability) cao, giải pháp chuẩn mực là áp dụng Saga Pattern dựa trên tính Nhất quán cuối cùng (Eventual Consistency):\n\n1. Hạn chế của 2PC:\nTwo-Phase Commit là giao dịch đồng bộ, gây hiện tượng Blocking trên toàn hệ thống và là "Single Point of Failure" nếu Coordinator bị sập, vi phạm nguyên lý cô lập của Microservices.\n\n2. Mô hình Saga Pattern:\nMột giao dịch nghiệp vụ lớn được phân rã thành chuỗi các Local Transaction tại từng service. Mỗi service cập nhật cơ sở dữ liệu riêng và phát ra Sự kiện (Event/Message). Nếu một bước thất bại, hệ thống thực thi các Giao dịch bù trừ (Compensating Transactions) theo thứ tự ngược lại để hoàn nguyên trạng thái dữ liệu.\n\n3. Hai trường phái triển khai:\n- Choreography (Phân tán qua Message Broker): Các service tự lắng nghe sự kiện của nhau qua Kafka. Phù hợp cho luồng xử lý đơn giản (2-4 bước).\n- Orchestration (Điều phối tập trung): Sử dụng một Saga Orchestrator chuyên trách (như Temporal hoặc Zeebe) để kiểm soát trạng thái state machine. Rất dễ theo dõi, giám sát và xử lý timeout trong các quy trình nghiệp vụ phức tạp.',
        goldenKeywords: ['Saga Pattern', 'Compensating Transaction', 'Choreography vs Orchestration', 'Eventual Consistency', 'Temporal / Camunda', 'Outbox Pattern'],
      },
    ],
  },
];

// ============================================================================
// BỘ SINH CÂU HỎI THÔNG MINH CHO TỪNG LĨNH VỰC THỰC TẾ
// ============================================================================
const generateQuestions = (topicName, domainId) => {
  if (domainId === 'kinh-te') {
    return [
      `Hãy phân tích nguyên nhân và cách bạn đánh giá rủi ro tài chính của một doanh nghiệp khi thực hiện: ${topicName}?`,
      `Khi các chỉ số thanh toán và biên lợi nhuận bị suy giảm trong bối cảnh lạm phát, bạn sẽ tham mưu giải pháp gì cho Ban Giám đốc trong ${topicName}?`,
      `Chia sẻ một case study thực tế bạn đã áp dụng ${topicName} để tối ưu hóa dòng tiền hoặc cắt giảm chi phí cho doanh nghiệp?`,
      `Các sai lầm hoặc gian lận phổ biến nhất cần kiểm soát chặt chẽ khi triển khai ${topicName} là gì?`,
      `Nếu được giao quyền quyết định, bạn sẽ xây dựng quy trình kiểm soát và báo cáo định kỳ cho ${topicName} như thế nào?`,
    ];
  }
  if (domainId === 'marketing') {
    return [
      `Chiến lược cốt lõi của bạn để tối ưu hiệu quả và đo lường ROI khi triển khai: ${topicName} là gì?`,
      `Khi ngân sách bị cắt giảm 30% nhưng mục tiêu KPI doanh số giữ nguyên, bạn sẽ tái cấu trúc ${topicName} như thế nào?`,
      `Làm thế nào để phối hợp nhịp nhàng giữa đội ngũ Sáng tạo (Creative) và Đội ngũ Số liệu (Data/Performance) trong ${topicName}?`,
      `Kể về một chiến dịch thất bại hoặc gặp khủng hoảng khi thực hiện ${topicName} và bài học đắt giá bạn rút ra được?`,
      `Xu hướng công nghệ và hành vi khách hàng mới nhất đang tác động mạnh mẽ đến ${topicName} trong năm nay là gì?`,
    ];
  }
  if (domainId === 'sales') {
    return [
      `Quy trình chuẩn mực từng bước của bạn từ khâu tiếp cận đến chốt hợp đồng đối với: ${topicName}?`,
      `Khách hàng lớn từ chối ký hợp đồng với lý do giá quá cao hoặc chưa đúng thời điểm, bạn sẽ xử lý phản đối trong ${topicName} ra sao?`,
      `Làm thế nào bạn phân loại và ưu tiên các khách hàng tiềm năng có tỷ lệ chốt cao nhất trong ${topicName}?`,
      `Chia sẻ về một thương vụ đàm phán khó khăn nhất bạn từng xoay chuyển tình thế thành công trong ${topicName}?`,
      `Bí quyết của bạn để vừa đạt chỉ tiêu số mới (Hunting) vừa nuôi dưỡng quan hệ lâu dài (Farming) trong ${topicName}?`,
    ];
  }
  if (domainId === 'hr') {
    return [
      `Phương pháp của bạn để xây dựng tiêu chí đánh giá chuẩn mực và thu hút ứng viên chất lượng cao trong: ${topicName}?`,
      `Khi xảy ra xung đột quan điểm hoặc bất đồng lợi ích giữa nhân sự và doanh nghiệp, cách giải quyết của bạn trong ${topicName} là gì?`,
      `Làm thế nào để đo lường định lượng hiệu quả (KPIs/Metrics) của các chương trình thuộc ${topicName}?`,
      `Chia sẻ kinh nghiệm thực tế của bạn trong việc tái cấu trúc hoặc triển khai thành công một chính sách mới về ${topicName}?`,
      `Bạn ứng dụng công nghệ và chuyển đổi số như thế nào để tối ưu năng suất lao động trong ${topicName}?`,
    ];
  }
  return [
    `Hãy giải thích nguyên lý hoạt động cốt lõi và các tiêu chuẩn tốt nhất (Best Practices) của: ${topicName}?`,
    `Khi hệ thống hoặc quy trình gặp sự cố về hiệu năng ở quy mô lớn, bạn sẽ chẩn đoán và khắc phục ${topicName} như thế nào?`,
    `So sánh giải pháp ${topicName} với các phương án thay thế khác trên thị trường. Điểm đánh đổi (Trade-offs) quan trọng nhất là gì?`,
    `Chia sẻ một bài học kinh nghiệm sâu sắc nhất bạn tích lũy được sau khi triển khai dự án thực tế về ${topicName}?`,
    `Nếu bắt đầu thiết kế giải pháp cho khách hàng doanh nghiệp lớn, bạn sẽ kiến trúc ${topicName} theo mô hình nào?`,
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
  const [historyList, setHistoryList] = useState(MOCK_HISTORY);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [histFilter, setHistFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const timerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const recognitionRef = useRef(null);

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setTimerSec((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerOn]);

  // Web Speech Synthesis (AI Voice Reading)
  const speakQuestionText = (text) => {
    if (isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
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

  const handleStart = () => {
    const topic = customTopic.trim() || selectedTopic;
    if (!selectedDomain || !topic) {
      showToast('⚠️ Vui lòng chọn lĩnh vực và chủ đề phỏng vấn!');
      return;
    }
    const qs = generateQuestions(topic, selectedDomain.id).slice(0, numQuestions);
    setQuestions(qs);
    setAnswers({});
    setCurrentAnswer('');
    setCurrentIdx(0);
    setTimerSec(0);
    setTimerOn(true);
    setDone(false);
    setResult(null);
    setView('live');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Speak first question
    setTimeout(() => {
      speakQuestionText(qs[0]);
    }, 600);
  };

  const handleNext = () => {
    stopSpeaking();
    const upd = { ...answers, [currentIdx]: currentAnswer.trim() };
    setAnswers(upd);
    setCurrentAnswer('');
    if (currentIdx < questions.length - 1) {
      setIsAiTyping(true);
      setTimeout(() => {
        setIsAiTyping(false);
        setCurrentIdx((i) => {
          const next = i + 1;
          speakQuestionText(questions[next]);
          return next;
        });
      }, 1000);
    } else {
      setTimerOn(false);
      setDone(true);
      setIsAiTyping(true);
      setTimeout(() => {
        setIsAiTyping(false);
        buildResult(upd);
      }, 2200);
    }
  };

  const buildResult = (ans) => {
    const topic = customTopic.trim() || selectedTopic;
    const scoredQuestions = questions.map((q, i) => {
      const userText = ans[i] || '';
      const len = userText.length;
      const sc = Math.min(96, Math.max(50, 55 + Math.floor(len / 12) + Math.floor(Math.random() * 18)));
      return {
        q,
        intent: 'Đánh giá năng lực chuyên môn và phương pháp giải quyết tình huống thực tế.',
        score: sc,
        answer: userText || '(Ứng viên bỏ trống câu trả lời)',
        criticalFeedback: {
          flaws: sc >= 85
            ? 'Câu trả lời đầy đủ, lập luận chặt chẽ. Cần bổ sung thêm 1 chỉ số định lượng về ngân sách hoặc hiệu suất để hoàn hảo.'
            : sc >= 70
            ? 'Đã nêu được ý tưởng cơ bản nhưng còn thiếu mô hình STAR, lập luận còn mang tính lý thuyết và chưa đưa ra số liệu thực chiến.'
            : 'Chưa chạm đúng trọng tâm câu hỏi. Thiếu các thuật ngữ chuyên môn quan trọng và không có giải pháp khả thi.',
          interviewerImpression: sc >= 85
            ? 'Ứng viên tự tin, giàu kinh nghiệm thực tiễn.'
            : 'Ứng viên có tiềm năng nhưng cần rèn luyện thêm cách diễn đạt và cấu trúc câu trả lời.',
        },
        modelAnswer: `GỢI Ý CÂU TRẢ LỜI MẪU THEO MÔ HÌNH STAR CHO CHỦ ĐỀ: ${topic}
- Tình huống (Situation): Bối cảnh thực tế tại doanh nghiệp quy mô tương ứng.
- Nhiệm vụ (Task): Trọng trách cốt lõi cần giải quyết đối với câu hỏi tình huống này.
- Hành động (Action): Triển khai quy trình 3 bước với công cụ chuyên sâu và sự phối hợp liên phòng ban.
- Kết quả (Result): Đo lường thành công bằng các chỉ số định lượng cụ thể (+25% hiệu suất, tiết kiệm chi phí, đạt KPI cam kết).`,
        goldenKeywords: ['STAR Method', 'KPI / Metrics', 'Problem Solving', 'Data-driven Decision', 'Execution Excellence'],
      };
    });

    const total = Math.round(scoredQuestions.reduce((s, q) => s + q.score, 0) / scoredQuestions.length);
    const grade = total >= 90 ? 'Xuất Sắc' : total >= 80 ? 'Khá Tốt' : total >= 65 ? 'Đạt Yêu Cầu' : 'Cần Cải Thiện';
    const gc = total >= 90 ? '#588157' : total >= 80 ? '#2D3A31' : total >= 65 ? '#D4A373' : '#C27B66';

    const newResult = {
      id: 'HM-' + Math.floor(9000 + Math.random() * 999),
      date: new Date().toISOString().split('T')[0],
      domain: selectedDomain.label,
      domainId: selectedDomain.id,
      topic,
      level: LEVELS.find((l) => l.id === selectedLevel)?.label || selectedLevel,
      duration: fmt(timerSec),
      totalScore: total,
      grade,
      gradeColor: gc,
      questionsCount: questions.length,
      competencies: {
        domainKnowledge: Math.min(98, total + 3),
        problemSolving: Math.max(50, total - 2),
        structureSTAR: Math.max(45, total - 8),
        deliveryTone: Math.min(95, total + 1),
      },
      aiSummary: `Buổi phỏng vấn chủ đề "${topic}" hoàn thành. Ứng viên đạt điểm số ${total}/100 (${grade}). Hệ thống đã phân tích chi tiết từng lỗi sai và tạo gợi ý câu trả lời mẫu chuẩn mực.`,
      strengths: [
        'Tinh thần cầu tiến và phản xạ nhanh với các câu hỏi tình huống.',
        'Hiểu biết cơ bản về quy trình làm việc và thuật ngữ trong ngành.',
      ],
      criticalFlaws: [
        'Cần hạn chế nói lan man và áp dụng chặt chẽ mô hình STAR.',
        'Bổ sung số liệu định lượng (Metrics & KPIs) chứng minh kết quả.',
      ],
      improvementPlan: [
        'Đọc kỹ gợi ý câu trả lời mẫu chuẩn điểm 10 bên dưới.',
        'Luyện tập lại các câu hỏi bị chấm điểm dưới 75.',
      ],
      questions: scoredQuestions,
    };

    setResult(newResult);
    setHistoryList([newResult, ...historyList]);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs = [
    { id: 'setup', icon: 'tune', label: '1. Cấu Hình Phỏng Vấn' },
    { id: 'live', icon: 'videocam', label: '2. Phòng Thi AI' },
    { id: 'result', icon: 'analytics', label: '3. Kết Quả & Đánh Giá' },
    { id: 'history', icon: 'history', label: '4. Lịch Sử & Chi Tiết Lỗi Sai' },
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
      <div className="w-full bg-[#FAF9F5]/90 border-b border-botanical-stone sticky top-16 z-30 backdrop-blur-2xl px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-2xl bg-botanical-forest text-white flex items-center justify-center shadow-soft">
              <span className="material-symbols-outlined text-white text-xl">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-botanical-forest tracking-wide">AI Practice Studio</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full badge-sage font-bold">Đa Ngành Nghề v4.5</span>
              </div>
              <p className="text-[11px] text-botanical-forest/70 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-botanical-terracotta animate-pulse"></span>
                Kinh tế • Marketing • Sales • Nhân sự HR • Logistics • IT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none font-sans text-xs">
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
                  className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-botanical-forest text-white shadow-soft border border-botanical-forest'
                      : locked
                      ? 'text-botanical-forest/30 cursor-not-allowed bg-transparent'
                      : 'text-botanical-forest/70 hover:text-botanical-forest hover:bg-botanical-stone/30'
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
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-7">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-sage">
              <span className="w-2 h-2 rounded-full bg-botanical-terracotta animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-widest text-botanical-forest uppercase">Bước 1 — Thiết Lập Chủ Đề Phỏng Vấn</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-botanical-forest">
              Chọn Lĩnh Vực & Ngành Nghề Bạn Muốn Luyện Tập
            </h1>
            <p className="text-sm text-botanical-forest/75 max-w-2xl leading-relaxed">
              HireMate AI hỗ trợ phỏng vấn đa chuyên ngành: từ <strong className="text-botanical-forest font-bold">Kinh tế, Tài chính, Ngân hàng</strong>, <strong className="text-botanical-terracotta font-bold">Marketing</strong>, <strong className="text-botanical-forest font-bold">B2B Sales</strong> đến <strong className="text-botanical-forest font-bold">Nhân sự HR</strong> và <strong className="text-botanical-forest font-bold">Công nghệ Phần mềm</strong>.
            </p>
          </div>

          {/* CHỌN LĨNH VỰC */}
          <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-7 space-y-4 shadow-soft-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${selectedDomain ? 'bg-botanical-forest text-white' : 'bg-botanical-terracotta text-white'}`}>
                  {selectedDomain ? '✓' : '1'}
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-botanical-forest">Lựa Chọn Ngành Nghề Của Bạn</h2>
                  <p className="text-xs text-botanical-forest/65">AI sẽ tự động nạp ngân hàng câu hỏi chuyên sâu theo đúng ngành bạn chọn.</p>
                </div>
              </div>
              {selectedDomain && (
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full badge-sage">
                  Đã chọn: {selectedDomain.label}
                </span>
              )}
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
                        ? 'bg-[#FAF9F5] border-botanical-forest shadow-soft ring-2 ring-botanical-forest/20' 
                        : 'bg-white border-botanical-stone hover:bg-[#FAF9F5] hover:border-botanical-sage/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="material-symbols-outlined text-[28px] p-2 rounded-xl bg-botanical-cream text-botanical-forest">
                        {d.icon}
                      </span>
                      {isSel && (
                        <span className="material-symbols-outlined text-sm font-bold text-white bg-botanical-forest rounded-full p-1">
                          check
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-serif font-bold text-botanical-forest group-hover:text-botanical-terracotta leading-tight">
                        {d.label}
                      </div>
                      <p className="text-[11px] text-botanical-forest/65 mt-1.5 leading-snug line-clamp-2">
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
            <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-7 space-y-5 shadow-soft-xl animate-fadeIn transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-botanical-forest text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-botanical-forest">
                    Chọn Chủ Đề Chuyên Môn Trong Ngành: <span className="text-botanical-terracotta">{selectedDomain.label}</span>
                  </h2>
                  <p className="text-xs text-botanical-forest/65">Chọn một chủ đề phổ biến hoặc nhập nội dung tùy ý bạn muốn thử sức.</p>
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
                      className={`p-3.5 rounded-2xl text-left text-xs font-sans font-semibold border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isChecked
                          ? 'bg-botanical-forest text-white border-botanical-forest shadow-soft'
                          : 'bg-[#FAF9F5] border-botanical-stone text-botanical-forest hover:bg-white hover:border-botanical-sage/60'
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

              <div className="pt-2">
                <label className="block text-xs font-bold text-botanical-forest mb-2">
                  Hoặc tự nhập chủ đề / vị trí phỏng vấn tùy chỉnh của bạn:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ví dụ: Giám đốc Chi nhánh Ngân hàng, Trưởng phòng Digital Marketing, B2B Key Account..."
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value);
                      if (e.target.value) setSelectedTopic('');
                    }}
                    className="w-full bg-[#FAF9F5] border border-botanical-stone rounded-2xl px-4 py-3 text-sm text-botanical-forest placeholder:text-botanical-forest/40 focus:outline-none focus:ring-2 focus:ring-botanical-sage/50 focus:bg-white transition-colors"
                  />
                  {customTopic && (
                    <span className="absolute right-3 top-3 text-[10px] font-mono px-2 py-0.5 rounded-full badge-sage">
                      Custom Topic
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* CẤP ĐỘ & MỤC TIÊU */}
          {selectedDomain && (
            <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-7 space-y-6 shadow-soft-xl animate-fadeIn transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-botanical-terracotta text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h2 className="font-serif font-bold text-base text-botanical-forest">Cấp Bậc & Mục Tiêu Phỏng Vấn</h2>
                  <p className="text-xs text-botanical-forest/65">AI sẽ điều chỉnh độ sâu và độ khó câu hỏi theo kinh nghiệm của bạn.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-botanical-forest uppercase tracking-wider">Cấp Độ Ứng Tuyển:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {LEVELS.map((lvl) => {
                    const isSel = selectedLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => setSelectedLevel(lvl.id)}
                        className={`p-3 rounded-2xl text-center border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-botanical-forest text-white border-botanical-forest shadow-soft font-bold'
                            : 'bg-[#FAF9F5] border-botanical-stone text-botanical-forest hover:bg-white'
                        }`}
                      >
                        <div className="text-xs font-serif font-bold">{lvl.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{lvl.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-botanical-forest uppercase tracking-wider block mb-2">
                    Số lượng câu hỏi:
                  </label>
                  <div className="flex gap-2">
                    {[3, 5, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNumQuestions(n)}
                        className={`flex-1 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                          numQuestions === n
                            ? 'bg-botanical-terracotta text-white border-botanical-terracotta shadow-soft'
                            : 'bg-[#FAF9F5] text-botanical-forest border-botanical-stone hover:bg-white'
                        }`}
                      >
                        {n} câu ({n * 4} - {n * 6} phút)
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-botanical-forest uppercase tracking-wider block mb-2">
                    Mục tiêu đặc biệt cần AI lưu ý (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tập trung xoáy sâu vào kỹ năng đàm phán hợp đồng hoặc xử lý nợ..."
                    value={interviewGoal}
                    onChange={(e) => setInterviewGoal(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-botanical-stone rounded-2xl px-3.5 py-2.5 text-xs text-botanical-forest placeholder:text-botanical-forest/40 focus:outline-none focus:ring-2 focus:ring-botanical-sage/50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-botanical-stone/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-botanical-forest/75">
                  🎯 Đã sẵn sàng bộ câu hỏi tình huống chuyên sâu cho <strong className="text-botanical-forest">{customTopic || selectedTopic || 'Chủ đề đã chọn'}</strong>.
                </div>
                <button
                  onClick={handleStart}
                  className="btn-botanical-primary rounded-full px-8 py-3.5 text-xs uppercase tracking-wider shadow-soft hover:shadow-soft-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                >
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  Bắt Đầu Phỏng Vấn Với AI Ngay
                </button>
              </div>
            </section>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* 2. VIEW LIVE (PHÒNG PHỎNG VẤN TRỰC TUYẾN CHUYÊN NGHIỆP THẾ HỆ MỚI)    */}
      {/* ===================================================================== */}
      {view === 'live' && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-fadeIn">
          {/* 1. TOP EXECUTIVE STATUS BAR */}
          <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft-xl transition-all duration-300">
            {/* Left: Domain & Live indicator */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-soft overflow-hidden bg-botanical-forest" 
                >
                  <span className="material-symbols-outlined text-xl">smart_toy</span>
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-botanical-terracotta opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-botanical-terracotta"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-serif font-bold text-botanical-forest tracking-wide">
                    {customTopic || selectedTopic}
                  </span>
                  <span 
                    className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider badge-sage"
                  >
                    {selectedLevel.toUpperCase()} LEVEL
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-botanical-terracotta/15 text-botanical-terracotta border border-botanical-terracotta/30 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-botanical-terracotta animate-pulse"></span>
                    LIVE ROOM
                  </span>
                </div>
                <p className="text-[11px] text-botanical-forest/70 flex items-center gap-1.5 mt-0.5">
                  <span>{selectedDomain?.label}</span>
                  <span className="text-botanical-stone">•</span>
                  <span>Phòng thi số #HM-{selectedDomain?.id?.toUpperCase() || 'PRO'}</span>
                </p>
              </div>
            </div>

            {/* Center: Stepper Dots & Progress */}
            <div className="hidden md:flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-full border border-botanical-stone">
              <span className="text-[11px] font-mono font-bold text-botanical-forest/70 mr-1">
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
                          ? 'w-7 bg-botanical-terracotta shadow-soft' 
                          : isDone 
                          ? 'w-4 bg-botanical-forest' 
                          : 'w-2 bg-botanical-stone'
                      }`}
                      title={`Câu ${idx + 1}/${questions.length}`}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-mono font-bold ml-2 text-botanical-forest">
                {currentIdx + 1}/{questions.length}
              </span>
            </div>

            {/* Right: Timer & Action controls */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#FAF9F5] border border-botanical-stone text-botanical-forest shadow-soft">
                <span className="material-symbols-outlined text-sm animate-pulse text-botanical-terracotta">timer</span>
                <span>{fmt(timerSec)}</span>
              </div>

              {/* Mute AI Speech Toggle */}
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (!isMuted) stopSpeaking();
                  showToast(!isMuted ? 'Đã tắt giọng nói AI' : 'Đã bật giọng nói AI');
                }}
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-botanical-terracotta/15 text-botanical-terracotta border-botanical-terracotta/30' 
                    : 'bg-botanical-cream text-botanical-forest border-botanical-stone hover:bg-botanical-stone/60'
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
                className="px-3.5 py-1.5 rounded-full bg-botanical-cream hover:bg-botanical-terracotta/15 text-botanical-forest hover:text-botanical-terracotta border border-botanical-stone hover:border-botanical-terracotta/30 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Rời khỏi phòng phỏng vấn"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Rời Phòng</span>
              </button>
            </div>
          </div>

          {!done ? (
            /* 2-COLUMN MAIN STAGE */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT STAGE: AI PERSONA & CANDIDATE WORKSPACE (8 Columns) */}
              <div className="lg:col-span-8 space-y-5">
                
                {/* 2.1 AI INTERVIEWER PERSONA STAGE CARD */}
                <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 sm:p-6 shadow-soft-xl relative overflow-hidden transition-all duration-300">
                  {/* AI Persona Header Banner */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-botanical-stone/80">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img 
                          src={getPersona(selectedDomain?.id).avatar} 
                          alt={getPersona(selectedDomain?.id).name}
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-botanical-stone shadow-soft ring-2 ring-botanical-forest/10"
                        />
                        {isAiSpeaking && (
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-botanical-terracotta opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-botanical-terracotta border-2 border-white flex items-center justify-center">
                              <span className="material-symbols-outlined text-[10px] text-white">volume_up</span>
                            </span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-serif font-bold text-botanical-forest tracking-wide">
                            {getPersona(selectedDomain?.id).name}
                          </h3>
                          <span 
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border badge-sage"
                          >
                            AI ASSESSOR
                          </span>
                        </div>
                        <p className="text-xs text-botanical-forest/70 font-medium">
                          {getPersona(selectedDomain?.id).roleTitle} • <span className="text-botanical-forest/50">{getPersona(selectedDomain?.id).company}</span>
                        </p>
                      </div>
                    </div>

                    {/* Animated Neural Audio Equalizer */}
                    <div className="hidden sm:flex items-center gap-2 bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-botanical-stone">
                      <span className="text-[11px] font-mono text-botanical-forest/70">
                        {isAiSpeaking ? 'AI Đang Nói' : 'AI Lắng Nghe'}
                      </span>
                      <div className="flex items-end gap-1 h-4 w-10">
                        {[40, 80, 50, 100, 65, 30].map((h, i) => (
                          <div 
                            key={i} 
                            className={`w-1 rounded-full transition-all duration-150 ${isAiSpeaking ? 'animate-bounce' : 'opacity-40'}`}
                            style={{ 
                              height: isAiSpeaking ? `${h}%` : '30%',
                              backgroundColor: '#C27B66',
                              animationDelay: `${i * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Question Display Callout */}
                  <div className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-botanical-forest/70 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-botanical-terracotta"></span>
                        CÂU HỎI SỐ #{currentIdx + 1} / {questions.length}
                      </span>

                      {/* Re-play AI Audio speech */}
                      <button
                        onClick={() => speakQuestionText(questions[currentIdx])}
                        disabled={isAiSpeaking}
                        className="text-xs font-mono px-3.5 py-1 rounded-full bg-botanical-cream hover:bg-botanical-stone/60 border border-botanical-stone text-botanical-forest transition-all flex items-center gap-1.5 cursor-pointer shadow-soft disabled:opacity-50"
                        title="Bấm để AI đọc lại câu hỏi"
                      >
                        <span className="material-symbols-outlined text-sm text-botanical-terracotta">record_voice_over</span>
                        <span>{isAiSpeaking ? 'Đang đọc...' : 'Nghe lại giọng AI'}</span>
                      </button>
                    </div>

                    <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF9F5] border border-botanical-stone/80 shadow-soft relative">
                      <span className="absolute -top-3.5 left-4 text-3xl font-serif text-botanical-forest/20 select-none">“</span>
                      <p className="text-base sm:text-lg font-serif font-semibold text-botanical-forest leading-relaxed tracking-wide">
                        {questions[currentIdx]}
                      </p>
                    </div>

                    {/* STAR Structural Recommendation Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-botanical-forest/70 font-medium flex items-center gap-1 text-[11px] mr-1">
                        <span className="material-symbols-outlined text-botanical-terracotta text-sm">stars</span>
                        Khung STAR chuẩn mực:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-botanical-stone text-botanical-forest text-[11px] font-mono">
                        <strong className="text-botanical-terracotta">S:</strong> Bối cảnh thực tế
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-botanical-stone text-botanical-forest text-[11px] font-mono">
                        <strong className="text-botanical-forest">T:</strong> Nhiệm vụ cốt lõi
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-botanical-stone text-botanical-forest text-[11px] font-mono">
                        <strong className="text-botanical-sage">A:</strong> Hành động 3 bước
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-botanical-stone text-botanical-forest text-[11px] font-mono">
                        <strong className="text-botanical-terracotta">R:</strong> Kết quả &amp; KPI %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2.2 CANDIDATE WORKSPACE: VIDEO HUD & ANSWER COMPOSER */}
                <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 sm:p-6 shadow-soft-xl space-y-4 transition-all duration-300">
                  
                  {/* Top Bar: Camera HUD & Mic status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-botanical-stone/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-botanical-sage animate-pulse"></span>
                      <label className="text-xs font-serif font-bold text-botanical-forest uppercase tracking-wider">
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
                        className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isCamOn 
                            ? 'bg-botanical-forest text-white border-botanical-forest shadow-soft' 
                            : 'bg-botanical-cream text-botanical-forest/70 border-botanical-stone hover:text-botanical-forest'
                        }`}
                        title="Bật/Tắt Camera"
                      >
                        <span className="material-symbols-outlined text-sm">{isCamOn ? 'videocam' : 'videocam_off'}</span>
                        <span>{isCamOn ? 'Cam ON' : 'Cam OFF'}</span>
                      </button>

                      {/* Microphone Voice Recognition Toggle */}
                      <button
                        onClick={toggleMic}
                        className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-soft ${
                          isMicOn
                            ? 'bg-botanical-terracotta text-white border-botanical-terracotta animate-pulse'
                            : 'bg-botanical-cream text-botanical-forest border-botanical-stone hover:bg-botanical-stone/60'
                        }`}
                        title="Bật/Tắt Voice Speech Recognition"
                      >
                        <span className="material-symbols-outlined text-sm">{isMicOn ? 'mic' : 'mic_none'}</span>
                        <span>{isMicOn ? 'Đang Thu Âm...' : 'Bật Voice Speech'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Interactive Candidate Camera PIP preview & Voice waves */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Simulated / Real Candidate Feed */}
                    <div className="sm:col-span-5 relative rounded-2xl overflow-hidden bg-botanical-forest border border-botanical-stone aspect-video sm:aspect-auto sm:h-36 flex items-center justify-center shadow-soft group">
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
                            <div className="w-20 h-24 border border-dashed border-botanical-sage/70 rounded-2xl relative animate-pulse">
                              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-botanical-sage"></span>
                              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-botanical-sage"></span>
                              <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-botanical-sage"></span>
                              <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-botanical-sage"></span>
                            </div>
                          </div>
                          {/* HUD Badges */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-botanical-forest/80 backdrop-blur-md text-[9px] font-mono text-botanical-cream font-bold border border-white/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-botanical-sage"></span>
                            AI VISION: TRACKING
                          </div>
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-botanical-forest/80 backdrop-blur-md text-[9px] font-mono text-white/80">
                            1080P • 60 FPS
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 space-y-1">
                          <span className="material-symbols-outlined text-3xl text-botanical-cream/40">videocam_off</span>
                          <p className="text-[11px] text-botanical-cream/60 font-mono">Camera đang tắt</p>
                        </div>
                      )}
                    </div>

                    {/* STAR Quick Scaffold Inserter Bar */}
                    <div className="sm:col-span-7 bg-[#FAF9F5] rounded-2xl p-3 border border-botanical-stone space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-botanical-forest font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-botanical-terracotta">auto_fix_high</span>
                          Chèn Mẫu Cấu Trúc Trả Lời (STAR):
                        </span>
                        <span className="text-[10px] text-botanical-forest/50">1-Click</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button 
                          onClick={() => insertStarScaffold('S')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-botanical-cream border border-botanical-stone text-[11px] font-mono text-botanical-terracotta text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Bối cảnh / Tình huống (Situation)"
                        >
                          + [S] Tình huống
                        </button>
                        <button 
                          onClick={() => insertStarScaffold('T')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-botanical-cream border border-botanical-stone text-[11px] font-mono text-botanical-forest text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Nhiệm vụ cốt lõi (Task)"
                        >
                          + [T] Nhiệm vụ
                        </button>
                        <button 
                          onClick={() => insertStarScaffold('A')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-botanical-cream border border-botanical-stone text-[11px] font-mono text-botanical-sage text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Hành động 3 bước (Action)"
                        >
                          + [A] Hành động
                        </button>
                        <button 
                          onClick={() => insertStarScaffold('R')}
                          type="button"
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-botanical-cream border border-botanical-stone text-[11px] font-mono text-botanical-terracotta text-left transition-all cursor-pointer truncate font-bold"
                          title="Chèn mục Kết quả số liệu (Result)"
                        >
                          + [R] Kết quả &amp; KPI
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Rich Textarea Workspace */}
                  <div className="space-y-2">
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
                        className="w-full bg-[#FAF9F5] border border-botanical-stone focus:border-botanical-sage focus:bg-white rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-botanical-forest placeholder:text-botanical-forest/40 focus:outline-none leading-relaxed resize-none shadow-soft transition-all font-sans"
                      />
                      {currentAnswer && (
                        <button
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa câu trả lời hiện tại để viết lại?')) {
                              setCurrentAnswer('');
                            }
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-botanical-cream hover:bg-botanical-terracotta/20 text-botanical-forest/60 hover:text-botanical-terracotta transition-all text-xs cursor-pointer border border-botanical-stone/60"
                          title="Xóa nội dung trả lời"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>

                    {/* Bottom Status Bar of Answer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-botanical-forest/70 font-bold">
                          {currentAnswer.length} ký tự
                        </span>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <div className="w-24 h-1.5 bg-botanical-stone/80 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                currentAnswer.length < 50 ? 'bg-botanical-clay' : currentAnswer.length < 200 ? 'bg-botanical-sage' : 'bg-botanical-forest'
                              }`}
                              style={{ width: `${Math.min(100, (currentAnswer.length / 300) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-botanical-forest/60">
                            {currentAnswer.length < 50 ? 'Cần thêm ý' : currentAnswer.length < 200 ? 'Khá tốt' : '✓ Độ sâu tuyệt vời'}
                          </span>
                        </div>
                      </div>

                      {/* Next / Submit CTA Button */}
                      <button
                        onClick={handleNext}
                        disabled={isAiTyping}
                        className="btn-botanical-primary rounded-full px-6 sm:px-8 py-3 text-xs sm:text-sm uppercase tracking-wider font-bold shadow-soft hover:shadow-soft-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
              </div>

              {/* RIGHT STAGE: REAL-TIME TELEMETRY & COACHING MATRIX (4 Columns) */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* 2.3 REAL-TIME AI TELEMETRY PANEL */}
                <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 shadow-soft-xl space-y-4 transition-all duration-300">
                  
                  {/* Tab Selector inside Telemetry */}
                  <div className="flex items-center justify-between pb-3 border-b border-botanical-stone/80">
                    <span className="text-xs font-serif font-bold text-botanical-forest uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-botanical-terracotta">query_stats</span>
                      Tín Hiệu Đo Lường Trực Tiếp
                    </span>
                    <span className="badge-sage px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                      ACTIVE
                    </span>
                  </div>

                  {/* Meter 1: STAR Structure Completion Gauge */}
                  {(() => {
                    const starSignals = detectStarSignals(currentAnswer);
                    return (
                      <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-botanical-stone space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-botanical-forest/80 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-botanical-terracotta">verified</span>
                            Chỉ số cấu trúc STAR
                          </span>
                          <span className="text-sm font-serif font-bold text-botanical-forest">
                            {starSignals.score}%
                          </span>
                        </div>

                        <div className="w-full h-2 bg-botanical-stone/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 bg-botanical-forest"
                            style={{
                              width: `${starSignals.score}%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono text-center">
                          <span className={`p-1 rounded-lg border ${starSignals.s ? 'bg-botanical-forest text-white border-botanical-forest font-bold' : 'bg-white border-botanical-stone text-botanical-forest/50'}`}>
                            S {starSignals.s ? '✓' : '...'}
                          </span>
                          <span className={`p-1 rounded-lg border ${starSignals.t ? 'bg-botanical-forest text-white border-botanical-forest font-bold' : 'bg-white border-botanical-stone text-botanical-forest/50'}`}>
                            T {starSignals.t ? '✓' : '...'}
                          </span>
                          <span className={`p-1 rounded-lg border ${starSignals.a ? 'bg-botanical-forest text-white border-botanical-forest font-bold' : 'bg-white border-botanical-stone text-botanical-forest/50'}`}>
                            A {starSignals.a ? '✓' : '...'}
                          </span>
                          <span className={`p-1 rounded-lg border ${starSignals.r ? 'bg-botanical-forest text-white border-botanical-forest font-bold' : 'bg-white border-botanical-stone text-botanical-forest/50'}`}>
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
                      <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-botanical-stone space-y-2">
                        <span className="text-xs font-mono text-botanical-forest/80 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-botanical-sage">label</span>
                          Từ khóa chuyên môn bắt được ({detectedKws.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5 min-h-[38px]">
                          {detectedKws.length > 0 ? (
                            detectedKws.map((kw, idx) => (
                              <span 
                                key={idx} 
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-botanical-forest/10 text-botanical-forest border border-botanical-forest/20 shadow-soft"
                              >
                                ✓ {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-botanical-forest/50 italic">
                              Chưa phát hiện từ khóa chuyên ngành. Hãy nhắc đến các công cụ &amp; chỉ số thực tế.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Meter 3: Contextual AI Advice */}
                  <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-botanical-stone space-y-1.5">
                    <span className="text-xs font-mono text-botanical-terracotta font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      Lời khuyên từ {getPersona(selectedDomain?.id).name}:
                    </span>
                    <p className="text-xs text-botanical-forest/75 leading-relaxed font-sans">
                      {getPersona(selectedDomain?.id).greeting} Hãy trả lời súc tích và kết thúc bằng một chỉ số định lượng cụ thể.
                    </p>
                  </div>
                </div>

                {/* 2.4 QUESTION NAVIGATOR & TIMELINE PREVIEW */}
                <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 shadow-soft-xl space-y-3 transition-all duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-botanical-stone/80">
                    <span className="text-xs font-serif font-bold text-botanical-forest uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-botanical-terracotta">format_list_numbered</span>
                      Lộ Trình Buổi Phỏng Vấn
                    </span>
                    <span className="badge-sage px-2 py-0.5 rounded-full text-[10px] font-mono">
                      {questions.length} Câu
                    </span>
                  </div>

                  <div className="space-y-2">
                    {questions.map((q, idx) => {
                      const isPast = idx < currentIdx;
                      const isNow = idx === currentIdx;
                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-2xl border text-xs transition-all flex items-start gap-2.5 ${
                            isNow 
                              ? 'bg-botanical-forest text-white border-botanical-forest font-bold shadow-soft' 
                              : isPast 
                              ? 'bg-[#FAF9F5] border-botanical-stone text-botanical-forest' 
                              : 'bg-white/60 border-botanical-stone/60 text-botanical-forest/40'
                          }`}
                        >
                          <span 
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                              isNow 
                                ? 'bg-botanical-terracotta text-white font-bold' 
                                : isPast 
                                ? 'bg-botanical-cream text-botanical-forest font-bold' 
                                : 'bg-botanical-stone/40 text-botanical-forest/50'
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
            <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-12 text-center space-y-6 shadow-soft-xl transition-all duration-300 my-8">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-botanical-terracotta animate-spin" style={{ animationDuration: '8s' }}></div>
                <div className="w-full h-full rounded-full bg-botanical-cream flex items-center justify-center border border-botanical-stone">
                  <span className="material-symbols-outlined text-5xl text-botanical-terracotta animate-pulse">psychology</span>
                </div>
              </div>
              
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-2xl font-serif font-bold text-botanical-forest tracking-wide">
                  Hệ Thống Synthia AI Đang Chấm Điểm Chuyên Sâu...
                </h3>
                <p className="text-sm text-botanical-forest/75 font-sans leading-relaxed">
                  Đang bóc tách từng luận điểm, đối chiếu khung năng lực STAR và tự động tổng hợp báo cáo chẩn đoán điểm mạnh &amp; điểm yếu.
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-botanical-terracotta animate-bounce"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/* 3. VIEW RESULT (KẾT QUẢ VỪA THI XONG)                                  */}
      {/* ===================================================================== */}
      {view === 'result' && result && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-7 animate-fadeIn">
          {/* Top Banner Điểm Số */}
          <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-8 text-center space-y-4 shadow-soft-xl">
            <div className="w-28 h-28 rounded-full mx-auto flex flex-col items-center justify-center border-4 border-botanical-stone bg-[#FAF9F5] shadow-soft">
              <span className="font-serif font-black text-4xl text-botanical-forest">
                {result.totalScore}
              </span>
              <span className="text-[10px] font-mono text-botanical-forest/60">/100 Điểm</span>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-botanical-forest/60">Đánh Giá Tổng Quan Từ AI</div>
              <div className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-botanical-forest">
                Xếp Loại: <span className="text-botanical-terracotta">{result.grade}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-xs text-botanical-forest/80">
              <span className="px-3.5 py-1 rounded-full bg-[#FAF9F5] border border-botanical-stone">Chủ đề: <strong className="text-botanical-forest">{result.topic}</strong></span>
              <span className="px-3.5 py-1 rounded-full bg-[#FAF9F5] border border-botanical-stone">Thời gian: <strong className="text-botanical-forest">{result.duration}</strong></span>
              <span className="px-3.5 py-1 rounded-full bg-[#FAF9F5] border border-botanical-stone">Cấp bậc: <strong className="text-botanical-forest">{result.level}</strong></span>
              <span className="px-3.5 py-1 rounded-full bg-[#FAF9F5] border border-botanical-stone font-mono">Mã bài: <strong className="text-botanical-terracotta">#{result.id}</strong></span>
            </div>

            <p className="text-sm text-botanical-forest/75 max-w-2xl mx-auto leading-relaxed">{result.aiSummary}</p>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedHistorySession(result);
                  setView('history');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-botanical-primary rounded-full px-6 py-2.5 text-xs uppercase font-bold shadow-soft hover:shadow-soft-lg flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">analytics</span>
                Xem Toàn Bộ Chi Tiết Lỗi Sai &amp; Câu Trả Lời Mẫu
              </button>
              <button
                onClick={() => {
                  setView('setup');
                }}
                className="btn-botanical-secondary rounded-full px-5 py-2.5 text-xs uppercase font-bold flex items-center gap-2 cursor-pointer"
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
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-sage">
              <span className="material-symbols-outlined text-sm text-botanical-forest">history</span>
              <span className="text-[11px] font-bold text-botanical-forest uppercase">Nhật Ký Các Buổi Phỏng Vấn AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-botanical-forest">
              Lịch Sử Bài Phỏng Vấn &amp; Đánh Giá Chi Tiết
            </h1>
            <p className="text-sm text-botanical-forest/75">
              Chọn bất kỳ buổi phỏng vấn nào để mở <strong className="text-botanical-forest">Trang Phân Tích Chuyên Sâu</strong>: chỉ rõ chi tiết lỗi sai từng câu, lý do bị trừ điểm và gợi ý câu trả lời mẫu điểm 10 theo mô hình STAR.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-all ${
                  histFilter === f.id
                    ? 'bg-botanical-forest text-white border-botanical-forest shadow-soft'
                    : 'bg-[#FAF9F5] text-botanical-forest/75 border-botanical-stone hover:text-botanical-forest hover:bg-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Danh Sách Các Buổi Đã Thi */}
          <div className="space-y-4">
            {historyList
              .filter((s) => histFilter === 'ALL' || s.domainId === histFilter || s.domain.toLowerCase().includes(histFilter.toLowerCase()))
              .map((session) => (
                <div
                  key={session.id}
                  className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 sm:p-6 transition-all hover:border-botanical-sage/60 hover:shadow-soft-xl space-y-4 shadow-soft"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 border-botanical-stone bg-[#FAF9F5] font-serif font-black text-xl text-botanical-forest shadow-soft"
                      >
                        {session.totalScore}
                        <span className="text-[9px] font-mono font-normal opacity-70">/100</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-serif font-bold text-base text-botanical-forest">{session.topic}</h3>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border badge-sage"
                          >
                            {session.grade}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-botanical-forest/65">
                          <span className="text-botanical-terracotta font-bold">{session.domain}</span>
                          <span>•</span>
                          <span>Cấp độ: {session.level}</span>
                          <span>•</span>
                          <span>Thời lượng: {session.duration}</span>
                          <span>•</span>
                          <span>{session.date}</span>
                          <span className="font-mono text-botanical-forest font-bold">#{session.id}</span>
                        </div>

                        <p className="text-xs text-botanical-forest/75 leading-relaxed pt-1 line-clamp-2">
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
                        className="btn-botanical-primary rounded-full w-full sm:w-auto px-5 py-2.5 font-bold text-xs uppercase tracking-wider shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Mở Báo Cáo Chi Tiết Lỗi Sai</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Mini Progress Pills */}
                  <div className="pt-3 border-t border-botanical-stone/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#FAF9F5] rounded-2xl p-2.5 border border-botanical-stone">
                      <div className="text-[10px] text-botanical-forest/65 uppercase">Chuyên Môn Ngành:</div>
                      <div className="font-bold text-botanical-forest mt-0.5">{session.competencies?.domainKnowledge || 80}%</div>
                    </div>
                    <div className="bg-[#FAF9F5] rounded-2xl p-2.5 border border-botanical-stone">
                      <div className="text-[10px] text-botanical-forest/65 uppercase">Tư Duy Giải Quyết:</div>
                      <div className="font-bold text-botanical-forest mt-0.5">{session.competencies?.problemSolving || 75}%</div>
                    </div>
                    <div className="bg-[#FAF9F5] rounded-2xl p-2.5 border border-botanical-stone">
                      <div className="text-[10px] text-botanical-forest/65 uppercase">Cấu Trúc STAR:</div>
                      <div className="font-bold text-botanical-forest mt-0.5">{session.competencies?.structureSTAR || 70}%</div>
                    </div>
                    <div className="bg-[#FAF9F5] rounded-2xl p-2.5 border border-botanical-stone">
                      <div className="text-[10px] text-botanical-forest/65 uppercase">Độ Tự Tin &amp; Phong Thái:</div>
                      <div className="font-bold text-botanical-forest mt-0.5">{session.competencies?.deliveryTone || 80}%</div>
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
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-7 animate-fadeIn">
          {/* Top Breadcrumb & Back */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              onClick={() => {
                setSelectedHistorySession(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-botanical-secondary rounded-full inline-flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all cursor-pointer w-fit"
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
                className="btn-botanical-primary rounded-full px-4 py-2 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-soft"
              >
                <span className="material-symbols-outlined text-sm">model_training</span>
                Luyện Lại Chủ Đề Này
              </button>
              <button
                onClick={() => showToast('Đang tạo file PDF Báo cáo đánh giá chi tiết...')}
                className="btn-botanical-secondary rounded-full px-4 py-2 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Xuất Báo Cáo PDF
              </button>
            </div>
          </div>

          {/* Banner Thông Tin Bài Phỏng Vấn */}
          <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-7 shadow-soft-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold border badge-sage">
                    {selectedHistorySession.grade}
                  </span>
                  <span className="text-xs font-mono text-botanical-forest/60">Mã hồ sơ: #{selectedHistorySession.id}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-botanical-forest">
                  {selectedHistorySession.topic}
                </h1>
                <div className="flex flex-wrap gap-3 text-xs text-botanical-forest/70">
                  <span>Ngành: <strong className="text-botanical-terracotta">{selectedHistorySession.domain}</strong></span>
                  <span>•</span>
                  <span>Cấp bậc: <strong className="text-botanical-forest">{selectedHistorySession.level}</strong></span>
                  <span>•</span>
                  <span>Thời lượng: <strong className="text-botanical-forest">{selectedHistorySession.duration}</strong></span>
                  <span>•</span>
                  <span>Ngày thi: <strong className="text-botanical-forest">{selectedHistorySession.date}</strong></span>
                </div>
              </div>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shrink-0 border-4 border-botanical-stone bg-[#FAF9F5] shadow-soft">
                <span className="font-serif font-black text-3xl sm:text-4xl text-botanical-forest">
                  {selectedHistorySession.totalScore}
                </span>
                <span className="text-[10px] font-mono text-botanical-forest/60">/100 ĐIỂM</span>
              </div>
            </div>
          </section>

          {/* 4 Trụ Cột Năng Lực Đo Lường Bằng AI */}
          <section className="space-y-3">
            <h2 className="font-serif font-bold text-base text-botanical-forest flex items-center gap-2">
              <span className="material-symbols-outlined text-botanical-terracotta">speed</span>
              Đánh Giá 4 Trụ Cột Năng Lực Cốt Lõi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  label: 'Kiến Thức Chuyên Môn',
                  score: selectedHistorySession.competencies?.domainKnowledge || 80,
                  desc: 'Độ chính xác thuật ngữ & nguyên lý ngành',
                  color: '#2D3A31',
                },
                {
                  label: 'Tư Duy Giải Quyết Vấn Đề',
                  score: selectedHistorySession.competencies?.problemSolving || 75,
                  desc: 'Tính khả thi & kinh nghiệm thực chiến',
                  color: '#588157',
                },
                {
                  label: 'Cấu Trúc Trả Lời (STAR)',
                  score: selectedHistorySession.competencies?.structureSTAR || 70,
                  desc: 'Mạch lạc, có số liệu & minh chứng',
                  color: '#C27B66',
                },
                {
                  label: 'Phong Thái & Thuyết Phục',
                  score: selectedHistorySession.competencies?.deliveryTone || 80,
                  desc: 'Tự tin, chuyên nghiệp & đĩnh đạc',
                  color: '#8C5E58',
                },
              ].map((c) => (
                <div key={c.label} className="card-botanical bg-white/95 rounded-2xl border border-botanical-stone p-4 space-y-2 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-botanical-forest">{c.label}</span>
                    <span className="font-serif font-bold text-sm text-botanical-forest">
                      {c.score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-botanical-stone/80 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: c.score + '%', backgroundColor: c.color }} />
                  </div>
                  <p className="text-[11px] text-botanical-forest/65 leading-snug">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Bảng Đánh Giá Cốt Lõi: Điểm Mạnh, Lỗi Sai & Lộ Trình Cải Thiện */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Điểm Mạnh */}
            <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 space-y-3 shadow-soft">
              <div className="flex items-center gap-2 text-botanical-forest">
                <span className="material-symbols-outlined text-lg">verified</span>
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider">Điểm Sáng Nổi Bật</h3>
              </div>
              <ul className="space-y-2 text-xs text-botanical-forest/80 leading-relaxed">
                {(selectedHistorySession.strengths || [
                  'Nắm được các khái niệm chuyên môn nền tảng.',
                  'Tác phong trả lời tự tin, giao tiếp gãy gọn.',
                ]).map((st, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-botanical-forest font-bold">✓</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lỗi Sai & Thiếu Sót */}
            <div className="card-botanical bg-[#FAF9F5] rounded-3xl border border-botanical-terracotta/40 p-5 space-y-3 shadow-soft">
              <div className="flex items-center gap-2 text-botanical-terracotta">
                <span className="material-symbols-outlined text-lg">warning</span>
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider">Lỗi Sai Cần Sửa Ngay</h3>
              </div>
              <ul className="space-y-2 text-xs text-botanical-forest/80 leading-relaxed">
                {(selectedHistorySession.criticalFlaws || [
                  'Câu trả lời còn mang tính chung chung, thiếu số liệu định lượng.',
                  'Chưa tuân thủ cấu trúc STAR dẫn đến việc thiếu kết quả đo lường.',
                ]).map((fl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-botanical-terracotta font-bold">✕</span>
                    <span>{fl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lộ Trình Cải Thiện */}
            <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 space-y-3 shadow-soft">
              <div className="flex items-center gap-2 text-botanical-sage">
                <span className="material-symbols-outlined text-lg">route</span>
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider">Hành Động Khắc Phục</h3>
              </div>
              <ul className="space-y-2 text-xs text-botanical-forest/80 leading-relaxed">
                {(selectedHistorySession.improvementPlan || [
                  'Học thuộc các từ khóa chuyên ngành theo gợi ý bên dưới.',
                  'Luyện lại câu hỏi tình huống với số liệu doanh thu/chi phí cụ thể.',
                ]).map((pl, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-botanical-forest font-bold">→</span>
                    <span>{pl}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Phân Tích Chi Tiết Từng Câu Hỏi & Gợi Ý Câu Trả Lời Mẫu */}
          <section className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-botanical-forest flex items-center gap-2">
                  <span className="material-symbols-outlined text-botanical-terracotta">quiz</span>
                  Phân Tích Chi Tiết Từng Câu Hỏi &amp; Gợi Ý Trả Lời Chuẩn Điểm 10
                </h2>
                <p className="text-xs text-botanical-forest/70">
                  Dưới đây là lời phân tích chi tiết của AI: chỉ rõ vì sao bạn bị trừ điểm và cách trả lời chuẩn mực giúp ghi điểm tối đa với nhà tuyển dụng.
                </p>
              </div>
              <span className="badge-sage px-3 py-1 rounded-full text-xs font-mono">
                {selectedHistorySession.questions.length} Câu Hỏi
              </span>
            </div>

            <div className="space-y-6">
              {selectedHistorySession.questions.map((item, idx) => {
                const c = scoreColor(item.score);
                return (
                  <div
                    key={idx}
                    className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone overflow-hidden shadow-soft-xl"
                  >
                    {/* Header Câu Hỏi */}
                    <div className="p-5 sm:p-6 border-b border-botanical-stone/80 bg-[#FAF9F5] space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-soft bg-botanical-forest text-white"
                          >
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-sans uppercase tracking-wider text-botanical-forest/65">
                            Mục tiêu đánh giá: <strong className="text-botanical-forest">{item.intent || 'Năng lực chuyên môn và xử lý tình huống'}</strong>
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-serif font-bold text-botanical-forest">
                            {item.score}
                            <span className="text-xs font-normal text-botanical-forest/60">/100</span>
                          </div>
                          <div className="w-24 h-1.5 bg-botanical-stone/80 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: item.score + '%', backgroundColor: c }} />
                          </div>
                        </div>
                      </div>

                      <h3 className="text-sm sm:text-base font-serif font-bold text-botanical-forest leading-relaxed pt-1">
                        "{item.q}"
                      </h3>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                      {/* 1. Câu Trả Lời Của Bạn */}
                      <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-botanical-stone space-y-1.5">
                        <div className="text-[11px] font-sans font-bold text-botanical-forest/70 uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-botanical-sage">person</span>
                          Câu Trả Lời Thực Tế Của Bạn:
                        </div>
                        <p className="text-xs sm:text-sm text-botanical-forest leading-relaxed italic">
                          "{item.answer}"
                        </p>
                      </div>

                      {/* 2. AI Bóc Tách Lỗi Sai & Nguyên Nhân Bị Trừ Điểm */}
                      <div className="bg-botanical-terracotta/10 rounded-2xl p-4 border border-botanical-terracotta/30 space-y-2.5">
                        <div className="text-[11px] font-sans font-bold text-botanical-terracotta uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">error</span>
                          Phân Tích Chi Tiết Lỗi Sai &amp; Thiếu Sót (AI Diagnostic):
                        </div>
                        <p className="text-xs text-botanical-forest/85 leading-relaxed">
                          {item.criticalFeedback?.flaws || 'Câu trả lời còn thiếu các ý then chốt và chưa áp dụng mô hình STAR để chứng minh kết quả.'}
                        </p>
                        {item.criticalFeedback?.interviewerImpression && (
                          <div className="text-[11px] text-botanical-forest/75 pt-1 border-t border-botanical-terracotta/20 flex items-start gap-1.5">
                            <strong className="shrink-0 text-botanical-terracotta">Góc nhìn Nhà Tuyển Dụng:</strong>
                            <span>{item.criticalFeedback.interviewerImpression}</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Gợi Ý Câu Trả Lời Mẫu Chuẩn Điểm 10 (Model Answer) */}
                      <div className="bg-white rounded-2xl p-5 border border-botanical-stone space-y-3 shadow-soft">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-sans font-bold text-botanical-forest uppercase flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-botanical-terracotta">auto_awesome</span>
                            Gợi Ý Cách Trả Lời Chuẩn Điểm 10 (Mô Hình STAR / Chuẩn Ngành):
                          </div>
                          <span className="badge-sage px-2 py-0.5 rounded-full text-[10px] font-mono">
                            Model Answer
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-botanical-forest/90 leading-relaxed whitespace-pre-line font-sans bg-[#FAF9F5] p-4 rounded-xl border border-botanical-stone/80">
                          {item.modelAnswer || 'Áp dụng mô hình STAR với số liệu định lượng cụ thể để thuyết phục người phỏng vấn.'}
                        </div>

                        {/* Từ khóa đắt giá */}
                        {item.goldenKeywords && item.goldenKeywords.length > 0 && (
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-botanical-forest/75 font-bold uppercase mr-1">Thuật Ngữ Vàng Nên Đưa Vào:</span>
                            {item.goldenKeywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="px-2.5 py-0.5 rounded-full badge-sage text-[10px] font-mono font-bold"
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
            <div className="pt-6 border-t border-botanical-stone/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => {
                  setSelectedHistorySession(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-botanical-secondary rounded-full w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="btn-botanical-primary rounded-full w-full sm:w-auto px-8 py-3 text-xs uppercase tracking-wider font-bold shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
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
