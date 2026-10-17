import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { jobApi, applicationApi, companyApi } from '../api';
import { parseSkillList } from '../utils/helpers';
import { calculateJobDeadline } from '../utils/jobTimeUtils';

// 6 Enterprise Job Description Templates for HR / Recruiters
const SAMPLE_JDS = [
  {
    key: 'intern_backend',
    label: 'Intern Backend',
    icon: 'school',
    title: 'Intern Backend Engineer (Java / Spring Boot)',
    domain: 'Công Nghệ Thông Tin / Phần Mềm',
    employmentType: 'INTERNSHIP',
    jobLevel: 'INTERN',
    educationRequirement: 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
    experienceRequirement: 'Không yêu cầu kinh nghiệm (Được kèm cặp 1-on-1)',
    workplaceType: 'Hybrid (Linh hoạt tại văn phòng & từ xa)',
    genderRequirement: 'Không yêu cầu',
    salary: '8 - 12 triệu VNĐ / tháng',
    salaryMin: 8000000,
    salaryMax: 12000000,
    location: 'Đà Nẵng (Hybrid)',
    vacanciesCount: 3,
    days: 45,
    description: '- Tham gia phát triển và tối ưu hóa các module RESTful API lõi dựa trên Java 21 và Spring Boot 3.\n- Hỗ trợ xây dựng lược đồ cơ sở dữ liệu PostgreSQL, viết query tối ưu hóa và thiết lập index hiệu năng cao.\n- Tìm hiểu và ứng dụng kiến trúc Microservices, triển khai hệ thống thông báo Kafka và bộ đệm Redis.\n- Tham gia quy trình Agile/Scrum, thực hiện Code Review cùng Senior Tech Lead và viết Unit/Integration Tests.',
    requirements: '- Sinh viên năm cuối hoặc mới tốt nghiệp chuyên ngành CNTT, Kỹ thuật phần mềm hoặc tương đương.\n- Nắm vững kiến thức nền tảng về OOP, cấu trúc dữ liệu, giải thuật và hệ quản trị CSDL quan hệ.\n- Đã từng thực hiện đồ án môn học hoặc dự án thực tế với Java (Spring Boot) và PostgreSQL / MySQL.\n- Tinh thần chủ động học hỏi, ham nghiên cứu công nghệ mới và tư duy giải quyết vấn đề mạch lạc.',
    benefits: '- Phụ cấp thực tập hấp dẫn từ 8 - 12 triệu VNĐ/tháng, cơ hội chuyển thẳng lên Full-time sau kỳ thực tập.\n- Được kèm cặp 1-on-1 cùng Tech Lead giàu kinh nghiệm thực chiến dự án lớn.\n- Trang bị máy tính xách tay cấu hình cao và màn hình phụ làm việc hiện đại.\n- Tham gia đầy đủ các hoạt động teambuilding, thể thao, đồ ăn nhẹ và cà phê miễn phí tại văn phòng.',
    mandatorySkills: ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'RESTful API', 'Git'],
    preferredSkills: ['Microservices', 'Docker', 'Redis', 'Kafka', 'JUnit 5']
  },
  {
    key: 'frontend_react',
    label: 'Senior Frontend',
    icon: 'devices',
    title: 'Senior Frontend Engineer (React / TypeScript / Next.js)',
    domain: 'Công Nghệ Thông Tin / Web Development',
    employmentType: 'FULL_TIME',
    jobLevel: 'SENIOR',
    educationRequirement: 'Đại học / Cử nhân chuyên ngành CNTT hoặc tương đương',
    experienceRequirement: 'Tối thiểu 4+ năm kinh nghiệm phát triển Frontend chuyên sâu',
    workplaceType: 'Hybrid (Linh hoạt tại văn phòng & WFH)',
    genderRequirement: 'Không yêu cầu',
    salary: '$2,000 - $3,200/tháng',
    salaryMin: 2000,
    salaryMax: 3200,
    location: 'TP.HCM (Quận 1 / Hybrid)',
    vacanciesCount: 2,
    days: 30,
    description: '- Chủ trì kiến trúc giao diện người dùng (Frontend Architecture) cho nền tảng web thế hệ mới với hàng triệu người dùng.\n- Xây dựng Design System dùng chung, tối ưu hóa Web Vitals, Core Rendering Performance và SEO Next.js.\n- Tích hợp mượt mà với các dịch vụ Backend Microservices qua GraphQL & RESTful API.\n- Hướng dẫn, mentoring các thành viên Junior và đảm bảo chất lượng code thông qua CI/CD và Cypress/Jest test suites.',
    requirements: '- Tối thiểu 4+ năm kinh nghiệm phát triển Frontend chuyên sâu với React, TypeScript, Next.js và Tailwind CSS.\n- Nắm vững các mô hình quản lý state (Zustand, Redux Toolkit, React Query) và tối ưu hóa DOM Rendering.\n- Kinh nghiệm thực tế với Responsive UI, Micro-frontends, Webpack / Vite build tools.\n- Kỹ năng tư duy sản phẩm (Product Mindset) và khả năng giao tiếp tiếng Anh tốt trong môi trường quốc tế.',
    benefits: '- Mức lương cạnh tranh từ $2,000 - $3,200/tháng (Gross/Net) + Thưởng hiệu suất dự án theo quý.\n- Gói bảo hiểm sức khỏe VIP toàn diện PVI cho nhân viên và người thân trong gia đình.\n- 18 ngày phép năm có lương, ngân sách đào tạo và thi chứng chỉ quốc tế $1,000/năm.\n- Môi trường công nghệ hiện đại, tự do sáng tạo, giờ làm việc linh hoạt (Flexible Working Hours).',
    mandatorySkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux / Zustand'],
    preferredSkills: ['GraphQL', 'Cypress', 'Vite', 'Docker', 'Design System']
  },
  {
    key: 'fullstack',
    label: 'Fullstack Dev',
    icon: 'layers',
    title: 'Fullstack Software Engineer (Node.js & React)',
    domain: 'Công Nghệ Thông Tin / Phần Mềm',
    employmentType: 'FULL_TIME',
    jobLevel: 'MIDDLE',
    educationRequirement: 'Đại học / Cao đẳng chuyên ngành CNTT hoặc tương đương',
    experienceRequirement: 'Tối thiểu 3 năm kinh nghiệm lập trình Fullstack',
    workplaceType: 'On-site (Tại văn phòng công ty)',
    genderRequirement: 'Không yêu cầu',
    salary: '35 - 55 triệu VNĐ / tháng',
    salaryMin: 35000000,
    salaryMax: 55000000,
    location: 'Hà Nội (Cầu Giấy)',
    vacanciesCount: 2,
    days: 30,
    description: '- Trực tiếp phát triển trọn gói các tính năng từ giao diện người dùng đến dịch vụ Backend và Database.\n- Thiết kế kiến trúc module độc lập, xây dựng RESTful & gRPC APIs có khả năng co giãn linh hoạt.\n- Quản trị và tối ưu hóa hệ thống dữ liệu PostgreSQL / MongoDB, thiết lập giải pháp caching Redis.\n- Đảm bảo tính bảo mật (OAuth2, JWT, RBAC) và thiết lập pipeline tự động hóa CI/CD lên hạ tầng Cloud.',
    requirements: '- Tối thiểu 3 năm kinh nghiệm lập trình Fullstack với Node.js (NestJS / Express) và React (TypeScript).\n- Thành thạo thiết kế Database quan hệ (PostgreSQL) và NoSQL (MongoDB, Redis).\n- Hiểu sâu về Docker, Containerization và triển khai ứng dụng trên Cloud (AWS / GCP).\n- Tinh thần trách nhiệm cao (Ownership), khả năng làm việc độc lập và phối hợp nhóm hiệu quả.',
    benefits: '- Thu nhập từ 35 - 55 triệu VNĐ/tháng + Lương tháng 13 + Thưởng lợi nhuận cuối năm.\n- Được cấp Macbook Pro M3 Max và màn hình UltraWide 4K khi gia nhập công ty.\n- Đầy đủ chế độ BHXH, BHYT theo luật Lao động và gói khám sức khỏe tổng quát định kỳ.\n- Du lịch nghỉ dưỡng 5 sao hàng năm, hoạt động thể thao nội bộ (bóng đá, cầu lông, gym).',
    mandatorySkills: ['Node.js', 'React', 'TypeScript', 'PostgreSQL', 'Docker'],
    preferredSkills: ['NestJS', 'Redis', 'AWS', 'Kubernetes', 'CI/CD']
  },
  {
    key: 'ai_engineer',
    label: 'AI & Data Engineer',
    icon: 'psychology',
    title: 'AI / Machine Learning Engineer (Python & Generative AI)',
    domain: 'Trí Tuệ Nhân Tạo / Dữ Liệu Lớn',
    employmentType: 'FULL_TIME',
    jobLevel: 'SENIOR',
    educationRequirement: 'Đại học / Thạc sĩ chuyên ngành AI, Khoa Học Máy Tính, Toán - Tin',
    experienceRequirement: 'Tối thiểu 2+ năm kinh nghiệm thực chiến với AI/LLM',
    workplaceType: 'Hybrid (Linh hoạt)',
    genderRequirement: 'Không yêu cầu',
    salary: '$2,500 - $4,500/tháng',
    salaryMin: 2500,
    salaryMax: 4500,
    location: 'TP.HCM (Quận 7 / Hybrid)',
    vacanciesCount: 1,
    days: 45,
    description: '- Nghiên cứu, huấn luyện và tinh chỉnh (Fine-tuning) các mô hình AI/LLM phục vụ bài toán Matching và OCR thông minh.\n- Xây dựng kiến trúc RAG (Retrieval-Augmented Generation), tích hợp Vector Database (Pinecone, ChromaDB, pgvector).\n- Triển khai và tối ưu hóa AI Pipeline phục vụ Inference thời gian thực với độ trễ thấp và độ tin cậy cao.\n- Phối hợp với đội ngũ Kỹ sư Phần mềm để đóng gói mô hình thành các API RESTful/gRPC sẵn sàng cho môi trường Production.',
    requirements: '- Tốt nghiệp Đại học/Thạc sĩ chuyên ngành Trí Tuệ Nhân Tạo, Khoa Học Máy Tính, Toán - Tin.\n- Tối thiểu 2+ năm kinh nghiệm thực chiến với Python, PyTorch / TensorFlow, Hugging Face và OpenAI/Gemini API.\n- Nắm vững kiến trúc Transformer, Prompt Engineering, RAG Pipelines và Vector Database.\n- Đã từng có kinh nghiệm triển khai mô hình AI trên nền tảng Cloud (AWS SageMaker, GCP Vertex AI hoặc Docker).',
    benefits: '- Mức lương từ $2,500 - $4,500/tháng kèm quyền mua cổ phần ưu đãi (ESOP).\n- Làm việc trực tiếp với các chuyên gia AI đầu ngành, cơ hội công bố nghiên cứu quốc tế.\n- Tài trợ 100% chi phí compute GPUs đám mây (A100 / H100) cho hoạt động R&D.\n- Chế độ làm việc linh hoạt (Remote 2 ngày/tuần), 20 ngày phép năm có lương.',
    mandatorySkills: ['Python', 'PyTorch', 'Generative AI', 'LLMs', 'Vector Database'],
    preferredSkills: ['LangChain', 'Docker', 'FastAPI', 'AWS / GCP', 'Fine-tuning']
  },
  {
    key: 'qa_automation',
    label: 'Automation QA',
    icon: 'rule',
    title: 'Senior Automation QA Engineer (Java & Playwright / Selenium)',
    domain: 'Đảm Bảo Chất Lượng Phần Mềm',
    employmentType: 'FULL_TIME',
    jobLevel: 'SENIOR',
    educationRequirement: 'Đại học / Cử nhân CNTT hoặc chứng chỉ kiểm thử quốc tế ISTQB',
    experienceRequirement: 'Tối thiểu 3 năm kinh nghiệm trong lĩnh vực Automation Testing',
    workplaceType: 'Remote (100% làm việc từ xa)',
    genderRequirement: 'Không yêu cầu',
    salary: '25 - 40 triệu VNĐ / tháng',
    salaryMin: 25000000,
    salaryMax: 40000000,
    location: 'Đà Nẵng / Remote',
    vacanciesCount: 2,
    days: 30,
    description: '- Xây dựng và duy trì Test Automation Framework cho Web, API và Mobile Apps.\n- Thiết kế kịch bản kiểm thử tự động (Automation Test Scripts), kiểm thử hiệu năng (Performance/Load Testing với JMeter/k6).\n- Tích hợp bộ kiểm thử tự động vào quy trình CI/CD (GitHub Actions / GitLab CI), phát hiện sớm lỗi trước khi lên Production.\n- Phối hợp chặt chẽ với Developers và Product Owners để làm rõ yêu cầu nghiệp vụ và tiêu chí chấp thuận (Acceptance Criteria).',
    requirements: '- Tối thiểu 3 năm kinh nghiệm trong lĩnh vực Automation Testing với Java hoặc JavaScript/TypeScript.\n- Thành thạo các framework kiểm thử phổ biến: Playwright, Cypress, Selenium WebDriver, RestAssured.\n- Hiểu biết vững về CI/CD, Git, Docker và quy trình kiểm thử phần mềm theo chuẩn Agile/Scrum.\n- Kỹ năng phân tích logic tốt, tỉ mỉ, khả năng tìm kiếm và tái hiện lỗi (Bug Tracking) chuẩn xác.',
    benefits: '- Thu nhập 25 - 40 triệu VNĐ/tháng + Lương tháng 13 và thưởng dự án.\n- Chế độ làm việc linh hoạt (cho phép Full Remote hoặc Hybrid tại Đà Nẵng).\n- Bảo hiểm sức khỏe quốc tế, gói khám sức khỏe định kỳ cao cấp.\n- Hỗ trợ chi phí thi các chứng chỉ quốc tế ISTQB, AWS Certified.',
    mandatorySkills: ['Automation Testing', 'Java / TypeScript', 'Playwright / Selenium', 'REST API Testing', 'CI/CD'],
    preferredSkills: ['JMeter', 'Docker', 'GitLab CI', 'Cypress', 'Postman']
  },
  {
    key: 'business_analyst',
    label: 'IT Business Analyst',
    icon: 'analytics',
    title: 'Senior IT Business Analyst (Agile & System Modeling)',
    domain: 'Phân Tích Nghiệp Vụ CNTT',
    employmentType: 'FULL_TIME',
    jobLevel: 'SENIOR',
    educationRequirement: 'Đại học chuyên ngành CNTT, Hệ thống thông tin quản lý hoặc Kinh tế',
    experienceRequirement: 'Tối thiểu 3+ năm kinh nghiệm làm IT Business Analyst',
    workplaceType: 'On-site (Tại văn phòng)',
    genderRequirement: 'Không yêu cầu',
    salary: '30 - 45 triệu VNĐ / tháng',
    salaryMin: 30000000,
    salaryMax: 45000000,
    location: 'Hà Nội / TP.HCM',
    vacanciesCount: 2,
    days: 30,
    description: '- Thu thập, phân tích và làm rõ các yêu cầu nghiệp vụ từ khách hàng và các bên liên quan (Stakeholders).\n- Xây dựng tài liệu đặc tả yêu cầu: BRD, SRS, Use Case Specifications, User Stories kèm Acceptance Criteria.\n- Thiết kế mô hình hóa nghiệp vụ (BPMN), sơ đồ luồng dữ liệu (Data Flow) và Wireframes/Mockups giao diện trên Figma.\n- Phối hợp chặt chẽ cùng Development Team và QA trong các buổi Grooming/Sprint Planning để giải đáp nghiệp vụ.',
    requirements: '- Tối thiểu 3+ năm kinh nghiệm làm IT Business Analyst trong các dự án phần mềm doanh nghiệp, Fintech hoặc E-Commerce.\n- Thành thạo công cụ mô hình hóa BPMN, UML, quản lý tác vụ Jira / Confluence và thiết kế Wireframe Figma.\n- Kỹ năng viết câu truy vấn SQL để tra cứu và phân tích dữ liệu trên cơ sở dữ liệu.\n- Kỹ năng giao tiếp xuất sắc, khả năng đàm phán và thuyết trình chuyên nghiệp.',
    benefits: '- Thu nhập 30 - 45 triệu VNĐ/tháng + Thưởng hoàn thành dự án.\n- Phụ cấp ăn trưa, gửi xe, gói bảo hiểm sức khỏe Bảo Việt toàn diện.\n- Tham gia các khóa đào tạo nâng cao chuyên môn (CCBA, CBAP, Scrum Master) do công ty tài trợ.\n- Môi trường làm việc trẻ trung, năng động, cơ hội thăng tiến lên Product Owner hoặc Project Manager.',
    mandatorySkills: ['Business Analysis', 'Agile / Scrum', 'BRD & SRS', 'SQL', 'BPMN / UML'],
    preferredSkills: ['Figma', 'Jira / Confluence', 'Fintech Domain', 'Data Analytics', 'API Specifications']
  }
];

export default function RecruiterJobManagementPage({ user, onNavigateToPipeline }) {
  const { theme: livingTheme, luminosity } = useLivingTheme();
  // Category tab: 'ALL' | 'ACTIVE' | 'PAUSED' | 'CLOSED'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Auto-reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);
  const [notification, setNotification] = useState('');
  const [companyStatus, setCompanyStatus] = useState('PENDING'); // 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNVERIFIED'
  const [showUnverifiedWarningModal, setShowUnverifiedWarningModal] = useState(false);

  useEffect(() => {
    const fetchCompStatus = async () => {
      try {
        const res = await companyApi.getMyCompany();
        const comp = res?.data || res;
        if (comp && comp.status) {
          setCompanyStatus(comp.status);
          return;
        }
      } catch (err) {}
      const companyKey = (user?.companyName || 'vng_corporation').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const saved = localStorage.getItem(`hiremate_company_legal_${companyKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCompanyStatus(parsed.status || 'PENDING');
        } catch {}
      }
    };
    fetchCompStatus();
  }, [user]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Delete Job modal state & ownership validation
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDeleteJob = (job) => {
    if (!job) return false;
    if (user?.role === 'ADMIN') return true;
    const currentUserId = user?.userId || user?.id;
    const jobRecruiterId = job.recruiterId || job.raw?.recruiterId || job.recruiter?.recruiterId;

    if (currentUserId && jobRecruiterId && String(currentUserId) === String(jobRecruiterId)) {
      return true;
    }
    const currentUserEmail = user?.email?.toLowerCase();
    const jobRecruiterEmail = (job.recruiterEmail || job.raw?.recruiterEmail || job.recruiter?.user?.email)?.toLowerCase();
    if (currentUserEmail && jobRecruiterEmail && currentUserEmail === jobRecruiterEmail) {
      return true;
    }
    const currentUserName = (user?.fullName || user?.name)?.trim().toLowerCase();
    const jobRecruiterName = (job.recruiterName || job.raw?.recruiterName || job.recruiter?.user?.fullName)?.trim().toLowerCase();
    if (currentUserName && jobRecruiterName && currentUserName === jobRecruiterName) {
      return true;
    }
    try {
      const myCreated = JSON.parse(localStorage.getItem('hiremate_my_created_jobs') || '[]');
      if (Array.isArray(myCreated) && myCreated.some((id) => String(id) === String(job.id))) {
        return true;
      }
    } catch (e) {}

    return false;
  };

  const handleConfirmDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      setIsDeleting(true);
      await jobApi.deleteJob(jobToDelete.id);

      setJobsList((prev) => prev.filter((j) => j.id !== jobToDelete.id));

      try {
        const myCreated = JSON.parse(localStorage.getItem('hiremate_my_created_jobs') || '[]');
        const updated = myCreated.filter((id) => String(id) !== String(jobToDelete.id));
        localStorage.setItem('hiremate_my_created_jobs', JSON.stringify(updated));
      } catch (e) {}

      triggerToast(`Đã xóa vĩnh viễn tin tuyển dụng "${jobToDelete.title}" thành công!`);
      setJobToDelete(null);
    } catch (err) {
      console.error('Lỗi khi xóa tin tuyển dụng:', err);
      const errMsg = err.response?.data?.message || err.message || 'Không thể xóa tin tuyển dụng này.';
      triggerToast(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Tag inputs & drag file state
  const [mandSkillTagInput, setMandSkillTagInput] = useState('');
  const [prefSkillTagInput, setPrefSkillTagInput] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // AI JD Scanner state (Quét file Word/PDF/Image hoặc dán text trực tiếp tự động điền form)
  const [isScanningJd, setIsScanningJd] = useState(false);
  const [jdScanFileName, setJdScanFileName] = useState('');
  const [jdScanSuccess, setJdScanSuccess] = useState(false);
  const [lastScannedData, setLastScannedData] = useState(null);
  const [rawJdText, setRawJdText] = useState('');
  const fileInputRef = useRef(null);

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3500);
  };

  // Jobs state loaded from real database
  const [jobsList, setJobsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to format scanned salary properly (distinguishing USD vs VND)
  const formatScannedSalary = (min, max, text) => {
    if (text && (text.includes('$') || text.includes('triệu') || text.includes('tr') || text.includes('VNĐ') || text.includes('VND'))) {
      return text;
    }
    const minNum = Number(min);
    const maxNum = Number(max);
    if (minNum && maxNum) {
      if (minNum < 10000) {
        return `$${minNum.toLocaleString()} - $${maxNum.toLocaleString()}/tháng`;
      }
      if (minNum >= 1000000) {
        return `${(minNum / 1000000).toFixed(0)} - ${(maxNum / 1000000).toFixed(0)} triệu VNĐ / tháng`;
      }
      return `${minNum.toLocaleString('vi-VN')} - ${maxNum.toLocaleString('vi-VN')} VNĐ`;
    }
    return text || '';
  };

  // Initial Clean Form Generator (Không có sẵn dữ liệu mẫu khi chưa nhập/tải file)
  const getInitialCreateForm = () => ({
    title: '',
    code: 'JD-' + Math.floor(100 + Math.random() * 900),
    domain: '',
    employmentType: 'FULL_TIME',
    jobLevel: 'INTERN',
    educationRequirement: 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
    experienceRequirement: 'Không yêu cầu kinh nghiệm (Intern/Fresher)',
    workplaceType: 'Hybrid (Linh hoạt)',
    genderRequirement: 'Không yêu cầu',
    salary: '',
    salaryMin: null,
    salaryMax: null,
    location: '',
    vacanciesCount: 1,
    deadlineDate: '',
    description: '',
    requirements: '',
    benefits: '',
    mandatorySkillsInput: '',
    preferredSkillsInput: '',
  });

  // Create Job Form - Ban đầu hoàn toàn trống để HR tự gõ hoặc tải file AI tự điền
  
  const JOB_LEVEL_OPTIONS = [
    { id: 'INTERN', label: 'Thực tập sinh (Intern)', icon: 'school', color: 'indigo', desc: 'Dành cho sinh viên năm 3, năm cuối hoặc mới ra trường cần tích lũy kinh nghiệm' },
    { id: 'FRESHER', label: 'Fresher (Mới ra trường)', icon: 'workspace_premium', color: 'blue', desc: 'Dưới 1 năm kinh nghiệm, đã hoàn thành chương trình đại học/cao đẳng' },
    { id: 'JUNIOR', label: 'Junior (1 - 2 năm)', icon: 'person', color: 'emerald', desc: 'Có từ 1 - 2 năm kinh nghiệm thực chiến dự án' },
    { id: 'MIDDLE', label: 'Middle (2 - 4 năm)', icon: 'military_tech', color: 'amber', desc: 'Có từ 2 - 4 năm kinh nghiệm, làm việc độc lập vững vàng' },
    { id: 'SENIOR', label: 'Senior (4 - 6 năm)', icon: 'stars', color: 'purple', desc: 'Kỹ sư cấp cao từ 4+ năm kinh nghiệm, làm chủ kiến trúc' },
    { id: 'LEAD', label: 'Tech Lead / Trưởng nhóm', icon: 'groups', color: 'rose', desc: 'Dẫn dắt kỹ thuật và quản lý đội ngũ lập trình' },
    { id: 'MANAGER', label: 'Quản lý / Director', icon: 'shield_person', color: 'slate', desc: 'Quản trị cấp cao phụ trách kỹ thuật hoặc phòng ban' },
  ];

  const EDUCATION_OPTIONS = [
    'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
    'Đại học / Cử nhân chuyên ngành CNTT hoặc tương đương',
    'Cao đẳng / Trung cấp chuyên nghiệp',
    'Thạc sĩ / Tiến sĩ chuyên ngành liên quan',
    'Chứng chỉ quốc tế chuyên môn tương đương',
    'Không yêu cầu bằng cấp (Ưu tiên năng lực thực tế)'
  ];

  const EXPERIENCE_OPTIONS = [
    'Không yêu cầu kinh nghiệm (Intern/Fresher - Đào tạo thực tế)',
    'Dưới 1 năm kinh nghiệm',
    '1 - 2 năm kinh nghiệm',
    '2 - 4 năm kinh nghiệm',
    '4 - 6 năm kinh nghiệm',
    'Trên 6 năm kinh nghiệm'
  ];

  const [createForm, setCreateForm] = useState(getInitialCreateForm);

  // Parsed Skill tag arrays for interactive chips
  const mandatorySkillsArray = useMemo(() => {
    return (createForm.mandatorySkillsInput || '')
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [createForm.mandatorySkillsInput]);

  const preferredSkillsArray = useMemo(() => {
    return (createForm.preferredSkillsInput || '')
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [createForm.preferredSkillsInput]);

  // Tab for Detailed Job Content: 'DESC' (Mô tả) | 'REQ' (Yêu cầu) | 'BEN' (Đãi ngộ)
  const [activeContentTab, setActiveContentTab] = useState('DESC');

  // Dynamic AI Job Quality Score (0 - 100) based strictly on real input completeness
  const aiJobScore = useMemo(() => {
    let score = 0;
    if (createForm.title && createForm.title.trim().length >= 5) score += 20;
    if (createForm.salary && createForm.salary.trim().length > 0) score += 15;
    if (mandatorySkillsArray.length >= 2) score += 25;
    else if (mandatorySkillsArray.length === 1) score += 10;
    if (preferredSkillsArray.length >= 1) score += 15;
    if (createForm.description && createForm.description.trim().length >= 40) score += 15;
    if (createForm.requirements && createForm.requirements.trim().length >= 20) score += 10;
    return Math.min(score, 100);
  }, [createForm.title, createForm.salary, createForm.description, createForm.requirements, mandatorySkillsArray.length, preferredSkillsArray.length]);

  const handleAddMandatorySkill = (skillToAdd) => {
    const trimmed = (skillToAdd || mandSkillTagInput).trim();
    if (!trimmed) return;
    if (!mandatorySkillsArray.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...mandatorySkillsArray, trimmed];
      setCreateForm(prev => ({ ...prev, mandatorySkillsInput: updated.join(', ') }));
    }
    setMandSkillTagInput('');
  };

  const handleRemoveMandatorySkill = (skillToRemove) => {
    const updated = mandatorySkillsArray.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase());
    setCreateForm(prev => ({ ...prev, mandatorySkillsInput: updated.join(', ') }));
  };

  const handleAddPreferredSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || prefSkillTagInput).trim();
    if (!trimmed) return;
    if (!preferredSkillsArray.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...preferredSkillsArray, trimmed];
      setCreateForm(prev => ({ ...prev, preferredSkillsInput: updated.join(', ') }));
    }
    setPrefSkillTagInput('');
  };

  const handleRemovePreferredSkill = (skillToRemove) => {
    const updated = preferredSkillsArray.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase());
    setCreateForm(prev => ({ ...prev, preferredSkillsInput: updated.join(', ') }));
  };

  // Gợi ý kỹ năng động 1-click dựa trên tiêu đề công việc thực tế của HR (Frontend, Backend, QA, Mobile, AI...)
  const dynamicMandatorySuggestions = useMemo(() => {
    const t = (createForm.title || '').toLowerCase();
    if (t.includes('frontend') || t.includes('front-end') || t.includes('react') || t.includes('vue') || t.includes('web')) {
      return ['React', 'TypeScript', 'JavaScript', 'HTML5 & CSS3', 'Tailwind CSS', 'Next.js', 'Redux', 'Vue.js'];
    }
    if (t.includes('qa') || t.includes('qc') || t.includes('tester') || t.includes('kiem thu')) {
      return ['Automation Testing', 'Manual Testing', 'Playwright', 'Selenium', 'Postman', 'RESTful API', 'SQL'];
    }
    if (t.includes('mobile') || t.includes('flutter') || t.includes('react native') || t.includes('ios') || t.includes('android')) {
      return ['Flutter', 'Dart', 'React Native', 'iOS (Swift)', 'Android (Kotlin)', 'RESTful API', 'Firebase'];
    }
    if (t.includes('ai') || t.includes('data') || t.includes('machine learning')) {
      return ['Python', 'Generative AI', 'LLMs', 'PyTorch', 'Vector Database', 'RESTful API', 'Docker'];
    }
    if (t.includes('fullstack')) {
      return ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'RESTful API', 'Next.js'];
    }
    return ['Java 21', 'Spring Boot 3', 'PostgreSQL', 'RESTful API', 'Docker', 'Microservices', 'Node.js', 'React'];
  }, [createForm.title]);

  const dynamicPreferredSuggestions = useMemo(() => {
    const t = (createForm.title || '').toLowerCase();
    if (t.includes('frontend') || t.includes('front-end') || t.includes('react') || t.includes('vue') || t.includes('web')) {
      return ['GraphQL', 'Vite', 'Webpack', 'Figma', 'Jest / Cypress', 'CI/CD', 'Docker', 'Responsive Design'];
    }
    if (t.includes('qa') || t.includes('qc') || t.includes('tester')) {
      return ['JMeter', 'Cypress', 'CI/CD', 'Docker', 'GitLab CI', 'Test Planning', 'Bug Tracking'];
    }
    if (t.includes('mobile')) {
      return ['CI/CD', 'Fastlane', 'Redux', 'GraphQL', 'App Store / Play Store Deployment', 'SQLite'];
    }
    if (t.includes('ai') || t.includes('data')) {
      return ['LangChain', 'FastAPI', 'Docker', 'AWS / GCP', 'RAG Pipelines', 'Fine-tuning', 'Hugging Face'];
    }
    if (t.includes('fullstack')) {
      return ['Redis', 'AWS', 'Kubernetes', 'CI/CD', 'GraphQL', 'Microservices', 'NestJS'];
    }
    return ['Kafka', 'Redis Cluster', 'AWS', 'Kubernetes', 'CI/CD', 'GraphQL', 'Next.js', 'JMeter'];
  }, [createForm.title]);

  // Tự động quét file JD (PDF, Word DOCX/DOC, TXT, và Ảnh chụp màn hình OCR PNG/JPG/WEBP) bằng AI
  const handleJdFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    if (!isValid) {
      triggerToast('Định dạng tệp không được hỗ trợ. Vui lòng tải lên file PDF, Word (.docx, .doc), Text (.txt) hoặc Ảnh chụp (.png, .jpg, .jpeg, .webp).');
      return;
    }

    try {
      setIsScanningJd(true);
      setJdScanFileName(file.name);
      setJdScanSuccess(false);

      const formData = new FormData();
      formData.append('file', file);

      const res = await jobApi.scanJd(formData);
      const data = res?.data || res;

      if (data) {
        const todayStr = new Date().toISOString().split('T')[0];
        let validDeadline = data.deadlineDate;
        if (validDeadline && validDeadline < todayStr) {
          const future = new Date();
          future.setDate(future.getDate() + 30);
          validDeadline = future.toISOString().split('T')[0];
        }
        const validVacancies = data.vacanciesCount && Number(data.vacanciesCount) >= 1 ? Math.floor(Number(data.vacanciesCount)) : 1;

        setLastScannedData(data);

        setCreateForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          domain: data.domain || prev.domain,
          employmentType: data.employmentType || (data.title?.toLowerCase().includes('intern') ? 'INTERNSHIP' : prev.employmentType || 'FULL_TIME'),
          jobLevel: data.jobLevel || (data.title?.toLowerCase().includes('intern') ? 'INTERN' : data.title?.toLowerCase().includes('fresher') ? 'FRESHER' : data.title?.toLowerCase().includes('senior') ? 'SENIOR' : prev.jobLevel || 'MIDDLE'),
          educationRequirement: data.educationRequirement || prev.educationRequirement || 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
          experienceRequirement: data.experienceRequirement || prev.experienceRequirement || 'Không yêu cầu kinh nghiệm (Intern/Fresher)',
          workplaceType: data.workplaceType || prev.workplaceType || 'Hybrid (Linh hoạt)',
          genderRequirement: data.genderRequirement || prev.genderRequirement || 'Không yêu cầu',
          salary: formatScannedSalary(data.salaryMin, data.salaryMax, data.salaryText) || prev.salary,
          salaryMin: data.salaryMin !== null && data.salaryMin !== undefined ? data.salaryMin : prev.salaryMin,
          salaryMax: data.salaryMax !== null && data.salaryMax !== undefined ? data.salaryMax : prev.salaryMax,
          location: data.location || prev.location,
          vacanciesCount: validVacancies,
          deadlineDate: validDeadline || prev.deadlineDate,
          description: data.description || prev.description,
          requirements: data.requirements || prev.requirements,
          benefits: data.benefits || prev.benefits,
          mandatorySkillsInput: Array.isArray(data.mandatorySkills) && data.mandatorySkills.length > 0 
            ? data.mandatorySkills.join(', ') 
            : prev.mandatorySkillsInput,
          preferredSkillsInput: Array.isArray(data.preferredSkills) && data.preferredSkills.length > 0 
            ? data.preferredSkills.join(', ') 
            : prev.preferredSkillsInput,
        }));
        setJdScanSuccess(true);
        triggerToast(`🎉 AI đã bóc tách dữ liệu từ "${file.name}" và điền kỹ năng vào form!`);
      }
    } catch (err) {
      console.error('Lỗi khi quét JD:', err);
      triggerToast('Không thể quét JD tự động. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsScanningJd(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Quét trực tiếp nội dung văn bản JD thô bằng AI
  const handleScanRawJdText = async () => {
    if (!rawJdText || rawJdText.trim().length < 20) {
      triggerToast('Vui lòng dán nội dung mô tả công việc (tối thiểu 20 ký tự) để AI phân tích.');
      return;
    }

    try {
      setIsScanningJd(true);
      setJdScanFileName('Nội dung văn bản dán trực tiếp');
      setJdScanSuccess(false);

      const formData = new FormData();
      formData.append('rawText', rawJdText.trim());

      const res = await jobApi.scanJd(formData);
      const data = res?.data || res;

      if (data) {
        const todayStr = new Date().toISOString().split('T')[0];
        let validDeadline = data.deadlineDate;
        if (validDeadline && validDeadline < todayStr) {
          const future = new Date();
          future.setDate(future.getDate() + 30);
          validDeadline = future.toISOString().split('T')[0];
        }
        const validVacancies = data.vacanciesCount && Number(data.vacanciesCount) >= 1 ? Math.floor(Number(data.vacanciesCount)) : 1;

        setLastScannedData(data);

        setCreateForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          domain: data.domain || prev.domain,
          employmentType: data.employmentType || (data.title?.toLowerCase().includes('intern') ? 'INTERNSHIP' : prev.employmentType || 'FULL_TIME'),
          jobLevel: data.jobLevel || (data.title?.toLowerCase().includes('intern') ? 'INTERN' : data.title?.toLowerCase().includes('fresher') ? 'FRESHER' : data.title?.toLowerCase().includes('senior') ? 'SENIOR' : prev.jobLevel || 'MIDDLE'),
          educationRequirement: data.educationRequirement || prev.educationRequirement || 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
          experienceRequirement: data.experienceRequirement || prev.experienceRequirement || 'Không yêu cầu kinh nghiệm (Intern/Fresher)',
          workplaceType: data.workplaceType || prev.workplaceType || 'Hybrid (Linh hoạt)',
          genderRequirement: data.genderRequirement || prev.genderRequirement || 'Không yêu cầu',
          salary: formatScannedSalary(data.salaryMin, data.salaryMax, data.salaryText) || prev.salary,
          salaryMin: data.salaryMin !== null && data.salaryMin !== undefined ? data.salaryMin : prev.salaryMin,
          salaryMax: data.salaryMax !== null && data.salaryMax !== undefined ? data.salaryMax : prev.salaryMax,
          location: data.location || prev.location,
          vacanciesCount: validVacancies,
          deadlineDate: validDeadline || prev.deadlineDate,
          description: data.description || prev.description,
          requirements: data.requirements || prev.requirements,
          benefits: data.benefits || prev.benefits,
          mandatorySkillsInput: Array.isArray(data.mandatorySkills) && data.mandatorySkills.length > 0 
            ? data.mandatorySkills.join(', ') 
            : prev.mandatorySkillsInput,
          preferredSkillsInput: Array.isArray(data.preferredSkills) && data.preferredSkills.length > 0 
            ? data.preferredSkills.join(', ') 
            : prev.preferredSkillsInput,
        }));
        setJdScanSuccess(true);
        triggerToast('🎉 AI đã bóc tách văn bản và tự động điền kỹ năng chuẩn xác vào form!');
      }
    } catch (err) {
      console.error('Lỗi khi quét văn bản JD:', err);
      triggerToast('Không thể quét JD tự động: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsScanningJd(false);
    }
  };

  // Mở Studio Tạo Tin Tuyển Dụng Mới (Khởi tạo form sạch sẽ, sẵn sàng để tự gõ hoặc tải file AI điền)
  const handleOpenCreateModal = () => {
    // 🛡️ BẢO VỆ PHÁP LÝ: Doanh nghiệp phải được xác minh GPKD (VERIFIED/ACTIVE) mới được đăng bài
    const isVerified = companyStatus === 'VERIFIED' || companyStatus === 'ACTIVE' || user?.role === 'ADMIN';
    if (!isVerified) {
      setShowUnverifiedWarningModal(true);
      return;
    }
    setCreateForm(getInitialCreateForm());
    setMandSkillTagInput('');
    setPrefSkillTagInput('');
    setRawJdText('');
    setJdScanFileName('');
    setJdScanSuccess(false);
    setLastScannedData(null);
    setActiveContentTab('DESC');
    setShowCreateModal(true);
  };

  // Áp dụng ghi đè toàn bộ dữ liệu từ file JD đã quét
  const handleApplyAllScannedData = () => {
    if (!lastScannedData) return;
    const data = lastScannedData;
    const todayStr = new Date().toISOString().split('T')[0];
    let validDeadline = data.deadlineDate;
    if (validDeadline && validDeadline < todayStr) {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      validDeadline = future.toISOString().split('T')[0];
    }
    const validVacancies = data.vacanciesCount && Number(data.vacanciesCount) >= 1 ? Math.floor(Number(data.vacanciesCount)) : 1;

    setCreateForm(prev => ({
      ...prev,
      title: data.title || '',
      domain: data.domain || '',
      employmentType: data.employmentType || (data.title?.toLowerCase().includes('intern') ? 'INTERNSHIP' : 'FULL_TIME'),
      jobLevel: data.jobLevel || (data.title?.toLowerCase().includes('intern') ? 'INTERN' : data.title?.toLowerCase().includes('fresher') ? 'FRESHER' : data.title?.toLowerCase().includes('senior') ? 'SENIOR' : 'MIDDLE'),
      educationRequirement: data.educationRequirement || 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
      experienceRequirement: data.experienceRequirement || 'Không yêu cầu kinh nghiệm (Intern/Fresher)',
      workplaceType: data.workplaceType || 'Hybrid (Linh hoạt)',
      genderRequirement: data.genderRequirement || 'Không yêu cầu',
      salary: formatScannedSalary(data.salaryMin, data.salaryMax, data.salaryText) || '',
      salaryMin: data.salaryMin || null,
      salaryMax: data.salaryMax || null,
      location: data.location || '',
      vacanciesCount: validVacancies,
      deadlineDate: validDeadline || '',
      description: data.description || '',
      requirements: data.requirements || '',
      benefits: data.benefits || '',
      mandatorySkillsInput: Array.isArray(data.mandatorySkills) && data.mandatorySkills.length > 0 
        ? data.mandatorySkills.join(', ') 
        : '',
      preferredSkillsInput: Array.isArray(data.preferredSkills) && data.preferredSkills.length > 0 
        ? data.preferredSkills.join(', ') 
        : '',
    }));
    triggerToast('✨ Đã áp dụng toàn bộ thông tin từ file đã quét vào bài đăng!');
  };

  // Nạp tức thì JD mẫu chuẩn Doanh nghiệp HR cho Recruiter kiểm thử nhanh
  const handleLoadSampleJd = (sampleKey = 'intern_backend') => {
    const sample = SAMPLE_JDS.find(s => s.key === sampleKey) || SAMPLE_JDS[0];
    const d = new Date();
    d.setDate(d.getDate() + (sample.days || 30));

    setCreateForm({
      title: sample.title,
      code: 'JD-' + sample.key.toUpperCase().slice(0, 4) + '-' + Math.floor(100 + Math.random() * 900),
      domain: sample.domain,
      employmentType: sample.employmentType,
      jobLevel: sample.jobLevel || 'INTERN',
      educationRequirement: sample.educationRequirement || 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
      experienceRequirement: sample.experienceRequirement || 'Không yêu cầu kinh nghiệm',
      workplaceType: sample.workplaceType || 'Hybrid (Linh hoạt)',
      genderRequirement: sample.genderRequirement || 'Không yêu cầu',
      salary: sample.salary,
      salaryMin: sample.salaryMin,
      salaryMax: sample.salaryMax,
      location: sample.location,
      vacanciesCount: sample.vacanciesCount,
      deadlineDate: d.toISOString().split('T')[0],
      description: sample.description,
      requirements: sample.requirements,
      benefits: sample.benefits,
      mandatorySkillsInput: sample.mandatorySkills.join(', '),
      preferredSkillsInput: sample.preferredSkills.join(', '),
    });
    setJdScanSuccess(true);
    setJdScanFileName(`Mẫu Doanh Nghiệp: ${sample.label}`);
    triggerToast(`✨ Đã tải mẫu bài đăng chuẩn "${sample.label}" thành công!`);
  };

  const fetchMyJobs = async () => {
    try {
      setIsLoading(true);
      const res = await jobApi.getMyJobs();
      const rawList = res?.data || [];
      if (Array.isArray(rawList)) {
        // Asynchronously enrich with application counts and AI match metrics
        const enriched = await Promise.all(
          rawList.map(async (j) => {
            let applicantCount = j.vacanciesCount || 0;
            let aiHigh = 0;
            let topAvatars = [];
            try {
              const appsRes = await applicationApi.getJobApplications(j.jobId);
              const apps = appsRes?.data || [];
              if (Array.isArray(apps)) {
                applicantCount = apps.length;
                aiHigh = apps.filter((a) => (a.matchingScore || 0) >= 80).length;
                topAvatars = apps.slice(0, 3).map((a) => a.candidateAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
              }
            } catch (ignored) { }

            return {
              id: j.jobId,
              code: `JD-REQ-${j.jobId}`,
              badgeText: j.status === 'PUBLISHED' ? 'Đang Đăng Tuyển' : j.status === 'CLOSED' ? 'Đã Đóng' : 'Bản Nháp',
              badgeType: j.status === 'PUBLISHED' ? 'high-priority' : 'frontend',
              title: j.title || 'Vị trí Tuyển Dụng',
              status: j.status === 'PUBLISHED' ? 'ACTIVE' : j.status === 'CLOSED' ? 'CLOSED' : 'PAUSED',
              approvalStatus: j.approvalStatus || 'APPROVED',
              domain: j.company?.industry || j.companyName || 'Công Nghệ & Kỹ Thuật',
              domainIcon: 'work',
              location: j.location || 'Việt Nam',
              salary: j.salaryMin && j.salaryMax ? `$${j.salaryMin} - $${j.salaryMax}` : 'Thỏa thuận',
              salaryMin: j.salaryMin,
              salaryMax: j.salaryMax,
              employmentType: j.employmentType || 'FULL_TIME',
              vacanciesCount: j.vacanciesCount || 1,
              deadlineDate: j.deadlineDate || '',
              description: j.description || '',
              requirements: Array.isArray(j.requirements) ? j.requirements.join('\n') : (j.requirements || ''),
              benefits: Array.isArray(j.benefits) ? j.benefits.join('\n') : (j.benefits || ''),
              totalApplicants: applicantCount,
              aiMatchHighCount: aiHigh,
              mandatorySkills: Array.isArray(j.mandatorySkills) && j.mandatorySkills.length > 0
                ? j.mandatorySkills
                : parseSkillList(j.requirements, ['Yêu cầu chuyên môn']),
              preferredSkills: Array.isArray(j.preferredSkills) && j.preferredSkills.length > 0
                ? j.preferredSkills
                : parseSkillList(j.benefits, ['Đãi ngộ hấp dẫn']),
              topCandidateAvatars: topAvatars,
              recruiterId: j.recruiterId || j.raw?.recruiterId || j.recruiter?.recruiterId,
              recruiterName: j.recruiterName || j.raw?.recruiterName || j.recruiter?.user?.fullName || 'Chuyên viên HR',
              recruiterEmail: j.recruiterEmail || j.raw?.recruiterEmail || j.recruiter?.user?.email,
              raw: j,
            };
          })
        );
        setJobsList(enriched);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách job từ Supabase:', err);
      triggerToast('Không thể tải dữ liệu việc làm thực tế từ hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  useEffect(() => {
    const handleCheckHash = () => {
      if (window.location.hash.includes('action=new')) {
        handleOpenCreateModal();
      }
    };
    handleCheckHash();
    window.addEventListener('hashchange', handleCheckHash);
    return () => window.removeEventListener('hashchange', handleCheckHash);
  }, []);

  // Filtered jobs calculation with Expiration & Deadline support
  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const deadlineInfo = calculateJobDeadline(job.deadlineDate);
      let matchCategory = true;

      if (selectedCategory === 'ALL') {
        matchCategory = true;
      } else if (selectedCategory === 'ACTIVE') {
        matchCategory = job.status === 'ACTIVE' && !deadlineInfo.isExpired;
      } else if (selectedCategory === 'EXPIRING_SOON') {
        matchCategory = deadlineInfo.isExpiringSoon;
      } else if (selectedCategory === 'EXPIRED') {
        matchCategory = deadlineInfo.isExpired;
      } else if (selectedCategory === 'PAUSED') {
        matchCategory = job.status === 'PAUSED';
      } else if (selectedCategory === 'CLOSED') {
        matchCategory = job.status === 'CLOSED';
      }

      const matchQuery =
        searchQuery.trim() === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.mandatorySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.preferredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchQuery;
    });
  }, [jobsList, selectedCategory, searchQuery]);

  // Paginated Jobs calculation
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedJobs = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, validCurrentPage, PAGE_SIZE]);

  const activeCount = useMemo(() => jobsList.filter((j) => j.status === 'ACTIVE' && !calculateJobDeadline(j.deadlineDate).isExpired).length, [jobsList]);
  const expiringSoonCount = useMemo(() => jobsList.filter((j) => calculateJobDeadline(j.deadlineDate).isExpiringSoon).length, [jobsList]);
  const expiredCount = useMemo(() => jobsList.filter((j) => calculateJobDeadline(j.deadlineDate).isExpired).length, [jobsList]);
  const pausedCount = useMemo(() => jobsList.filter((j) => j.status === 'PAUSED').length, [jobsList]);
  const closedCount = useMemo(() => jobsList.filter((j) => j.status === 'CLOSED').length, [jobsList]);
  const totalApplicantsCount = useMemo(() => jobsList.reduce((acc, j) => acc + (j.totalApplicants || 0), 0), [jobsList]);
  const totalAiMatchHighCount = useMemo(() => jobsList.reduce((acc, j) => acc + (j.aiMatchHighCount || 0), 0), [jobsList]);

  // Quick Extend Job Deadline by X days directly
  const handleQuickExtend = async (jobId, daysToAdd = 30) => {
    try {
      const target = jobsList.find((j) => j.id === jobId);
      if (!target) return;

      const baseDate = target.deadlineDate ? new Date(target.deadlineDate) : new Date();
      const newDate = new Date(Math.max(baseDate.getTime(), Date.now()) + daysToAdd * 24 * 60 * 60 * 1000);
      const newDeadlineStr = newDate.toISOString().split('T')[0];

      await jobApi.updateJob(jobId, {
        title: target.title,
        description: target.description || target.title,
        requirements: target.requirements || target.mandatorySkills.join(', '),
        benefits: target.benefits || target.preferredSkills.join(', '),
        location: target.location,
        salaryMin: target.salaryMin,
        salaryMax: target.salaryMax,
        employmentType: target.employmentType || 'FULL_TIME',
        vacanciesCount: target.vacanciesCount || 2,
        deadlineDate: newDeadlineStr,
        status: 'PUBLISHED',
      });

      setJobsList((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, deadlineDate: newDeadlineStr } : j))
      );
      triggerToast(`Đã gia hạn thành công tin "${target.title}" thêm ${daysToAdd} ngày (Hạn mới: ${newDate.toLocaleDateString('vi-VN')})!`);
    } catch (err) {
      triggerToast('Lỗi gia hạn tin: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Kiểm tra số lượng tuyển dụng: phải >= 1, không được âm hoặc bằng 0
      const vacancies = Number(createForm.vacanciesCount);
      if (isNaN(vacancies) || vacancies < 1) {
        triggerToast('⚠️ Số lượng tuyển dụng phải từ 1 người trở lên (không được để trống, số âm hoặc bằng 0).');
        return;
      }

      // 2. Kiểm tra hạn chót nộp hồ sơ: không được là ngày trong quá khứ
      const todayStr = new Date().toISOString().split('T')[0];
      if (createForm.deadlineDate && createForm.deadlineDate < todayStr) {
        triggerToast('⚠️ Hạn chót nộp hồ sơ không được là ngày trong quá khứ (phải từ ngày hiện tại trở đi).');
        return;
      }

      // 3. Phân tích và kiểm tra mức lương
      const salaryStr = (createForm.salary || '').toLowerCase();
      const isTrieu = salaryStr.includes('triệu') || salaryStr.includes('tr');
      const nums = salaryStr.replace(/[^\d.,\-]/g, ' ').split('-').map(s => s.trim()).filter(Boolean);
      
      let salaryMin = createForm.salaryMin;
      let salaryMax = createForm.salaryMax;

      if (nums[0]) {
        const val0 = parseFloat(nums[0].replace(/,/g, '').replace(/\.(?=\d{3})/g, ''));
        if (!isNaN(val0)) salaryMin = isTrieu && val0 < 1000 ? val0 * 1000000 : val0;
      }
      if (nums[1]) {
        const val1 = parseFloat(nums[1].replace(/,/g, '').replace(/\.(?=\d{3})/g, ''));
        if (!isNaN(val1)) salaryMax = isTrieu && val1 < 1000 ? val1 * 1000000 : val1;
      }

      salaryMin = salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : 25000000;
      salaryMax = salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : 45000000;

      if (salaryMin < 0 || salaryMax < 0) {
        triggerToast('⚠️ Mức lương không được là số âm.');
        return;
      }
      if (salaryMax < salaryMin) {
        triggerToast('⚠️ Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.');
        return;
      }

      const mandSkills = (createForm.mandatorySkillsInput || '')
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
      const prefSkills = (createForm.preferredSkillsInput || '')
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const levelMap = {
        INTERN: 'Thực tập sinh (Intern)',
        FRESHER: 'Fresher (Mới ra trường)',
        JUNIOR: 'Junior (1 - 2 năm kinh nghiệm)',
        MIDDLE: 'Middle (2 - 4 năm kinh nghiệm)',
        SENIOR: 'Senior (4 - 6 năm kinh nghiệm)',
        LEAD: 'Tech Lead / Trưởng nhóm',
        MANAGER: 'Quản lý / Director'
      };
      const formattedLevel = levelMap[createForm.jobLevel] || createForm.jobLevel || 'Thực tập sinh (Intern)';

      const criteriaSection = [
        '[TIÊU CHUẨN TUYỂN DỤNG & ĐIỀU KIỆN]',
        `- Cấp bậc tuyển dụng: ${formattedLevel}`,
        `- Yêu cầu bằng cấp / Học vấn: ${createForm.educationRequirement || 'Đại học / Cử nhân'}`,
        `- Kinh nghiệm làm việc: ${createForm.experienceRequirement || 'Không yêu cầu kinh nghiệm'}`,
        `- Môi trường làm việc: ${createForm.workplaceType || 'Hybrid (Linh hoạt)'}`,
        `- Giới tính yêu cầu: ${createForm.genderRequirement || 'Không yêu cầu'}`
      ].join('\n');

      const rawReq = (createForm.requirements || '').trim();
      const compiledRequirements = rawReq.includes('[TIÊU CHUẨN TUYỂN DỤNG')
        ? rawReq
        : `${criteriaSection}\n\n[YÊU CẦU NĂNG LỰC CHI TIẾT]\n${rawReq || '- Nắm vững kiến thức nền tảng và các kỹ năng chuyên môn yêu cầu bên dưới.\n- Tinh thần chủ động, trách nhiệm và khả năng phối hợp nhóm hiệu quả.'}`;

      const payload = {
        title: createForm.title,
        description: createForm.description || '',
        requirements: compiledRequirements,
        benefits: createForm.benefits || '',
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        location: createForm.location,
        employmentType: createForm.employmentType || (createForm.jobLevel === 'INTERN' ? 'INTERNSHIP' : 'FULL_TIME'),
        vacanciesCount: vacancies,
        deadlineDate: createForm.deadlineDate || null,
        mandatorySkills: mandSkills,
        preferredSkills: prefSkills,
        status: 'PUBLISHED',
      };

      await jobApi.createJob(payload);
      triggerToast(`🎉 Đã xuất bản thành công tin tuyển dụng mới: "${createForm.title}"!`);
      setShowCreateModal(false);
      setCreateForm(getInitialCreateForm());
      setLastScannedData(null);
      await fetchMyJobs();
    } catch (err) {
      triggerToast('Lỗi khi đăng tin: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      // 1. Kiểm tra số lượng tuyển dụng
      const vacancies = Number(editingJob.vacanciesCount);
      if (isNaN(vacancies) || vacancies < 1) {
        triggerToast('⚠️ Số lượng tuyển dụng phải từ 1 người trở lên (không được để trống, số âm hoặc bằng 0).');
        return;
      }

      // 2. Kiểm tra hạn chót nộp hồ sơ
      const todayStr = new Date().toISOString().split('T')[0];
      if (editingJob.deadlineDate && editingJob.deadlineDate < todayStr) {
        triggerToast('⚠️ Hạn chót nộp hồ sơ không được là ngày trong quá khứ (phải từ ngày hiện tại trở đi).');
        return;
      }

      // 3. Phân tích mức lương
      const salaryStr = (editingJob.salary || '').toLowerCase();
      const isTrieu = salaryStr.includes('triệu') || salaryStr.includes('tr');
      const nums = salaryStr.replace(/[^\d.,\-]/g, ' ').split('-').map(s => s.trim()).filter(Boolean);
      let salaryMin = editingJob.salaryMin;
      let salaryMax = editingJob.salaryMax;

      if (nums[0]) {
        const val0 = parseFloat(nums[0].replace(/,/g, '').replace(/\.(?=\d{3})/g, ''));
        if (!isNaN(val0)) salaryMin = isTrieu && val0 < 1000 ? val0 * 1000000 : val0;
      }
      if (nums[1]) {
        const val1 = parseFloat(nums[1].replace(/,/g, '').replace(/\.(?=\d{3})/g, ''));
        if (!isNaN(val1)) salaryMax = isTrieu && val1 < 1000 ? val1 * 1000000 : val1;
      }

      salaryMin = salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : 25000000;
      salaryMax = salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : 45000000;

      if (salaryMin < 0 || salaryMax < 0) {
        triggerToast('⚠️ Mức lương không được là số âm.');
        return;
      }
      if (salaryMax < salaryMin) {
        triggerToast('⚠️ Mức lương tối đa không được nhỏ hơn mức lương tối thiểu.');
        return;
      }

      const mandSkills = (editingJob.mandatorySkillsInput || '')
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
      const prefSkills = (editingJob.preferredSkillsInput || '')
        .split(/[,;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        title: editingJob.title,
        description: editingJob.description || '',
        requirements: editingJob.requirements || '',
        benefits: editingJob.benefits || '',
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        location: editingJob.location,
        employmentType: editingJob.employmentType || editingJob.raw?.employmentType || 'FULL_TIME',
        vacanciesCount: vacancies,
        deadlineDate: editingJob.deadlineDate || null,
        mandatorySkills: mandSkills,
        preferredSkills: prefSkills,
        status: editingJob.status === 'ACTIVE' ? 'PUBLISHED' : editingJob.status === 'CLOSED' ? 'CLOSED' : 'DRAFT',
      };

      await jobApi.updateJob(editingJob.id, payload);
      triggerToast(`🎉 Đã cập nhật thành công tin tuyển dụng ${editingJob.code}!`);
      setShowEditModal(false);
      await fetchMyJobs();
    } catch (err) {
      triggerToast('Lỗi khi cập nhật tin tuyển dụng: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (jobId) => {
    const currentJob = jobsList.find((j) => j.id === jobId);
    if (!currentJob) return;
    const nextStatus = currentJob.status === 'ACTIVE' ? 'CLOSED' : 'PUBLISHED';
    try {
      await jobApi.updateJobStatus(jobId, nextStatus);
      triggerToast(`Trạng thái tin ${currentJob.code} đã cập nhật sang: ${nextStatus === 'PUBLISHED' ? 'Đang bật tuyển' : 'Đã đóng'}`);
      await fetchMyJobs();
    } catch (err) {
      triggerToast('Lỗi khi đổi trạng thái tin tuyển dụng: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCopyLink = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#/jobs?code=${code}`);
      triggerToast(`Đã sao chép link ứng tuyển vị trí ${code}!`);
    } else {
      triggerToast(`Link ứng tuyển: ${code}`);
    }
  };

  return (
    <div className="recruiter-job-page recruiter-page w-full bg-transparent font-sans text-[#221d47] antialiased min-h-screen pb-16 selection:bg-[#5b48bd] selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#221d47] text-white border border-purple-300/30 text-xs font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-xl animate-fade-in">
          <span className="material-symbols-outlined text-[#10b981] text-base">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Ambient Purple Halos */}
      <div className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-10 py-8 space-y-8 max-w-7xl mx-auto">
        <div className="absolute top-10 left-10 w-80 h-80 bg-[#5b48bd]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-10 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Page Title & Quick Pulse Banner */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#edeafd] text-[#5b48bd] border border-[#d6cefa] uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Hệ Thống Quản Trị Tuyển Dụng AI</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47] tracking-tight">
              Quản Lý Tin Tuyển Dụng
            </h1>
          </div>

          {/* Live Activity & Subscription Status Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.hash = '#/recruiter-pricing'; }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-105 border border-amber-300/40"
              title="Mua gói dịch vụ hoặc mua thêm tin tuyển dụng nổi bật"
            >
              <span className="material-symbols-outlined text-sm font-bold animate-bounce">workspace_premium</span>
              <span>Nâng Cấp Gói &amp; Mua Tin</span>
            </button>

            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-white/90 border border-purple-100 shadow-sm text-xs backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
              <div className="text-xs">
                <span className="text-slate-500">Đồng bộ AI Engine:</span>
                <span className="text-[#221d47] font-semibold ml-1">2 phút trước</span>
              </div>
            </div>
          </div>
        </div>

        {/* COMPANY GPKD VERIFICATION ALERT BANNER */}
        {companyStatus !== 'VERIFIED' && companyStatus !== 'ACTIVE' && (
          <div className="relative z-10 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 text-amber-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in font-sans">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-2xl">pending_actions</span>
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-sm sm:text-base flex items-center gap-2 flex-wrap">
                  <span>Hồ Sơ Doanh Nghiệp Đang Chờ Admin Xác Minh GPKD</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                    {companyStatus === 'PENDING' ? 'Chờ Duyệt (PENDING)' : companyStatus === 'REJECTED' ? 'Bị Từ Chối (REJECTED)' : 'Chưa Xác Thực'}
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  {companyStatus === 'REJECTED'
                    ? 'Hồ sơ pháp lý của doanh nghiệp đã bị Admin từ chối. Vui lòng bấm vào đây để cập nhật lại Mã số thuế và bản scan Giấy phép kinh doanh.'
                    : 'Doanh nghiệp của bạn cần được Ban Quản Trị Admin phê duyệt Giấy phép kinh doanh (GPKD) trước khi có thể xuất bản bài đăng tuyển dụng ra trang chủ.'}
                </p>
              </div>
            </div>
            <a
              href="#/recruiter/profile"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-full text-xs font-bold whitespace-nowrap shadow-md flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Cập nhật GPKD ngay</span>
            </a>
          </div>
        )}

        {/* 4 Clean Metric Cards (Mindskills Palette) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Metric 1 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Vị Trí Đang Mở</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47]">{activeCount}</span>
                  <span className="text-xs text-[#10b981] font-semibold">/ {jobsList.length} tổng tin</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#edeafd] border border-purple-200 flex items-center justify-center text-[#5b48bd] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">work_outline</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" /> {activeCount} Đang tuyển &bull; {pausedCount} Tạm dừng
              </span>
              <span className="text-[#5b48bd] font-bold">{jobsList.length > 0 ? Math.round((activeCount / jobsList.length) * 100) : 0}% Active</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Tổng Hồ Sơ Đã Nộp</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47]">{totalApplicantsCount}</span>
                  <span className="text-xs text-[#0284c7] font-semibold">tổng CV</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0284c7] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">folder_shared</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <span>Trung bình {jobsList.length > 0 ? (totalApplicantsCount / jobsList.length).toFixed(1) : 0} hồ sơ/job</span>
              <span className="text-[#10b981] font-bold">Dữ liệu Supabase</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-6 rounded-[24px] bg-white border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">AI Match &gt; 80%</p>
                <div className="flex items-baseline gap-2 mt-2 flex-nowrap">
                  <span className="text-3xl lg:text-4xl font-sans font-extrabold text-[#221d47] shrink-0">{totalAiMatchHighCount}</span>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ứng viên tiềm năng</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#5b48bd] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <div className="w-2/3 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#5b48bd] h-full rounded-full"
                  style={{ width: `${totalApplicantsCount > 0 ? Math.min(100, Math.round((totalAiMatchHighCount / totalApplicantsCount) * 100)) : 0}%` }}
                />
              </div>
              <span className="text-[#5b48bd] font-bold">
                {totalApplicantsCount > 0 ? Math.round((totalAiMatchHighCount / totalApplicantsCount) * 100) : 0}% Tỷ lệ
              </span>
            </div>
          </div>

          {/* Metric 4: Quản Trị Hạn Chót Tuyển Dụng */}
          <div className={`p-6 rounded-[24px] bg-white border shadow-sm hover:shadow-md transition-all group ${
            expiredCount > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-purple-100/80'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Hạn Chót Tuyển Dụng</p>
                <div className="flex items-baseline gap-2 mt-2 flex-nowrap">
                  <span className={`text-2xl lg:text-3xl font-sans font-extrabold shrink-0 ${
                    expiredCount > 0 ? 'text-rose-600' : 'text-[#10b981]'
                  }`}>
                    {expiredCount > 0 ? `${expiredCount} Quá Hạn` : `${activeCount} Đúng Hạn`}
                  </span>
                  {expiringSoonCount > 0 && (
                    <span className="text-xs text-amber-600 font-bold whitespace-nowrap bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {expiringSoonCount} sắp hết
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
                expiredCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-[#10b981]'
              }`}>
                <span className="material-symbols-outlined text-[22px]">{expiredCount > 0 ? 'event_busy' : 'schedule'}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-600 border-t border-purple-100">
              <span className="text-slate-500">
                {expiredCount > 0 ? `Cần kiểm tra và gia hạn ${expiredCount} tin` : 'Tất cả tin tuyển đang trong hạn'}
              </span>
              {expiredCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('EXPIRED')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Lọc ngay</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              ) : (
                <span className="text-[#10b981] font-bold">Live Supabase</span>
              )}
            </div>
          </div>
        </div>

        {/* Filter, Search & Action Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[28px] bg-white border border-purple-100/80 shadow-sm overflow-hidden">
          {/* Search Box & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f7ff] text-[#221d47] placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-full focus:outline-none focus:border-[#5b48bd] focus:ring-2 focus:ring-[#5b48bd]/20 focus:bg-white transition-all border border-purple-100 font-sans"
                placeholder="Tìm theo chức danh, tech stack (Java, React...)"
                type="text"
              />
            </div>

            {/* Segmented Category Tabs with Overdue & Expiring Soon */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#f4f2fd] rounded-full overflow-x-auto text-xs border border-purple-100 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'ALL'
                  ? 'bg-[#5b48bd] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Tất cả</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">({jobsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('ACTIVE')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'ACTIVE'
                  ? 'bg-[#10b981] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Đang bật tuyển</span>
                <span className="text-[10px] opacity-90">({activeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('EXPIRING_SOON')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'EXPIRING_SOON'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-amber-700 hover:bg-amber-100/70'
                  }`}
              >
                <span className="material-symbols-outlined text-[14px]">alarm</span>
                <span>Sắp hết hạn</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedCategory === 'EXPIRING_SOON' ? 'bg-white/25' : 'bg-amber-100 text-amber-800'}`}>({expiringSoonCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('EXPIRED')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'EXPIRED'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-rose-700 hover:bg-rose-100/70'
                  }`}
              >
                <span className="material-symbols-outlined text-[14px]">event_busy</span>
                <span>Đã quá hạn</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedCategory === 'EXPIRED' ? 'bg-white/25' : 'bg-rose-100 text-rose-800'}`}>({expiredCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('PAUSED')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'PAUSED'
                  ? 'bg-[#f97316] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Tạm dừng</span>
                <span className="text-[10px] opacity-90">({pausedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('CLOSED')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${selectedCategory === 'CLOSED'
                  ? 'bg-[#64748b] text-white shadow-md'
                  : 'text-[#47369f] hover:bg-white/60'
                  }`}
              >
                <span>Đã đóng</span>
                <span className="text-[10px] opacity-90">({closedCount})</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-purple-50 text-[#5b48bd] text-xs font-bold transition-all border border-purple-200 cursor-pointer shadow-sm whitespace-nowrap"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-[#5b48bd]">ios_share</span>
              <span>Xuất Báo Cáo</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap hover:scale-105"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Đăng Tin Mới</span>
            </button>
          </div>
        </div>

        {/* Job Cards Grid - Equal height balanced cards */}
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-5">
          {isLoading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 bg-white/60 rounded-[32px] border border-purple-100">
              <span className="material-symbols-outlined text-4xl text-[#5b48bd] animate-spin">progress_activity</span>
              <p className="text-xs font-semibold text-[#5b48bd]">Đang kết nối và đồng bộ tin tuyển dụng từ Supabase Cloud...</p>
            </div>
          )}

          {!isLoading && filteredJobs.length === 0 && (
            <div className="col-span-full py-16 px-6 text-center bg-white rounded-[32px] border border-dashed border-purple-200 shadow-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#edeafd] flex items-center justify-center text-[#5b48bd] mb-3">
                <span className="material-symbols-outlined text-3xl">post_add</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">Chưa có tin tuyển dụng nào phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-5">
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Không tìm thấy tin tuyển dụng nào theo bộ lọc tìm kiếm hiện tại. Hãy thử chọn Tất cả hoặc từ khóa khác.'
                  : 'Dữ liệu thực tế từ cơ sở dữ liệu Supabase. Hãy bấm nút Đăng Tin Mới để bắt đầu thu hút ứng viên và áp dụng AI matching.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-6 py-2.5 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                + Đăng Tin Tuyển Dụng Ngay
              </button>
            </div>
          )}
          {paginatedJobs.map((job) => {
            const deadlineInfo = calculateJobDeadline(job.deadlineDate);
            return (
            <div
              key={job.id}
              className={`flex flex-col h-full p-5 sm:p-5.5 rounded-[24px] bg-white border transition-all duration-300 group font-sans shadow-xs hover:shadow-xl ${
                deadlineInfo.isExpired
                  ? 'border-rose-200 hover:border-rose-300 bg-gradient-to-b from-rose-50/15 via-white to-white'
                  : deadlineInfo.isExpiringSoon
                  ? 'border-amber-200 hover:border-amber-300 bg-gradient-to-b from-amber-50/15 via-white to-white'
                  : 'border-slate-200/90 hover:border-purple-300'
              }`}
            >
              {/* Top / Main Body (Stretches smoothly) */}
              <div className="flex flex-col gap-3">
                {/* 1. Header Row: Badges, Code & Author Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap min-h-[26px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border flex items-center gap-1 ${
                        job.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : job.status === 'CLOSED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          job.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span>{job.badgeText}</span>
                    </span>

                    {/* Deadline Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border flex items-center gap-1 shadow-2xs ${deadlineInfo.badgeClass}`}
                      title={deadlineInfo.deadlineFormatted ? `Hạn chót: ${deadlineInfo.deadlineFormatted}` : 'Không giới hạn thời gian'}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {deadlineInfo.isExpired ? 'event_busy' : deadlineInfo.isExpiringSoon ? 'alarm' : 'schedule'}
                      </span>
                      <span>{deadlineInfo.label}</span>
                    </span>

                    {/* Code */}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-100/90 text-slate-600 border border-slate-200/70">
                      {job.code}
                    </span>
                  </div>

                  {/* Right Header: Author & Approval Status */}
                  <div className="flex items-center gap-2">
                    {canDeleteJob(job) ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5b48bd] border border-purple-200/80 flex items-center gap-1" title="Tin tuyển dụng do bạn đăng">
                        <span className="material-symbols-outlined text-[12px] text-[#5b48bd]">person</span>
                        <span>Bài của tôi</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1" title={`Đăng bởi: ${job.recruiterName || 'Đồng nghiệp'}`}>
                        <span className="material-symbols-outlined text-[12px] text-slate-400">group</span>
                        <span className="truncate max-w-[100px]">{job.recruiterName || 'Đồng nghiệp'}</span>
                      </span>
                    )}

                    {/* Toggle Approval & Pause Button */}
                    {job.approvalStatus === 'PENDING' ? (
                      <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Chờ duyệt</span>
                      </span>
                    ) : job.approvalStatus === 'REJECTED' ? (
                      <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Từ chối</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(job.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          job.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Bấm để Tạm dừng / Tiếp tục tuyển"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{job.status === 'ACTIVE' ? 'Đang tuyển' : 'Tạm dừng'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Job Title - Exact same height on all cards */}
                <div className="min-h-[28px] flex items-center">
                  <h2
                    onClick={() => {
                      window.location.hash = `#/jobs/${job.id}`;
                    }}
                    className="text-lg lg:text-xl font-bold text-slate-900 group-hover:text-[#5b48bd] transition-colors cursor-pointer flex items-center gap-2 leading-snug line-clamp-1"
                    title={job.title}
                  >
                    <span className="capitalize truncate">{job.title}</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-[#5b48bd] transition-colors shrink-0">open_in_new</span>
                  </h2>
                </div>

                {/* 3. Primary Meta Row: Salary, Location, Company - Exact same height */}
                <div className="flex flex-wrap items-center gap-2 min-h-[28px]">
                  {/* Salary */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-xs">
                    <span className="material-symbols-outlined text-[15px] text-amber-600">payments</span>
                    <span>{job.salary}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 font-medium text-xs">
                    <span className="material-symbols-outlined text-[15px] text-slate-500">location_on</span>
                    <span>{job.location}</span>
                  </div>

                  {/* Domain/Company */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-100 font-medium text-xs">
                    <span className="material-symbols-outlined text-[15px] text-[#5b48bd]">{job.domainIcon}</span>
                    <span>{job.domain}</span>
                  </div>
                </div>

                {/* Overdue Alert Banner or Active Status Note - Fixed min-h-[42px] for perfect balance across cards */}
                {deadlineInfo.isExpired ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs gap-2 min-h-[42px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-rose-600 text-[17px] shrink-0">warning</span>
                      <span className="truncate">
                        <strong>Quá hạn:</strong> {deadlineInfo.alertMessage || 'Đã hết hạn nộp hồ sơ.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickExtend(job.id, 30)}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                      title="Gia hạn thêm 30 ngày cho tin này"
                    >
                      <span className="material-symbols-outlined text-[13px]">update</span>
                      <span>Gia hạn +30 ngày</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-200/70 text-emerald-950 text-xs gap-2 min-h-[42px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-emerald-600 text-[17px] shrink-0">check_circle</span>
                      <span className="truncate font-medium">
                        <strong>Đang mở tuyển:</strong> {deadlineInfo.label || 'Sẵn sàng tiếp nhận hồ sơ ứng viên.'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                      Đang nhận CV
                    </span>
                  </div>
                )}

                {/* 4. Skills 70/30 Matrix Preview (Capped & Balanced) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 min-h-[66px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[10px] uppercase font-black text-[#5b48bd] tracking-wider shrink-0 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      Bắt buộc (70%):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {job.mandatorySkills.slice(0, 3).map((sk) => (
                        <span key={sk} className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50/70 text-purple-900 border border-purple-200/60 truncate max-w-[150px]">
                          {sk}
                        </span>
                      ))}
                      {job.mandatorySkills.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-[#5b48bd]" title={job.mandatorySkills.slice(3).join(', ')}>
                          +{job.mandatorySkills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-[10px] uppercase font-black text-emerald-700 tracking-wider shrink-0 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Ưu tiên (30%):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {job.preferredSkills.slice(0, 2).map((sk) => (
                        <span key={sk} className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50/70 text-emerald-900 border border-emerald-200/60 truncate max-w-[150px]">
                          {sk}
                        </span>
                      ))}
                      {job.preferredSkills.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700" title={job.preferredSkills.slice(2).join(', ')}>
                          +{job.preferredSkills.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Highlight Stats Box & Action Bar (Pinned perfectly to bottom) */}
              <div className="mt-auto pt-3.5 space-y-3">
                {/* 5. Highlight Stats Box: Hồ sơ & AI Match metrics */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/60 via-slate-50 to-indigo-50/40 flex items-center justify-between gap-3 border border-purple-100/70 min-h-[58px]">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hồ sơ đã nộp</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
                        {job.totalApplicants} <span className="text-xs font-normal text-slate-400">CVs</span>
                      </div>
                    </div>

                    <div className="h-8 w-px bg-purple-200/60" />

                    <div>
                      <div className="text-[10px] font-bold text-[#5b48bd] uppercase tracking-wide flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-[#5b48bd]">auto_awesome</span>
                        AI Match &gt; 80%
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-[#5b48bd] mt-0.5 flex items-baseline gap-1">
                        {job.aiMatchHighCount} <span className="text-xs font-semibold text-[#5b48bd]/80">ứng viên</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Candidates Avatars */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 hidden sm:inline">Top ứng viên:</span>
                    <div className="flex -space-x-2 overflow-hidden">
                      {job.topCandidateAvatars.length > 0 ? (
                        job.topCandidateAvatars.map((av, idx) => (
                          <img
                            key={idx}
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-2xs inline-block"
                            src={av}
                            alt="Candidate avatar"
                          />
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chờ ứng viên...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Action Bar - Identical, balanced, single row with no huge gaps or offset buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* Secondary Actions (Xem, Sửa, Link, Xóa) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        window.location.hash = `#/jobs/${job.id}`;
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5b48bd] text-xs font-semibold transition-all flex items-center gap-1 border border-slate-200 hover:border-purple-200 cursor-pointer shadow-2xs shrink-0"
                      type="button"
                      title="Xem chi tiết bài đăng tuyển dụng"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#5b48bd]">visibility</span>
                      <span>Xem bài</span>
                    </button>

                    <button
                      onClick={() => {
                        const reqStr = String(job.requirements || '');
                        const levelMatch = reqStr.match(/(?:Cấp bậc|Vị trí)(?:\s+tuyển dụng)?:\s*([^\n\r]+)/i);
                        const eduMatch = reqStr.match(/(?:Yêu cầu bằng cấp|Bằng cấp|Trình độ học vấn|Học vấn):\s*([^\n\r]+)/i);
                        const expMatch = reqStr.match(/(?:Kinh nghiệm làm việc|Kinh nghiệm):\s*([^\n\r]+)/i);
                        const wpMatch = reqStr.match(/(?:Môi trường làm việc|Môi trường|Hình thức làm việc):\s*([^\n\r]+)/i);
                        const genMatch = reqStr.match(/(?:Giới tính|Giới tính yêu cầu):\s*([^\n\r]+)/i);

                        const detectedLevel = levelMatch ? levelMatch[1].trim()
                          : (job.title?.toLowerCase().includes('intern') ? 'INTERN' : job.title?.toLowerCase().includes('senior') ? 'SENIOR' : 'MIDDLE');

                        setEditingJob({
                          ...job,
                          jobLevel: detectedLevel.includes('Intern') ? 'INTERN' : detectedLevel.includes('Fresher') ? 'FRESHER' : detectedLevel.includes('Senior') ? 'SENIOR' : detectedLevel.includes('Junior') ? 'JUNIOR' : detectedLevel.includes('Lead') ? 'LEAD' : detectedLevel.includes('Manager') ? 'MANAGER' : 'MIDDLE',
                          educationRequirement: eduMatch ? eduMatch[1].trim() : 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)',
                          experienceRequirement: expMatch ? expMatch[1].trim() : (job.title?.toLowerCase().includes('intern') ? 'Không yêu cầu kinh nghiệm (Intern/Fresher)' : '1 - 2 năm kinh nghiệm'),
                          workplaceType: wpMatch ? wpMatch[1].trim() : (job.location?.toLowerCase().includes('remote') ? 'Remote (100% từ xa)' : 'Hybrid (Linh hoạt)'),
                          genderRequirement: genMatch ? genMatch[1].trim() : 'Không yêu cầu',
                          mandatorySkillsInput: Array.isArray(job.mandatorySkills) && job.mandatorySkills.length > 0
                            ? job.mandatorySkills.join(', ')
                            : (Array.isArray(job.raw?.mandatorySkills) ? job.raw.mandatorySkills.join(', ') : ''),
                          preferredSkillsInput: Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0
                            ? job.preferredSkills.join(', ')
                            : (Array.isArray(job.raw?.preferredSkills) ? job.raw.preferredSkills.join(', ') : ''),
                        });
                        setShowEditModal(true);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5b48bd] text-xs font-semibold transition-all flex items-center gap-1 border border-slate-200 hover:border-purple-200 cursor-pointer shadow-2xs shrink-0"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px] text-slate-500">edit</span>
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(job.code)}
                      className="p-1.5 rounded-xl bg-white hover:bg-purple-50 text-slate-500 hover:text-[#5b48bd] transition-all border border-slate-200 hover:border-purple-200 cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                      title="Sao chép link ứng tuyển"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                    </button>

                    {canDeleteJob(job) ? (
                      <button
                        onClick={() => setJobToDelete(job)}
                        className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                        title="Xóa vĩnh viễn tin tuyển dụng này"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px] text-rose-500">delete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerToast(`Bạn không có quyền xóa tin này. Tin do chuyên viên ${job.recruiterName || 'khác'} đăng!`)}
                        className="p-1.5 rounded-xl bg-slate-50 text-slate-300 transition-all border border-slate-200 cursor-not-allowed shadow-2xs flex items-center justify-center shrink-0 opacity-60"
                        title={`Tin này do ${job.recruiterName || 'chuyên viên khác'} đăng`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                      </button>
                    )}
                  </div>

                  {/* Primary CTA */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => {
                        window.location.hash = `#/applicants-management?jobId=${job.id}`;
                      }}
                      className="px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">group</span>
                      <span>Quản lý {job.totalApplicants} ứng viên</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Executive Pagination Bar */}
        {filteredJobs.length > 0 && (
          <div className="relative z-10 bg-white/95 backdrop-blur-xs p-4 sm:p-5 rounded-[24px] border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-[#1e1b4b]">{(validCurrentPage - 1) * PAGE_SIZE + 1}</span> - <span className="font-bold text-[#1e1b4b]">{Math.min(validCurrentPage * PAGE_SIZE, filteredJobs.length)}</span> trong tổng số <span className="font-bold text-[#5b48bd]">{filteredJobs.length}</span> tin tuyển dụng
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  validCurrentPage <= 1
                    ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                    : 'text-[#47369f] bg-purple-50/80 hover:bg-[#5b48bd] hover:text-white border border-purple-200 cursor-pointer shadow-2xs'
                }`}
                title="Trang trước"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span className="hidden sm:inline">Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                      validCurrentPage === pageNum
                        ? 'bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] text-white shadow-sm font-extrabold scale-105'
                        : 'text-slate-600 hover:text-[#5b48bd] hover:bg-purple-50 border border-transparent hover:border-purple-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  validCurrentPage >= totalPages
                    ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-100'
                    : 'text-[#47369f] bg-purple-50/80 hover:bg-[#5b48bd] hover:text-white border border-purple-200 cursor-pointer shadow-2xs'
                }`}
                title="Trang tiếp"
              >
                <span className="hidden sm:inline">Tiếp</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL CẢNH BÁO: DOANH NGHIỆP CHƯA ĐƯỢC XÁC MINH GPKD      */}
      {/* ======================================================== */}
      {showUnverifiedWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl shadow-2xl text-slate-800 overflow-hidden">
            
            {/* Top Accent Gradient Bar */}
            <div className={`h-2.5 w-full bg-gradient-to-r ${
              companyStatus === 'REJECTED' ? 'from-rose-500 via-red-500 to-amber-500' : 'from-amber-500 via-orange-500 to-yellow-400'
            }`} />

            <div className="p-6 sm:p-7">
              {/* Header with Icon and Close Button */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    companyStatus === 'REJECTED' ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {companyStatus === 'REJECTED' ? 'cancel' : 'verified_user'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      Yêu Cầu Xác Minh Doanh Nghiệp
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        companyStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : companyStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {companyStatus === 'PENDING' ? 'Chờ Duyệt GPKD (PENDING)' : companyStatus === 'REJECTED' ? 'Bị Từ Chối GPKD (REJECTED)' : 'Chưa Xác Minh GPKD'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUnverifiedWarningModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Main message */}
              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed mb-6">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 font-medium">
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">policy</span>
                    <span>
                      Theo Điều 23 Nghị định 23/2021/NĐ-CP và chính sách an toàn của <strong>HireMate AI</strong>, <strong>Nhà tuyển dụng chỉ được phép đăng bài tuyển dụng khi Doanh nghiệp đã được xác minh Giấy phép kinh doanh (GPKD) hợp pháp.</strong>
                    </span>
                  </p>
                </div>

                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                    <span>Lợi ích khi hoàn tất xác minh Doanh nghiệp:</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-slate-500">
                    <li><strong className="text-slate-700">Bảo vệ ứng viên:</strong> Loại bỏ hoàn toàn nguy cơ tin tuyển dụng mạo danh, lừa đảo.</li>
                    <li><strong className="text-slate-700">Tăng độ uy tín:</strong> Bài đăng từ công ty đã xác thực đạt tỷ lệ nộp CV cao hơn 45%.</li>
                    <li><strong className="text-slate-700">Mở khóa toàn diện:</strong> Đăng tin tuyển dụng và sử dụng AI Interview Studio.</li>
                  </ul>
                </div>

                {/* Specific Status Alert */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                  {companyStatus === 'PENDING' && (
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-sm">schedule</span>
                      <span>Hồ sơ GPKD của bạn đang trong hàng đợi thẩm duyệt của Ban Quản Trị (dự kiến 1 - 4 giờ làm việc). Vui lòng kiên nhẫn chờ phê duyệt!</span>
                    </p>
                  )}
                  {companyStatus === 'REJECTED' && (
                    <p className="flex items-center gap-2 text-rose-700">
                      <span className="material-symbols-outlined text-rose-600 text-sm">error</span>
                      <span>Hồ sơ GPKD trước đó bị Admin từ chối do hình ảnh mờ hoặc thông tin MST chưa khớp. Vui lòng cập nhật lại hồ sơ mới.</span>
                    </p>
                  )}
                  {companyStatus !== 'PENDING' && companyStatus !== 'REJECTED' && (
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-500 text-sm">upload_file</span>
                      <span>Doanh nghiệp chưa hoàn thiện nộp Giấy phép kinh doanh. Vui lòng tải lên bản chụp GPKD / Giấy đăng ký kinh doanh hợp lệ.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnverifiedWarningModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                >
                  Đã hiểu / Để sau
                </button>
                <a
                  href="#/recruiter/profile"
                  onClick={() => setShowUnverifiedWarningModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>Cập Nhật GPKD Doanh Nghiệp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TẠO TIN TUYỂN DỤNG MỚI (EXECUTIVE AI STUDIO)      */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-6xl xl:max-w-7xl bg-[#fafafc] border border-slate-200/90 rounded-[28px] max-h-[92vh] flex flex-col shadow-2xl text-slate-800 overflow-hidden">
            
            {/* Modal Header: Modern Executive SaaS Studio */}
            <div className="px-6 sm:px-8 py-4.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between gap-4 text-slate-800 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#7c3aed] to-[#ec4899] text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0 border border-white/20">
                  <span className="material-symbols-outlined text-xl">auto_awesome</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-sans">
                      Studio Đăng Tin Tuyển Dụng AI
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                      Gemini 1.5 Multimodal • Chuẩn 70/30 ATS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                    Tự động bóc tách JD qua tài liệu/ảnh OCR, chuẩn hóa ma trận kỹ năng và trực quan hóa thẻ tin song song theo thời gian thực
                  </p>
                </div>
              </div>

              {/* Right Controls: Permanent Split View Badge & Close Button */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/70 text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm text-indigo-600">vertical_split</span>
                  <span>Giao Diện Song Song (Split Studio)</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer border border-slate-200/60"
                  title="Đóng cửa sổ"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body Container: Permanent 2-Column Split Studio */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#fafafc]">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ======================================================== */}
                {/* LEFT COLUMN: FORM STUDIO & UNIFIED AI INTAKE (7 COLS)    */}
                {/* ======================================================== */}
                <div className="space-y-5 lg:col-span-7 xl:col-span-7">
                  
                  {/* UNIFIED AI SMART INTAKE (DÁN TRỰC TIẾP, GÕ HOẶC KÉO THẢ TỆP TRONG 1 KHỐI DUY NHẤT) */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <span className="material-symbols-outlined text-lg">document_scanner</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                            <span>Quét &amp; Bóc Tách Bằng AI (Gemini Multimodal OCR)</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200/60">Auto-Fill</span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Dán nội dung JD trực tiếp hoặc kéo thả / đính kèm file để AI tự động trích xuất các ô thông tin
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Unified Interactive Box (Textarea + Drag-drop + Attachment) */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleJdFileUpload({ target: { files: e.dataTransfer.files } });
                        }
                      }}
                      className={`rounded-xl border transition-all ${
                        isDraggingFile
                          ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100'
                      }`}
                    >
                      <textarea
                        rows={4}
                        value={rawJdText}
                        onChange={(e) => setRawJdText(e.target.value)}
                        placeholder="Dán nội dung tin tuyển dụng (JD) từ LinkedIn, TopCV, email... hoặc kéo thả file JD (PDF, Word, Ảnh) trực tiếp vào khung này để AI bóc tách..."
                        className="w-full bg-transparent p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed font-sans"
                      />

                      {/* Integrated Action Toolbar inside the intake box */}
                      <div className="px-3 py-2 bg-white/90 border-t border-slate-200/70 rounded-b-xl flex items-center justify-between gap-2 flex-wrap">
                        {/* File input attachment */}
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleJdFileUpload}
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            id="unified-jd-file-input"
                            disabled={isScanningJd}
                          />
                          <label
                            htmlFor="unified-jd-file-input"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 cursor-pointer transition-colors shadow-2xs ${
                              isScanningJd ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Tải lên tài liệu hoặc ảnh chụp JD"
                          >
                            <span className="material-symbols-outlined text-[15px] text-indigo-600">attach_file</span>
                            <span>Đính kèm file / Ảnh chụp JD</span>
                          </label>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            Hỗ trợ .pdf, .docx, .png, .jpg
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {rawJdText.trim() && (
                            <button
                              type="button"
                              onClick={() => setRawJdText('')}
                              className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer transition-colors"
                            >
                              Xóa nội dung
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleScanRawJdText}
                            disabled={isScanningJd || !rawJdText.trim()}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isScanningJd ? (
                              <>
                                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                <span>Đang phân tích...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                <span>Phân Tích Bằng AI</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status indicator during file scan */}
                    {isScanningJd && (
                      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2.5 animate-pulse">
                        <span className="material-symbols-outlined text-base animate-spin text-indigo-600">sync</span>
                        <span className="font-semibold">
                          AI Gemini đang đọc và bóc tách dữ liệu từ <strong>{jdScanFileName}</strong>... Trích xuất chức danh, dải lương và ma trận kỹ năng 70/30.
                        </span>
                      </div>
                    )}

                    {/* Success status banner */}
                    {jdScanSuccess && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-fade-in flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-base text-emerald-600 shrink-0">check_circle</span>
                          <span className="text-xs">
                            Đã bóc tách thành công từ <strong>{jdScanFileName}</strong>! Đã tự động điền các ô thông tin vào form.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {lastScannedData && (
                            <button
                              type="button"
                              onClick={handleApplyAllScannedData}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                              title="Ghi đè tất cả các trường bằng toàn bộ dữ liệu bóc tách từ file"
                            >
                              Ghi đè tất cả
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setJdScanSuccess(false)}
                            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FORM FIELDS CONTAINER */}
                  <form onSubmit={handleCreateSubmit} className="space-y-5 text-xs font-sans">
                    
                    {/* SECTION 1: CORE ATTRIBUTES & CATEGORY */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-600 text-lg">badge</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                            1. Thông Tin Vị Trí &amp; Phân Loại
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">Bắt buộc (*)</span>
                      </div>

                      {/* Row 1: Title & Code */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">
                            Tiêu Đề Vị Trí Tuyển Dụng *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Senior Backend Engineer (Java / Distributed Systems)"
                            value={createForm.title}
                            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans font-semibold text-xs outline-none"
                          />
                          {/* Quick Role Suggestions */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] text-slate-400">Gợi ý:</span>
                            {['Intern Backend (Java)', 'Senior Frontend (React)', 'Fullstack Engineer', 'AI / Data Engineer'].map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, title: role })}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                            <span>Mã Vị Trí (JD Code)</span>
                            <button
                              type="button"
                              onClick={() => setCreateForm({ ...createForm, code: 'JD-REQ-' + Math.floor(100 + Math.random() * 900) })}
                              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                            >
                              <span className="material-symbols-outlined text-[12px]">refresh</span>
                              <span>Tạo mới</span>
                            </button>
                          </label>
                          <input
                            type="text"
                            required
                            value={createForm.code}
                            onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 font-mono font-bold text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Row 2: Domain & Employment Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">
                            Lĩnh Vực / Chuyên Môn *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ví dụ: Công nghệ thông tin / Phần mềm"
                            value={createForm.domain}
                            onChange={(e) => setCreateForm({ ...createForm, domain: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 font-sans outline-none text-xs"
                          />
                          {/* Domain quick pills */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {['Công Nghệ Thông Tin', 'Fintech', 'Trí Tuệ Nhân Tạo', 'E-Commerce'].map((dom) => (
                              <button
                                key={dom}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, domain: dom })}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                {dom}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">
                            Hình Thức Làm Việc *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'FULL_TIME', label: 'Toàn thời gian', icon: 'work' },
                              { id: 'PART_TIME', label: 'Bán thời gian', icon: 'schedule' },
                              { id: 'CONTRACT', label: 'Hợp đồng / Hybrid', icon: 'apartment' },
                              { id: 'INTERNSHIP', label: 'Thực tập sinh', icon: 'school' },
                            ].map((mode) => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, employmentType: mode.id })}
                                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                  createForm.employmentType === mode.id
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">{mode.icon}</span>
                                <span className="text-[11px] font-bold truncate">{mode.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: POSITION LEVEL, EDUCATION & ELIGIBILITY */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-600 text-lg">school</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                            2. Cấp Bậc, Bằng Cấp &amp; Tiêu Chuẩn Tuyển Dụng
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                          Chuẩn ATS &amp; Học Vấn
                        </span>
                      </div>

                      {/* 1. Cấp Bậc Tuyển Dụng (INTERN, FRESHER, JUNIOR, MIDDLE, SENIOR, LEAD, MANAGER) */}
                      <div>
                        <label className="block text-slate-700 mb-1.5 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-indigo-600">workspace_premium</span>
                            <span>Cấp Bậc Vị Trí Tuyển Dụng *</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-semibold lowercase">
                            {createForm.jobLevel === 'INTERN' ? '🌟 Chương trình tuyển Thực Tập Sinh / Sinh Viên' : 'Tiêu chuẩn cấp bậc'}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                          {JOB_LEVEL_OPTIONS.map((lvl) => {
                            const isSelected = createForm.jobLevel === lvl.id;
                            return (
                              <button
                                key={lvl.id}
                                type="button"
                                onClick={() => {
                                  setCreateForm(prev => ({
                                    ...prev,
                                    jobLevel: lvl.id,
                                    employmentType: lvl.id === 'INTERN' ? 'INTERNSHIP' : prev.employmentType
                                  }));
                                }}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
                                  isSelected
                                    ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200'
                                    : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200'
                                }`}
                                title={lvl.desc}
                              >
                                <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-white' : 'text-indigo-600 group-hover:scale-110 transition-transform'}`}>
                                  {lvl.icon}
                                </span>
                                <span className="text-[11px] font-extrabold leading-tight">
                                  {lvl.id}
                                </span>
                                <span className={`text-[9px] line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {lvl.id === 'INTERN' ? 'Thực tập sinh' : lvl.id === 'FRESHER' ? 'Mới tốt nghiệp' : lvl.id === 'JUNIOR' ? '1 - 2 năm' : lvl.id === 'MIDDLE' ? '2 - 4 năm' : lvl.id === 'SENIOR' ? '4 - 6 năm' : lvl.id === 'LEAD' ? 'Tech Lead' : 'Quản lý'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Yêu Cầu Bằng Cấp / Học Vấn & Kinh Nghiệm Làm Việc */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-blue-600">history_edu</span>
                              <span>Yêu Cầu Bằng Cấp / Học Vấn *</span>
                            </span>
                          </label>
                          <select
                            value={createForm.educationRequirement}
                            onChange={(e) => setCreateForm({ ...createForm, educationRequirement: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:bg-white focus:border-indigo-500 font-sans outline-none text-xs cursor-pointer"
                          >
                            {EDUCATION_OPTIONS.map((edu) => (
                              <option key={edu} value={edu}>{edu}</option>
                            ))}
                          </select>
                          {/* Quick selection pills for degree */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                            {['Đại học / Cử nhân', 'Cao đẳng', 'Thạc sĩ', 'Không yêu cầu bằng cấp'].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, educationRequirement: p })}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-colors cursor-pointer"
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-emerald-600">work_history</span>
                              <span>Kinh Nghiệm Làm Việc *</span>
                            </span>
                          </label>
                          <select
                            value={createForm.experienceRequirement}
                            onChange={(e) => setCreateForm({ ...createForm, experienceRequirement: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:bg-white focus:border-indigo-500 font-sans outline-none text-xs cursor-pointer"
                          >
                            {EXPERIENCE_OPTIONS.map((exp) => (
                              <option key={exp} value={exp}>{exp}</option>
                            ))}
                          </select>
                          {/* Quick selection pills for experience */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                            {['Không yêu cầu', '1 - 2 năm', '2 - 4 năm', '3 - 5 năm'].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, experienceRequirement: p })}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 transition-colors cursor-pointer"
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. Môi Trường Làm Việc (On-site / Hybrid / Remote) & Giới Tính */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-amber-600">apartment</span>
                            <span>Môi Trường &amp; Không Gian Làm Việc</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'On-site (Tại văn phòng)', label: 'On-site', icon: 'business' },
                              { id: 'Hybrid (Linh hoạt)', label: 'Hybrid', icon: 'sync_alt' },
                              { id: 'Remote (Từ xa 100%)', label: 'Remote', icon: 'home_work' },
                            ].map((wp) => (
                              <button
                                key={wp.id}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, workplaceType: wp.id })}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                  createForm.workplaceType === wp.id
                                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                                }`}
                              >
                                <span className="material-symbols-outlined text-base">{wp.icon}</span>
                                <span className="text-[10px]">{wp.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-purple-600">wc</span>
                            <span>Yêu Cầu Giới Tính</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['Không yêu cầu', 'Nam', 'Nữ'].map((gen) => (
                              <button
                                key={gen}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, genderRequirement: gen })}
                                className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-xs ${
                                  createForm.genderRequirement === gen
                                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                                }`}
                              >
                                {gen}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* SECTION 2: COMPENSATION, LOCATION & TIMELINE */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-lg">payments</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                            2. Đãi Ngộ, Địa Điểm &amp; Tiến Độ Tuyển Dụng
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Salary with quick preset chips */}
                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">
                            Mức Lương Dự Kiến *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="$1,500 - $2,500/tháng"
                            value={createForm.salary}
                            onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-amber-600 focus:bg-white focus:border-indigo-500 font-bold text-xs outline-none"
                          />
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {[
                              '$1,500 - $2,500/tháng',
                              '15 - 25 triệu VNĐ',
                              '25 - 45 triệu VNĐ',
                              'Thỏa thuận'
                            ].map((sal) => (
                              <button
                                key={sal}
                                type="button"
                                onClick={() => setCreateForm({ ...createForm, salary: sal })}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                              >
                                {sal}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Vacancies with +/- buttons */}
                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                            <span>Số Lượng Tuyển *</span>
                            <span className="text-[10px] text-indigo-700 font-semibold">≥ 1 người</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = Number(createForm.vacanciesCount) || 1;
                                if (curr > 1) setCreateForm({ ...createForm, vacanciesCount: curr - 1 });
                              }}
                              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center border border-slate-200 cursor-pointer shrink-0"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              placeholder="1"
                              value={createForm.vacanciesCount}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  setCreateForm({ ...createForm, vacanciesCount: '' });
                                  return;
                                }
                                const cleaned = raw.replace(/\D/g, '');
                                const num = parseInt(cleaned, 10);
                                setCreateForm({ ...createForm, vacanciesCount: isNaN(num) || num < 1 ? 1 : num });
                              }}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2 text-center text-slate-800 font-bold focus:bg-white focus:border-indigo-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const curr = Number(createForm.vacanciesCount) || 1;
                                setCreateForm({ ...createForm, vacanciesCount: curr + 1 });
                              }}
                              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center border border-slate-200 cursor-pointer shrink-0"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Deadline with Quick Date Buttons */}
                        <div>
                          <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                            <span>Hạn Chót Nộp Hồ Sơ *</span>
                            <span className="text-[10px] text-indigo-700 font-semibold">≥ Hôm nay</span>
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            required
                            value={createForm.deadlineDate}
                            onChange={(e) => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              const val = e.target.value;
                              if (val && val < todayStr) {
                                triggerToast('⚠️ Không thể chọn ngày trong quá khứ! Hệ thống đã đặt thành hôm nay.');
                                setCreateForm({ ...createForm, deadlineDate: todayStr });
                              } else {
                                setCreateForm({ ...createForm, deadlineDate: val });
                              }
                            }}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:bg-white focus:border-indigo-500 font-sans outline-none text-xs"
                          />
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {[
                              { label: '+15 ngày', days: 15 },
                              { label: '+30 ngày', days: 30 },
                              { label: '+45 ngày', days: 45 },
                              { label: '+60 ngày', days: 60 },
                            ].map((preset) => (
                              <button
                                key={preset.days}
                                type="button"
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + preset.days);
                                  setCreateForm({ ...createForm, deadlineDate: d.toISOString().split('T')[0] });
                                }}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Location row */}
                      <div>
                        <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">
                          Địa Điểm Làm Việc *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: TP.HCM (Hybrid), Đà Nẵng hoặc Remote"
                          value={createForm.location}
                          onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 font-sans outline-none text-xs"
                        />
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {['Đà Nẵng (Hybrid)', 'TP.HCM (Quận 1)', 'Hà Nội (Cầu Giấy)', 'Remote Toàn Cầu'].map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => setCreateForm({ ...createForm, location: loc })}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: DETAILED CONTENT (TABS FOR DESCRIPTION, REQUIREMENTS, BENEFITS) */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-600 text-lg">description</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                            4. Nội Dung Chi Tiết Bài Đăng Tuyển Dụng
                          </span>
                        </div>
                        {/* Segmented Tab Controls */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setActiveContentTab('DESC')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                              activeContentTab === 'DESC'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-indigo-600'
                            }`}
                          >
                            Mô Tả (JD)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveContentTab('REQ')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                              activeContentTab === 'REQ'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-600'
                            }`}
                          >
                            Yêu Cầu (Requirements)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveContentTab('BEN')}
                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                              activeContentTab === 'BEN'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-emerald-600'
                            }`}
                          >
                            Quyền Lợi (Benefits)
                          </button>
                        </div>
                      </div>

                      {/* 1. MÔ TẢ CÔNG VIỆC */}
                      {activeContentTab === 'DESC' && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-indigo-600 uppercase text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              Mô Tả Trách Nhiệm Công Việc (Job Description) *
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {(createForm.description || '').length} ký tự
                            </span>
                          </div>
                          <textarea
                            rows={6}
                            required
                            placeholder="- Tham gia phát triển hệ thống lõi phục vụ hàng triệu người dùng...&#10;- Thiết kế kiến trúc giải pháp và tối ưu hóa hiệu năng hệ thống...&#10;- Phối hợp chặt chẽ với team Product và các bộ phận liên quan..."
                            value={createForm.description}
                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-sans leading-relaxed text-xs"
                          />
                        </div>
                      )}

                      {/* 2. YÊU CẦU ỨNG VIÊN */}
                      {activeContentTab === 'REQ' && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-amber-600 uppercase text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                              Yêu Cầu Ứng Viên (Requirements &amp; Experience) *
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {(createForm.requirements || '').length} ký tự
                            </span>
                          </div>
                          <textarea
                            rows={6}
                            required
                            placeholder="- Tối thiểu 1 - 2 năm kinh nghiệm làm việc thực tế với tech stack tương đương...&#10;- Nắm vững kiến thức nền tảng về cấu trúc dữ liệu, giải thuật và OOP...&#10;- Tinh thần trách nhiệm cao, chủ động học hỏi và kỹ năng làm việc nhóm tốt..."
                            value={createForm.requirements}
                            onChange={(e) => setCreateForm({ ...createForm, requirements: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white font-sans leading-relaxed text-xs"
                          />
                        </div>
                      )}

                      {/* 3. QUYỀN LỢI & PHÚC LỢI */}
                      {activeContentTab === 'BEN' && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-emerald-600 uppercase text-xs flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              Quyền Lợi &amp; Chế Độ Đãi Ngộ (Benefits) *
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {(createForm.benefits || '').length} ký tự
                            </span>
                          </div>
                          <textarea
                            rows={6}
                            required
                            placeholder="- Lương tháng 13 + thưởng hiệu quả kinh doanh dự án định kỳ...&#10;- Bảo hiểm sức khỏe cao cấp cho nhân viên và người thân...&#10;- Cung cấp trang thiết bị làm việc hiện đại (Macbook Pro, màn hình 4K)...&#10;- Du lịch, teambuilding hàng năm cùng công ty..."
                            value={createForm.benefits}
                            onChange={(e) => setCreateForm({ ...createForm, benefits: e.target.value })}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white font-sans leading-relaxed text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* SECTION 4: AI SKILLS MATRIX 70/30 (HIREMATE CORE MATCHING ENGINE) */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-600 text-lg">psychology</span>
                          <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                            5. Ma Trận Kỹ Năng AI 70/30 (HireMate Match Engine)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                          Chuẩn Trọng Số AI
                        </span>
                      </div>

                      {/* Visual Weight Balance Bar */}
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-indigo-600">70% Kỹ năng bắt buộc (Vòng lọc hồ sơ)</span>
                          <span className="text-emerald-700">30% Kỹ năng ưu tiên (Cộng điểm xếp hạng)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                          <div className="h-full bg-indigo-600 w-[70%]" title="70% Trọng số bắt buộc"></div>
                          <div className="h-full bg-emerald-500 w-[30%]" title="30% Trọng số ưu tiên"></div>
                        </div>
                      </div>

                      {/* 70% MANDATORY SKILLS */}
                      <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-indigo-700 uppercase flex items-center gap-1.5 text-xs">
                            <span className="material-symbols-outlined text-sm text-indigo-600">verified</span>
                            Kỹ Năng Bắt Buộc (Mandatory - 70% Trọng Số) *
                          </label>
                          <span className="text-[10px] font-mono font-bold text-white bg-indigo-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                            Trọng số: 70%
                          </span>
                        </div>

                        {/* Interactive Chips list */}
                        <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                          {mandatorySkillsArray.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Chưa có kỹ năng bắt buộc. Nhập bên dưới hoặc bấm gợi ý 1-click.</span>
                          ) : (
                            mandatorySkillsArray.map((sk) => (
                              <span
                                key={sk}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs group hover:bg-indigo-100 transition-colors"
                              >
                                <span>{sk}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMandatorySkill(sk)}
                                  className="w-4 h-4 rounded-full hover:bg-rose-500 hover:text-white text-indigo-500 flex items-center justify-center transition-colors cursor-pointer text-xs"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Tag Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nhập kỹ năng bắt buộc và nhấn Enter..."
                            value={mandSkillTagInput}
                            onChange={(e) => setMandSkillTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddMandatorySkill();
                              }
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs font-sans focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddMandatorySkill()}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                            <span>Thêm</span>
                          </button>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 font-semibold">Gợi ý 1-click ({createForm.title ? 'theo vị trí' : 'chuẩn'}):</span>
                          {dynamicMandatorySuggestions.map((sk) => (
                            <button
                              key={sk}
                              type="button"
                              onClick={() => handleAddMandatorySkill(sk)}
                              className="px-2.5 py-0.5 rounded-full text-[10px] bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer font-medium shadow-2xs"
                            >
                              + {sk}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 30% PREFERRED SKILLS */}
                      <div className="p-4 rounded-xl bg-emerald-50/30 border border-emerald-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-emerald-700 uppercase flex items-center gap-1.5 text-xs">
                            <span className="material-symbols-outlined text-sm text-emerald-600">stars</span>
                            Kỹ Năng Ưu Tiên (Preferred - 30% Trọng Số)
                          </label>
                          <span className="text-[10px] font-mono font-bold text-white bg-emerald-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                            Trọng số: 30%
                          </span>
                        </div>

                        {/* Interactive Chips list */}
                        <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                          {preferredSkillsArray.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Chưa có kỹ năng ưu tiên. Nhập bên dưới hoặc bấm gợi ý 1-click.</span>
                          ) : (
                            preferredSkillsArray.map((sk) => (
                              <span
                                key={sk}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs group hover:bg-emerald-100 transition-colors"
                              >
                                <span>{sk}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePreferredSkill(sk)}
                                  className="w-4 h-4 rounded-full hover:bg-rose-500 hover:text-white text-emerald-700 flex items-center justify-center transition-colors cursor-pointer text-xs"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Tag Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nhập kỹ năng ưu tiên và nhấn Enter..."
                            value={prefSkillTagInput}
                            onChange={(e) => setPrefSkillTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddPreferredSkill();
                              }
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs font-sans focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddPreferredSkill()}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                            <span>Thêm</span>
                          </button>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 font-semibold">Gợi ý 1-click ({createForm.title ? 'theo vị trí' : 'chuẩn'}):</span>
                          {dynamicPreferredSuggestions.map((sk) => (
                            <button
                              key={sk}
                              type="button"
                              onClick={() => handleAddPreferredSkill(sk)}
                              className="px-2.5 py-0.5 rounded-full text-[10px] bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer font-medium shadow-2xs"
                            >
                              + {sk}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar inside Form */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-base text-indigo-600">verified</span>
                        <span>Đã cấu hình tự động ma trận kỹ năng 70/30 &amp; tính điểm ATS</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Hủy Bỏ
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                        >
                          Xuất Bản Tin Ngay
                        </button>
                      </div>
                    </div>

                  </form>
                </div>

                {/* ======================================================== */}
                {/* RIGHT COLUMN: LIVE CARD PREVIEW & AI QUALITY INSPECTOR    */}
                {/* ======================================================== */}
                <div className="space-y-5 lg:sticky lg:top-0 lg:col-span-5 xl:col-span-5 animate-fade-in">
                  
                  {/* Clarification banner for Candidate View */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5 shadow-xs">
                    <span className="material-symbols-outlined text-indigo-600 text-base shrink-0 mt-0.5">visibility</span>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">Bản Xem Trước Giao Diện Ứng Viên (Candidate View)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Mô phỏng trực quan cách thẻ tin hiển thị trên trang tìm việc của Ứng viên khi bài đăng này được xuất bản theo thời gian thực.
                      </p>
                    </div>
                  </div>

                  {/* AI QUALITY SCORECARD */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600 text-lg">speed</span>
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                          Điểm Sức Hút Bài Đăng (AI ATS)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Live Calculator
                      </span>
                    </div>

                    {/* Score Gauge & Status */}
                    <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`${aiJobScore >= 80 ? 'text-emerald-500' : aiJobScore >= 60 ? 'text-amber-500' : aiJobScore > 0 ? 'text-indigo-500' : 'text-slate-300'}`}
                            strokeDasharray={`${aiJobScore}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-sm font-extrabold ${aiJobScore > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{aiJobScore}</span>
                          <span className="text-[8px] text-slate-400 font-bold">/100</span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900">
                          {aiJobScore >= 85
                            ? '🌟 Bài đăng tối ưu & cực kỳ thu hút!'
                            : aiJobScore >= 65
                            ? '⚡ Bài đăng khá tốt, sẵn sàng đón ứng viên'
                            : aiJobScore > 0
                            ? '⚠️ Cần bổ sung thêm thông tin để tối ưu ATS'
                            : '📝 Bắt đầu nhập thông tin hoặc tải file JD'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {aiJobScore >= 85
                            ? 'Đầy đủ mức lương, mô tả chi tiết và kỹ năng 70/30'
                            : aiJobScore >= 65
                            ? 'Bổ sung thêm kỹ năng ưu tiên và dải lương để đạt điểm 90+'
                            : aiJobScore > 0
                            ? 'Bổ sung chức danh, mức lương và ma trận kỹ năng 70/30'
                            : 'Tự gõ hoặc tải file JD lên để AI đánh giá tự động'}
                        </p>
                      </div>
                    </div>

                    {/* ATS Checklist */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${createForm.title.trim().length >= 5 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {createForm.title.trim().length >= 5 ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={createForm.title.trim().length >= 5 ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                          Tiêu đề vị trí tuyển dụng chuẩn ATS
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${createForm.salary.trim() ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {createForm.salary.trim() ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={createForm.salary.trim() ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                          Mức lương minh bạch (+35% tỷ lệ ứng tuyển)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${mandatorySkillsArray.length >= 2 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {mandatorySkillsArray.length >= 2 ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={mandatorySkillsArray.length >= 2 ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                          Đã cấu hình ma trận kỹ năng 70/30 AI Match
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${createForm.description.trim().length >= 40 ? 'text-emerald-600' : 'text-slate-300'}`}>
                          {createForm.description.trim().length >= 40 ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={createForm.description.trim().length >= 40 ? 'text-slate-700 font-semibold' : 'text-slate-400'}>
                          Mô tả &amp; trách nhiệm công việc chi tiết
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LIVE CANDIDATE JOB CARD PREVIEW */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-indigo-200/70 shadow-lg space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600 text-base">visibility</span>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Xem Trước Thẻ Tin (Candidate View)
                        </span>
                      </div>
                      {(createForm.title.trim() || createForm.salary.trim() || mandatorySkillsArray.length > 0) ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Cập nhật theo thời gian thực"></span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">Chờ nhập liệu</span>
                      )}
                    </div>

                    {/* Check if form is completely blank */}
                    {!createForm.title.trim() && !createForm.salary.trim() && mandatorySkillsArray.length === 0 && !createForm.description.trim() ? (
                      /* Empty State: Prompting user to type or upload file */
                      <div className="py-10 px-5 rounded-xl bg-slate-50/60 border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                          <span className="material-symbols-outlined text-2xl">edit_note</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800">Chưa có dữ liệu bài đăng</h4>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                            Bản xem trước thẻ tin ứng viên sẽ hiển thị tại đây khi bạn <strong>tự gõ thông tin</strong> ở khung bên trái hoặc <strong>dán / đính kèm file JD</strong> để AI tự động điền vào các ô trống.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs font-semibold text-indigo-600">
                            <span className="material-symbols-outlined text-[13px]">edit_note</span> Tự gõ linh hoạt
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs font-semibold text-emerald-600">
                            <span className="material-symbols-outlined text-[13px]">auto_awesome</span> AI Auto-Fill từ File
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Rendered Job Card with live values */
                      <div className="p-4 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 shadow-xs space-y-3.5 animate-fade-in">
                        {/* Top Row: Badge & Status */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Đang Đăng Tuyển</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            {createForm.code || 'JD-REQ-NEW'}
                          </span>
                        </div>

                        {/* Title & Domain */}
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug">
                            {createForm.title.trim() || <span className="text-slate-400 italic font-normal">Đang soạn tiêu đề...</span>}
                          </h3>
                          <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1 mt-1">
                            <span>{user?.companyName || user?.company || (user?.email?.toLowerCase().includes('fpt') ? 'FPT Software' : 'Doanh Nghiệp Tuyển Dụng')}</span>
                            <span className="material-symbols-outlined text-[13px] text-blue-500">verified</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 truncate">{createForm.domain.trim() || <span className="text-slate-400 italic font-normal">Chưa chọn chuyên môn</span>}</span>
                          </p>
                        </div>

                        {/* Professional Criteria Badges (Level, Degree, Exp, Workplace) */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[13px]">school</span>
                            <span>{createForm.jobLevel === 'INTERN' ? 'Thực tập sinh (Intern)' : createForm.jobLevel === 'FRESHER' ? 'Fresher (Mới tốt nghiệp)' : createForm.jobLevel === 'SENIOR' ? 'Senior (Cấp cao)' : createForm.jobLevel || 'Chuyên viên'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[13px]">history_edu</span>
                            <span className="truncate max-w-[130px]">{createForm.educationRequirement || 'Đại học / Cử nhân'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[13px]">work_history</span>
                            <span className="truncate max-w-[120px]">{createForm.experienceRequirement || 'Không yêu cầu kn'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                            <span className="material-symbols-outlined text-[13px]">apartment</span>
                            <span>{createForm.workplaceType || 'Hybrid'}</span>
                          </span>
                        </div>

                        {/* Highlights Ribbon */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Mức lương</p>
                            <p className="font-bold text-amber-600 text-[11px] truncate">
                              {createForm.salary.trim() || <span className="text-slate-400 font-normal italic">Chưa nhập</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Địa điểm</p>
                            <p className="font-bold text-slate-700 text-[11px] truncate">
                              {createForm.location.trim() || <span className="text-slate-400 font-normal italic">Chưa nhập</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Hình thức</p>
                            <p className="font-bold text-slate-700 text-[11px]">
                              {createForm.employmentType === 'FULL_TIME' ? 'Toàn thời gian'
                                : createForm.employmentType === 'PART_TIME' ? 'Bán thời gian'
                                : createForm.employmentType === 'CONTRACT' ? 'Hợp đồng / Hybrid'
                                : createForm.employmentType === 'INTERNSHIP' ? 'Thực tập sinh'
                                : createForm.employmentType}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Số lượng</p>
                            <p className="font-bold text-indigo-600 text-[11px]">{createForm.vacanciesCount || 1} người</p>
                          </div>
                        </div>

                        {/* 70% Skills */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>Kỹ Năng Bắt Buộc (70% Trọng Số):</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {mandatorySkillsArray.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">Chưa nhập kỹ năng bắt buộc</span>
                            ) : (
                              mandatorySkillsArray.slice(0, 5).map((sk) => (
                                <span key={sk} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {sk}
                                </span>
                              ))
                            )}
                            {mandatorySkillsArray.length > 5 && (
                              <span className="text-[10px] text-slate-400 font-bold">+{mandatorySkillsArray.length - 5}</span>
                            )}
                          </div>
                        </div>

                        {/* 30% Skills */}
                        {preferredSkillsArray.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">stars</span>
                              <span>Kỹ Năng Ưu Tiên (30% Trọng Số):</span>
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {preferredSkillsArray.slice(0, 4).map((sk) => (
                                <span key={sk} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description preview snippet */}
                        {createForm.description.trim() && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {createForm.description}
                            </p>
                          </div>
                        )}

                        {/* Deadline info */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Hạn nộp hồ sơ:</span>
                          <strong className="text-slate-700">{createForm.deadlineDate || 'Chưa thiết lập'}</strong>
                        </div>
                      </div>
                    )}

                    {/* Publish Button */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={handleCreateSubmit}
                        className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
                      >
                        <span className="material-symbols-outlined text-base group-hover:rotate-12 transition-transform">rocket_launch</span>
                        <span>Xuất Bản Tin Tuyển Dụng Ngay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer text-center"
                      >
                        Hủy Bỏ
                      </button>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* MODAL 2: CHỈNH SỬA TIN TUYỂN DỤNG (EDIT JD)             */}
      {/* ======================================================== */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-3xl bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-[#221d47]">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h2 className="text-xl font-sans font-extrabold text-[#221d47] flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#5b48bd]">edit</span>
              Chỉnh Sửa Tin Tuyển Dụng ({editingJob.code})
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-[#221d47] mb-1 font-bold uppercase">Tiêu đề vị trí *</label>
                <input
                  type="text"
                  required
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                />
              </div>

              {/* Edit Cấp bậc & Bằng cấp */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100">
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase text-[11px]">Cấp bậc tuyển dụng</label>
                  <select
                    value={editingJob.jobLevel || 'INTERN'}
                    onChange={(e) => setEditingJob({ ...editingJob, jobLevel: e.target.value, employmentType: e.target.value === 'INTERN' ? 'INTERNSHIP' : editingJob.employmentType })}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-[#221d47] font-semibold focus:outline-none focus:border-[#5b48bd] font-sans text-xs cursor-pointer"
                  >
                    <option value="INTERN">INTERN (Thực tập sinh)</option>
                    <option value="FRESHER">FRESHER (Mới ra trường)</option>
                    <option value="JUNIOR">JUNIOR (1 - 2 năm)</option>
                    <option value="MIDDLE">MIDDLE (2 - 4 năm)</option>
                    <option value="SENIOR">SENIOR (4 - 6 năm)</option>
                    <option value="LEAD">LEAD (Tech Lead / Trưởng nhóm)</option>
                    <option value="MANAGER">MANAGER (Quản lý)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase text-[11px]">Yêu cầu bằng cấp</label>
                  <select
                    value={editingJob.educationRequirement || 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)'}
                    onChange={(e) => setEditingJob({ ...editingJob, educationRequirement: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-[#221d47] font-semibold focus:outline-none focus:border-[#5b48bd] font-sans text-xs cursor-pointer"
                  >
                    {EDUCATION_OPTIONS.map(edu => (
                      <option key={edu} value={edu}>{edu}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase text-[11px]">Kinh nghiệm làm việc</label>
                  <select
                    value={editingJob.experienceRequirement || 'Không yêu cầu kinh nghiệm (Intern/Fresher - Đào tạo thực tế)'}
                    onChange={(e) => setEditingJob({ ...editingJob, experienceRequirement: e.target.value })}
                    className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-[#221d47] font-semibold focus:outline-none focus:border-[#5b48bd] font-sans text-xs cursor-pointer"
                  >
                    {EXPERIENCE_OPTIONS.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase">Mức lương</label>
                  <input
                    type="text"
                    value={editingJob.salary}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#f97316] font-bold focus:outline-none focus:border-[#5b48bd]"
                  />
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase">Hình thức làm việc</label>
                  <select
                    value={editingJob.employmentType || 'FULL_TIME'}
                    onChange={(e) => setEditingJob({ ...editingJob, employmentType: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] cursor-pointer font-sans"
                  >
                    <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                    <option value="PART_TIME">Bán thời gian (Part-time)</option>
                    <option value="CONTRACT">Hợp đồng (Contract)</option>
                    <option value="INTERNSHIP">Thực tập sinh (Internship)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase">Trạng thái tin</label>
                  <select
                    value={editingJob.status}
                    onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] cursor-pointer font-sans"
                  >
                    <option value="ACTIVE">ACTIVE (Đang bật tuyển dụng)</option>
                    <option value="PAUSED">PAUSED (Tạm dừng)</option>
                    <option value="CLOSED">CLOSED (Đã đóng)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase">Địa điểm làm việc</label>
                  <input
                    type="text"
                    value={editingJob.location}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase flex items-center justify-between">
                    <span>Số lượng tuyển</span>
                    <span className="text-[10px] text-purple-700 font-semibold">≥ 1 người (không âm)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={editingJob.vacanciesCount || 1}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setEditingJob({ ...editingJob, vacanciesCount: '' });
                        return;
                      }
                      const cleaned = raw.replace(/\D/g, '');
                      const num = parseInt(cleaned, 10);
                      setEditingJob({ ...editingJob, vacanciesCount: isNaN(num) || num < 1 ? 1 : num });
                    }}
                    onBlur={() => {
                      const num = parseInt(editingJob.vacanciesCount, 10);
                      if (isNaN(num) || num < 1) {
                        setEditingJob({ ...editingJob, vacanciesCount: 1 });
                      }
                    }}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[#221d47] mb-1 font-bold uppercase flex items-center justify-between">
                    <span>Hạn chót ứng tuyển</span>
                    <span className="text-[10px] text-purple-700 font-semibold">≥ Hôm nay</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={editingJob.deadlineDate || ''}
                    onChange={(e) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const val = e.target.value;
                      if (val && val < todayStr) {
                        triggerToast('⚠️ Không thể chọn ngày trong quá khứ! Hệ thống đã tự động đặt thành ngày hôm nay.');
                        setEditingJob({ ...editingJob, deadlineDate: todayStr });
                      } else {
                        setEditingJob({ ...editingJob, deadlineDate: val });
                      }
                    }}
                    onBlur={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      if (editingJob.deadlineDate && editingJob.deadlineDate < todayStr) {
                        triggerToast('⚠️ Hạn chót không được là ngày quá khứ. Đã tự động điều chỉnh.');
                        setEditingJob({ ...editingJob, deadlineDate: todayStr });
                      }
                    }}
                    className="w-full bg-[#f8f7ff] border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans"
                  />
                  {/* Preset Quick Date Buttons */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                    {[
                      { label: '+15 ngày', days: 15 },
                      { label: '+30 ngày', days: 30 },
                      { label: '+60 ngày', days: 60 },
                      { label: '+90 ngày', days: 90 },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + preset.days);
                          setEditingJob({ ...editingJob, deadlineDate: d.toISOString().split('T')[0] });
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-[#5b48bd] hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* NỘI DUNG CHI TIẾT */}
              <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-purple-100 space-y-3">
                <div>
                  <label className="block text-[#5b48bd] mb-1 font-bold uppercase text-xs">Mô Tả Công Việc (Job Description)</label>
                  <textarea
                    rows={4}
                    value={editingJob.description || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans leading-relaxed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[#f97316] mb-1 font-bold uppercase text-xs">Yêu Cầu Ứng Viên (Requirements)</label>
                  <textarea
                    rows={4}
                    value={editingJob.requirements || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#f97316] font-sans leading-relaxed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[#10b981] mb-1 font-bold uppercase text-xs">Quyền Lợi &amp; Phúc Lợi (Benefits)</label>
                  <textarea
                    rows={4}
                    value={editingJob.benefits || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, benefits: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#10b981] font-sans leading-relaxed text-xs"
                  />
                </div>

                {/* 70% Mandatory Skills */}
                <div>
                  <label className="block text-[#5b48bd] mb-1 font-bold uppercase text-xs flex items-center justify-between">
                    <span>Kỹ Năng Bắt Buộc (Mandatory - 70% Trọng Số AI Match)</span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Trọng số 70%</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Java 21, Spring Boot, PostgreSQL, Docker"
                    value={editingJob.mandatorySkillsInput || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, mandatorySkillsInput: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#5b48bd] font-sans text-xs"
                  />
                </div>

                {/* 30% Preferred Skills */}
                <div>
                  <label className="block text-emerald-700 mb-1 font-bold uppercase text-xs flex items-center justify-between">
                    <span>Kỹ Năng Ưu Tiên (Preferred - 30% Trọng Số AI Match)</span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Trọng số 30%</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kafka, Redis, AWS, Kubernetes"
                    value={editingJob.preferredSkillsInput || ''}
                    onChange={(e) => setEditingJob({ ...editingJob, preferredSkillsInput: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-[#221d47] focus:outline-none focus:border-[#10b981] font-sans text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase text-white bg-[#5b48bd] hover:bg-[#47369f] transition-all shadow-md cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XUẤT BÁO CÁO TUYỂN DỤNG                         */}
      {/* ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-sans">
          <div className="relative w-full max-w-md bg-white border border-purple-100 rounded-[32px] p-6 shadow-2xl space-y-4 text-[#221d47]">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <h3 className="text-xl font-sans font-extrabold text-[#221d47] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#5b48bd]">ios_share</span>
              Xuất Báo Cáo Tuyển Dụng Tổng Hợp
            </h3>
            <p className="text-xs text-slate-500">
              Tải xuống tập tin thống kê dữ liệu 12 vị trí tuyển dụng, 156 hồ sơ ứng viên và điểm AI Match thời gian thực.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Đã tải xuống báo cáo tổng quan định dạng Excel (.xlsx)');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#f8f7ff] hover:bg-white border border-purple-100 hover:border-[#5b48bd] flex items-center justify-between transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 text-[#221d47]">
                  <span className="material-symbols-outlined text-[#10b981]">table_chart</span>
                  <span className="font-bold">Bảng tính Excel (.xlsx)</span>
                </div>
                <span className="text-[11px] font-bold text-[#10b981]">Tải Về</span>
              </button>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  triggerToast('Đã xuất báo cáo phân tích hiệu suất tuyển dụng PDF');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#f8f7ff] hover:bg-white border border-purple-100 hover:border-[#5b48bd] flex items-center justify-between transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2.5 text-[#221d47]">
                  <span className="material-symbols-outlined text-[#f97316]">picture_as_pdf</span>
                  <span className="font-bold">Tài liệu PDF Executive (.pdf)</span>
                </div>
                <span className="text-[11px] font-bold text-[#f97316]">Tải Về</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: XÁC NHẬN XÓA VĨNH VIỄN TIN TUYỂN DỤNG             */}
      {/* ======================================================== */}
      {jobToDelete && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-rose-100 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5 text-slate-800 animate-fade-in">
            <button
              onClick={() => setJobToDelete(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  Xóa Vĩnh Viễn Tin Tuyển Dụng?
                </h3>
                <p className="text-xs text-slate-500">Mã tin: {jobToDelete.code}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2 text-xs text-rose-950">
              <p className="font-bold text-slate-900 line-clamp-2">
                &ldquo;{jobToDelete.title}&rdquo;
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                <span>&bull; Vị trí: <strong>{jobToDelete.location}</strong></span>
                <span>&bull; Đơn nộp: <strong>{jobToDelete.totalApplicants} CVs</strong></span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed pt-1">
                ⚠️ <strong>Cảnh báo:</strong> Tin tuyển dụng, tiêu chí kỹ năng và các hồ sơ ứng tuyển liên quan sẽ bị xóa hoàn toàn khỏi hệ thống. Hành động này <strong>không thể hoàn tác</strong>!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteJob}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-200 transition-all cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
