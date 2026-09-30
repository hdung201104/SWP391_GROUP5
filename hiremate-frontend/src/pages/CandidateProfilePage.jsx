import React, { useState } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';

export default function CandidateProfilePage({ user }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();

  // Active Tab: 'resume' (Bản CV Trực quan) | 'attachments' (Kho tệp PDF & Phân tích ATS)
  const [activeTab, setActiveTab] = useState('resume');

  // Canvas Theme: 'paper-white' (Giấy Trắng A4 Chuẩn In) | 'living-glass' (Chuẩn Botanical)
  const [canvasTheme, setCanvasTheme] = useState('paper-white');

  // Resume Template: 'executive' (2 Cột Cân Đối) | 'harvard' (Tối giản Harvard ATS 100%) | 'modern' (Hiện Đại Sang Trọng)
  const [cvTemplate, setCvTemplate] = useState('executive');

  // Mode: Is user currently in direct edit mode?
  const [isEditing, setIsEditing] = useState(false);

  // Job search status: 'OPEN_TO_WORK' | 'EXPLORING' | 'NOT_LOOKING'
  const [jobSearchStatus, setJobSearchStatus] = useState('OPEN_TO_WORK');

  // ==========================================================================
  // CANDIDATE ACCOUNTS & THEIR MULTIPLE CV VERSIONS
  // (Mỗi ứng viên là 1 người duy nhất, sở hữu nhiều phiên bản CV khác nhau để nộp tuyển dụng)
  // ==========================================================================
  const candidateDatabase = {
    // ỨNG VIÊN 1: NGUYỄN THẢO MY (Chuyên ngành Kinh tế & Tài chính)
    thaomy: {
      accountName: 'Nguyễn Thảo My',
      accountIndustry: 'Kinh Tế & Tài Chính (CFA)',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      email: 'thaomy.nguyen@gmail.com',
      phone: '0983 246 810',
      location: 'Quận 1, TP. Hồ Chí Minh',
      dob: '22/04/1997',
      gender: 'Nữ',
      linkedin: 'linkedin.com/in/thaomy-finance',
      github: 'github.com/thaomy-fintech',
      portfolio: 'thaomyinvest.vn',
      
      // DANH SÁCH 3 PHIÊN BẢN CV CỦA CÙNG 1 NGƯỜI (NGUYỄN THẢO MY)
      cvVersions: [
        {
          id: 'cv_thaomy_vn',
          versionName: 'Bản 1: CV Tiêu Chuẩn Tiếng Việt',
          versionBadge: '⭐ MẶC ĐỊNH FAST APPLY',
          isDefault: true,
          targetTitle: 'Senior Financial Analyst / Trưởng Nhóm Phân Tích Đầu Tư',
          tagline: 'Chuyên gia phân tích tài chính doanh nghiệp với 4+ năm kinh nghiệm lập mô hình định giá DCF, phân tích M&A và thẩm định danh mục đầu tư quy mô 500+ tỷ VNĐ.',
          summary: 'Chuyên viên Phân tích Tài chính Cấp cao (CFA Level II Candidate) với bề dày kinh nghiệm thực hiện thẩm định tài chính, xây dựng mô hình dự phóng tài chính đa kịch bản (Financial Modeling) và phân tích rủi ro thanh khoản cho các tập đoàn bán lẻ và quỹ đầu tư tư nhân.\n\nSở hữu năng lực tư duy định lượng vượt trội: Thành thạo SQL, Python phân tích chuỗi thời gian, Power BI và Bloomberg Terminal. Đã tư vấn thành công 4 thương vụ M&A với tổng giá trị thẩm định vượt 500 tỷ VNĐ, tối ưu hóa 18% chi phí vốn bình quân WACC cho doanh nghiệp.',
          education: [
            {
              id: 1,
              school: 'Đại học Kinh tế TP. Hồ Chí Minh (UEH)',
              degree: 'Cử nhân Tài chính Doanh nghiệp & Đầu tư',
              period: '2015 — 2019',
              grade: 'Tốt nghiệp Xuất sắc (GPA: 3.78 / 4.0)',
              highlight: 'Á khoa toàn khóa; Chủ nhiệm CLB Nghiên cứu Thị trường Tài chính Doanh nghiệp Trẻ.'
            }
          ],
          certifications: [
            { id: 1, name: 'CFA Level II Candidate', issuer: 'CFA Institute (Hoa Kỳ)', year: '2024', code: 'CFA-ID: 981244' },
            { id: 2, name: 'Financial Modeling & Valuation Analyst (FMVA®)', issuer: 'CFI Corporate Finance Institute', year: '2023', code: 'FMVA-90182' },
            { id: 3, name: 'IELTS Academic 8.0 (Listening 8.5, Reading 8.5)', issuer: 'British Council Vietnam', year: '2024', code: 'TRF: 24VN009182TH' }
          ],
          languages: [
            { name: 'Tiếng Việt', level: 'Bản ngữ (Native)', score: 'Bản ngữ' },
            { name: 'Tiếng Anh', level: 'Thành thạo thương mại (IELTS 8.0)', score: 'C1 / Professional' },
            { name: 'Tiếng Trung (Mandarin)', level: 'Giao tiếp kinh doanh (HSK 4)', score: 'Trung cấp' }
          ],
          skills: [
            { category: 'Mô hình Tài chính & Định giá', items: ['Định giá DCF (Chiết khấu dòng tiền)', 'Comparable Company Analysis (CCA)', 'Thẩm định M&A', 'Tối ưu WACC'] },
            { category: 'Kế toán Quản trị & Dự báo', items: ['Phân tích Báo cáo Tài chính P&L', 'Báo cáo Dòng tiền Cashflow', 'Lập Ngân sách Doanh nghiệp', 'Kiểm soát Chi phí OPEX/CAPEX'] },
            { category: 'Công cụ Định lượng & Dữ liệu', items: ['Advanced MS Excel (VBA/Macros)', 'Power BI & DAX', 'SQL Data Extraction', 'Python for Finance (Pandas)'] },
            { category: 'Hệ thống Quản lý Doanh nghiệp', items: ['SAP ERP Financials', 'Bloomberg Terminal', 'QuickBooks Enterprise', 'Refinitiv Eikon'] }
          ],
          experiences: [
            {
              id: 1,
              role: 'Lead Investment & Financial Analyst',
              company: 'FPT Capital Fund Management',
              period: '03/2022 — Hiện tại',
              location: 'TP. Hồ Chí Minh • Toàn thời gian',
              bullets: [
                'Chủ trì thẩm định và xây dựng mô hình tài chính định giá cho 8 dự án M&A thuộc lĩnh vực Bán lẻ & Công nghệ, trực tiếp chốt thành công 2 thương vụ quy mô 320 tỷ VNĐ.',
                'Thiết lập hệ thống Dashboard Power BI theo dõi chỉ số tài chính thời gian thực (EBITDA, ROI, Dòng tiền tự do FCF), rút ngắn 65% thời gian lập báo cáo quý cho Hội đồng Quản trị.',
                'Tái cơ cấu cơ cấu nợ và danh mục vay tín dụng, giúp doanh nghiệp tiết kiệm 2.4 tỷ VNĐ chi phí lãi vay mỗi năm.',
                'Đào tạo và kèm cặp chuyên môn cho 4 chuyên viên phân tích tài chính trẻ đạt chứng chỉ FMVA quốc tế.'
              ],
              tags: ['M&A Valuation', 'Financial Modeling', 'DCF', 'Power BI', 'CFA Standards']
            },
            {
              id: 2,
              role: 'Senior Financial Planning & Analysis (FP&A)',
              company: 'Vinamilk Group Corporation',
              period: '09/2019 — 02/2022',
              location: 'TP. Hồ Chí Minh • Toàn thời gian',
              bullets: [
                'Chịu trách nhiệm phân tích ngân sách và chênh lệch dự toán (Variance Analysis) cho 12 nhà máy và đơn vị trực thuộc với tổng ngân sách vận hành 1,800 tỷ VNĐ.',
                'Phối hợp cùng bộ phận Chuỗi cung ứng (Supply Chain) rà soát chu kỳ hàng tồn kho, giảm 14 ngày chu chuyển tiền mặt (Cash Conversion Cycle).',
                'Xây dựng kịch bản tài chính ứng phó biến động tỷ giá và giá nguyên liệu sữa bột toàn cầu, bảo vệ biên lợi nhuận ròng đạt 16.5%.'
              ],
              tags: ['FP&A', 'Variance Analysis', 'SAP ERP', 'Cashflow Forecasting']
            }
          ],
          projects: [
            {
              id: 1,
              name: 'Tái Cấu Trúc Vốn & Đàm Phán Tín Dụng Doanh Nghiệp',
              role: 'Lead Financial Advisor',
              period: '2023 — 2024',
              summary: 'Tái tài trợ gói vay hợp vốn 250 tỷ VNĐ từ 3 ngân hàng thương mại, hạ lãi suất bình quân từ 9.8% xuống 7.5%/năm và gia hạn thời hạn thanh toán thêm 3 năm.',
              tags: ['Debt Restructuring', 'Syndicated Loan', 'Bank Negotiation']
            },
            {
              id: 2,
              name: 'Hệ Thống Tự Động Hóa Báo Cáo Dự Phóng Dòng Tiền (Rolling Forecast)',
              role: 'Project Lead',
              period: '2022',
              summary: 'Ứng dụng Python và Power BI kết nối trực tiếp dữ liệu SAP ERP, tạo dự báo dòng tiền 13 tuần tự động với sai số dưới 3.5%.',
              tags: ['Python', 'Power BI', 'SAP Integration']
            }
          ]
        },

        {
          id: 'cv_thaomy_en',
          versionName: 'Bản 2: International English CV (MNC)',
          versionBadge: '🌐 CHUẨN ĐA QUỐC GIA',
          isDefault: false,
          targetTitle: 'Senior Investment & Financial Analyst (Bilingual / Global MNC Focus)',
          tagline: 'CFA Level II candidate with 4+ years of cross-border financial valuation, DCF modeling, M&A due diligence, and capital structure optimization for $20M+ funds.',
          summary: 'High-performing Senior Financial Analyst with extensive track record in cross-border financial due diligence, automated rolling cashflow forecasting, and quantitative equity research.\n\nDemonstrated expertise in Python for financial time-series, Power BI enterprise dashboards, and SAP ERP integration. Successfully advised on 4 M&A transactions exceeding $22M total valuation, while lowering weighted average cost of capital (WACC) by 180 bps.',
          education: [
            {
              id: 1,
              school: 'University of Economics Ho Chi Minh City (UEH)',
              degree: 'Bachelor of Corporate Finance & Investment Banking',
              period: '2015 — 2019',
              grade: 'Graduated with Highest Distinction (GPA: 3.78 / 4.0)',
              highlight: 'Valedictorian runner-up; President of the Young Financial Research Association.'
            }
          ],
          certifications: [
            { id: 1, name: 'CFA Level II Candidate', issuer: 'CFA Institute (USA)', year: '2024', code: 'CFA-ID: 981244' },
            { id: 2, name: 'Financial Modeling & Valuation Analyst (FMVA®)', issuer: 'CFI Corporate Finance Institute', year: '2023', code: 'FMVA-90182' },
            { id: 3, name: 'IELTS Academic 8.0 (Listening 8.5, Reading 8.5)', issuer: 'British Council Vietnam', year: '2024', code: 'TRF: 24VN009182TH' }
          ],
          languages: [
            { name: 'Vietnamese', level: 'Native Language', score: 'Native' },
            { name: 'English', level: 'Professional Working Proficiency (IELTS 8.0)', score: 'C1 / Professional' },
            { name: 'Mandarin Chinese', level: 'Business Communication (HSK 4)', score: 'Intermediate' }
          ],
          skills: [
            { category: 'Financial Modeling & Valuation', items: ['Discounted Cashflow (DCF)', 'Comparable Company Analysis (CCA)', 'M&A Due Diligence', 'WACC Optimization'] },
            { category: 'FP&A & Variance Analysis', items: ['P&L Financial Reporting', '13-Week Cashflow Forecasting', 'Corporate Budgeting', 'OPEX/CAPEX Control'] },
            { category: 'Quantitative & BI Tools', items: ['Advanced MS Excel (VBA/Macros)', 'Power BI & DAX Modeling', 'SQL Querying', 'Python for Finance (Pandas)'] },
            { category: 'Enterprise Systems', items: ['SAP S/4HANA Finance', 'Bloomberg Professional Terminal', 'Refinitiv Eikon', 'QuickBooks'] }
          ],
          experiences: [
            {
              id: 1,
              role: 'Lead Investment & Financial Analyst',
              company: 'FPT Capital Fund Management',
              period: '03/2022 — Present',
              location: 'Ho Chi Minh City • Full-time',
              bullets: [
                'Led financial modeling and target valuation for 8 cross-border M&A transactions, directly closing 2 strategic deals valued at $14M USD.',
                'Architected real-time Power BI executive dashboards for board-level reporting, reducing quarterly close cycle time by 65%.',
                'Restructured corporate debt and syndicated loan facilities, saving $105,000 USD in annualized debt-servicing interest costs.',
                'Mentored and coached 4 junior analysts towards achieving FMVA and CFA Level I credentials.'
              ],
              tags: ['M&A Valuation', 'Financial Modeling', 'DCF', 'Power BI', 'CFA Standards']
            },
            {
              id: 2,
              role: 'Senior Financial Planning & Analysis (FP&A)',
              company: 'Vinamilk Group Corporation',
              period: '09/2019 — 02/2022',
              location: 'Ho Chi Minh City • Full-time',
              bullets: [
                'Supervised variance analysis and OPEX budgeting across 12 manufacturing plants with an aggregate operational budget of $78M USD.',
                'Collaborated with Supply Chain leadership to optimize inventory turns, compressing cash conversion cycle (CCC) by 14 days.',
                'Modeled currency FX sensitivity and global raw dairy commodity volatility, defending operating net profit margin at 16.5%.'
              ],
              tags: ['FP&A', 'Variance Analysis', 'SAP S/4HANA', 'Cashflow Modeling']
            }
          ],
          projects: [
            {
              id: 1,
              name: 'Corporate Capital Restructuring & Syndicated Debt Facility',
              role: 'Lead Financial Advisor',
              period: '2023 — 2024',
              summary: 'Refinanced $11M syndicated credit line across 3 commercial banks, lowering blended coupon from 9.8% to 7.5% with a 3-year tenor extension.',
              tags: ['Debt Restructuring', 'Syndicated Loan', 'Bank Negotiation']
            },
            {
              id: 2,
              name: 'Automated 13-Week Rolling Cashflow Forecast System',
              role: 'Project Lead',
              period: '2022',
              summary: 'Bridged SAP ERP data warehouse with Python and Power BI, creating automated 13-week liquidity forecasting with less than 3.5% error variance.',
              tags: ['Python', 'Power BI', 'SAP Integration']
            }
          ]
        },

        {
          id: 'cv_thaomy_lead',
          versionName: 'Bản 3: Ứng Tuyển Quản Lý / Lead (Leadership)',
          versionBadge: '🎯 QUẢN LÝ & CHIẾN LƯỢC',
          isDefault: false,
          targetTitle: 'Trưởng Ban Phân Tích Kế Hoạch & Đầu Tư Chiến Lược (FP&A Squad Lead)',
          tagline: 'Trưởng nhóm tài chính giàu kinh nghiệm điều hành và kèm cặp đội ngũ 8 chuyên viên, tái cấu trúc gói tín dụng hợp vốn 250 tỷ và báo cáo định kỳ trước Hội Đồng Quản Trị.',
          summary: 'Trưởng nhóm Phân tích Kế hoạch & Đầu tư Tài chính (FP&A Squad Lead) với năng lực kép về chiến lược vốn và điều hành nhân sự. Trực tiếp lãnh đạo squad 8 chuyên viên phân tích tài chính trẻ đạt hiệu suất KPI 125%.\n\nCó kinh nghiệm sâu sắc trong việc đàm phán hợp đồng tín dụng hợp vốn quy mô 250 tỷ VNĐ, giảm 2.4 tỷ VNĐ lãi vay thường niên; thiết lập hệ thống cảnh báo sớm rủi ro dòng tiền và bảo vệ biên lợi nhuận ròng 16.5% trong giai đoạn biến động thị trường.',
          education: [
            {
              id: 1,
              school: 'Đại học Kinh tế TP. Hồ Chí Minh (UEH)',
              degree: 'Cử nhân Tài chính Doanh nghiệp & Đầu tư',
              period: '2015 — 2019',
              grade: 'Tốt nghiệp Xuất sắc (GPA: 3.78 / 4.0)',
              highlight: 'Á khoa toàn khóa; Chủ nhiệm CLB Nghiên cứu Thị trường Tài chính Doanh nghiệp Trẻ.'
            }
          ],
          certifications: [
            { id: 1, name: 'CFA Level II Candidate', issuer: 'CFA Institute (Hoa Kỳ)', year: '2024', code: 'CFA-ID: 981244' },
            { id: 2, name: 'Financial Modeling & Valuation Analyst (FMVA®)', issuer: 'CFI Corporate Finance Institute', year: '2023', code: 'FMVA-90182' },
            { id: 3, name: 'Leadership & Strategic Negotiation', issuer: 'FPT Leadership Academy', year: '2023', code: 'LEAD-8819' }
          ],
          languages: [
            { name: 'Tiếng Việt', level: 'Bản ngữ (Native)', score: 'Bản ngữ' },
            { name: 'Tiếng Anh', level: 'Thành thạo thương mại & Đàm phán (IELTS 8.0)', score: 'C1 / Professional' }
          ],
          skills: [
            { category: 'Năng Lực Lãnh Đạo & Điều Hành', items: ['Quản Trị Đội Ngũ Squad (8 nhân sự)', 'Báo Cáo Hội Đồng Quản Trị (BOD)', 'Đàm Phán Tín Dụng Hợp Vốn', 'Hoạch Định Chiến Lược Vốn'] },
            { category: 'Mô hình Tài chính & Định giá M&A', items: ['Thẩm Định M&A Cấp Cao', 'Mô Hình Định Giá DCF Đa Kịch Bản', 'Tối Ưu WACC & Đòn Bẩy Tài Chính', 'Quản Trị Rủi Ro Thanh Khoản'] },
            { category: 'Hệ Thống & Tự Động Hóa Quản Trị', items: ['Power BI Executive Dashboards', 'SAP ERP S/4HANA', 'Lập Dự Toán Ngân Sách 1,800 Tỷ', 'Tối Ưu Chu Kỳ Tiền Mặt'] }
          ],
          experiences: [
            {
              id: 1,
              role: 'Trưởng Nhóm Phân Tích Đầu Tư Chiến Lược',
              company: 'FPT Capital Fund Management',
              period: '03/2022 — Hiện tại',
              location: 'TP. Hồ Chí Minh • Toàn thời gian',
              bullets: [
                'Trực tiếp quản trị và điều phối đội ngũ 8 chuyên viên phân tích tài chính; xây dựng ma trận đánh giá năng lực giúp 100% thành viên vượt chỉ tiêu KPI năm.',
                'Đại diện quỹ làm việc trực tiếp cùng Hội đồng Quản trị và các định chế tài chính quốc tế, thẩm định 8 dự án M&A và chốt thành công 2 thương vụ 320 tỷ VNĐ.',
                'Chủ trì đàm phán tái cơ cấu nợ vay với 3 ngân hàng thương mại, hạ lãi suất vay 2.3% và tiết kiệm 2.4 tỷ VNĐ lãi vay mỗi năm.',
                'Xây dựng hệ thống báo cáo quản trị tự động phục vụ ban điều hành ra quyết định đầu tư nhanh hơn 3 lần.'
              ],
              tags: ['Leadership', 'M&A Valuation', 'BOD Reporting', 'Debt Negotiation']
            },
            {
              id: 2,
              role: 'Chuyên Viên Phân Tích Kế Hoạch Tài Chính Cấp Cao',
              company: 'Vinamilk Group Corporation',
              period: '09/2019 — 02/2022',
              location: 'TP. Hồ Chí Minh • Toàn thời gian',
              bullets: [
                'Chịu trách nhiệm quản lý dự toán ngân sách hoạt động 1,800 tỷ VNĐ của 12 nhà máy trực thuộc toàn quốc.',
                'Đề xuất sáng kiến tối ưu hóa vòng quay hàng tồn kho và chu kỳ tiền mặt, giải phóng 45 tỷ VNĐ vốn lưu động cho tập đoàn.'
              ],
              tags: ['Budgeting 1800B', 'Working Capital', 'SAP ERP']
            }
          ],
          projects: [
            {
              id: 1,
              name: 'Dự Án Tái Cơ Cấu Nguồn Vốn Chiến Lược Doanh Nghiệp',
              role: 'Trưởng Nhóm Tư Vấn Chiến Lược',
              period: '2023 — 2024',
              summary: 'Cơ cấu lại gói nợ 250 tỷ VNĐ, kéo dài kỳ hạn vay 36 tháng và cắt giảm 18% chi phí vốn bình quân WACC.',
              tags: ['Capital Strategy', 'Debt Restructuring']
            }
          ]
        }
      ]
    },

    // ỨNG VIÊN 2: TRẦN BẢO LONG (Chuyên ngành Công nghệ thông tin)
    baolong: {
      accountName: 'Trần Bảo Long',
      accountIndustry: 'Công Nghệ Thông Tin (Software & Cloud)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      email: 'long.tran@gmail.com',
      phone: '0912 345 678',
      location: 'TP. Hồ Chí Minh, Việt Nam',
      dob: '15/08/1998',
      gender: 'Nam',
      linkedin: 'linkedin.com/in/longtran-backend',
      github: 'github.com/longtran-dev',
      portfolio: 'longtran.tech',

      // 3 PHIÊN BẢN CV CỦA TRẦN BẢO LONG
      cvVersions: [
        {
          id: 'cv_long_vn',
          versionName: 'Bản 1: Backend Squad Lead (Tiếng Việt)',
          versionBadge: '⭐ MẶC ĐỊNH FAST APPLY',
          isDefault: true,
          targetTitle: 'Senior Backend Engineer / Distributed Systems Architect',
          tagline: 'Kỹ sư kiến trúc hệ thống phân tán với kinh nghiệm tối ưu tải 50,000+ RPS, kiến trúc Microservices Java 21 / Spring Boot 3 và cơ sở dữ liệu quan hệ chuẩn 3NF.',
          summary: 'Kỹ sư Backend Cấp cao với hơn 4 năm kinh nghiệm thực chiến kiến tạo các hệ thống phân tán chịu tải lớn, chuyên sâu kiến trúc Microservices hiện đại bằng Java 21, Spring Boot 3 và cơ sở dữ liệu quan hệ PostgreSQL chuẩn 3NF.\n\nThực chiến xuất sắc trong bài toán hiệu năng & độ trễ: Đảm bảo P99 dưới 15ms với Redis Cluster, thiết kế luồng sự kiện phân vùng Kafka đạt thông lượng 50,000+ RPS và tự động hóa điều phối Kubernetes trên AWS Cloud. Tư duy chuẩn mực Clean Architecture, luôn hướng tới việc kiến tạo sản phẩm số mở rộng bền vững và tối ưu 40% chi phí hạ tầng cho doanh nghiệp.',
          education: [
            {
              id: 1,
              school: 'Đại học FPT (FPT University TP.HCM)',
              degree: 'Kỹ sư Kỹ thuật Phần mềm (Software Engineering)',
              period: '2017 — 2021',
              grade: 'Tốt nghiệp Loại Giỏi (GPA: 3.65 / 4.0)',
              highlight: 'Đồ án tốt nghiệp: "Xây dựng sàn giao dịch tài sản số phân tán sử dụng Event Sourcing và Microservices" (Giải Xuất Sắc).'
            }
          ],
          certifications: [
            { id: 1, name: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', year: '2023 — 2026', code: 'AWS-SAA: 894102' },
            { id: 2, name: 'Oracle Certified Professional: Java SE 17 Developer', issuer: 'Oracle University', year: '2022', code: 'OCP-90214' },
            { id: 3, name: 'TOEIC 850 / 990 (Listening & Reading)', issuer: 'ETS Global', year: '2023', code: 'Professional Working Proficiency' }
          ],
          languages: [
            { name: 'Tiếng Việt', level: 'Bản ngữ (Native)', score: 'Bản ngữ' },
            { name: 'Tiếng Anh', level: 'Thành thạo làm việc (TOEIC 850/990)', score: 'B2 / Professional' }
          ],
          skills: [
            { category: 'Ngôn ngữ Lập trình Cốt lõi', items: ['Java 21 (Virtual Threads)', 'Python 3', 'TypeScript / JavaScript', 'SQL (PostgreSQL/MySQL)'] },
            { category: 'Framework & Kiến trúc', items: ['Spring Boot 3', 'Spring Cloud', 'Microservices', 'RESTful APIs & gRPC'] },
            { category: 'Cơ sở dữ liệu & Caching', items: ['PostgreSQL (Chuẩn 3NF)', 'Redis Cluster', 'ElasticSearch', 'MySQL'] },
            { category: 'Message Queue & Event Streaming', items: ['Apache Kafka (Event-Driven)', 'RabbitMQ', 'Event Sourcing', 'CQRS'] },
            { category: 'DevOps, Cloud & Giám sát', items: ['Docker & Kubernetes (K8s)', 'AWS (EC2, S3, RDS)', 'GitLab CI/CD', 'Prometheus & Grafana'] }
          ],
          experiences: [
            {
              id: 1,
              role: 'Senior Backend Squad Lead',
              company: 'FPT Software Corporation',
              period: '06/2023 — Hiện tại',
              location: 'TP. Hồ Chí Minh • Toàn thời gian',
              bullets: [
                'Trực tiếp thiết kế và chỉ đạo triển khai core Microservices xử lý thanh toán và quản lý đơn hàng chịu tải đỉnh 50,000+ RPS với cam kết SLA sẵn sàng 99.99%.',
                'Tái cấu trúc toàn diện tầng Cache đa lớp (Redis Cluster kết hợp Caffeine local cache), giảm độ trễ P99 từ 120ms xuống còn 15ms cho toàn bộ chuỗi API truy vấn.',
                'Tiên phong áp dụng Java 21 Virtual Threads và Spring Boot 3 giúp tiết kiệm 40% chi phí tài nguyên máy chủ điện toán đám mây AWS.',
                'Dẫn dắt đội ngũ kỹ sư 6 thành viên, ban hành quy chuẩn kiểm thử tự động với Unit/Integration Test đạt độ phủ 85% và chuẩn hóa luồng CI/CD.'
              ],
              tags: ['Java 21', 'Spring Boot 3', 'Kafka', 'Redis Cluster', 'AWS', 'Docker']
            }
          ],
          projects: [
            {
              id: 1,
              name: 'HireMate AI Career Platform',
              role: 'Core Backend Architect',
              period: '2024 — 2025',
              summary: 'Nền tảng tuyển dụng và phỏng vấn AI thông minh. Xây dựng thuật toán AI Matching 70/30 và luồng xử lý phỏng vấn trực tiếp độ trễ thấp.',
              tags: ['Spring Boot 3', 'PostgreSQL 3NF', 'Gemini AI', 'WebSocket']
            }
          ]
        },
        {
          id: 'cv_long_en',
          versionName: 'Bản 2: Cloud Architect Resume (English)',
          versionBadge: '🌐 CHUẨN QUỐC TẾ',
          isDefault: false,
          targetTitle: 'Senior Cloud & Distributed Systems Architect',
          tagline: 'Distributed backend architect with proven experience delivering 50,000+ RPS microservices, sub-15ms P99 latency with Java 21 and AWS.',
          summary: 'Senior Distributed Systems Engineer with 4+ years architecting enterprise-scale microservices using Java 21 Virtual Threads, Spring Boot 3, and AWS Cloud.\n\nDemonstrated mastery in event-driven streaming with Apache Kafka, multi-layer caching with Redis Cluster, and automated Kubernetes orchestration.',
          education: [
            {
              id: 1,
              school: 'FPT University Ho Chi Minh City',
              degree: 'Bachelor of Science in Software Engineering',
              period: '2017 — 2021',
              grade: 'Graduated with Honors (GPA: 3.65 / 4.0)',
              highlight: 'Outstanding Capstone Thesis Award in Distributed Event Sourcing Systems.'
            }
          ],
          certifications: [
            { id: 1, name: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', year: '2023 — 2026', code: 'AWS-SAA: 894102' }
          ],
          languages: [
            { name: 'Vietnamese', level: 'Native Language', score: 'Native' },
            { name: 'English', level: 'Professional Working Proficiency (TOEIC 850)', score: 'B2 / Professional' }
          ],
          skills: [
            { category: 'Core Languages', items: ['Java 21', 'Python 3', 'SQL', 'TypeScript'] },
            { category: 'Architecture & Cloud', items: ['Microservices', 'Spring Boot 3', 'AWS (EC2, RDS, S3)', 'Docker', 'Kubernetes'] }
          ],
          experiences: [
            {
              id: 1,
              role: 'Senior Backend Squad Lead',
              company: 'FPT Software Corporation',
              period: '06/2023 — Present',
              location: 'Ho Chi Minh City • Full-time',
              bullets: [
                'Architected high-throughput payment settlement microservices handling peak traffic of 50,000+ RPS with 99.99% SLA availability.',
                'Decreased P99 latency from 120ms to 15ms via multi-tier caching with Redis Cluster and Caffeine local caches.',
                'Adopted Java 21 Virtual Threads and Spring Boot 3, reducing cloud server infrastructure expenses by 40% on AWS.'
              ],
              tags: ['Java 21', 'Spring Boot 3', 'Kafka', 'Redis', 'AWS']
            }
          ],
          projects: [
            {
              id: 1,
              name: 'HireMate AI Recruitment Platform',
              role: 'Core Backend Architect',
              period: '2024 — 2025',
              summary: 'Built 70/30 skill matching algorithm with PostgreSQL 3NF and sub-second live AI interview processing.',
              tags: ['Spring Boot 3', 'PostgreSQL', 'Gemini AI']
            }
          ]
        },
        {
          id: 'cv_long_lead',
          versionName: 'Bản 3: Vị Trí Tech Lead & Quản Lý Đội Ngũ',
          versionBadge: '🎯 TECH LEAD & QUẢN TRỊ',
          isDefault: false,
          targetTitle: 'Engineering Manager / Technical Squad Lead',
          tagline: 'Tech Lead dẫn dắt squad 6 kỹ sư, chuẩn hóa quy chuẩn Clean Architecture, CI/CD tự động và tối ưu 40% ngân sách hạ tầng cloud.',
          summary: 'Tech Lead với năng lực kép về chuyên môn kỹ thuật sâu và kỹ năng dẫn dắt đội ngũ kỹ sư. Đã thiết lập quy chuẩn văn hóa kỹ thuật tự động hóa Unit/Integration Test đạt độ phủ 85% và đào tạo 4 kỹ sư trẻ lên cấp bậc Middle/Senior.',
          education: [
            {
              id: 1,
              school: 'Đại học FPT TP.HCM',
              degree: 'Kỹ sư Kỹ thuật Phần mềm',
              period: '2017 — 2021',
              grade: 'Tốt nghiệp Loại Giỏi (GPA: 3.65 / 4.0)',
              highlight: 'Giải Nhất Nghiên cứu Công nghệ Sinh viên FPT Edu.'
            }
          ],
          certifications: [
            { id: 1, name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2023', code: 'AWS-SAA: 894102' }
          ],
          languages: [
            { name: 'Tiếng Việt', level: 'Bản ngữ', score: 'Bản ngữ' },
            { name: 'Tiếng Anh', level: 'Lưu loát công việc', score: 'B2 / Professional' }
          ],
          skills: [
            { category: 'Quản Trị Đội Ngũ & Agile', items: ['Squad Leadership (6 Kỹ sư)', 'Sprint Planning & Agile Scrum', 'Code Review Quy Chuẩn', 'Mentoring'] },
            { category: 'Kiến Trúc & Tối Ưu Hạ Tầng', items: ['Tối Ưu Chi Phí AWS (Giảm 40%)', 'SLA 99.99%', 'Clean Architecture', 'CI/CD Automation'] }
          ],
          experiences: [
            {
              id: 1,
              role: 'Technical Squad Lead',
              company: 'FPT Software Corporation',
              period: '06/2023 — Hiện tại',
              location: 'TP. Hồ Chí Minh • Toàn thời gian',
              bullets: [
                'Trực tiếp quản lý và phân công công việc cho 6 kỹ sư backend; chuẩn hóa quy trình review code và giảm 50% lỗi phát sinh trên môi trường Production.',
                'Tiết kiệm 40% chi phí vận hành hạ tầng AWS hàng tháng thông qua việc tối ưu hóa kiến trúc bộ nhớ và ảo hóa CPU.'
              ],
              tags: ['Squad Lead', 'AWS Cost', 'Agile', 'Mentoring']
            }
          ],
          projects: [
            {
              id: 1,
              name: 'Quy Chuẩn Hóa Kiến Trúc Microservices Khối Doanh Nghiệp',
              role: 'Lead Architect',
              period: '2024',
              summary: 'Ban hành bộ khung mẫu Archetype Spring Boot 3 chuẩn cho 5 dự án toàn đơn vị.',
              tags: ['Architecture', 'Best Practices']
            }
          ]
        }
      ]
    }
  };

  // State: Currently selected candidate account (Default: 'thaomy')
  const [currentAccountKey, setCurrentAccountKey] = useState('thaomy');
  const currentCandidate = candidateDatabase[currentAccountKey] || candidateDatabase.thaomy;

  // State: Currently selected CV version ID (Default: first version of the candidate)
  const [selectedVersionId, setSelectedVersionId] = useState(currentCandidate.cvVersions[0].id);

  // Mutable Master CV Data (Bound to current active CV version)
  const currentVersionData = currentCandidate.cvVersions.find(v => v.id === selectedVersionId) || currentCandidate.cvVersions[0];
  const [cvData, setCvData] = useState(() => JSON.parse(JSON.stringify(currentVersionData)));

  // State for skill inputs
  const [skillCategoryInputs, setSkillCategoryInputs] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [isRewritingBio, setIsRewritingBio] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Switch between CV versions OF THE SAME PERSON
  const handleSelectCvVersion = (verId) => {
    setSelectedVersionId(verId);
    const targetVer = currentCandidate.cvVersions.find(v => v.id === verId) || currentCandidate.cvVersions[0];
    setCvData(JSON.parse(JSON.stringify(targetVer)));
    showToast(`Đã chuyển sang: ${targetVer.versionName}`);
  };

  // Switch Candidate Account (for demo testing)
  const handleSwitchCandidateAccount = (accKey) => {
    setCurrentAccountKey(accKey);
    const newAcc = candidateDatabase[accKey];
    const firstVer = newAcc.cvVersions[0];
    setSelectedVersionId(firstVer.id);
    setCvData(JSON.parse(JSON.stringify(firstVer)));
    showToast(`Đã chuyển sang tài khoản ứng viên: ${newAcc.accountName} (${newAcc.accountIndustry})`);
  };

  // Set default CV for fast apply
  const handleSetDefaultCvVersion = (verId) => {
    currentCandidate.cvVersions.forEach(v => {
      v.isDefault = (v.id === verId);
    });
    showToast('Đã đặt bản CV này làm bản mặc định khi nộp hồ sơ Fast Apply!');
  };

  // Duplicate current CV version
  const handleDuplicateCurrentCv = () => {
    const newId = `cv_custom_${Date.now()}`;
    const duplicated = {
      ...JSON.parse(JSON.stringify(cvData)),
      id: newId,
      versionName: `${cvData.versionName || 'Bản CV'} (Bản Sao)`,
      versionBadge: '📝 BẢN TÙY BIẾN MỚI',
      isDefault: false
    };
    currentCandidate.cvVersions.push(duplicated);
    setSelectedVersionId(newId);
    setCvData(duplicated);
    setIsEditing(true);
    showToast('🎉 Đã nhân bản thêm 1 phiên bản CV mới! Bạn có thể chỉnh sửa ngay.');
  };

  // Gemini AI Polish Summary
  const handleRewriteBioWithGemini = () => {
    setIsRewritingBio(true);
    showToast('Gemini AI đang tối ưu hóa từ khóa theo tiêu chuẩn ATS cho phiên bản này...');
    setTimeout(() => {
      let upgradedBio = '';
      if (selectedVersionId.includes('en')) {
        upgradedBio = 'Accomplished Senior Specialist with strong quantitative capabilities, holding prestigious international credentials and demonstrated impact across multimillion-dollar projects.\n\nProven track record in optimizing operational efficiencies by over 30%, automating reporting pipelines, and driving sustainable business growth under stringent governance standards.';
      } else {
        upgradedBio = 'Chuyên gia Cấp cao với bề dày kinh nghiệm thực chiến, sở hữu tư duy giải pháp định lượng sắc bén và các chứng chỉ chuyên môn quốc tế danh giá.\n\nThực chiến xuất sắc trong bài toán tối ưu hóa nguồn lực: Trực tiếp nâng cao hiệu suất dự án thêm 35%, tiết kiệm chi phí vận hành cho tổ chức và luôn hoàn thành xuất sắc các mục tiêu chiến lược do Ban Lãnh Đạo đề ra.';
      }
      setCvData(prev => ({ ...prev, summary: upgradedBio }));
      setIsRewritingBio(false);
      showToast('✨ Gemini AI đã nâng cấp bản tóm tắt đạt chuẩn ATS 100%!');
    }, 1100);
  };

  // Work Experience Edit Handlers
  const handleAddExperience = () => {
    const newExp = {
      id: Date.now(),
      role: 'Vị trí công tác mới',
      company: 'Tên Doanh Nghiệp / Tổ Chức',
      period: '2024 — Hiện tại',
      location: 'TP. Hồ Chí Minh • Toàn thời gian',
      bullets: [
        'Mô tả thành tựu chính hoặc dự án trọng điểm kèm số liệu đo lường cụ thể.',
        'Đạt hiệu quả tăng trưởng hoặc tiết kiệm chi phí cho doanh nghiệp.'
      ],
      tags: ['Kỹ năng 1', 'Kỹ năng 2']
    };
    setCvData(prev => ({
      ...prev,
      experiences: [newExp, ...prev.experiences]
    }));
    showToast('Đã thêm một vị trí kinh nghiệm mới! Bạn có thể sửa trực tiếp.');
  };

  const handleDeleteExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id)
    }));
    showToast('Đã xóa vị trí kinh nghiệm.');
  };

  const handleUpdateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const handleAddBullet = (expId) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => {
        if (exp.id === expId) {
          return { ...exp, bullets: [...exp.bullets, 'Thành tựu mới định lượng theo kết quả thực tế...'] };
        }
        return exp;
      })
    }));
  };

  const handleUpdateBullet = (expId, bulletIdx, value) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => {
        if (exp.id === expId) {
          const newBullets = [...exp.bullets];
          newBullets[bulletIdx] = value;
          return { ...exp, bullets: newBullets };
        }
        return exp;
      })
    }));
  };

  const handleDeleteBullet = (expId, bulletIdx) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => {
        if (exp.id === expId) {
          const newBullets = exp.bullets.filter((_, idx) => idx !== bulletIdx);
          return { ...exp, bullets: newBullets };
        }
        return exp;
      })
    }));
  };

  // Project Edit Handlers
  const handleAddProject = () => {
    const newProj = {
      id: Date.now(),
      name: 'Tên Dự Án Mới',
      role: 'Vai trò đảm nhiệm',
      period: '2024',
      summary: 'Tóm tắt giải pháp, đóng góp cá nhân và tác động cụ thể đến hoạt động kinh doanh.',
      tags: ['Công cụ 1', 'Công cụ 2']
    };
    setCvData(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));
    showToast('Đã thêm một dự án mới.');
  };

  const handleDeleteProject = (id) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
    showToast('Đã xóa dự án.');
  };

  const handleUpdateProject = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  // Skill Handlers
  const handleRemoveSkill = (categoryIndex, skillItem) => {
    setCvData(prev => {
      const newSkills = [...prev.skills];
      newSkills[categoryIndex] = {
        ...newSkills[categoryIndex],
        items: newSkills[categoryIndex].items.filter(item => item !== skillItem)
      };
      return { ...prev, skills: newSkills };
    });
  };

  const handleAddSkillToCategory = (categoryIndex) => {
    const inputVal = skillCategoryInputs[categoryIndex]?.trim();
    if (!inputVal) return;
    setCvData(prev => {
      const newSkills = [...prev.skills];
      newSkills[categoryIndex] = {
        ...newSkills[categoryIndex],
        items: [...newSkills[categoryIndex].items, inputVal]
      };
      return { ...prev, skills: newSkills };
    });
    setSkillCategoryInputs(prev => ({ ...prev, [categoryIndex]: '' }));
    showToast(`Đã thêm kỹ năng "${inputVal}"!`);
  };

  // CV Files State for ATS Vault Tab
  const [cvFiles, setCvFiles] = useState([
    {
      id: 1,
      name: 'CV_NguyenThaoMy_Chuan_2026.pdf',
      size: '1.2 MB',
      uploaded: 'Hôm nay',
      isDefault: true,
      atsScore: 99,
      parsed: true,
      targetIndustry: 'Tài chính & Đầu tư'
    },
    {
      id: 2,
      name: 'ThaoMy_Executive_English_Resume.pdf',
      size: '1.5 MB',
      uploaded: '3 ngày trước',
      isDefault: false,
      atsScore: 98,
      parsed: true,
      targetIndustry: 'Quỹ Đầu Tư & Global MNC'
    }
  ]);

  const handleUploadCv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(`Đang tải lên và phân tích ATS: ${file.name}...`);
    setTimeout(() => {
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploaded: 'Vừa xong',
        isDefault: false,
        atsScore: 97,
        parsed: true,
        targetIndustry: 'Đa ngành'
      };
      setCvFiles(prev => [newFile, ...prev]);
      showToast(`🎉 Tải lên thành công! AI đã phân tích hồ sơ đạt 97/100 Điểm ATS.`);
    }, 1200);
  };

  return (
    <div className="w-full bg-transparent font-sans text-botanical-forest min-h-screen pb-24 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-white/95 border border-botanical-stone text-botanical-forest text-xs font-semibold shadow-soft-xl flex items-center gap-2.5 backdrop-blur-xl animate-fadeIn">
          <span className="material-symbols-outlined text-base text-botanical-sage">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ========================================================= */}
        {/* 1. TOP EXECUTIVE STUDIO TOOLBAR                            */}
        {/* ========================================================= */}
        <div className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-5 sm:p-6 shadow-soft space-y-4 no-print">
          
          {/* Row 1: Candidate Account Indicator & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-botanical-stone">
            
            {/* Left: View Mode Tabs + Candidate Account Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-5 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'resume'
                    ? 'bg-botanical-forest text-white shadow-soft font-bold'
                    : 'bg-white text-botanical-forest/70 hover:text-botanical-forest border border-botanical-stone'
                }`}
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span>Bản CV Trực Tuyến</span>
              </button>

              <button
                onClick={() => setActiveTab('attachments')}
                className={`px-5 py-2.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'attachments'
                    ? 'bg-botanical-forest text-white shadow-soft font-bold'
                    : 'bg-white text-botanical-forest/70 hover:text-botanical-forest border border-botanical-stone'
                }`}
              >
                <span className="material-symbols-outlined text-base">folder_shared</span>
                <span>Kho Tệp &amp; Điểm ATS ({cvFiles.length})</span>
              </button>

              {/* Demo Candidate Switcher */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-botanical-stone text-xs">
                <span className="material-symbols-outlined text-sm text-botanical-forest">account_circle</span>
                <span className="text-[11px] text-botanical-forest/60">Ứng viên:</span>
                <select
                  value={currentAccountKey}
                  onChange={(e) => handleSwitchCandidateAccount(e.target.value)}
                  className="bg-transparent text-botanical-forest font-serif font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="thaomy" className="bg-white text-botanical-forest">Nguyễn Thảo My (Tài Chính)</option>
                  <option value="baolong" className="bg-white text-botanical-forest">Trần Bảo Long (Công Nghệ)</option>
                </select>
              </div>
            </div>

            {/* Right: Quick Actions (Edit Mode, Print PDF, Duplicate, AI Polish) */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* PRIMARY TOGGLE: EDIT MODE VS VIEW MODE */}
              <button
                onClick={() => {
                  const nextState = !isEditing;
                  setIsEditing(nextState);
                  showToast(nextState ? '✏️ Đã bật Chế độ Chỉnh sửa trực tiếp!' : '💾 Đã lưu và chuyển sang Chế độ Xem Bản Chuẩn!');
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-soft ${
                  isEditing
                    ? 'bg-botanical-terracotta/20 text-botanical-terracotta border border-botanical-terracotta/40 ring-2 ring-botanical-terracotta/20 animate-pulse'
                    : 'btn-botanical-secondary !rounded-full !text-xs !py-2 !px-4'
                }`}
                title="Bấm để chỉnh sửa trực tiếp từng dòng trên CV hoặc xem thành phẩm"
              >
                <span className="material-symbols-outlined text-base">
                  {isEditing ? 'check_circle' : 'edit_document'}
                </span>
                <span>{isEditing ? 'LƯU & XONG (SAVE)' : 'SỬA CV TRỰC TIẾP'}</span>
              </button>

              {/* Duplicate CV Version */}
              <button
                onClick={handleDuplicateCurrentCv}
                className="btn-botanical-secondary !rounded-full !text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-soft cursor-pointer"
                title="Tạo thêm 1 bản sao CV để tùy chỉnh riêng cho công ty khác"
              >
                <span className="material-symbols-outlined text-base text-botanical-sage">content_copy</span>
                <span>Nhân Bản CV</span>
              </button>

              {/* Print / Export PDF A4 */}
              <button
                onClick={() => {
                  showToast('Đang chuẩn bị trang in định dạng PDF chuẩn A4 sắc nét...');
                  setTimeout(() => window.print(), 400);
                }}
                className="btn-botanical-secondary !rounded-full !text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-soft cursor-pointer"
                title="In hoặc xuất bản CV ra file PDF A4 sắc nét"
              >
                <span className="material-symbols-outlined text-base">print</span>
                <span>In / Xuất PDF</span>
              </button>

              {/* Gemini AI Optimization */}
              <button
                onClick={handleRewriteBioWithGemini}
                disabled={isRewritingBio}
                className="btn-botanical-primary !rounded-full !text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-soft cursor-pointer disabled:opacity-50"
                title="Nhờ AI tinh chỉnh từ khóa tối ưu điểm ATS"
              >
                <span className="material-symbols-outlined text-base animate-pulse">auto_awesome</span>
                <span>{isRewritingBio ? 'Đang Nâng Cấp...' : 'AI Tinh Chỉnh ATS'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: CV VERSIONS SELECTOR OF THE SAME CANDIDATE */}
          {activeTab === 'resume' && (
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
              
              {/* CV Versions List */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-botanical-forest/70 uppercase tracking-wider font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-botanical-sage">folder_special</span>
                  <span>Các Phiên Bản CV Của {currentCandidate.accountName}:</span>
                </span>
                
                {currentCandidate.cvVersions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => handleSelectCvVersion(ver.id)}
                    className={`px-4 py-2 rounded-full font-medium transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                      selectedVersionId === ver.id
                        ? 'bg-botanical-forest text-white shadow-soft font-bold'
                        : 'bg-white text-botanical-forest/70 hover:text-botanical-forest border border-botanical-stone'
                    }`}
                  >
                    <span>{ver.versionName}</span>
                    {ver.isDefault && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bản mặc định Fast Apply"></span>
                    )}
                  </button>
                ))}

                {/* Make default button */}
                <button
                  onClick={() => handleSetDefaultCvVersion(selectedVersionId)}
                  className="px-3 py-1.5 rounded-full bg-botanical-cream hover:bg-white text-botanical-forest/70 hover:text-botanical-forest border border-botanical-stone text-[11px] font-medium cursor-pointer flex items-center gap-1"
                  title="Đặt phiên bản này làm CV mặc định khi ứng tuyển Fast Apply"
                >
                  <span className="material-symbols-outlined text-xs">star</span>
                  <span>Đặt Mặc Định</span>
                </button>
              </div>

              {/* Canvas Style Switcher (Living Glass vs Paper White, Templates) */}
              <div className="flex items-center gap-3 flex-wrap">
                
                {/* Canvas Aesthetics */}
                <div className="flex items-center bg-[#FAF9F5] p-1 rounded-full border border-botanical-stone">
                  <button
                    onClick={() => setCanvasTheme('living-glass')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      canvasTheme === 'living-glass'
                        ? 'bg-botanical-forest text-white shadow-soft font-bold'
                        : 'text-botanical-forest/60 hover:text-botanical-forest'
                    }`}
                    title="Giao diện kính mờ cao cấp hợp tông 100% với hình nền sống của dự án"
                  >
                    <span className="w-2 h-2 rounded-full mr-1 bg-botanical-sage"></span>
                    <span>🌿 Chuẩn Botanical</span>
                  </button>

                  <button
                    onClick={() => setCanvasTheme('paper-white')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      canvasTheme === 'paper-white'
                        ? 'bg-white text-botanical-forest shadow-soft font-bold'
                        : 'text-botanical-forest/60 hover:text-botanical-forest'
                    }`}
                    title="Xem trước định dạng giấy trắng A4 trước khi in ấn"
                  >
                    <span>📄 Giấy Trắng A4</span>
                  </button>
                </div>

                {/* Template Layout Switcher */}
                <div className="flex items-center bg-[#FAF9F5] p-1 rounded-full border border-botanical-stone">
                  {[
                    { id: 'executive', label: '2 Cột Chuẩn' },
                    { id: 'harvard', label: 'Harvard ATS' },
                    { id: 'modern', label: 'Hiện Đại' }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setCvTemplate(tpl.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        cvTemplate === tpl.id 
                          ? 'bg-botanical-forest text-white shadow-soft font-bold' 
                          : 'text-botanical-forest/60 hover:text-botanical-forest'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

              </div>

            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* EDIT MODE PROMPT BANNER                                    */}
        {/* ========================================================= */}
        {isEditing && (
          <div className="p-5 rounded-3xl bg-botanical-sage/15 border border-botanical-sage/30 flex flex-wrap items-center justify-between gap-4 text-botanical-forest text-xs shadow-soft animate-fadeIn no-print font-sans">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-botanical-forest text-2xl">edit_note</span>
              <div>
                <strong className="text-botanical-forest block font-serif font-bold text-sm">CHẾ ĐỘ CHỈNH SỬA TRỰC TIẾP ({cvData.versionName})</strong>
                <span className="text-botanical-forest/75 text-xs">
                  Bạn đang sửa trực tiếp bản CV của <strong>{currentCandidate.accountName}</strong>. Nhập nội dung vào các ô bên dưới rồi nhấn <strong>"LƯU &amp; XONG"</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAddExperience}
                className="btn-botanical-secondary !text-xs !py-2 !px-4 cursor-pointer shadow-soft"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Thêm Kinh Nghiệm</span>
              </button>

              <button
                onClick={handleAddProject}
                className="btn-botanical-secondary !text-xs !py-2 !px-4 cursor-pointer shadow-soft"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Thêm Dự Án</span>
              </button>

              <button
                onClick={() => {
                  setIsEditing(false);
                  showToast('🎉 Đã lưu toàn bộ nội dung CV thành công!');
                }}
                className="btn-botanical-primary !text-xs !py-2 !px-5 shadow-soft cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: AUTHENTIC RESUME CANVAS                           */}
        {/* ========================================================= */}
        {activeTab === 'resume' && (
          <div className="space-y-4">
            
            {/* Top Sub-bar: ATS Verification Badge */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white/95 border border-botanical-stone text-xs text-botanical-forest shadow-soft font-sans">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-botanical-sage"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-botanical-forest"></span>
                </span>
                <span className="text-botanical-forest/80 font-sans">
                  ỨNG VIÊN: <strong className="text-botanical-forest font-serif">{currentCandidate.accountName}</strong> — {cvData.versionName}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-sans">
                <span className="text-botanical-forest/70">
                  Tương thích ATS: <strong className="font-bold text-botanical-forest">99/100 (Xuất sắc)</strong>
                </span>
                <span className="text-botanical-stone">•</span>
                <span className="text-botanical-forest/70">
                  Tông màu: <strong className="font-bold text-botanical-forest">Botanical Organic</strong>
                </span>
                <span className="text-botanical-stone">•</span>
                <span className="text-botanical-forest/70">
                  Khổ in: <strong className="text-botanical-forest font-bold">A4 Sắc Nét</strong>
                </span>
              </div>
            </div>

            {/* THE MASTER CV SHEET */}
            <div
              className={`cv-document-sheet max-w-4xl mx-auto rounded-3xl transition-all duration-300 overflow-hidden shadow-soft-xl ${
                canvasTheme === 'paper-white'
                  ? 'bg-[#ffffff] text-slate-800 border border-slate-300'
                  : 'card-botanical bg-white/95 border border-botanical-stone text-botanical-forest'
              }`}
              style={{ minHeight: '1130px' }}
            >

              {/* ──────────────────────────────────────────────────────── */}
              {/* TEMPLATE A: EXECUTIVE 2 CỘT (2-COLUMN BALANCED)          */}
              {/* ──────────────────────────────────────────────────────── */}
              {cvTemplate === 'executive' && (
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-full">
                  
                  {/* LEFT COLUMN: SIDEBAR (34% / 4 COLS) */}
                  <aside className={`md:col-span-4 p-6 sm:p-7 space-y-6 ${
                    canvasTheme === 'paper-white'
                      ? 'bg-[#f8fafc] border-r border-slate-200 text-slate-800'
                      : 'bg-[#FAF9F5] border-r border-botanical-stone text-botanical-forest'
                  }`}>
                    
                    {/* Portrait & Candidate Name */}
                    <div className="text-center space-y-3 pb-2">
                      <div className="relative inline-block">
                        <img
                          src={currentCandidate.avatarUrl}
                          alt={currentCandidate.accountName}
                          className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-soft mx-auto border-2 border-botanical-stone"
                        />
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow" title="Đang sẵn sàng nhận việc"></span>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-lg font-serif font-bold text-botanical-forest">
                          {currentCandidate.accountName}
                        </h2>

                        {isEditing ? (
                          <div className="space-y-1 pt-1">
                            <input
                              type="text"
                              value={cvData.targetTitle}
                              onChange={(e) => setCvData({ ...cvData, targetTitle: e.target.value })}
                              className="w-full text-center text-xs bg-white border border-botanical-stone rounded-xl p-2 text-botanical-forest font-bold focus:border-botanical-sage focus:ring-2 focus:ring-botanical-sage/20 font-sans"
                              placeholder="Chức danh mục tiêu của bản CV này"
                            />
                          </div>
                        ) : (
                          <p className="text-xs font-serif font-bold leading-snug text-botanical-terracotta">
                            {cvData.targetTitle}
                          </p>
                        )}

                        <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-sans font-medium bg-botanical-sage/20 text-botanical-forest border border-botanical-sage/30">
                          SẴN SÀNG NHẬN VIỆC
                        </span>
                      </div>
                    </div>

                    {/* Section: Thông Tin Liên Hệ (CỦA CÙNG 1 NGƯỜI) */}
                    <div className="space-y-3 pt-2">
                      <h3 className={`text-xs font-headline font-black uppercase tracking-wider pb-1 border-b flex items-center gap-1.5 ${
                        canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#E6E2DA]'
                      }`}>
                        <span className="material-symbols-outlined text-sm" style={{ color: livingTheme.primary }}>contact_phone</span>
                        <span>Thông Tin Liên Hệ</span>
                      </h3>
                      
                      <div className={`space-y-2.5 text-xs ${canvasTheme === 'paper-white' ? 'text-slate-800' : 'text-[#2D3A31]/90'}`}>
                        <div className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-sm text-slate-500 mt-0.5 shrink-0">mail</span>
                          <span className="break-all font-medium">{currentCandidate.email}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">call</span>
                          <span className="font-medium">{currentCandidate.phone}</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-sm text-slate-500 mt-0.5 shrink-0">location_on</span>
                          <span className="font-medium">{currentCandidate.location}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">cake</span>
                          <span className="font-medium">{currentCandidate.dob}</span>
                        </div>
                        <div className="flex items-center gap-2.5 pt-1">
                          <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">link</span>
                          <span className="font-medium truncate hover:underline" style={{ color: livingTheme.primary }}>{currentCandidate.linkedin}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">language</span>
                          <span className="font-medium truncate hover:underline" style={{ color: livingTheme.primary }}>{currentCandidate.portfolio}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section: Học Vấn Chính Quy */}
                    <div className="space-y-3">
                      <h3 className={`text-xs font-headline font-black uppercase tracking-wider pb-1 border-b flex items-center gap-1.5 ${
                        canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#E6E2DA]'
                      }`}>
                        <span className="material-symbols-outlined text-sm" style={{ color: livingTheme.primary }}>school</span>
                        <span>Học Vấn Chính Quy</span>
                      </h3>

                      {cvData.education.map((edu, eIdx) => (
                        <div key={edu.id || eIdx} className="space-y-1.5 text-xs">
                          {isEditing ? (
                            <div className="space-y-1.5 p-2 rounded-xl bg-white border border-[#CBD5E1] shadow-sm">
                              <input
                                type="text"
                                value={edu.school}
                                onChange={(e) => {
                                  const newEdu = [...cvData.education];
                                  newEdu[eIdx].school = e.target.value;
                                  setCvData({ ...cvData, education: newEdu });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-bold text-slate-900 text-xs"
                                placeholder="Tên trường học"
                              />
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => {
                                  const newEdu = [...cvData.education];
                                  newEdu[eIdx].degree = e.target.value;
                                  setCvData({ ...cvData, education: newEdu });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-slate-800 text-xs"
                                placeholder="Chuyên ngành / Bằng cấp"
                              />
                              <div className="grid grid-cols-2 gap-1.5">
                                <input
                                  type="text"
                                  value={edu.grade}
                                  onChange={(e) => {
                                    const newEdu = [...cvData.education];
                                    newEdu[eIdx].grade = e.target.value;
                                    setCvData({ ...cvData, education: newEdu });
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded p-1 text-emerald-700 text-xs font-mono font-bold"
                                  placeholder="Loại tốt nghiệp / GPA"
                                />
                                <input
                                  type="text"
                                  value={edu.period}
                                  onChange={(e) => {
                                    const newEdu = [...cvData.education];
                                    newEdu[eIdx].period = e.target.value;
                                    setCvData({ ...cvData, education: newEdu });
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-600 text-xs font-mono"
                                  placeholder="Niên khóa"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className={`font-headline font-bold leading-snug ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                                {edu.school}
                              </h4>
                              <p className={`font-medium ${canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A554D]'}`}>{edu.degree}</p>
                              <p className="text-[11px] font-mono font-bold text-emerald-700">{edu.grade}</p>
                              <p className={`text-[10px] font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{edu.period}</p>
                              <p className={`text-[11px] italic pt-1 leading-snug ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{edu.highlight}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Section: Chứng Chỉ Chuyên Nghiệp */}
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between pb-1 border-b ${
                        canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                      }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                        }`}>
                          <span className="material-symbols-outlined text-sm" style={{ color: livingTheme.primary }}>workspace_premium</span>
                          <span>Chứng Chỉ Quốc Tế</span>
                        </h3>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newCert = {
                                id: Date.now(),
                                name: 'Tên chứng chỉ mới',
                                issuer: 'Đơn vị cấp',
                                year: '2024',
                                code: 'Mã chứng chỉ'
                              };
                              setCvData({ ...cvData, certifications: [...cvData.certifications, newCert] });
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                          >
                            + Thêm
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {cvData.certifications.map((cert, cIdx) => (
                          <div
                            key={cert.id || cIdx}
                            className={`p-2.5 rounded-xl border text-xs space-y-0.5 relative group ${
                              canvasTheme === 'paper-white' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/80 border-[#E6E2DA] shadow-sm'
                            }`}
                          >
                            {isEditing && (
                              <button
                                onClick={() => {
                                  setCvData({
                                    ...cvData,
                                    certifications: cvData.certifications.filter((_, idx) => idx !== cIdx)
                                  });
                                }}
                                className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Xóa chứng chỉ"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            )}

                            {isEditing ? (
                              <div className="space-y-1 pr-5">
                                <input
                                  type="text"
                                  value={cert.name}
                                  onChange={(e) => {
                                    const nextCerts = [...cvData.certifications];
                                    nextCerts[cIdx].name = e.target.value;
                                    setCvData({ ...cvData, certifications: nextCerts });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-slate-900 text-xs font-bold"
                                  placeholder="Tên chứng chỉ"
                                />
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="text"
                                    value={cert.issuer}
                                    onChange={(e) => {
                                      const nextCerts = [...cvData.certifications];
                                      nextCerts[cIdx].issuer = e.target.value;
                                      setCvData({ ...cvData, certifications: nextCerts });
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700 text-[10px]"
                                    placeholder="Đơn vị cấp"
                                  />
                                  <input
                                    type="text"
                                    value={cert.year}
                                    onChange={(e) => {
                                      const nextCerts = [...cvData.certifications];
                                      nextCerts[cIdx].year = e.target.value;
                                      setCvData({ ...cvData, certifications: nextCerts });
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700 text-[10px]"
                                    placeholder="Năm cấp"
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <h4 className={`font-headline font-bold text-[11px] leading-snug ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                                  {cert.name}
                                </h4>
                                <p className={`text-[10px] font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{cert.issuer} • {cert.year}</p>
                                <p className="text-[10px] font-mono font-semibold truncate" style={{ color: livingTheme.primary }}>{cert.code}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section: Ngoại Ngữ */}
                    <div className="space-y-3">
                      <h3 className={`text-xs font-headline font-black uppercase tracking-wider pb-1 border-b flex items-center gap-1.5 ${
                        canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#E6E2DA]'
                      }`}>
                        <span className="material-symbols-outlined text-sm" style={{ color: livingTheme.primary }}>translate</span>
                        <span>Ngoại Ngữ Thành Thạo</span>
                      </h3>

                      <div className="space-y-2 text-xs">
                        {cvData.languages.map((lang, lIdx) => (
                          <div key={lIdx} className="flex items-center justify-between border-b border-dashed border-[#E6E2DA] pb-1">
                            <span className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{lang.name}</span>
                            <span className={`text-[10px] font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{lang.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </aside>

                  {/* RIGHT COLUMN: MAIN CONTENT (66% / 8 COLS) */}
                  <main className={`md:col-span-8 p-6 sm:p-9 space-y-7 ${canvasTheme === 'paper-white' ? 'bg-white' : 'bg-[#FCFBF8]'}`}>
                    
                    {/* 1. Header Banner & Title */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h1 className={`text-2xl sm:text-4xl font-headline font-black uppercase tracking-tight ${
                          canvasTheme === 'paper-white' ? 'text-slate-950' : 'text-[#2D3A31]'
                        }`}>
                          {currentCandidate.accountName}
                        </h1>
                        <span className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border ${
                          canvasTheme === 'paper-white' ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#FAF9F5] text-[#2D3A31] border-[#E6E2DA]'
                        }`}>
                          {cvData.versionBadge || 'EXECUTIVE RESUME'}
                        </span>
                      </div>

                      <p className="text-base sm:text-lg font-headline font-bold tracking-wide" style={{ color: livingTheme.primary }}>
                        {cvData.targetTitle}
                      </p>

                      <div className="h-1 w-24 rounded-full" style={{ backgroundColor: livingTheme.primary }}></div>

                      {isEditing ? (
                        <div className="pt-2">
                          <label className="text-[10px] font-mono text-slate-500 block mb-1">Tagline định vị bản thân:</label>
                          <textarea
                            rows={2}
                            value={cvData.tagline}
                            onChange={(e) => setCvData({ ...cvData, tagline: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                      ) : (
                        <p className={`text-xs leading-relaxed pt-1 font-medium ${canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A554D]'}`}>
                          {cvData.tagline}
                        </p>
                      )}
                    </div>

                    {/* 2. Executive Summary (Tóm tắt năng lực cốt lõi) */}
                    <section className="space-y-2.5">
                      <div className={`flex items-center justify-between pb-1 border-b ${
                        canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                      }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${
                          canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                        }`}>
                          <span className="material-symbols-outlined text-base" style={{ color: livingTheme.primary }}>badge</span>
                          <span>Tóm Tắt Năng Lực Cốt Lõi (Executive Summary)</span>
                        </h3>
                        {isEditing && (
                          <button
                            onClick={handleRewriteBioWithGemini}
                            disabled={isRewritingBio}
                            className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs animate-pulse">auto_awesome</span>
                            <span>AI Tối Ưu Nhanh</span>
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-1.5">
                          <textarea
                            rows={4}
                            value={cvData.summary}
                            onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-relaxed text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                            placeholder="Nhập phần tóm tắt năng lực, số năm kinh nghiệm và điểm mạnh cốt lõi..."
                          />
                          <p className="text-[10px] text-slate-500 text-right font-mono">
                            Độ dài: {cvData.summary.length} ký tự • Tối ưu chuẩn ATS
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2.5 shadow-sm ${
                          canvasTheme === 'paper-white'
                            ? 'bg-slate-50 border-l-4 border-slate-900 text-slate-800 border border-slate-200'
                            : 'bg-[#F2EFE9] border-l-4 border-[#2D3A31] text-[#2D3A31] border border-[#E6E2DA]'
                        }`}>
                          {cvData.summary.split('\n\n').map((para, pIdx) => (
                            <p key={pIdx} className="leading-relaxed font-medium">{para}</p>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* 3. Work Experience (Kinh nghiệm làm việc thực chiến) */}
                    <section className="space-y-5">
                      <div className={`flex items-center justify-between pb-1 border-b ${
                        canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                      }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${
                          canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                        }`}>
                          <span className="material-symbols-outlined text-base" style={{ color: livingTheme.primary }}>history_edu</span>
                          <span>Kinh Nghiệm Làm Việc (Work Experience)</span>
                        </h3>
                        {isEditing && (
                          <button
                            onClick={handleAddExperience}
                            className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Thêm vị trí mới</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-6">
                        {cvData.experiences.map((exp, expIdx) => (
                          <div
                            key={exp.id || expIdx}
                            className={`space-y-2.5 ${isEditing ? 'p-3 rounded-2xl bg-white border border-slate-300 shadow-sm relative' : ''}`}
                          >
                            {isEditing && (
                              <button
                                onClick={() => handleDeleteExperience(exp.id)}
                                className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 cursor-pointer flex items-center gap-1 text-xs"
                                title="Xóa toàn bộ vị trí này"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                <span>Xóa vị trí</span>
                              </button>
                            )}

                            {/* Role & Company Header */}
                            {isEditing ? (
                              <div className="space-y-2 pr-20">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-500 block font-mono">Chức danh / Vị trí:</label>
                                    <input
                                      type="text"
                                      value={exp.role}
                                      onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-bold text-slate-900 text-xs"
                                      placeholder="Chức danh"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 block font-mono">Tên Công ty / Tổ chức:</label>
                                    <input
                                      type="text"
                                      value={exp.company}
                                      onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-emerald-800 font-semibold text-xs"
                                      placeholder="Công ty"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={exp.period}
                                    onChange={(e) => handleUpdateExperience(exp.id, 'period', e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700 text-xs font-mono"
                                    placeholder="Thời gian làm việc"
                                  />
                                  <input
                                    type="text"
                                    value={exp.location}
                                    onChange={(e) => handleUpdateExperience(exp.id, 'location', e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700 text-xs"
                                    placeholder="Địa điểm & Loại hình"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                                <div>
                                  <h4 className={`text-base font-headline font-bold ${
                                    canvasTheme === 'paper-white' ? 'text-slate-950' : 'text-[#2D3A31]'
                                  }`}>
                                    {exp.role}
                                  </h4>
                                  <p className="text-sm font-semibold" style={{ color: livingTheme.primary }}>
                                    {exp.company}
                                  </p>
                                </div>
                                <div className="text-xs font-mono sm:text-right">
                                  <span className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-800' : 'text-[#2D3A31]'}`}>{exp.period}</span>
                                  <span className={`block text-[10px] ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.location}</span>
                                </div>
                              </div>
                            )}

                            {/* Bullets with quantifiable results */}
                            <div className="space-y-1.5 pt-1">
                              {isEditing && (
                                <span className="text-[11px] font-mono text-emerald-800 block">
                                  Thành tựu chính (Phương pháp STAR - Kết quả định lượng):
                                </span>
                              )}
                              
                              {exp.bullets.map((b, bIdx) => (
                                <div key={bIdx} className="flex items-start gap-2">
                                  {isEditing ? (
                                    <>
                                      <textarea
                                        rows={2}
                                        value={b}
                                        onChange={(e) => handleUpdateBullet(exp.id, bIdx, e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-medium"
                                      />
                                      <button
                                        onClick={() => handleDeleteBullet(exp.id, bIdx)}
                                        className="text-rose-500 hover:text-rose-700 pt-1 cursor-pointer shrink-0"
                                        title="Xóa gạch đầu dòng này"
                                      >
                                        <span className="material-symbols-outlined text-sm">remove_circle</span>
                                      </button>
                                    </>
                                  ) : (
                                    <div className={`flex items-start gap-2 text-xs sm:text-sm leading-relaxed ${
                                      canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#334155] font-medium'
                                    }`}>
                                      <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: livingTheme.primary }}></span>
                                      <span>{b}</span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {isEditing && (
                                <button
                                  onClick={() => handleAddBullet(exp.id)}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold pt-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xs">add</span>
                                  <span>Thêm gạch đầu dòng</span>
                                </button>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                              {exp.tags.map((t, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                                    canvasTheme === 'paper-white'
                                      ? 'bg-slate-100 text-slate-800 border border-slate-300 font-semibold'
                                      : 'bg-white text-[#2D3A31] border border-[#E6E2DA] font-semibold'
                                  }`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 4. Key Projects (Dự án tiêu biểu) */}
                    <section className="space-y-3.5">
                      <div className={`flex items-center justify-between pb-1 border-b ${
                        canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                      }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${
                          canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                        }`}>
                          <span className="material-symbols-outlined text-base" style={{ color: livingTheme.primary }}>rocket_launch</span>
                          <span>Dự Án Trọng Điểm (Key Projects)</span>
                        </h3>
                        {isEditing && (
                          <button
                            onClick={handleAddProject}
                            className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Thêm dự án mới</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {cvData.projects.map((proj, pIdx) => (
                          <div
                            key={proj.id || pIdx}
                            className={`p-4 rounded-2xl border space-y-2 relative ${
                              canvasTheme === 'paper-white'
                                ? 'bg-slate-50 border-slate-300 shadow-sm'
                                : 'bg-white border-[#E6E2DA] shadow-sm'
                            }`}
                          >
                            {isEditing && (
                              <button
                                onClick={() => handleDeleteProject(proj.id)}
                                className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Xóa dự án này"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}

                            {isEditing ? (
                              <div className="space-y-1.5 pr-5">
                                <input
                                  type="text"
                                  value={proj.name}
                                  onChange={(e) => handleUpdateProject(proj.id, 'name', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 font-bold text-slate-900 text-xs"
                                  placeholder="Tên dự án"
                                />
                                <div className="grid grid-cols-2 gap-1">
                                  <input
                                    type="text"
                                    value={proj.role}
                                    onChange={(e) => handleUpdateProject(proj.id, 'role', e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-emerald-800 text-xs font-semibold"
                                    placeholder="Vai trò"
                                  />
                                  <input
                                    type="text"
                                    value={proj.period}
                                    onChange={(e) => handleUpdateProject(proj.id, 'period', e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700 text-xs font-mono"
                                    placeholder="Năm thực hiện"
                                  />
                                </div>
                                <textarea
                                  rows={2}
                                  value={proj.summary}
                                  onChange={(e) => handleUpdateProject(proj.id, 'summary', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-xs text-slate-800 font-medium"
                                  placeholder="Tóm tắt dự án và kết quả đạt được..."
                                />
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`font-headline font-bold text-sm ${
                                    canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                                  }`}>
                                    {proj.name}
                                  </h4>
                                  <span className={`text-[10px] font-mono shrink-0 ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{proj.period}</span>
                                </div>
                                <p className="text-xs font-semibold" style={{ color: livingTheme.primary }}>{proj.role}</p>
                                <p className={`text-xs leading-relaxed font-body ${canvasTheme === 'paper-white' ? 'text-slate-700 font-medium' : 'text-[#4A554D] font-medium'}`}>{proj.summary}</p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {proj.tags.map((t, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                        canvasTheme === 'paper-white' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-[#FAF9F5] border border-[#E6E2DA] text-[#2D3A31]'
                                      }`}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 5. Technical & Core Skills Matrix */}
                    <section className="space-y-3">
                      <div className={`flex items-center justify-between pb-1 border-b ${
                        canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                      }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${
                          canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                        }`}>
                          <span className="material-symbols-outlined text-base" style={{ color: livingTheme.primary }}>psychology</span>
                          <span>Ma Trận Năng Lực Chuyên Môn (Skills Matrix)</span>
                        </h3>
                        {isEditing && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Bấm [x] để xóa kỹ năng hoặc nhập thêm bên dưới
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5 text-xs sm:text-sm">
                        {cvData.skills.map((cat, catIdx) => (
                          <div
                            key={catIdx}
                            className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 transition-all ${
                              canvasTheme === 'paper-white' ? 'bg-slate-50 border-slate-300' : 'bg-white border-[#E6E2DA] shadow-sm'
                            }`}
                          >
                            <span className={`w-48 shrink-0 font-bold font-headline flex items-center gap-1.5 pt-0.5 ${
                              canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: livingTheme.primary }}></span>
                              {cat.category}:
                            </span>

                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {cat.items.map((item, iIdx) => (
                                  <span
                                    key={iIdx}
                                    className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 ${
                                      canvasTheme === 'paper-white'
                                        ? 'bg-white text-slate-800 border border-slate-300 shadow-sm font-semibold'
                                        : 'bg-[#FAF9F5] text-[#2D3A31] border border-[#E6E2DA] shadow-sm font-semibold'
                                    }`}
                                  >
                                    <span>{item}</span>
                                    {isEditing && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(catIdx, item)}
                                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                        title="Xóa kỹ năng này"
                                      >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                      </button>
                                    )}
                                  </span>
                                ))}
                              </div>

                              {isEditing && (
                                <div className="flex items-center gap-1.5 pt-1">
                                  <input
                                    type="text"
                                    value={skillCategoryInputs[catIdx] || ''}
                                    onChange={(e) => setSkillCategoryInputs({ ...skillCategoryInputs, [catIdx]: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSkillToCategory(catIdx);
                                      }
                                    }}
                                    placeholder="Gõ tên kỹ năng mới & Enter..."
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddSkillToCategory(catIdx)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white cursor-pointer"
                                  >
                                    + Thêm
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                  </main>

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TEMPLATE B: HARVARD CLASSIC ATS 100% (1-COLUMN)          */}
              {/* ──────────────────────────────────────────────────────── */}
              {cvTemplate === 'harvard' && (
                <div className={`p-8 sm:p-12 space-y-6 ${canvasTheme === 'paper-white' ? 'bg-white text-slate-850' : 'bg-[#FDFCF9] text-[#2D3A31]'}`}>
                  
                  {/* Top Centered Header */}
                  <div className={`text-center space-y-1.5 pb-4 border-b-2 ${canvasTheme === 'paper-white' ? 'border-slate-800' : 'border-[#2D3A31]'}`}>
                    <h1 className={`text-2xl sm:text-3xl font-serif font-black uppercase tracking-wider ${
                      canvasTheme === 'paper-white' ? 'text-slate-950' : 'text-[#1A2520]'
                    }`}>
                      {currentCandidate.accountName}
                    </h1>
                    <p className="text-sm font-semibold tracking-wide" style={{ color: livingTheme.primary }}>
                      {cvData.targetTitle}
                    </p>
                    <div className={`text-xs flex flex-wrap items-center justify-center gap-3 pt-1 font-mono ${
                      canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A5B4D]'
                    }`}>
                      <span>{currentCandidate.phone}</span>
                      <span>•</span>
                      <span>{currentCandidate.email}</span>
                      <span>•</span>
                      <span>{currentCandidate.location}</span>
                      <span>•</span>
                      <span>{currentCandidate.linkedin}</span>
                    </div>
                  </div>

                  {/* Harvard Section 1: Summary */}
                  <section className="space-y-2">
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${
                      canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                    }`}>
                      TÓM TẮT NĂNG LỰC (PROFESSIONAL SUMMARY)
                    </h2>
                    <p className={`text-xs leading-relaxed ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#4A5B4D] font-medium'}`}>{cvData.summary}</p>
                  </section>

                  {/* Harvard Section 2: Education */}
                  <section className="space-y-3">
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${
                      canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                    }`}>
                      HỌC VẤN (EDUCATION)
                    </h2>
                    {cvData.education.map((edu, eIdx) => (
                      <div key={edu.id || eIdx} className="text-xs space-y-0.5">
                        <div className={`flex justify-between font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                          <span>{edu.school}</span>
                          <span className={`font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{edu.period}</span>
                        </div>
                        <div className={`flex justify-between italic ${canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A5B4D]'}`}>
                          <span>{edu.degree}</span>
                          <span className="font-semibold not-italic text-emerald-600 dark:text-emerald-400">{edu.grade}</span>
                        </div>
                        <p className={`text-[11px] pt-0.5 ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{edu.highlight}</p>
                      </div>
                    ))}
                  </section>

                  {/* Harvard Section 3: Experience */}
                  <section className="space-y-4">
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${
                      canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                    }`}>
                      KINH NGHIỆM LÀM VIỆC (PROFESSIONAL EXPERIENCE)
                    </h2>
                    {cvData.experiences.map((exp, expIdx) => (
                      <div key={exp.id || expIdx} className="text-xs space-y-1">
                        <div className={`flex justify-between font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                          <span>{exp.company} — {exp.role}</span>
                          <span className={`font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.period}</span>
                        </div>
                        <p className={`text-[11px] italic ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.location}</p>
                        <ul className={`list-disc list-outside pl-4 space-y-1 ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#4A5B4D] font-medium'}`}>
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Harvard Section 4: Skills & Certifications */}
                  <section className="space-y-2.5">
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${
                      canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                    }`}>
                      KỸ NĂNG, CHỨNG CHỈ &amp; NGOẠI NGỮ (SKILLS &amp; CERTIFICATIONS)
                    </h2>
                    <div className={`text-xs space-y-1.5 ${canvasTheme === 'paper-white' ? 'text-slate-800' : 'text-[#4A5B4D]'}`}>
                      {cvData.skills.map((s, idx) => (
                        <p key={idx}>
                          <strong className={canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}>{s.category}:</strong> {s.items.join(', ')}
                        </p>
                      ))}
                      <p>
                        <strong className={canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}>Chứng chỉ quốc tế:</strong> {cvData.certifications.map(c => `${c.name} (${c.issuer})`).join('; ')}
                      </p>
                      <p>
                        <strong className={canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}>Ngoại ngữ:</strong> {cvData.languages.map(l => `${l.name} (${l.score})`).join('; ')}
                      </p>
                    </div>
                  </section>

                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TEMPLATE C: HIỆN ĐẠI SANG TRỌNG (MODERN EDITORIAL)        */}
              {/* ──────────────────────────────────────────────────────── */}
              {cvTemplate === 'modern' && (
                <div className={`p-6 sm:p-10 space-y-7 ${canvasTheme === 'paper-white' ? 'bg-white text-slate-800' : 'bg-[#FDFCF9] text-[#2D3A31]'}`}>
                  
                  {/* Modern Header Banner */}
                  <div className={`p-6 sm:p-8 rounded-3xl ${livingTheme.activeNavBg} text-white shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border ${livingTheme.border}`}>
                    <div className="space-y-2 text-center sm:text-left">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 uppercase tracking-widest">
                        {cvData.versionBadge || 'VERIFIED PROFESSIONAL'}
                      </span>
                      <h1 className="text-3xl sm:text-4xl font-headline font-black uppercase tracking-tight">
                        {currentCandidate.accountName}
                      </h1>
                      <p className="text-base sm:text-lg font-bold text-white/95">
                        {cvData.targetTitle}
                      </p>
                      <p className="text-xs text-white/80 max-w-xl leading-relaxed pt-1">
                        {cvData.tagline}
                      </p>
                    </div>

                    <img
                      src={currentCandidate.avatarUrl}
                      alt={currentCandidate.accountName}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/30 shadow-2xl shrink-0"
                    />
                  </div>

                  {/* Contact Band */}
                  <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-around gap-4 text-xs font-mono font-semibold ${
                    canvasTheme === 'paper-white' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#F2F0EB] border-[#C5C0B6] text-[#2D3A31]'
                  }`}>
                    <span>📧 {currentCandidate.email}</span>
                    <span>📞 {currentCandidate.phone}</span>
                    <span>📍 {currentCandidate.location}</span>
                    <span>🔗 {currentCandidate.linkedin}</span>
                  </div>

                  {/* 2-Column Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-7">
                    
                    {/* Left: Experience & Projects (8 Cols) */}
                    <div className="md:col-span-8 space-y-7">
                      <section className="space-y-4">
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${
                          canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                        }`}>
                          KINH NGHIỆM THỰC CHIẾN (EXPERIENCE)
                        </h3>
                        {cvData.experiences.map((exp, eIdx) => (
                          <div key={exp.id || eIdx} className="space-y-1.5 text-xs sm:text-sm">
                            <div className={`flex justify-between font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                              <span>{exp.role}</span>
                              <span className={`font-mono text-xs ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.period}</span>
                            </div>
                            <p className="font-semibold text-xs" style={{ color: livingTheme.primary }}>{exp.company} — {exp.location}</p>
                            <ul className={`list-disc list-outside pl-4 space-y-1 text-xs ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#4A5B4D] font-medium'}`}>
                              {exp.bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </section>

                      <section className="space-y-4">
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${
                          canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                        }`}>
                          DỰ ÁN TRỌNG ĐIỂM (KEY PROJECTS)
                        </h3>
                        {cvData.projects.map((p, pIdx) => (
                          <div key={p.id || pIdx} className={`p-3.5 rounded-2xl border space-y-1 text-xs ${
                            canvasTheme === 'paper-white' ? 'bg-slate-50 border-slate-300' : 'bg-[#F2F0EB] border-[#C5C0B6]'
                          }`}>
                            <h4 className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{p.name}</h4>
                            <p className={canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A5B4D]'}>{p.summary}</p>
                          </div>
                        ))}
                      </section>
                    </div>

                    {/* Right: Skills, Education, Certs (4 Cols) */}
                    <div className="md:col-span-4 space-y-6">
                      <section className="space-y-3">
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${
                          canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                        }`}>
                          KỸ NĂNG CHUYÊN SÂU
                        </h3>
                        <div className="space-y-2">
                          {cvData.skills.map((sk, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <p className={`font-bold text-[11px] ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{sk.category}</p>
                              <div className="flex flex-wrap gap-1">
                                {sk.items.map((it, iIdx) => (
                                  <span key={iIdx} className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                    canvasTheme === 'paper-white' ? 'bg-slate-100 text-slate-800 border border-slate-300' : livingTheme.tagBg
                                  }`}>
                                    {it}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${
                          canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                        }`}>
                          HỌC VẤN &amp; CHỨNG CHỈ
                        </h3>
                        {cvData.education.map((e, idx) => (
                          <div key={e.id || idx} className="text-xs space-y-0.5">
                            <p className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{e.school}</p>
                            <p className={canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A5B4D]'}>{e.degree}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px]">{e.grade}</p>
                          </div>
                        ))}
                        <div className="pt-2 space-y-1.5">
                          {cvData.certifications.map((c, idx) => (
                            <div key={c.id || idx} className={`text-[11px] border-l-2 pl-2 ${canvasTheme === 'paper-white' ? 'border-slate-400' : 'border-[#C5C0B6]'}`}>
                              <p className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{c.name}</p>
                              <p className={`font-mono text-[10px] ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{c.issuer} ({c.year})</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CV FILES VAULT & ATS PARSER                        */}
        {/* ========================================================= */}
        {activeTab === 'attachments' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Upload Zone */}
            <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-8 shadow-soft-xl space-y-4 transition-all duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-botanical-stone/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-botanical-forest text-white shadow-soft">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-base text-botanical-forest">Tải Lên File CV PDF / DOCX</h2>
                    <p className="text-xs text-botanical-forest/70">Gemini AI tự động quét từ khóa ngành nghề và chấm điểm ATS tương thích.</p>
                  </div>
                </div>
                <span className="badge-sage px-3 py-1 rounded-full text-xs font-mono font-bold">{cvFiles.length} Tệp Lưu Trữ</span>
              </div>

              <label className="p-8 rounded-2xl bg-[#FAF9F5] border-2 border-dashed border-botanical-stone hover:border-botanical-sage hover:bg-white transition-all text-center block cursor-pointer group">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleUploadCv}
                  className="hidden" 
                />
                <span className="material-symbols-outlined text-4xl text-botanical-terracotta group-hover:scale-110 transition-transform">cloud_upload</span>
                <p className="font-serif font-bold text-base text-botanical-forest mt-2">Bấm hoặc Kéo thả file CV của bạn vào đây</p>
                <p className="text-xs text-botanical-forest/60 mt-1">Định dạng hỗ trợ: PDF, DOC, DOCX • Tối đa 15MB</p>
              </label>
            </section>

            {/* List of Uploaded CVs */}
            <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-8 shadow-soft-xl space-y-4 transition-all duration-300">
              <h2 className="font-serif font-bold text-base text-botanical-forest pb-3 border-b border-botanical-stone/80 flex items-center gap-2">
                <span className="material-symbols-outlined text-botanical-terracotta">folder_open</span>
                <span>Danh Sách Tệp CV Trong Kho Hồ Sơ Của {currentCandidate.accountName}</span>
              </h2>

              <div className="space-y-3">
                {cvFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      file.isDefault 
                        ? 'bg-[#FAF9F5] border-botanical-forest/30 shadow-soft' 
                        : 'bg-white border-botanical-stone hover:border-botanical-stone/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${file.isDefault ? 'bg-botanical-terracotta/15 text-botanical-terracotta font-bold' : 'bg-botanical-cream text-botanical-forest/70'}`}>
                        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-sm text-botanical-forest truncate max-w-xs sm:max-w-md">{file.name}</h3>
                          {file.isDefault && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-botanical-forest text-white">
                              MẶC ĐỊNH FAST APPLY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-botanical-forest/65 font-sans mt-0.5">
                          {file.size} • {file.uploaded} • Ngành: <strong className="text-botanical-forest">{file.targetIndustry}</strong> • Điểm ATS: <strong className="text-botanical-terracotta font-bold">{file.atsScore}/100</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!file.isDefault && (
                        <button
                          onClick={() => {
                            setCvFiles(prev => prev.map(f => ({ ...f, isDefault: f.id === file.id })));
                            showToast(`Đã chọn ${file.name} làm CV mặc định!`);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-botanical-cream hover:bg-botanical-stone/60 text-xs font-bold text-botanical-forest transition-colors cursor-pointer border border-botanical-stone/80"
                        >
                          Đặt Mặc Định
                        </button>
                      )}
                      <button
                        onClick={() => showToast(`Đang mở tải xuống tệp: ${file.name}`)}
                        className="p-2 rounded-full bg-botanical-cream hover:bg-botanical-stone/60 text-botanical-forest transition-colors cursor-pointer border border-botanical-stone/80"
                        title="Tải xuống tệp CV"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Privacy & Job Search Status settings */}
            <section className="card-botanical bg-white/95 rounded-3xl border border-botanical-stone p-6 sm:p-8 shadow-soft-xl space-y-4 transition-all duration-300">
              <h2 className="font-serif font-bold text-base text-botanical-forest pb-3 border-b border-botanical-stone/80 flex items-center gap-2">
                <span className="material-symbols-outlined text-botanical-sage">tune</span>
                <span>Thiết Lập Trạng Thái Ứng Tuyển &amp; Quyền Riêng Tư</span>
              </h2>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-botanical-forest font-bold mb-2">Trạng Thái Tìm Việc Hiện Tại:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'OPEN_TO_WORK', label: '🟢 Đang Tích Cực Tìm Việc (Open to Work)' },
                      { id: 'EXPLORING', label: '🟡 Mở Lòng Với Cơ Hội Tốt (Exploring)' },
                      { id: 'NOT_LOOKING', label: '⚪ Chưa Có Nhu Cầu (Not Looking)' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setJobSearchStatus(st.id);
                          showToast(`Đã chuyển trạng thái: ${st.label}`);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          jobSearchStatus === st.id 
                            ? 'bg-botanical-forest text-white font-bold shadow-soft border-botanical-forest' 
                            : 'bg-white border-botanical-stone text-botanical-forest/80 hover:bg-[#FAF9F5]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
