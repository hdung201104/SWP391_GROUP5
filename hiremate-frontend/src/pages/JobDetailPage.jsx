import React, { useState, useEffect, useMemo } from 'react';
import ApplyJobModal from '../components/jobs/ApplyJobModal';
import { jobApi, companyApi, applicationApi } from '../api';
import { isJobSaved, toggleSaveJob } from '../utils/savedJobsStorage';
import { calculateJobDeadline } from '../utils/jobTimeUtils';
import { createCandidateToHrMailto } from '../utils/emailUtils';
import { StaggerContainer, StaggerItem, GlassCard, GlassPanel, BlurReveal, CinematicTitle } from '../components/motion/MotionSystem';

// Helper for corporate brand logos
const getBrandLogo = (companyName = '', logoUrl = null) => {
  const name = companyName.toLowerCase();
  if (name.includes('fpt software') || name.includes('fpt')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-FPT-Software.png';
  }
  if (name.includes('vng')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VNG.png';
  }
  if (name.includes('viettel')) {
    return 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Viettel.png';
  }
  return logoUrl;
};

// Helper for corporate building cover photos matching mockup
const getBrandCover = (companyName = '') => {
  const name = companyName.toLowerCase();
  if (name.includes('fpt')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80';
  }
  if (name.includes('vng')) {
    return 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80';
};

// Company initials helper
const getCompanyInitials = (name) => {
  if (!name) return 'CORP';
  const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Intelligently parse raw text into clean bullet points
const parseCleanBullets = (raw) => {
  if (!raw) return [];
  const lines = Array.isArray(raw)
    ? raw.map((item) => (typeof item === 'string' ? item.trim().replace(/^[-*•\d+.]\s*/, '') : ''))
    : String(raw)
        .replaceAll('\\n', '\n')
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d+.]\s*/, ''));

  return lines.filter((l) => {
    if (!l || l.length === 0) return false;
    const lower = l.toLowerCase();
    if (lower.startsWith('[tiêu chuẩn') || lower.startsWith('[yêu cầu năng lực') || lower.startsWith('[điều kiện')) return false;
    if (lower.startsWith('cấp bậc tuyển dụng:') || lower.startsWith('cấp bậc:') || lower.startsWith('vị trí:')) return false;
    if (lower.startsWith('yêu cầu bằng cấp') || lower.startsWith('bằng cấp:') || lower.startsWith('trình độ học vấn:') || lower.startsWith('học vấn:')) return false;
    if (lower.startsWith('kinh nghiệm làm việc:') || lower.startsWith('kinh nghiệm:')) return false;
    if (lower.startsWith('môi trường làm việc:') || lower.startsWith('môi trường:')) return false;
    if (lower.startsWith('giới tính yêu cầu:') || lower.startsWith('giới tính:')) return false;
    return true;
  });
};

// Helper: Trích xuất tiêu chuẩn học vấn, cấp bậc, kinh nghiệm và môi trường từ thông tin Job
const extractJobCriteria = (job) => {
  if (!job) return {
    jobLevelLabel: 'Chuyên viên',
    educationLabel: 'Đại học / Cử nhân',
    experienceLabel: '1 - 2 năm kinh nghiệm',
    workplaceLabel: 'Hybrid (Linh hoạt)',
    genderLabel: 'Không yêu cầu'
  };

  const reqStr = String(job.requirements || '');
  const levelMatch = reqStr.match(/(?:Cấp bậc|Vị trí)(?:\s+tuyển dụng)?:\s*([^\n\r]+)/i);
  const eduMatch = reqStr.match(/(?:Yêu cầu bằng cấp|Bằng cấp|Trình độ học vấn|Học vấn):\s*([^\n\r]+)/i);
  const expMatch = reqStr.match(/(?:Kinh nghiệm làm việc|Kinh nghiệm):\s*([^\n\r]+)/i);
  const wpMatch = reqStr.match(/(?:Môi trường làm việc|Môi trường|Hình thức làm việc):\s*([^\n\r]+)/i);
  const genMatch = reqStr.match(/(?:Giới tính|Giới tính yêu cầu):\s*([^\n\r]+)/i);

  const t = (job.title || '').toLowerCase();
  const emp = (job.employmentType || '').toLowerCase();

  let jobLevelLabel = levelMatch ? levelMatch[1].trim() : '';
  if (!jobLevelLabel) {
    if (t.includes('intern') || emp.includes('intern')) jobLevelLabel = 'Thực tập sinh (Intern)';
    else if (t.includes('fresher') || emp.includes('fresher')) jobLevelLabel = 'Fresher (Mới ra trường)';
    else if (t.includes('junior')) jobLevelLabel = 'Junior (1 - 2 năm)';
    else if (t.includes('senior')) jobLevelLabel = 'Senior (4 - 6 năm)';
    else if (t.includes('lead')) jobLevelLabel = 'Tech Lead / Trưởng nhóm';
    else if (t.includes('manager')) jobLevelLabel = 'Quản lý / Director';
    else jobLevelLabel = 'Chuyên viên / Kỹ sư (Middle)';
  }

  let educationLabel = eduMatch ? eduMatch[1].trim() : '';
  if (!educationLabel) {
    if (t.includes('intern') || t.includes('fresher')) educationLabel = 'Đại học / Cử nhân (Sinh viên năm cuối hoặc mới tốt nghiệp)';
    else if (t.includes('ai') || t.includes('data')) educationLabel = 'Đại học / Thạc sĩ chuyên ngành AI, CNTT hoặc tương đương';
    else educationLabel = 'Đại học / Cử nhân chuyên ngành liên quan';
  }

  let experienceLabel = expMatch ? expMatch[1].trim() : '';
  if (!experienceLabel) {
    if (t.includes('intern') || t.includes('fresher')) experienceLabel = 'Không yêu cầu kinh nghiệm (Đào tạo thực tế)';
    else if (t.includes('senior')) experienceLabel = 'Tối thiểu 3 - 5 năm kinh nghiệm';
    else experienceLabel = '1 - 3 năm kinh nghiệm làm việc';
  }

  let workplaceLabel = wpMatch ? wpMatch[1].trim() : '';
  if (!workplaceLabel) {
    const loc = (job.location || '').toLowerCase();
    if (loc.includes('remote') || t.includes('remote')) workplaceLabel = 'Remote (100% làm việc từ xa)';
    else if (loc.includes('hybrid') || t.includes('hybrid')) workplaceLabel = 'Hybrid (Linh hoạt văn phòng & WFH)';
    else workplaceLabel = 'On-site (Tại văn phòng)';
  }

  const genderLabel = genMatch ? genMatch[1].trim() : 'Không yêu cầu';

  return { jobLevelLabel, educationLabel, experienceLabel, workplaceLabel, genderLabel };
};

// Smart role template fallback if recruiter inputs are minimal
const getRoleTemplate = (title = '') => {
  const lower = title.toLowerCase();
  if (lower.includes('test') || lower.includes('qa') || lower.includes('qc') || lower.includes('kiểm thử')) {
    return {
      descriptions: [
        'Tham gia nghiên cứu, thiết kế và phát triển kế hoạch kiểm thử (Test Plan, Test Strategy) cho các module sản phẩm.',
        'Xây dựng các kịch bản kiểm thử chi tiết (Test Cases, Test Scenarios) bao gồm Functional, Non-functional, UI/UX và API Testing.',
        'Thực hiện kiểm thử tính năng mới, kiểm thử hồi quy (Regression Testing) và xác nhận kết quả sửa lỗi.',
        'Sử dụng Postman kiểm thử RESTful API và kiểm tra dữ liệu bằng SQL queries.',
        'Ghi nhận, phân loại và quản lý vòng đời của lỗi (Bug Life Cycle) trên Jira/Trello.',
      ],
      requirements: [
        'Nắm vững quy trình kiểm thử phần mềm (STLC / SDLC), các kỹ thuật thiết kế Test Case (Equivalence Partitioning, Boundary Value).',
        'Có kinh nghiệm kiểm thử Web Application, Mobile App và kiểm thử RESTful API bằng Postman.',
        'Khả năng đọc hiểu câu lệnh truy vấn SQL (SELECT, JOIN) để kiểm tra tính toàn vẹn của dữ liệu.',
        'Tư duy logic tốt, cẩn thận, tỉ mỉ và có khả năng phát hiện lỗi giao diện cũng như luồng nghiệp vụ phức tạp.',
        'Khả năng đọc hiểu tài liệu kỹ thuật Tiếng Anh; kỹ năng giao tiếp và làm việc nhóm tích cực.',
      ],
      recommendedMandatory: ['Manual Testing', 'API Testing (Postman)', 'Test Case Design'],
      recommendedPreferred: ['Automation Testing', 'Jira / Confluence', 'SQL Basics'],
    };
  }

  // Mặc định chung cho các vị trí công việc
  return {
    descriptions: [
      'Chủ động tiếp nhận và triển khai các nhiệm vụ chuyên môn theo phân công từ Trưởng bộ phận.',
      'Phối hợp chặt chẽ với các thành viên trong nhóm để đạt được mục tiêu công việc chung của dự án.',
      'Đề xuất các giải pháp cải tiến quy trình nhằm nâng cao năng suất và hiệu quả công việc.',
      'Báo cáo tiến độ và kết quả công việc định kỳ một cách trung thực, rõ ràng.',
    ],
    requirements: [
      'Có tinh thần trách nhiệm cao, chủ động trong công việc và ham học hỏi kiến thức mới.',
      'Kỹ năng giao tiếp tốt, khả năng làm việc độc lập và làm việc nhóm hiệu quả.',
      'Có kinh nghiệm hoặc định hướng phát triển phù hợp với vị trí ứng tuyển.',
    ],
    recommendedMandatory: ['Kỹ năng chuyên môn', 'Làm việc nhóm', 'Giao tiếp'],
    recommendedPreferred: ['Tiếng Anh', 'Tư duy phản biện'],
  };
};

export default function JobDetailPage({ user: propUser, jobId }) {
  const currentId = Number(jobId) || 101;

  // Resolve user robustly from prop or local storage fallbacks
  const user = propUser || (() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role || parsed.email)) return parsed;
      }
      const hiremateUser = localStorage.getItem('hiremate_user');
      if (hiremateUser) {
        const parsed = JSON.parse(hiremateUser);
        if (parsed && (parsed.role || parsed.email)) return parsed;
      }
      const hrStored = localStorage.getItem('hiremate_hr_profile');
      if (hrStored) {
        const parsed = JSON.parse(hrStored);
        return { ...parsed, role: 'RECRUITER' };
      }
    } catch (e) {}
    return null;
  })();

  const rawRole = String(user?.role || '').toUpperCase().trim();
  const isRecruiter = rawRole === 'RECRUITER' || rawRole === 'ROLE_RECRUITER' || rawRole === 'HR' || (!rawRole && !!localStorage.getItem('hiremate_hr_profile'));
  const isAdmin = rawRole === 'ADMIN' || rawRole === 'ROLE_ADMIN';
  const isCandidate = rawRole === 'CANDIDATE' || rawRole === 'ROLE_CANDIDATE';
  const isGuest = !isRecruiter && !isAdmin && !isCandidate;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isApplying, setIsApplying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(() => isJobSaved(currentId));
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [myCompany, setMyCompany] = useState(null);
  const [myApplication, setMyApplication] = useState(null);

  const fetchCandidateApplication = () => {
    if (isCandidate && applicationApi?.getMyApplications && currentId) {
      applicationApi.getMyApplications()
        .then((res) => {
          const list = res?.data || res || [];
          if (Array.isArray(list)) {
            const existing = list.find((app) => {
              const targetJobId = app.job?.jobId || app.jobId;
              const isWithdrawn = app.status === 'WITHDRAWN' || app.status === 'WITHDRAWN_BY_CANDIDATE' || app.rejectionReason?.includes('WITHDRAWN_BY_CANDIDATE');
              return String(targetJobId) === String(currentId) && !isWithdrawn;
            });
            setMyApplication(existing || null);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchCandidateApplication();
  }, [isCandidate, currentId]);

  useEffect(() => {
    if (isRecruiter && companyApi?.getMyCompany) {
      companyApi.getMyCompany()
        .then((res) => {
          const c = res?.data || res;
          if (c) setMyCompany(c);
        })
        .catch(() => {});
    }
  }, [isRecruiter]);

  // Kiểm tra xem Nhà tuyển dụng hiện tại có phải là chủ sở hữu hoặc cùng công ty với tin này không
  const isJobOwner = useMemo(() => {
    if (!isRecruiter || !job) return false;

    // 1. So khớp ID người phụ trách (recruiterId / userId)
    if (user?.userId && job.recruiterId && String(user.userId) === String(job.recruiterId)) {
      return true;
    }

    // 2. So khớp Email người phụ trách
    if (user?.email && job.recruiterEmail && user.email.toLowerCase().trim() === job.recruiterEmail.toLowerCase().trim()) {
      return true;
    }

    // 3. So khớp ID Công ty (companyId)
    const currentCompId = user?.companyId || user?.company?.companyId || myCompany?.companyId || myCompany?.id;
    if (currentCompId && job.companyId && String(currentCompId) === String(job.companyId)) {
      return true;
    }

    // 4. So khớp Tên công ty từ user, myCompany, hoặc localStorage
    let currentCompName = user?.companyName || user?.company?.companyName || myCompany?.companyName || myCompany?.name;
    if (!currentCompName) {
      try {
        const hrProfile = JSON.parse(localStorage.getItem('hiremate_hr_profile') || '{}');
        currentCompName = hrProfile.companyName || hrProfile.company;
      } catch (e) {}
    }
    if (!currentCompName) {
      try {
        const extraComp = JSON.parse(localStorage.getItem('hiremate_company_info_extra') || '{}');
        currentCompName = extraComp.companyName;
      } catch (e) {}
    }

    if (currentCompName && job.companyName) {
      const clean1 = currentCompName.toLowerCase().replace(/công ty|tập đoàn|cổ phần|tnhh|ltd|corp|corporation|software|\./g, '').trim();
      const clean2 = job.companyName.toLowerCase().replace(/công ty|tập đoàn|cổ phần|tnhh|ltd|corp|corporation|software|\./g, '').trim();
      if (clean1 && clean2 && (clean1.includes(clean2) || clean2.includes(clean1))) {
        return true;
      }
    }

    // 5. Kiểm tra cache danh sách tin tuyển dụng do chính HR này tạo
    try {
      const myCreated = JSON.parse(localStorage.getItem('hiremate_my_created_jobs') || '[]');
      if (Array.isArray(myCreated) && myCreated.some((id) => String(id) === String(job.jobId))) {
        return true;
      }
    } catch (e) {}

    return false;
  }, [isRecruiter, job, user, myCompany]);

  // Modal Xóa tin tuyển dụng & Kiểm tra quyền sở hữu chính xác:
  // CHỈ người đăng bài này (hoặc ADMIN) mới có quyền xóa. Đồng nghiệp khác trong công ty không được xóa!
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDeleteThisJob = useMemo(() => {
    if (!job || !user) return false;
    if (user?.role === 'ADMIN' || rawRole === 'ADMIN') return true;

    const currentUserId = user.userId || user.id;
    const jobRecruiterId = job.recruiterId || job.recruiter?.recruiterId || job.raw?.recruiterId;

    if (currentUserId && jobRecruiterId && String(currentUserId) === String(jobRecruiterId)) {
      return true;
    }

    const currentUserEmail = user.email?.toLowerCase();
    const jobRecruiterEmail = (job.recruiterEmail || job.recruiter?.user?.email)?.toLowerCase();
    if (currentUserEmail && jobRecruiterEmail && currentUserEmail === jobRecruiterEmail) {
      return true;
    }

    const currentUserName = (user.fullName || user.name)?.trim().toLowerCase();
    const jobRecruiterName = (job.recruiterName || job.recruiter?.user?.fullName)?.trim().toLowerCase();
    if (currentUserName && jobRecruiterName && currentUserName === jobRecruiterName) {
      return true;
    }

    try {
      const myCreated = JSON.parse(localStorage.getItem('hiremate_my_created_jobs') || '[]');
      if (Array.isArray(myCreated) && myCreated.some((id) => String(id) === String(job.jobId || currentId))) {
        return true;
      }
    } catch (e) {}

    return false;
  }, [job, user, rawRole, currentId]);

  const handleConfirmDelete = async () => {
    if (!job) return;
    try {
      setIsDeleting(true);
      await jobApi.deleteJob(job.jobId || currentId);

      try {
        const myCreated = JSON.parse(localStorage.getItem('hiremate_my_created_jobs') || '[]');
        const updated = myCreated.filter((id) => String(id) !== String(job.jobId || currentId));
        localStorage.setItem('hiremate_my_created_jobs', JSON.stringify(updated));
      } catch (e) {}

      setShowDeleteModal(false);
      window.location.hash = '#/recruiter-jobs';
    } catch (err) {
      console.error('Lỗi khi xóa tin tuyển dụng:', err);
      alert(err.response?.data?.message || err.message || 'Không thể xóa tin tuyển dụng này.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setIsBookmarked(isJobSaved(currentId));
  }, [currentId]);

  const handleToggleBookmark = () => {
    if (!user) {
      window.location.hash = '#/login';
      return;
    }
    const targetJob = job || { id: currentId, jobId: currentId, title: 'Vị trí Tuyển dụng' };
    const saved = toggleSaveJob(targetJob);
    setIsBookmarked(saved);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Format salary
  const formatSalary = (min, max, text) => {
    if (text) return text;
    const minNum = Number(min);
    const maxNum = Number(max);

    if (minNum >= 1000000 && maxNum >= 1000000) {
      const minMil = minNum / 1000000;
      const maxMil = maxNum / 1000000;
      const minStr = Number.isInteger(minMil) ? minMil : minMil.toFixed(0);
      const maxStr = Number.isInteger(maxMil) ? maxMil : maxMil.toFixed(0);
      return `${minStr} – ${maxStr} triệu VNĐ / tháng`;
    }
    if (minNum && maxNum) {
      return `$${minNum.toLocaleString()} – $${maxNum.toLocaleString()}/tháng`;
    }
    return 'Lương thỏa thuận';
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchFn = jobApi?.getJobDetail || jobApi?.getJobById;
    if (typeof fetchFn === 'function') {
      fetchFn(currentId)
        .then((res) => {
          if (mounted && res?.data) {
            const apiData = res.data;
            const compName = apiData.companyName || apiData.company?.companyName || 'Doanh Nghiệp Tuyển Dụng';
            const template = getRoleTemplate(apiData.title || '');

            // Skills breakdown
            let mand = Array.isArray(apiData.mandatorySkills) && apiData.mandatorySkills.length > 0
              ? apiData.mandatorySkills
              : [];
            let pref = Array.isArray(apiData.preferredSkills) && apiData.preferredSkills.length > 0
              ? apiData.preferredSkills
              : [];

            if (mand.length === 0 && pref.length === 0) {
              const all = Array.isArray(apiData.skills) && apiData.skills.length > 0
                ? apiData.skills
                : template.recommendedMandatory.concat(template.recommendedPreferred);
              const split = Math.max(1, Math.ceil(all.length * 0.7));
              mand = all.slice(0, split);
              pref = all.slice(split);
            }

            setJob({
              jobId: apiData.jobId || currentId,
              code: apiData.code || `JD-IT-${apiData.jobId || currentId}`,
              title: apiData.title || 'Vị trí Tuyển Dụng',
              companyName: compName,
              companyId: apiData.companyId || apiData.company?.companyId,
              companyLogo: getBrandLogo(compName, apiData.companyLogo || apiData.company?.logoUrl),
              companyCover: getBrandCover(compName),
              companyIndustry: apiData.domain || apiData.company?.industry || 'Công nghệ thông tin',
              companyAddress: apiData.companyAddress || apiData.company?.address || 'Việt Nam',
              companySize: apiData.companySize || '100 - 500 nhân sự',
              companyWebsite: apiData.companyWebsite || apiData.company?.website || '',
              companyDesc: apiData.companyDescription || apiData.company?.description || 'Đang cập nhật giới thiệu công ty.',
              location: apiData.location || 'Việt Nam',
              employmentType: apiData.employmentType === 'FULL_TIME' ? 'Toàn thời gian (Full-time)' : (apiData.employmentType || 'Toàn thời gian (Full-time)'),
              salaryMin: apiData.salaryMin,
              salaryMax: apiData.salaryMax,
              salaryFormatted: formatSalary(apiData.salaryMin, apiData.salaryMax, apiData.salaryText),
              vacanciesCount: apiData.vacanciesCount || 1,
              deadlineDate: apiData.deadlineDate || null,
              deadline: apiData.deadlineDate ? new Date(apiData.deadlineDate).toLocaleDateString('vi-VN') : 'Không thời hạn',
              postedTime: apiData.createdAt ? new Date(apiData.createdAt).toLocaleDateString('vi-VN') : 'Mới đăng',
              recruiterId: apiData.recruiterId || apiData.recruiter?.userId || apiData.recruiter?.user_id,
              recruiterEmail: apiData.recruiterEmail || apiData.recruiter?.email,
              recruiterName: apiData.recruiterName || apiData.recruiter?.fullName || 'Bộ phận Tuyển dụng (HR)',
              applicantCount: apiData.applicantCount != null ? apiData.applicantCount : 0,
              skills: Array.isArray(apiData.skills) ? apiData.skills : [],
              mandatorySkills: mand,
              preferredSkills: pref,
              description: apiData.description,
              requirements: apiData.requirements,
              benefits: apiData.benefits,
              aiMatchScore: apiData.aiMatchScore != null ? apiData.aiMatchScore : (apiData.matchingScore != null ? Math.round(apiData.matchingScore) : null),
            });

            // Tải danh sách việc làm liên quan
            // Tải danh sách việc làm liên quan THẬT từ Supabase qua jobApi.getJobs()
            if (jobApi?.getJobs) {
              jobApi.getJobs()
                .then((jobsRes) => {
                  const list = Array.isArray(jobsRes?.data) ? jobsRes.data : (Array.isArray(jobsRes) ? jobsRes : []);
                  if (Array.isArray(list) && mounted) {
                    // Lọc bỏ tin hiện tại và chỉ lấy tin đã được duyệt APPROVED
                    const otherJobs = list.filter((j) =>
                      String(j.jobId) !== String(currentId) &&
                      (!j.approvalStatus || j.approvalStatus === 'APPROVED')
                    );

                    // Sắp xếp ưu tiên: cùng công ty trước, sau đó tới các công ty khác
                    const currentCompanyId = apiData.companyId || apiData.company?.companyId;
                    const currentCompanyName = (compName || '').trim().toLowerCase();
                    const sorted = [...otherJobs].sort((a, b) => {
                      const aSame = (currentCompanyId && a.companyId === currentCompanyId) ||
                                    ((a.companyName || '').trim().toLowerCase() === currentCompanyName);
                      const bSame = (currentCompanyId && b.companyId === currentCompanyId) ||
                                    ((b.companyName || '').trim().toLowerCase() === currentCompanyName);
                      if (aSame && !bSame) return -1;
                      if (!aSame && bSame) return 1;
                      return 0;
                    });
                    setRelatedJobs(sorted.slice(0, 5));
                  }
                })
                .catch((err) => {
                  console.warn('Lỗi khi tải việc làm liên quan từ Supabase:', err);
                  if (mounted) setRelatedJobs([]);
                });
            }
          }
        })
        .catch((err) => {
          if (mounted) {
            console.warn('Failed to load job detail:', err);
            setError('Không thể tải thông tin tin tuyển dụng này.');
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => { mounted = false; };
  }, [currentId]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#5b48bd] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Đang tải thông tin chi tiết bài đăng tuyển dụng...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-sans space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#5b48bd] flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-3xl">search_off</span>
        </div>
        <h2 className="text-xl font-bold text-[#1e1b4b]">Không Tìm Thấy Tin Tuyển Dụng</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {error || 'Công việc này hiện không khả dụng hoặc đã hết thời hạn ứng tuyển.'}
        </p>
        <div>
          <a
            href={isRecruiter ? '#/recruiter-jobs' : isAdmin ? '#/admin-dashboard?tab=JOBS' : '#/'}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#5b48bd] text-white text-xs font-bold hover:bg-[#47369f] transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Quay lại danh sách</span>
          </a>
        </div>
      </div>
    );
  }

  const template = getRoleTemplate(job.title || '');

  // Extract descriptions without losing user input
  const getDescriptionBullets = () => {
    const userBullets = parseCleanBullets(job.description);
    if (userBullets.length >= 1) return userBullets;
    return template.descriptions;
  };

  // Extract requirements without losing user input
  const getRequirementBullets = () => {
    const userBullets = parseCleanBullets(job.requirements);
    if (userBullets.length >= 1) return userBullets;
    return template.requirements;
  };

  // Extract benefits entered by HR (split by newline or semicolon)
  const getBenefitBullets = () => {
    if (!job.benefits) return [];
    let raw = String(job.benefits).replaceAll('\\n', '\n');
    let items = [];
    if (raw.includes('\n')) {
      items = raw.split('\n');
    } else if (raw.includes(';')) {
      items = raw.split(';');
    } else {
      items = [raw];
    }
    return items
      .map((item) => item.trim().replace(/^[-*•\d+.]\s*/, ''))
      .filter((item) => item.length > 0);
  };

  const descriptionBullets = getDescriptionBullets();
  const requirementBullets = getRequirementBullets();
  const benefitBullets = getBenefitBullets();
  const deadlineInfo = calculateJobDeadline(job.deadlineDate);
  const jobCriteria = extractJobCriteria(job);

  // Fallback related jobs matching mockup if DB has few jobs
  // Dữ liệu việc làm liên quan lấy 100% từ Supabase (không dùng mock)
  const displayedRelatedJobs = relatedJobs;

  return (
    <div className="w-full min-h-screen bg-[#f8f9fd] antialiased font-sans pb-24 selection:bg-[#5b48bd] selection:text-white">
      {/* Copied Link Toast */}
      {copiedLink && (
        <div className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-[#221d47] text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce border border-purple-300/30">
          <span className="material-symbols-outlined text-base text-[#10b981]">check_circle</span>
          <span>Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!</span>
        </div>
      )}

      {/* TOP BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <a
            href={isRecruiter ? '#/recruiter-jobs' : isAdmin ? '#/admin-dashboard?tab=JOBS' : '#/'}
            className="hover:text-[#5b48bd] flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">home</span>
          </a>
          <span className="text-slate-300">&gt;</span>
          <a
            href={isRecruiter ? '#/recruiter-jobs' : isAdmin ? '#/admin-dashboard?tab=JOBS' : '#/'}
            className="hover:text-[#5b48bd] transition-colors"
          >
            {isRecruiter 
              ? (isJobOwner ? 'Quản lý tin tuyển dụng' : 'Khảo sát việc làm thị trường')
              : isAdmin ? 'Quản trị tin đăng' : 'Việc làm'}
          </a>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-600 font-medium">{job.companyIndustry || 'Lập trình'}</span>
          <span className="text-slate-300">&gt;</span>
          <span className="font-bold text-[#1e1b4b] truncate max-w-xs">{job.title}</span>
        </nav>
      </div>

      {/* ============================================================ */}
      {/* 2-COLUMN MAIN LAYOUT (CINEMATIC GLASSY DASHBOARD V2)          */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ============================================================ */}
        {/* LEFT COLUMN (MAIN CONTENT: 8 COLS)                          */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 space-y-5">

          {/* 1. HERO HEADER CARD */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/85 p-6 sm:p-7 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.07)] relative overflow-hidden">
            {/* Top Specular Sheen Highlight */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden="true" />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              {/* Left: Avatar & Metadata */}
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Logo Box */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#edeafd] border border-purple-200 flex items-center justify-center font-extrabold text-2xl text-[#5b48bd] shrink-0 p-2 overflow-hidden shadow-2xs">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span>{getCompanyInitials(job.companyName)}</span>
                  )}
                </div>

                {/* Title & Info */}
                <div className="space-y-1.5">
                  <div>
                    <span className="bg-[#edeafd]/80 text-[#5b48bd] border border-purple-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-block">
                      {job.companyIndustry}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] tracking-tight leading-tight">
                    {job.title}
                  </h1>

                  <div className="flex items-center gap-1.5 text-sm font-bold text-[#5b48bd]">
                    <span>{job.companyName}</span>
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]" title="Doanh nghiệp xác thực">
                      verified
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                      <span>Đăng {job.postedTime}</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                      <span>Còn {job.vacanciesCount} người</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                      <span>{job.location}</span>
                    </span>
                  </div>

                  {/* 4 Core Attribute Badges: Cấp Bậc, Bằng Cấp, Kinh Nghiệm, Môi Trường */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs">
                      <span className="material-symbols-outlined text-sm text-[#5b48bd]">workspace_premium</span>
                      <span>Cấp bậc: {jobCriteria.jobLevelLabel}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs">
                      <span className="material-symbols-outlined text-sm text-blue-600">school</span>
                      <span className="truncate max-w-[220px]" title={jobCriteria.educationLabel}>Bằng cấp: {jobCriteria.educationLabel}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                      <span className="material-symbols-outlined text-sm text-emerald-600">work_history</span>
                      <span className="truncate max-w-[200px]" title={jobCriteria.experienceLabel}>Kinh nghiệm: {jobCriteria.experienceLabel}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
                      <span className="material-symbols-outlined text-sm text-amber-600">apartment</span>
                      <span>{jobCriteria.workplaceLabel}</span>
                    </span>
                  </div>

                  {/* Recruiter Pill & Contact Action */}
                  <div className="pt-1.5 flex items-center gap-2.5 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                      <span className="material-symbols-outlined text-purple-600 text-[16px]">person</span>
                      <span>HR: {job.recruiterName}</span>
                    </div>

                    {!isJobOwner && (
                      <a
                        href={createCandidateToHrMailto({
                          hrEmail: job.recruiterEmail || 'tuyendung@fpt.com',
                          hrName: job.recruiterName,
                          companyName: job.companyName,
                          jobTitle: job.title,
                          candidateName: user?.fullName || user?.name || 'Ứng viên',
                          candidateEmail: user?.email,
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                        title="Gửi email trao đổi trực tiếp với HR phụ trách bài đăng tuyển dụng này"
                      >
                        <span>✉️ Gửi Email cho HR</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions & Badges (Role-tailored) */}
              <div className="flex flex-col items-end gap-2.5 shrink-0 w-full md:w-auto">
                {isRecruiter ? (
                  isJobOwner ? (
                    <>
                      {/* Recruiter Stats Pill - HỒ SƠ ỨNG VIÊN CÔNG TY BẠN */}
                      <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs self-end">
                        <span className="material-symbols-outlined text-sm text-emerald-600">groups</span>
                        <span>{job.applicantCount || 0} hồ sơ đã nộp</span>
                      </div>

                      {/* Recruiter Action 1: View Applicants */}
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#/applicants-management?jobId=${job.jobId}`;
                        }}
                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#6d57d9] hover:from-[#4938a5] hover:to-[#5c47cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">how_to_reg</span>
                        <span>Xem hồ sơ ứng viên ({job.applicantCount || 0})</span>
                      </button>

                      {/* Recruiter Action 2: Edit Job */}
                      <button
                        type="button"
                        onClick={() => {
                          window.location.hash = `#/recruiter-jobs?edit=${job.jobId}`;
                        }}
                        className="w-full md:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200 text-[#5b48bd] bg-white hover:bg-purple-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_document</span>
                        <span>Chỉnh sửa tin đăng</span>
                      </button>

                      {/* Recruiter Action 2.5: Delete Job (Chỉ người đăng tin hoặc Admin mới được xóa) */}
                      {canDeleteThisJob ? (
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                          className="w-full md:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100 shadow-2xs hover:shadow"
                          title="Xóa vĩnh viễn tin tuyển dụng này"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Xóa tin tuyển dụng</span>
                        </button>
                      ) : (
                        <div
                          className="w-full md:w-auto px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-medium flex items-center justify-center gap-1.5 shadow-2xs"
                          title={`Bài đăng do chuyên viên ${job.recruiterName || 'khác'} tạo. Bạn không có quyền xóa.`}
                        >
                          <span className="material-symbols-outlined text-[14px] text-slate-400">lock</span>
                          <span>Đăng bởi: <strong className="text-slate-700">{job.recruiterName || 'Đồng nghiệp'}</strong> (Không thể xóa)</span>
                        </div>
                      )}

                      {/* Recruiter Action 3: Share Link */}
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full md:w-auto px-3.5 py-1 rounded-xl font-semibold text-[11px] text-slate-500 hover:text-[#5b48bd] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">share</span>
                        <span>Sao chép link gửi ứng viên</span>
                      </button>
                    </>
                  ) : (
                    /* RECRUITER CÔNG TY KHÁC ĐANG XEM TIN ĐỐI TÁC (CHẾ ĐỘ THAM KHẢO THỊ TRƯỜNG) */
                    <>
                      <div className="flex flex-col items-end gap-1">
                        <div className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs self-end">
                          <span className="material-symbols-outlined text-sm text-blue-600">business</span>
                          <span>Doanh nghiệp: {job.companyName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-amber-500">visibility</span>
                          <span>Chế độ tham khảo thị trường (HR)</span>
                        </span>
                      </div>

                      {/* Action 1: Bookmark reference */}
                      <button
                        type="button"
                        onClick={handleToggleBookmark}
                        className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border ${
                          isBookmarked
                            ? 'border-[#f97316] text-[#f97316] bg-orange-50'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isBookmarked ? 'bookmark' : 'bookmark_border'}
                        </span>
                        <span>{isBookmarked ? 'Đã lưu tin tham khảo' : 'Lưu tin tham khảo'}</span>
                      </button>

                      {/* Action 2: Share */}
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full md:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200 text-[#5b48bd] bg-white hover:bg-purple-50"
                      >
                        <span className="material-symbols-outlined text-[15px]">share</span>
                        <span>Chia sẻ tin tuyển dụng</span>
                      </button>
                    </>
                  )
                ) : isAdmin ? (
                  <>
                    {/* Admin Status Pill */}
                    <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs self-end">
                      <span className="material-symbols-outlined text-sm text-indigo-600">admin_panel_settings</span>
                      <span>Quyền Quản Trị Hệ Thống</span>
                    </div>

                    {/* Admin Action 1: Moderation */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '#/admin-dashboard?tab=JOBS';
                      }}
                      className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Kiểm duyệt tin đăng</span>
                    </button>

                    {/* Admin Action 2: Admin Portal */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '#/admin-dashboard?tab=JOBS';
                      }}
                      className="w-full md:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">dashboard</span>
                      <span>Bảng điều khiển Admin</span>
                    </button>
                  </>
                ) : isCandidate ? (
                  <>
                    {/* AI Match Pill for Candidate */}
                    {job.aiMatchScore != null ? (
                      <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-[#5b48bd] font-extrabold text-xs flex items-center gap-1.5 shadow-2xs self-end" title="Độ so khớp giữa CV cá nhân của bạn và tiêu chuẩn công việc">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">auto_awesome</span>
                        <span>Match AI: {job.aiMatchScore}%</span>
                      </div>
                    ) : (
                      <div className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-xs flex items-center gap-1.5 shadow-2xs self-end">
                        <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span>
                        <span>AI đang phân tích độ phù hợp CV</span>
                      </div>
                    )}

                    {/* Primary Button */}
                    {myApplication ? (
                      <a
                        href="#/applications"
                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">task_alt</span>
                        <span>Đã Ứng Tuyển (Xem tiến trình)</span>
                      </a>
                    ) : (deadlineInfo.isExpired || (job.status && job.status !== 'ACTIVE' && job.status !== 'OPEN' && job.status !== 'PUBLISHED')) ? (
                      <button
                        type="button"
                        disabled
                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">event_busy</span>
                        <span>{deadlineInfo.isExpired ? 'Đã Hết Hạn Nộp' : 'Đã Đóng Tuyển'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsApplying(true);
                        }}
                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#6d57d9] hover:from-[#4938a5] hover:to-[#5c47cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Ứng tuyển ngay</span>
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    )}

                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      className={`w-full md:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                        isBookmarked
                          ? 'border-[#f97316] text-[#f97316] bg-orange-50'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isBookmarked ? 'bookmark' : 'bookmark_border'}
                      </span>
                      <span>{isBookmarked ? 'Đã lưu việc làm' : 'Lưu việc làm'}</span>
                    </button>
                  </>
                ) : (
                  /* GUEST (CHƯA ĐĂNG NHẬP) */
                  <>
                    <div className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-medium text-xs flex items-center gap-1.5 shadow-2xs self-end">
                      <span className="material-symbols-outlined text-sm text-[#5b48bd]">psychology</span>
                      <span>Đăng nhập để AI đo độ phù hợp</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '#/login';
                      }}
                      className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#6d57d9] hover:from-[#4938a5] hover:to-[#5c47cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Đăng nhập để ứng tuyển</span>
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '#/login';
                      }}
                      className="w-full md:w-auto px-6 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
                      <span>Lưu việc làm</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          </section>

          {/* 2. DEADLINE NOTIFICATION BAR */}
          <div className="p-3.5 rounded-2xl bg-white border border-purple-100/90 flex items-center justify-between text-xs shadow-xs gap-3">
            <div className="flex items-center gap-2.5 text-slate-700">
              <div className="w-8 h-8 rounded-xl bg-[#edeafd] text-[#5b48bd] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">event_available</span>
              </div>
              <div>
                <span>Thời hạn tiếp nhận hồ sơ: </span>
                <strong className="text-slate-900">
                  {deadlineInfo.isExpired ? 'Đã quá hạn' : (deadlineInfo.daysLeft ? `Còn ${deadlineInfo.daysLeft} ngày` : 'Còn ngày')}
                </strong>
                <span className="text-slate-500">
                  {' '}(Hạn chót: {deadlineInfo.hasDeadline ? deadlineInfo.formattedDate : 'Không thời hạn'}).
                </span>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
              deadlineInfo.isExpired
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : deadlineInfo.isExpiringSoon
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {deadlineInfo.isExpired ? 'Đã Hết Hạn' : deadlineInfo.isExpiringSoon ? 'Sắp Hết Hạn' : 'Đang Mở Nhận CV'}
            </span>
          </div>

          {/* 2.5 TIÊU CHUẨN HỌC VẤN, CẤP BẬC & ĐIỀU KIỆN TUYỂN DỤNG WIDGET */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#5b48bd] flex items-center justify-center shrink-0 border border-purple-100">
                  <span className="material-symbols-outlined text-lg">school</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1e1b4b] flex items-center gap-2">
                    <span>Tiêu Chuẩn Học Vấn, Cấp Bậc &amp; Điều Kiện Tuyển Dụng</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">Chuẩn Doanh Nghiệp</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Khung điều kiện đầu vào của vị trí tuyển dụng do bộ phận HR và Tech Lead ban hành
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Cấp bậc */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-100/90 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">workspace_premium</span>
                  <span>Cấp Bậc Vị Trí</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-[#1e1b4b] leading-tight">
                  {jobCriteria.jobLevelLabel}
                </div>
                <p className="text-[11px] text-slate-500">
                  {jobCriteria.jobLevelLabel.includes('Intern') ? 'Tiếp nhận sinh viên / Fresher, đào tạo chuyên sâu' : 'Vị trí công tác chính thức tại dự án'}
                </p>
              </div>

              {/* Card 2: Bằng cấp / Học vấn */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/70 to-sky-50/50 border border-blue-100/90 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-blue-600">school</span>
                  <span>Yêu Cầu Bằng Cấp</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight line-clamp-2" title={jobCriteria.educationLabel}>
                  {jobCriteria.educationLabel}
                </div>
                <p className="text-[11px] text-slate-500">
                  Chuyên ngành CNTT hoặc tương đương
                </p>
              </div>

              {/* Card 3: Kinh nghiệm */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-100/90 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-emerald-600">work_history</span>
                  <span>Kinh Nghiệm</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight line-clamp-2" title={jobCriteria.experienceLabel}>
                  {jobCriteria.experienceLabel}
                </div>
                <p className="text-[11px] text-slate-500">
                  {jobCriteria.jobLevelLabel.includes('Intern') ? 'Chấp nhận chưa có kinh nghiệm thực tế' : 'Kinh nghiệm dự án liên quan'}
                </p>
              </div>

              {/* Card 4: Môi trường làm việc */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-100/90 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-amber-600">apartment</span>
                  <span>Môi Trường &amp; Giới Tính</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                  {jobCriteria.workplaceLabel}
                </div>
                <p className="text-[11px] text-slate-500">
                  Giới tính: {jobCriteria.genderLabel}
                </p>
              </div>
            </div>
          </div>

          {/* 3. 4 KEY METRICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Mức Thu Nhập */}
            <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm text-emerald-600">payments</span>
                <span>Mức Thu Nhập</span>
              </div>
              <div className="text-base font-black text-[#ea580c] leading-tight">
                {job.salaryFormatted}
              </div>
              <p className="text-[11px] text-slate-500">Gross/Net + Thưởng dự án</p>
            </div>

            {/* Địa Điểm */}
            <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">location_on</span>
                <span>Địa Điểm</span>
              </div>
              <div className="text-sm font-bold text-[#1e1b4b] leading-tight truncate">
                {job.location}
              </div>
              <p className="text-[11px] text-slate-500">Linh hoạt Hybrid / WFH</p>
            </div>

            {/* Hình Thức */}
            <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">work</span>
                <span>Hình Thức</span>
              </div>
              <div className="text-sm font-bold text-[#1e1b4b] leading-tight truncate">
                {job.employmentType}
              </div>
              <p className="text-[11px] text-slate-500 truncate" title={jobCriteria.jobLevelLabel}>Cấp bậc: {jobCriteria.jobLevelLabel}</p>
            </div>

            {/* Hạn Nộp Hồ Sơ */}
            <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className={`material-symbols-outlined text-sm ${deadlineInfo.isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                  {deadlineInfo.isExpired ? 'event_busy' : 'event_available'}
                </span>
                <span>Hạn Nộp Hồ Sơ</span>
              </div>
              <div className={`text-sm font-bold leading-tight ${deadlineInfo.isExpired ? 'text-rose-600' : 'text-[#1e1b4b]'}`}>
                {deadlineInfo.hasDeadline ? deadlineInfo.formattedDate : 'Không thời hạn'}
              </div>
              <p className={`text-[11px] font-semibold ${deadlineInfo.isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                {deadlineInfo.isExpired ? 'Đã hết hạn tiếp nhận' : (deadlineInfo.label || 'Không thời hạn')}
              </p>
            </div>
          </div>

          {/* 4. SKILLS CARD: 70% MANDATORY / 30% PREFERRED (EXACTLY MATCHING MOCKUP) */}
          <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#edeafd] text-[#5b48bd] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">psychology</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1e1b4b]">
                    {isRecruiter 
                      ? (isJobOwner ? 'Tiêu Chí Lọc Hồ Sơ & Đánh Giá Ứng Viên Bằng AI' : `Tiêu Chuẩn Kỹ Năng Tuyển Dụng (${job.companyName})`) 
                      : isAdmin 
                      ? 'Tiêu Chuẩn Kỹ Năng & Trọng Số Phê Duyệt Tin Đăng' 
                      : 'Tiêu Chuẩn Kỹ Năng & Trọng Số So Khớp AI HireMate'}
                  </h3>
                  {isRecruiter && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isJobOwner
                        ? 'Bộ khung tiêu chuẩn AI dùng để quét, so khớp và xếp hạng ứng viên nộp CV cho tin đăng của công ty bạn'
                        : `Bộ tiêu chuẩn kỹ năng do ${job.companyName} thiết lập để tuyển dụng vị trí này`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-500 font-medium">
                  Thuật toán 70% Bắt buộc + 30% Ưu tiên
                </span>
                <div className="h-1.5 w-36 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-[#5b48bd] h-full" style={{ width: '70%' }}></div>
                  <div className="bg-[#a78bfa] h-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>

            {/* Recruiter Rubric Clarification Box */}
            {isRecruiter && (
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-[#5b48bd] text-base shrink-0 mt-0.5">info</span>
                <div className="leading-relaxed">
                  {isJobOwner ? (
                    <>
                      <strong className="text-[#1e1b4b]">Dành cho Nhà Tuyển Dụng (Tin của công ty bạn):</strong> Đây là công thức trọng số tiêu chuẩn của HireMate AI (<strong>70% kỹ năng bắt buộc + 30% kỹ năng ưu tiên</strong>) dùng để <strong>tự động đối chiếu và chấm điểm độ phù hợp (Match AI)</strong> cho từng CV ứng viên nộp vào tin này. Hồ sơ Nhà tuyển dụng không tham gia ứng tuyển nên không có điểm Match AI cá nhân.
                    </>
                  ) : (
                    <>
                      <strong className="text-[#1e1b4b]">Chế độ tham khảo thị trường:</strong> Đây là bộ tiêu chuẩn kỹ năng (<strong>70% kỹ năng bắt buộc + 30% kỹ năng ưu tiên</strong>) do công ty <strong>{job.companyName}</strong> thiết lập để AI chấm điểm ứng viên cho vị trí này. Bạn đang xem ở chế độ tham khảo dành cho Nhà tuyển dụng đối tác.
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Kỹ Năng Bắt Buộc (70%) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5b48bd]"></span>
                <span>Kỹ Năng Bắt Buộc (70% Trọng Số):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.mandatorySkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1 rounded-full text-xs font-bold bg-white text-[#5b48bd] border border-purple-200 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd]"></span>
                    <span>{sk}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Kỹ Năng Ưu Tiên (30%) */}
            {job.preferredSkills.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-[#1e1b4b] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#a78bfa]"></span>
                  <span>Kỹ Năng Ưu Tiên / Điểm Cộng (30% Trọng Số):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white text-[#5b48bd] border border-purple-200 flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                      <span>{sk}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. NAVIGATION UNDERLINE TABS */}
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

          {/* 6. EDITORIAL CONTENT BOX */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-6 text-xs sm:text-[13px] leading-relaxed text-slate-700">

            {/* TRÁCH NHIỆM & MÔ TẢ CÔNG VIỆC */}
            {(activeTab === 'ALL' || activeTab === 'JD') && (
              <section className="space-y-3">
                <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#5b48bd]">description</span>
                  Trách Nhiệm &amp; Mô Tả Công Việc
                </h3>
                <div className="space-y-2.5 pt-1">
                  {descriptionBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5b48bd] mt-2 shrink-0"></span>
                      <span className="flex-1 text-slate-800 font-medium leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* YÊU CẦU NĂNG LỰC & KINH NGHIỆM */}
            {(activeTab === 'ALL' || activeTab === 'REQUIREMENTS') && (
              <section className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#ea580c]">verified</span>
                  Yêu Cầu Năng Lực &amp; Kinh Nghiệm
                </h3>
                <div className="space-y-2.5 pt-1">
                  {requirementBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-2 shrink-0"></span>
                      <span className="flex-1 text-slate-800 font-medium leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* QUYỀN LỢI & ĐÃI NGỘ */}
            {(activeTab === 'ALL' || activeTab === 'BENEFITS') && (
              <section className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-600">card_giftcard</span>
                  Quyền Lợi &amp; Chế Độ Đãi Ngộ
                </h3>
                {benefitBullets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    {benefitBullets.map((b, idx) => {
                      const icons = ['monetization_on', 'shield_with_heart', 'devices', 'flight', 'workspace_premium', 'redeem', 'trending_up', 'verified'];
                      const colors = ['text-emerald-600', 'text-blue-600', 'text-[#5b48bd]', 'text-amber-600', 'text-indigo-600', 'text-purple-600', 'text-teal-600'];
                      const icon = icons[idx % icons.length];
                      const color = colors[idx % colors.length];
                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 flex items-start gap-2.5">
                          <span className={`material-symbols-outlined ${color} text-lg shrink-0`}>{icon}</span>
                          <div>
                            <span className="text-slate-800 font-medium leading-relaxed">{b}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">monetization_on</span>
                      <div>
                        <strong className="text-slate-900 block mb-0.5">Thu nhập cạnh tranh</strong>
                        <span>Mức lương {job.salaryFormatted} kèm thưởng dự án và xét tăng lương định kỳ.</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-blue-600 text-lg shrink-0">shield_with_heart</span>
                      <div>
                        <strong className="text-slate-900 block mb-0.5">Bảo hiểm sức khỏe toàn diện</strong>
                        <span>Đầy đủ BHXH/BHYT theo luật và gói chăm sóc y tế cao cấp cho nhân viên.</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[#5b48bd] text-lg shrink-0">devices</span>
                      <div>
                        <strong className="text-slate-900 block mb-0.5">Trang thiết bị hiện đại</strong>
                        <span>Cung cấp máy tính xách tay cấu hình cao chuyên dụng và màn hình ngoài làm việc.</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">flight</span>
                      <div>
                        <strong className="text-slate-900 block mb-0.5">Nghỉ phép &amp; Teambuilding</strong>
                        <span>15 ngày phép năm có lương, hoạt động du lịch dã ngoại và gắn kết đội ngũ hàng năm.</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* QUY TRÌNH TUYỂN DỤNG */}
            {(activeTab === 'ALL' || activeTab === 'PROCESS') && (
              <section className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#5b48bd]">route</span>
                  Quy Trình Tuyển Dụng (4 Giai Đoạn)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-[#f8f7ff] border border-purple-100 text-center space-y-1">
                    <span className="w-5 h-5 mx-auto rounded-full bg-[#5b48bd] text-white text-[10px] font-black flex items-center justify-center">1</span>
                    <div className="font-bold text-[#221d47] text-[11px]">Nộp Hồ Sơ</div>
                    <div className="text-[10px] text-slate-400">Quét &amp; duyệt CV AI</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f8f7ff] border border-purple-100 text-center space-y-1">
                    <span className="w-5 h-5 mx-auto rounded-full bg-[#5b48bd] text-white text-[10px] font-black flex items-center justify-center">2</span>
                    <div className="font-bold text-[#221d47] text-[11px]">Luyện Phỏng Vấn</div>
                    <div className="text-[10px] text-slate-400">Mock Interview AI</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f8f7ff] border border-purple-100 text-center space-y-1">
                    <span className="w-5 h-5 mx-auto rounded-full bg-[#5b48bd] text-white text-[10px] font-black flex items-center justify-center">3</span>
                    <div className="font-bold text-[#221d47] text-[11px]">Phỏng Vấn Trực Tiếp</div>
                    <div className="text-[10px] text-slate-400">Tech Lead &amp; HR</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1">
                    <span className="w-5 h-5 mx-auto rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">4</span>
                    <div className="font-bold text-emerald-800 text-[11px]">Nhận Offer</div>
                    <div className="text-[10px] text-emerald-600">Gia nhập dự án</div>
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* 7. BOTTOM CTA BANNER (ROLE-TAILORED) */}
          {isRecruiter ? (
            isJobOwner ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#edeafd]/70 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-[#5b48bd] flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-xl">manage_accounts</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                        Quản lý tuyển dụng vị trí này
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Tin của công ty bạn
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Hiện có <strong className="text-[#5b48bd] font-bold">{job.applicantCount || 0} hồ sơ ứng tuyển</strong> đang chờ xét duyệt và xếp lịch phỏng vấn.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = `#/recruiter-jobs?edit=${job.jobId}`;
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-slate-700 hover:text-[#5b48bd] border border-purple-200 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit_document</span>
                    <span>Sửa bài đăng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = `#/applicants-management?jobId=${job.jobId}`;
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#4938a5] hover:to-[#6a54cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">how_to_reg</span>
                    <span>Xem danh sách ứng viên ({job.applicantCount || 0})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* RECRUITER CÔNG TY KHÁC ĐANG XEM TIN ĐỐI TÁC (CHẾ ĐỘ THAM KHẢO THỊ TRƯỜNG) */
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#5b48bd] flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-xl">domain</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                        Tin tuyển dụng của {job.companyName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Chế độ tham khảo thị trường
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Bạn đang xem tin đăng của doanh nghiệp khác. Quyền chỉnh sửa và quản lý danh sách ứng viên chỉ dành riêng cho HR phụ trách thuộc <strong>{job.companyName}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = '#/recruiter-jobs';
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#4938a5] hover:to-[#6a54cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">work_outline</span>
                    <span>Quản lý tin của công ty tôi</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            )
          ) : isAdmin ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                      Kiểm soát &amp; Phê duyệt tin đăng (System Admin)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Quyền Quản Trị
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Kiểm tra nội dung tuyển dụng, bảo đảm phù hợp tiêu chuẩn chất lượng và chính sách của HireMate AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/admin-dashboard?tab=JOBS';
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Bảng Kiểm Duyệt Admin</span>
              </button>
            </div>
          ) : isCandidate ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#edeafd]/60 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-[#5b48bd] flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                    Bạn có phù hợp với vị trí này?
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hãy nộp CV của bạn để HireMate AI tự động chấm điểm độ phù hợp và chuyển tới HR.
                  </p>
                </div>
              </div>

              {myApplication ? (
                <a
                  href="#/applications"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  <span>Đã Ứng Tuyển (Xem tiến trình)</span>
                </a>
              ) : (deadlineInfo.isExpired || (job.status && job.status !== 'ACTIVE' && job.status !== 'OPEN' && job.status !== 'PUBLISHED')) ? (
                <button
                  type="button"
                  disabled
                  className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">event_busy</span>
                  <span>{deadlineInfo.isExpired ? 'Đã Hết Hạn Nộp' : 'Đã Đóng Tuyển'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsApplying(true);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#4938a5] hover:to-[#6a54cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Ứng tuyển ngay</span>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              )}
            </div>
          ) : (
            /* GUEST */
            <div className="p-4 sm:p-5 rounded-2xl bg-[#edeafd]/60 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-[#5b48bd] flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="material-symbols-outlined text-xl">login</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1e1b4b]">
                    Bạn muốn ứng tuyển vị trí này?
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Đăng nhập hoặc đăng ký tài khoản Ứng viên để tải CV lên và nhận đánh giá độ phù hợp (Match AI) ngay lập tức.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/login';
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#4938a5] hover:to-[#6a54cb] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Đăng nhập ngay</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN (SIDEBAR: 4 COLS - MATCHING USER SCREENSHOT)    */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 space-y-5">

          {/* WIDGET 1: COMPANY OVERVIEW CARD */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/85 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.07)] overflow-hidden relative">
            {/* Top Specular Sheen */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden="true" />
            {/* Building Photo Cover */}
            <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-100">
              <img
                src={job.companyCover}
                alt={job.companyName}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Content Below Photo with Overlapping Logo */}
            <div className="px-5 pb-5">
              {/* Overlapping Company Logo */}
              <div className="-mt-8 w-16 h-16 rounded-2xl bg-white p-2 shadow-md border border-purple-100 flex items-center justify-center font-bold text-xl text-[#5b48bd] relative z-10 overflow-hidden">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span>{getCompanyInitials(job.companyName)}</span>
                )}
              </div>

              <div className="pt-3 space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-base text-[#1e1b4b]">
                    {job.companyId ? (
                      <a
                        href={`#/companies/${job.companyId}`}
                        className="hover:text-[#5b48bd] transition-colors hover:underline cursor-pointer flex items-center gap-1.5"
                        title="Xem trang chi tiết doanh nghiệp"
                      >
                        <span>{job.companyName}</span>
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                      </a>
                    ) : (
                      <>
                        <span>{job.companyName}</span>
                        <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">
                    Kiến tạo giá trị số, kiến tạo tương lai
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">groups</span>
                    <span>{job.companySize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">location_on</span>
                    <span>{job.companyAddress}</span>
                  </div>
                  {job.companyWebsite ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">language</span>
                      <a
                        href={job.companyWebsite.startsWith('http') ? job.companyWebsite : `https://${job.companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5b48bd] hover:underline flex items-center gap-1"
                      >
                        <span>Website công ty</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </a>
                    </div>
                  ) : null}
                </div>

                {/* Về chúng tôi Box */}
                <div className="pt-1">
                  <div className="p-3.5 rounded-xl bg-[#f8f7ff] border border-purple-100/80 text-xs text-slate-600 leading-relaxed">
                    <strong className="block text-slate-900 font-bold mb-1">Về chúng tôi</strong>
                    <p>{job.companyDesc}</p>
                  </div>
                </div>

                {/* Khung Thông Tin HR Phụ Trách Tuyển Dụng */}
                <div className="pt-2">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-600">contact_mail</span>
                        HR Phụ Trách Tuyển Dụng
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Phản hồi nhanh
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {job.recruiterName ? job.recruiterName.slice(0, 2).toUpperCase() : 'HR'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-[#1e1b4b] truncate">{job.recruiterName}</div>
                        <div className="text-[11px] text-slate-500 font-sans truncate">{job.recruiterEmail || 'hr@fpt.com'}</div>
                      </div>
                    </div>

                    {!isJobOwner && (
                      <a
                        href={createCandidateToHrMailto({
                          hrEmail: job.recruiterEmail || 'tuyendung@fpt.com',
                          hrName: job.recruiterName,
                          companyName: job.companyName,
                          jobTitle: job.title,
                          candidateName: user?.fullName || user?.name || 'Ứng viên',
                          candidateEmail: user?.email,
                        })}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Mở trình soạn email mặc định hoặc Gmail để liên hệ HR"
                      >
                        <span>✉️ Gửi Email cho HR</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 2: SIMILAR JOBS / CÁC VỊ TRÍ KHÁC TỪ DATABASE */}
          <div className="rounded-2xl bg-white border border-purple-100 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#1e1b4b]">
                {displayedRelatedJobs.some((j) => (j.companyName || '').toLowerCase() === (job.companyName || '').toLowerCase())
                  ? `Vị trí khác của ${job.companyName}`
                  : (isRecruiter ? 'Các vị trí tuyển dụng khác' : 'Việc làm liên quan')}
              </h3>
              <a
                href={isRecruiter ? '#/recruiter-jobs' : isAdmin ? '#/admin-dashboard?tab=JOBS' : '#/'}
                className="text-xs font-bold text-[#5b48bd] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>

            <div className="space-y-2 pt-1">
              {displayedRelatedJobs.length > 0 ? (
                displayedRelatedJobs.map((item, index) => {
                  const targetId = item.jobId || item.id;
                  const itemCompName = item.companyName || item.company || 'Doanh Nghiệp Tuyển Dụng';
                  const salaryText = item.salaryMin && item.salaryMax
                    ? (Number(item.salaryMin) >= 1000000
                        ? `${Number(item.salaryMin).toLocaleString('vi-VN')} - ${Number(item.salaryMax).toLocaleString('vi-VN')} đ/tháng`
                        : `$${Number(item.salaryMin).toLocaleString()} – $${Number(item.salaryMax).toLocaleString()}/tháng`)
                    : item.salaryMin
                    ? (Number(item.salaryMin) >= 1000000
                        ? `Từ ${Number(item.salaryMin).toLocaleString('vi-VN')} đ/tháng`
                        : `Từ $${Number(item.salaryMin).toLocaleString()}/tháng`)
                    : item.salaryFormatted || item.salary || 'Thương lượng';

                  return (
                    <div
                      key={targetId || index}
                      onClick={() => {
                        if (targetId) {
                          window.location.hash = `#/jobs/${targetId}`;
                        }
                      }}
                      className="p-3 rounded-xl hover:bg-[#f8f7ff] border border-transparent hover:border-purple-100 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${index % 2 === 0 ? "bg-sky-50 text-sky-600" : "bg-purple-50 text-[#5b48bd]"}`}>
                          <span className="material-symbols-outlined text-lg">
                            {index % 2 === 0 ? 'code' : 'desktop_windows'}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#5b48bd] transition-colors truncate">
                            {item.title}
                          </h4>
                          <div className="text-[11px] text-slate-500 truncate">
                            {itemCompName}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            <span>{item.location || 'Toàn quốc'}</span>
                          </div>
                          <div className="text-xs font-bold text-[#ea580c] pt-0.5">
                            {salaryText}
                          </div>
                        </div>
                      </div>

                      <span className="material-symbols-outlined text-slate-300 group-hover:text-[#5b48bd] transition-colors text-base shrink-0">
                        chevron_right
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">work_outline</span>
                  Chưa có vị trí tuyển dụng khác trên hệ thống
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Quick Apply Modal */}
      {isApplying && isCandidate && (
        <ApplyJobModal
          job={job}
          user={user}
          onClose={() => setIsApplying(false)}
          onSuccess={() => {
            setIsApplying(false);
            if (fetchCandidateApplication) fetchCandidateApplication();
            alert('🎉 Nộp hồ sơ ứng tuyển bằng AI CV thành công!');
          }}
        />
      )}

      {/* Delete Job Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-rose-100 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5 text-slate-800 animate-fade-in">
            <button
              onClick={() => setShowDeleteModal(false)}
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
                <p className="text-xs text-slate-500">Mã tin: JD-REQ-{job?.jobId || currentId}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2 text-xs text-rose-950">
              <p className="font-bold text-slate-900 line-clamp-2">
                &ldquo;{job?.title}&rdquo;
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                <span>&bull; Vị trí: <strong>{job?.location}</strong></span>
                <span>&bull; Đơn nộp: <strong>{job?.applicantCount || 0} CVs</strong></span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed pt-1">
                ⚠️ <strong>Cảnh báo:</strong> Tin tuyển dụng, tiêu chí kỹ năng và toàn bộ hồ sơ ứng tuyển liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này <strong>không thể hoàn tác</strong>!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
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
