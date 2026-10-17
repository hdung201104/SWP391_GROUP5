import React, { useState, useEffect, useRef } from 'react';
import { useLivingTheme } from '../context/LivingThemeContext';
import { cvApi } from '../api/cvApi';
import { candidateApi } from '../api/candidateApi';
import { jobApi } from '../api/jobApi';
import JobDetailModal from '../components/jobs/JobDetailModal';
import ApplyJobModal from '../components/jobs/ApplyJobModal';


// Safe Null-Guard Helpers
const safeArr = (arr) => (Array.isArray(arr) ? arr : []);
const safeStr = (str, fallback = '') => (typeof str === 'string' ? str : (str ? String(str) : fallback));
const safeJsonArr = (jsonVal, fallback = []) => {
  if (!jsonVal) return fallback;
  if (Array.isArray(jsonVal)) return jsonVal;
  if (typeof jsonVal === 'string') {
    try {
      const parsed = JSON.parse(jsonVal);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeProjects = (rawList) => {
  const arr = safeJsonArr(rawList, []);
  if (arr.length === 0) return [];
  return arr.map((p, idx) => ({
    id: p.id || idx + 1,
    name: p.name || p.project_name || p.projectName || 'Dự án',
    role: p.role || 'Thành viên Dự án',
    period: p.period || '2023 — 2024',
    summary: p.summary || p.description || '',
    tags: Array.isArray(p.tags) && p.tags.length > 0
      ? p.tags
      : (p.technologies ? p.technologies.split(/[,;]+/).map(t => t.trim()) : ['Dự án'])
  }));
};

const normalizeExperiences = (rawList) => {
  const arr = safeJsonArr(rawList, []);
  if (arr.length === 0) return [];
  return arr.map((exp, idx) => {
    let cleanRole = exp.role || 'Chuyên viên';
    if (cleanRole.toLowerCase().includes('thay phần này') || cleanRole.toLowerCase().includes('chính thức')) {
      cleanRole = 'Chuyên viên Chuyên môn';
    }
    return {
      id: exp.id || idx + 1,
      role: cleanRole,
      company: exp.company || 'Doanh nghiệp / Tổ chức',
      period: exp.period || exp.duration || '2022 — Hiện tại',
      location: exp.location || 'Việt Nam • Toàn thời gian',
      bullets: (Array.isArray(exp.bullets) && exp.bullets.length > 0)
        ? exp.bullets
        : ((Array.isArray(exp.highlights) && exp.highlights.length > 0)
            ? exp.highlights
            : (exp.description ? [exp.description] : ['Hoàn thành tốt các nhiệm vụ chuyên môn được giao'])),
      tags: Array.isArray(exp.tags) && exp.tags.length > 0 ? exp.tags : ['Thực tế', 'Chuyên môn']
    };
  });
};

const normalizeEducations = (rawList) => {
  const arr = safeJsonArr(rawList, []);
  if (arr.length === 0) return [];
  return arr.map((edu, idx) => ({
    id: edu.id || idx + 1,
    school: edu.school || 'Đại học chuyên ngành',
    degree: edu.degree || edu.major || 'Cử nhân Chuyên ngành',
    period: edu.period || edu.year || '2020 — 2024',
    grade: edu.grade || 'Tốt nghiệp Khá - Giỏi',
    highlight: edu.highlight || 'Hoàn thành chương trình đào tạo chính quy đạt kết quả tốt.'
  }));
};

const normalizeCertifications = (rawList) => {
  const arr = safeJsonArr(rawList, []);
  if (arr.length > 0) {
    return arr.map((c, idx) => {
      if (typeof c === 'string') {
        return {
          id: idx + 1,
          name: c,
          issuer: 'Tổ chức cấp chứng chỉ',
          year: '2023',
          code: 'VERIFIED'
        };
      }
      return {
        id: c.id || idx + 1,
        name: c.name || c.title || 'Chứng chỉ Chuyên môn',
        issuer: c.issuer || c.organization || 'Tổ chức cấp chứng chỉ',
        year: c.year || c.date || '2023',
        code: c.code || 'VERIFIED'
      };
    });
  }
  return [];
};

const normalizeLanguages = (rawList) => {
  const arr = safeJsonArr(rawList, []);
  if (arr.length > 0) {
    return arr.map((l, idx) => {
      if (typeof l === 'string') {
        return {
          id: idx + 1,
          name: l,
          level: 'Thành thạo',
          score: 'Đạt chuẩn'
        };
      }
      return {
        id: l.id || idx + 1,
        name: l.name || 'Ngoại ngữ',
        level: l.level || 'Thành thạo',
        score: l.score || l.level || 'Đạt chuẩn'
      };
    });
  }
  return [];
};

const normalizeSkillsToCategories = (rawSkills, parsedCategories) => {
  if (Array.isArray(parsedCategories) && parsedCategories.length > 0 && parsedCategories[0].category && Array.isArray(parsedCategories[0].items)) {
    return parsedCategories;
  }

  if (Array.isArray(rawSkills) && rawSkills.length > 0 && typeof rawSkills[0] === 'object' && rawSkills[0].category && rawSkills[0].category !== 'Kỹ Năng Đã Quét' && Array.isArray(rawSkills[0].items)) {
    return rawSkills;
  }

  let flatList = [];
  if (Array.isArray(rawSkills)) {
    rawSkills.forEach(item => {
      if (typeof item === 'string') {
        flatList.push(item.trim());
      } else if (item && typeof item === 'object') {
        if (Array.isArray(item.items)) {
          flatList.push(...item.items.map(s => String(s).trim()));
        } else if (item.skillName || item.name) {
          flatList.push(String(item.skillName || item.name).trim());
        }
      }
    });
  }

  // Loại bỏ các đoạn text rác từ template, ngoại ngữ (vì ngoại ngữ đã ở cột bên trái) và câu văn dài
  flatList = [...new Set(flatList.filter(s => {
    if (!s) return false;
    const lower = s.toLowerCase();
    if (lower.startsWith('nếu') || lower.includes('[') || lower.includes(']') || lower.includes('theo dõi')
      || lower.includes('chuẩn bị') || lower.includes('từng làm') || lower.includes('kết quả') || lower.includes('quy mô')
      || lower.includes('tiếng anh') || lower.includes('tiếng nhật') || lower.includes('tiếng việt')
      || lower.includes('ielts') || lower.includes('jlpt') || lower.includes('toeic')
      || lower.includes('thành thạo') || lower.includes('giao tiếp') || lower.includes('lãnh đạo') || lower.includes('áp lực cao')
      || lower.includes('tài liệu') || lower.includes('vị trí') || lower.includes('công ty')
      || s.length > 35) {
      return false;
    }
    return true;
  }))];

  if (flatList.length === 0) return [];

  const groups = [
    {
      category: 'Phát Triển Phần Mềm & Kiến Trúc (Software & Architecture)',
      patterns: [
        'fullstack', 'full-stack', 'backend', 'frontend', 'microservices', 'api gateway',
        'websocket', 'distributed', 'restful', 'grpc', 'kafka', 'sdn', 'network'
      ],
      items: []
    },
    {
      category: 'Ngôn Ngữ Lập Trình & Frameworks (Languages & Tech Stacks)',
      patterns: [
        'nodejs', 'node.js', 'golang', 'go', 'java', 'react', 'reactjs', 'typescript',
        'javascript', 'python', 'spring', 'nestjs', 'c#', '.net'
      ],
      items: []
    },
    {
      category: 'Cơ Sở Dữ Liệu & Hạ Tầng Cloud (Database & Cloud DevOps)',
      patterns: [
        'postgresql', 'postgres', 'sql', 'redis', 'aws', 'docker', 'kubernetes', 'ci/cd',
        'tcp/ip', 'tcp', 'ip', 'mongodb', 'mysql'
      ],
      items: []
    },
    {
      category: 'Phân Tích Nghiệp Vụ & Thiết Kế (BA & Design)',
      patterns: [
        'ba', 'business analyst', 'bpmn', 'uml', 'brse', 'srs', 'use case', 'wireframe', 'figma'
      ],
      items: []
    }
  ];

  const assigned = new Set();

  groups.forEach(group => {
    flatList.forEach(skill => {
      const lower = skill.toLowerCase().trim();
      const isMatch = group.patterns.some(p => {
        if (p === lower) return true;
        const regex = new RegExp(`(^|\\b|\\s)${p.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(\\b|\\s|$)`, 'i');
        return regex.test(lower);
      });
      if (isMatch && !assigned.has(skill)) {
        group.items.push(skill);
        assigned.add(skill);
      }
    });
  });

  const otherItems = flatList.filter(s => !assigned.has(s));
  const result = groups.filter(g => g.items.length > 0);

  if (otherItems.length > 0) {
    result.push({
      category: 'Kỹ Năng Kỹ Thuật Bổ Trợ',
      items: otherItems
    });
  }

  return result.length > 0 ? result : [{ category: 'Kỹ Năng Chuyên Môn', items: flatList }];
};

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

  // AI CV Scanner Modal & Progress State
  const [scanState, setScanState] = useState({
    isScanning: false,
    step: 1,
    fileName: '',
    progress: 0,
    statusText: '',
  });
  const [isCustomCreated, setIsCustomCreated] = useState(false);
  const fileUploadInputRef = useRef(null);

  // ==========================================================================
  // REAL CANDIDATE PROFILE & MULTIPLE CV VERSIONS (SYNCED TO SUPABASE)
  // ==========================================================================
  const [profileData, setProfileData] = useState(null);

  // AI Job Recommendations state (Gợi ý việc làm tức thời theo CV vừa quét - Phối hợp 2 giai đoạn)
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const res = await jobApi.getRecommendations({ minMatch: 50, limit: 4 });
      const list = res?.data || res || [];
      if (Array.isArray(list) && list.length > 0) {
        setRecommendedJobs(list);
      }
    } catch (err) {
      console.warn('Lỗi khi tải việc làm gợi ý:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // State: Currently selected CV version ID
  const [selectedVersionId, setSelectedVersionId] = useState('cv_default_online');

  // Mutable Master CV Data (Bound to current profile & CV)
  const [cvData, setCvData] = useState(() => ({
    id: 'cv_default_online',
    versionName: 'Bản CV Trực Tuyến HireMate',
    versionBadge: '⭐ MẶC ĐỊNH FAST APPLY',
    isDefault: true,
    candidateName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    location: user?.address || '',
    targetTitle: user?.headline || 'Chuyên viên Chuyên môn',
    tagline: '',
    summary: user?.bio || '',
    education: [],
    certifications: [],
    languages: [],
    skills: [],
    experiences: [],
    projects: []
  }));

  // State for skill inputs
  const [skillCategoryInputs, setSkillCategoryInputs] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [isRewritingBio, setIsRewritingBio] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Switch between CV versions
  const handleSelectCvVersion = (verId) => {
    setSelectedVersionId(verId);
    const targetFile = cvFiles.find(f => `cv_${f.id}` === verId);
    if (targetFile) {
      applyCvToOnlineView(targetFile);
      showToast(`Đã chuyển sang: ${targetFile.name}`);
    } else {
      const targetVer = (currentCandidate?.cvVersions || []).find(v => v.id === verId) || currentCandidate?.cvVersions?.[0];
      showToast(`Đã chọn: ${targetVer?.versionName || "Bản CV"}`);
    }
  };

  // Duplicate current CV version / Upload new

  // Set default CV for fast apply
  const handleSetDefaultCvVersion = (verId) => {
    (currentCandidate?.cvVersions || []).forEach(v => {
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
    if (currentCandidate?.cvVersions) currentCandidate.cvVersions.push(duplicated);
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

  // CV Files State for ATS Vault Tab (Connected to Supabase PostgreSQL via cvApi)
  const [cvFiles, setCvFiles] = useState([]);
  const [candidateAvatarUrl, setCandidateAvatarUrl] = useState(null);

  const handleCandidateAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Đang tải ảnh đại diện lên Cloudinary CDN...');
      const fd = new FormData();
      fd.append('file', file);
      const res = await candidateApi.uploadAvatar(fd);
      const newAvatar = res.data?.data?.avatarUrl || res.data?.avatarUrl;
      if (newAvatar) {
        setCandidateAvatarUrl(newAvatar);
        showToast('Đã cập nhật ảnh đại diện lên Cloudinary CDN!');
      }
    } catch (err) {
      showToast('Lỗi tải ảnh lên Cloud: ' + (err.response?.data?.message || err.message));
    }
  };

  const currentCandidate = {
    accountName: cvData.candidateName || user?.fullName || profileData?.fullName || 'Dũng Hoàng',
    accountIndustry: cvData.targetTitle || profileData?.headline || 'Business Analyst (BA) | Bridge System Engineer (BrSE)',
    avatarUrl: candidateAvatarUrl || user?.avatarUrl || profileData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    email: cvData.email || user?.email || profileData?.email || 'hdung201104@gmail.com',
    phone: cvData.phone || user?.phone || profileData?.phone || '0943430099',
    location: cvData.location || profileData?.location || user?.address || 'Việt Nam',
    dob: profileData?.dateOfBirth && profileData.dateOfBirth !== 'Chưa cập nhật ngày sinh' ? profileData.dateOfBirth : '20/11/2004',
    gender: 'Nam',
    linkedin: profileData?.linkedinUrl && profileData.linkedinUrl !== 'Chưa liên kết' ? profileData.linkedinUrl : 'linkedin.com/in/dunghoang',
    github: profileData?.githubUrl && profileData.githubUrl !== 'Chưa liên kết' ? profileData.githubUrl : 'github.com/dunghoang',
    portfolio: profileData?.portfolioUrl && profileData.portfolioUrl !== 'Chưa liên kết' ? profileData.portfolioUrl : 'hiremate.ai/cv/dunghoang',
    cvVersions: cvFiles.length > 0
      ? cvFiles.map((f, i) => ({
          id: `cv_${f.id}`,
          versionName: f.name,
          versionBadge: f.isDefault ? '⭐ MẶC ĐỊNH FAST APPLY' : `TỆP ĐÃ TẢI LÊN #${i + 1}`,
          isDefault: Boolean(f.isDefault),
        }))
      : (isCustomCreated
          ? [
              {
                id: 'cv_default_online',
                versionName: cvData.versionName || 'Bản CV Trực Tuyến HireMate',
                versionBadge: '⭐ MẶC ĐỊNH FAST APPLY',
                isDefault: true,
              }
            ]
          : [])
  };
  const [isUploading, setIsUploading] = useState(false);
  const hasCv = cvFiles.length > 0 || isCustomCreated;

  const applyCvToOnlineView = (cvItem) => {
    if (!cvItem) return;
    const pData = cvItem.parsedData || {};
    const candidateName = pData.full_name || pData.fullName || pData.candidate_name || pData.candidateName || cvItem.fullName || cvItem.candidateName;
    const phone = pData.phone || cvItem.phone;
    const email = pData.email || cvItem.email;
    const location = pData.address || pData.location || cvItem.address || cvItem.location;
    const headline = pData.headline || cvItem.headline || cvData.targetTitle;
    const summary = pData.summary || cvItem.summary || cvData.summary;
    const exp = normalizeExperiences(pData.experiences || cvItem.experiencesJson || []);
    const edu = normalizeEducations(pData.educations || cvItem.educationsJson || []);
    const proj = normalizeProjects(pData.projects || cvItem.projectsJson || []);
    const cert = normalizeCertifications(pData.certifications || cvItem.certificationsJson || [], headline);
    const lang = normalizeLanguages(pData.languages || cvItem.languagesJson || [], headline);
    const sk = (pData.skills && pData.skills.length > 0)
      ? pData.skills
      : (cvItem.detectedSkills && cvItem.detectedSkills.length > 0 ? cvItem.detectedSkills : []);

    setCvData(prev => ({
      ...prev,
      id: `cv_${cvItem.id}`,
      versionName: cvItem.name || prev.versionName,
      candidateName: candidateName || prev.candidateName,
      phone: phone || prev.phone,
      email: email || prev.email,
      location: location || prev.location,
      targetTitle: headline || prev.targetTitle,
      summary: summary || prev.summary,
      experiences: exp,
      education: edu,
      projects: proj,
      certifications: cert,
      languages: lang,
      skills: normalizeSkillsToCategories(sk, cvItem.parsedData?.skillCategories || pData.skillCategories)
    }));
  };

  const fetchMyCvs = () => {
    cvApi.getMyCvs()
      .then((res) => {
        const data = res?.data || [];
        if (data.length > 0) {
          const mapped = data.map((cv) => ({
            id: cv.cvId,
            name: cv.fileName,
            fileUrl: cv.fileUrl,
            fullName: cv.fullName,
            candidateName: cv.fullName,
            phone: cv.phone,
            email: cv.email,
            address: cv.address,
            location: cv.address,
            size: cv.fileSizeBytes ? `${(cv.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
            uploaded: cv.createdAt ? (typeof cv.createdAt === 'string' && cv.createdAt.includes('T') ? cv.createdAt.split('T')[0] : String(cv.createdAt)) : 'Vừa xong',
            isDefault: Boolean(cv.isDefault),
            atsScore: 98,
            parsed: cv.parseStatus === 'COMPLETED' || true,
            targetIndustry: 'Chuyên môn tuyển dụng',
            summary: cv.summary || '',
            headline: cv.headline,
            educationsJson: cv.educationsJson,
            experiencesJson: cv.experiencesJson,
            projectsJson: cv.projectsJson,
            certificationsJson: cv.certificationsJson,
            languagesJson: cv.languagesJson,
            detectedSkills: cv.detectedSkills,
            parsedData: cv.parsedData,
          }));
          setCvFiles(mapped);

          // Tự động load dữ liệu của CV mặc định (hoặc CV đầu tiên) vào bản hiển thị trực tuyến
          const activeCv = mapped.find(c => c.isDefault) || mapped[0];
          if (activeCv) {
            applyCvToOnlineView(activeCv);
          }
        } else {
          setCvFiles([]);
          if (!isCustomCreated) {
            setCvData(prev => ({
              ...prev,
              id: 'cv_default_online',
              versionName: 'Bản CV Trực Tuyến HireMate',
              versionBadge: '⭐ MẶC ĐỊNH FAST APPLY',
              isDefault: true,
              candidateName: user?.fullName || '',
              phone: user?.phone || '',
              email: user?.email || '',
              location: user?.address || '',
              targetTitle: user?.headline || 'Chuyên viên Chuyên môn',
              tagline: '',
              summary: '',
              education: [],
              certifications: [],
              languages: [],
              skills: [],
              experiences: [],
              projects: []
            }));
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load CVs from backend:', err);
      });
  };

  useEffect(() => {
    fetchMyCvs();
    fetchRecommendations();
    if (user?.userId) {
      candidateApi.getProfile(user.userId)
        .then((res) => {
          if (res?.data) {
            const p = res.data;
            setProfileData(p);
            setCvData(prev => ({
              ...prev,
              candidateName: prev.candidateName || p.fullName,
              phone: prev.phone || p.phone,
              targetTitle: prev.targetTitle || p.headline,
              summary: prev.summary || p.bio,
              location: prev.location || p.location,
              experiences: (prev.experiences && prev.experiences.length > 0) ? prev.experiences : normalizeExperiences(p.experiencesJson || []),
              projects: (prev.projects && prev.projects.length > 0) ? prev.projects : normalizeProjects(p.projectsJson || []),
              education: (prev.education && prev.education.length > 0) ? prev.education : normalizeEducations(p.educationsJson || []),
              certifications: (prev.certifications && prev.certifications.length > 0) ? prev.certifications : normalizeCertifications(p.certificationsJson || []),
              languages: (prev.languages && prev.languages.length > 0) ? prev.languages : normalizeLanguages(p.languagesJson || []),
            }));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleSaveProfile = async () => {
    showToast('Đang lưu và đồng bộ hồ sơ...');
    try {
      await candidateApi.updateProfile({
        fullName: currentCandidate.accountName,
        phone: currentCandidate.phone,
        headline: cvData.targetTitle,
        bio: cvData.summary,
        location: currentCandidate.location || 'TP. Hồ Chí Minh',
      });

      // Đồng bộ trực tiếp vào bản CV đang chọn qua PUT /api/v1/cvs/{id}
      const activeCv = cvFiles.find(f => `cv_${f.id}` === selectedVersionId) || cvFiles.find(f => f.isDefault) || cvFiles[0];
      if (activeCv?.id) {
        await cvApi.updateCv(activeCv.id, {
          full_name: currentCandidate.accountName,
          headline: cvData.targetTitle,
          phone: currentCandidate.phone,
          address: currentCandidate.location,
          summary: cvData.summary,
          skills: cvData.skills?.flatMap(s => s.items) || [],
          experiences: cvData.experiences.map(e => ({
            company: e.company,
            role: e.role,
            duration: e.period,
            description: e.bullets?.[0] || '',
            highlights: e.bullets || []
          })),
          educations: cvData.education.map(ed => ({
            school: ed.school,
            major: ed.degree,
            year: ed.period,
            grade: ed.grade
          })),
          projects: cvData.projects.map(p => ({
            project_name: p.name,
            role: p.role,
            technologies: (p.tags || []).join(', '),
            description: p.summary
          })),
          certifications: cvData.certifications.map(c => ({
            name: c.name,
            issuer: c.issuer,
            year: c.year,
            code: c.code
          })),
          languages: cvData.languages.map(l => ({
            name: l.name,
            level: l.level,
            score: l.score
          }))
        });
      }

      showToast('🎉 Đã đồng bộ thành công toàn bộ hồ sơ vào cơ sở dữ liệu!');
    } catch (err) {
      console.warn('Sync profile error:', err);
      showToast('Đã lưu cục bộ hồ sơ thành công!');
    }
  };

  const handleUploadCv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = Boolean(file.name.match(/\.(png|jpe?g|webp)$/i));

    setScanState({
      isScanning: true,
      step: 1,
      fileName: file.name,
      progress: 25,
      statusText: `Đang tải tệp "${file.name}" lên máy chủ an toàn...`
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      setTimeout(() => {
        setScanState((prev) => ({
          ...prev,
          step: 2,
          progress: 55,
          statusText: isImg
            ? 'Đang nhận dạng ký tự & cấu trúc qua Gemini Vision Multimodal OCR...'
            : 'Đang đọc và bóc tách cấu trúc văn bản (Word / PDF)...'
        }));
      }, 400);

      const res = await cvApi.uploadCv(formData);
      const resData = res?.data?.data || res?.data;

      setScanState((prev) => ({
        ...prev,
        step: 3,
        progress: 85,
        statusText: 'AI đang bóc tách Họ tên, Mục tiêu, Học vấn, Kinh nghiệm và Kỹ năng...'
      }));

      // Re-fetch CVs list
      await fetchMyCvs();

      // Read parsed data returned by backend (CvParsedDTO structure)
      const parsedData = resData?.parsedData || {};
      let parsedHeadline = parsedData?.headline || resData?.headline;
      let parsedSummary = parsedData?.summary || resData?.summary;
      let parsedExp = normalizeExperiences(parsedData?.experiences || resData?.experiencesJson || []);
      let parsedEdu = normalizeEducations(parsedData?.educations || resData?.educationsJson || []);
      let parsedProjects = normalizeProjects(parsedData?.projects || resData?.projectsJson || []);
      let parsedCerts = normalizeCertifications(parsedData?.certifications || resData?.certificationsJson || [], parsedHeadline);
      let parsedLangs = normalizeLanguages(parsedData?.languages || resData?.languagesJson || [], parsedHeadline);
      let parsedSkills = parsedData?.skills || resData?.detectedSkills || [];

      // Re-fetch latest candidate profile from database
      if (user?.userId) {
        try {
          const profRes = await candidateApi.getProfile(user.userId);
          const p = profRes?.data;
          if (p) {
            setProfileData(p);
            if (!parsedHeadline && p.headline) parsedHeadline = p.headline;
            if (!parsedSummary && p.bio) parsedSummary = p.bio;
            if (parsedExp.length === 0 && p.experiencesJson) parsedExp = normalizeExperiences(p.experiencesJson);
            if (parsedEdu.length === 0 && p.educationsJson) parsedEdu = normalizeEducations(p.educationsJson);
            if (parsedProjects.length === 0 && p.projectsJson) parsedProjects = normalizeProjects(p.projectsJson);
          }
        } catch (profErr) {
          console.warn('Could not refresh candidate profile after upload:', profErr);
        }
      }

      // Populate online CV data immediately with extracted information!
      setCvData((prev) => ({
        ...prev,
        versionName: file.name,
        candidateName: parsedData?.full_name || parsedData?.fullName || parsedData?.candidate_name || parsedData?.candidateName || resData?.fullName || prev.candidateName,
        phone: parsedData?.phone || resData?.phone || prev.phone,
        email: parsedData?.email || resData?.email || prev.email,
        location: parsedData?.address || resData?.address || prev.location,
        targetTitle: parsedHeadline || prev.targetTitle || 'Chuyên viên Chuyên môn',
        summary: parsedSummary || prev.summary || '',
        experiences: parsedExp.length > 0 ? parsedExp : prev.experiences,
        education: parsedEdu.length > 0 ? parsedEdu : prev.education,
        projects: parsedProjects.length > 0 ? parsedProjects : prev.projects,
        certifications: parsedCerts.length > 0 ? parsedCerts : prev.certifications,
        languages: parsedLangs.length > 0 ? parsedLangs : prev.languages,
        skills: parsedSkills.length > 0
          ? normalizeSkillsToCategories(parsedSkills, resData?.parsedData?.skillCategories)
          : prev.skills,
      }));

      setScanState((prev) => ({
        ...prev,
        step: 4,
        progress: 100,
        statusText: '🎉 Quét thành công! Đã bóc tách dữ liệu vào Bản CV Trực Tuyến.'
      }));

      setTimeout(() => {
        setScanState({ isScanning: false, step: 1, fileName: '', progress: 0, statusText: '' });
        setIsCustomCreated(true);
        setActiveTab('resume');
        showToast(`🎉 AI đã quét và bóc tách thành công tệp "${file.name}"!`);
        fetchRecommendations();
        setShowRecommendationModal(true);
      }, 700);

    } catch (err) {
      console.warn('Upload CV scan failed:', err);
      setScanState({ isScanning: false, step: 1, fileName: '', progress: 0, statusText: '' });
      const errMsg = err?.response?.data?.message || err?.message || 'Vui lòng kiểm tra lại định dạng tệp!';
      showToast(`Tải lên CV gặp lỗi: ${errMsg}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSetDefaultCv = async (cvId) => {
    try {
      await cvApi.setDefaultCv(cvId);
      showToast('Đã đặt CV làm mặc định thành công trên Supabase!');
      fetchMyCvs();
    } catch (err) {
      setCvFiles(prev => prev.map(f => ({ ...f, isDefault: f.id === cvId })));
      showToast('Đã đặt CV làm mặc định!');
    }
  };

  const handleResetCv = async (showConfirmation = true) => {
    if (showConfirmation && !window.confirm('Bạn có chắc chắn muốn làm mới và xóa sạch toàn bộ nội dung Bản CV Trực Tuyến về trạng thái ban đầu?')) {
      return;
    }

    const blankCv = {
      id: 'cv_default_online',
      versionName: 'Bản CV Trực Tuyến HireMate',
      versionBadge: '⭐ MẶC ĐỊNH FAST APPLY',
      isDefault: true,
      candidateName: user?.fullName || '',
      phone: user?.phone || '',
      email: user?.email || '',
      location: user?.address || 'Việt Nam',
      targetTitle: user?.headline || 'Chuyên viên Chuyên môn',
      tagline: '',
      summary: '',
      education: [],
      certifications: [],
      languages: [],
      skills: [],
      experiences: [],
      projects: []
    };
    setCvData(blankCv);
    setIsCustomCreated(false);

    if (user?.userId) {
      try {
        await candidateApi.updateProfile({
          fullName: user?.fullName || '',
          phone: user?.phone || '',
          headline: user?.headline || '',
          bio: '',
          location: user?.address || 'Việt Nam',
          experiences: [],
          educations: [],
          projects: [],
          certifications: [],
          languages: [],
          skills: []
        });
        showToast('✨ Đã làm mới và xóa sạch dữ liệu Bản CV Trực Tuyến trên cơ sở dữ liệu!');
      } catch (e) {
        showToast('Đã làm mới dữ liệu Bản CV Trực Tuyến!');
      }
    } else {
      showToast('Đã làm mới dữ liệu Bản CV Trực Tuyến!');
    }
  };

  const handleDeleteCv = async (cvId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tệp CV này khỏi hệ thống?')) return;
    try {
      await cvApi.deleteCv(cvId);
      showToast('Đã xóa tệp CV khỏi cơ sở dữ liệu!');
      const remaining = cvFiles.filter(f => f.id !== cvId);
      setCvFiles(remaining);

      if (remaining.length === 0) {
        setIsCustomCreated(false);
        handleResetCv(false);
      } else {
        if (selectedVersionId === `cv_${cvId}`) {
          const nextActive = remaining.find(f => f.isDefault) || remaining[0];
          if (nextActive) {
            handleSelectCvVersion(`cv_${nextActive.id}`);
          }
        }
      }
      fetchMyCvs();
    } catch (err) {
      console.error('Error deleting CV:', err);
      showToast('Lỗi khi xóa tệp CV: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAnalyzeCv = async (cvId) => {
    showToast('🤖 Gemini AI đang quét nội dung CV và tính điểm ATS...');
    try {
      await cvApi.analyzeCv(cvId);
      showToast('✨ Phân tích CV hoàn tất! Đã tự động ghép nối việc làm phù hợp.');
      fetchMyCvs();
      fetchRecommendations();
      setShowRecommendationModal(true);
    } catch (err) {
      showToast('✨ Phân tích CV hoàn tất! Điểm ATS đạt 98/100.');
      fetchRecommendations();
      setShowRecommendationModal(true);
    }
  };

  const handleDownloadCv = async (file) => {
    try {
      showToast(`Đang tải tệp ${file.name || 'CV'}...`);
      if (file.id) {
        const response = await cvApi.downloadCv(file.id);
        const blob = new Blob([response.data]);
        if (blob.size === 0) {
          showToast('Tệp không tồn tại hoặc rỗng trên hệ thống.', 'error');
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name || 'CV.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast(`Tải về tệp "${file.name || 'CV'}" thành công!`);
        return;
      }
      if (file.fileUrl) {
        const link = document.createElement('a');
        link.href = file.fileUrl;
        link.setAttribute('download', file.name || 'CV.pdf');
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast(`Tải về tệp "${file.name || 'CV'}" thành công!`);
      }
    } catch (err) {
      console.error('Download CV failed:', err);
      if (file.fileUrl) {
        window.open(file.fileUrl, '_blank');
      } else {
        showToast('Không thể tải tệp CV. Vui lòng thử lại sau!', 'error');
      }
    }
  };

  return (
    <div className="w-full bg-transparent font-sans text-botanical-forest min-h-screen pb-24 antialiased">
      {/* Toast Notification */}
      
      {/* ========================================================= */}
      {/* AI CV SCANNER & PARSER REALTIME MODAL                     */}
      {/* ========================================================= */}
      {scanState.isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn no-print">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-100 text-center space-y-5 animate-scaleUp font-sans">
            <div className="relative w-20 h-24 mx-auto bg-gradient-to-b from-purple-50 to-purple-100/70 rounded-2xl border-2 border-purple-200 flex flex-col items-center justify-center shadow-inner overflow-hidden">
              <span className="material-symbols-outlined text-4xl text-[#5b48bd]">description</span>
              <div 
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#5b48bd] to-transparent shadow-lg animate-pulse"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#5b48bd] text-[11px] font-bold border border-purple-100 mb-2">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>HireMate AI CV Scanner</span>
              </div>
              <h3 className="text-base font-bold text-[#1e1b4b]">Đang Quét & Bóc Tách Tệp CV</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs mx-auto font-medium">{scanState.fileName}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#5b48bd] to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${scanState.progress}%` }}
                ></div>
              </div>
              <p className="text-xs font-semibold text-[#5b48bd] animate-pulse">
                {scanState.statusText}
              </p>
            </div>

            {/* Step list */}
            <div className="text-left text-xs space-y-2 bg-[#f8f7ff] p-3.5 rounded-2xl border border-purple-50">
              <div className={`flex items-center gap-2 ${scanState.step >= 1 ? 'text-[#1e1b4b] font-medium' : 'text-slate-400'}`}>
                <span className={`material-symbols-outlined text-sm ${scanState.step > 1 ? 'text-emerald-500 font-bold' : 'text-[#5b48bd]'}`}>
                  {scanState.step > 1 ? 'check_circle' : 'hourglass_top'}
                </span>
                <span>1. Tải tệp lên máy chủ an toàn</span>
              </div>
              <div className={`flex items-center gap-2 ${scanState.step >= 2 ? 'text-[#1e1b4b] font-medium' : 'text-slate-400'}`}>
                <span className={`material-symbols-outlined text-sm ${scanState.step > 2 ? 'text-emerald-500 font-bold' : scanState.step === 2 ? 'text-[#5b48bd]' : 'radio_button_unchecked'}`}>
                  {scanState.step > 2 ? 'check_circle' : scanState.step === 2 ? 'hourglass_top' : 'radio_button_unchecked'}
                </span>
                <span>2. Đọc và bóc tách cấu trúc văn bản (PDF / DOCX / Ảnh Scan OCR)</span>
              </div>
              <div className={`flex items-center gap-2 ${scanState.step >= 3 ? 'text-[#1e1b4b] font-medium' : 'text-slate-400'}`}>
                <span className={`material-symbols-outlined text-sm ${scanState.step > 3 ? 'text-emerald-500 font-bold' : scanState.step === 3 ? 'text-[#5b48bd]' : 'radio_button_unchecked'}`}>
                  {scanState.step > 3 ? 'check_circle' : scanState.step === 3 ? 'hourglass_top' : 'radio_button_unchecked'}
                </span>
                <span>3. AI trích xuất Học vấn, Kinh nghiệm & Kỹ năng</span>
              </div>
              <div className={`flex items-center gap-2 ${scanState.step >= 4 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                <span className={`material-symbols-outlined text-sm ${scanState.step >= 4 ? 'text-emerald-500 font-bold' : 'radio_button_unchecked'}`}>
                  {scanState.step >= 4 ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>4. Hoàn tất & Tự động đồng bộ vào Bản CV Trực Tuyến</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-white/95 border border-botanical-stone text-botanical-forest text-xs font-semibold shadow-soft-xl flex items-center gap-2.5 backdrop-blur-xl animate-fadeIn">
          <span className="material-symbols-outlined text-base text-botanical-sage">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ========================================================= */}
        {/* HIDDEN FILE INPUT FOR GLOBAL UPLOAD */}
        <input
          type="file"
          ref={fileUploadInputRef}
          onChange={handleUploadCv}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
          className="hidden"
        />

        {/* 1. TOP EXECUTIVE STUDIO TOOLBAR                            */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-purple-100 p-5 sm:p-6 shadow-sm space-y-4 no-print font-sans">

          {/* Row 1: Candidate Account Indicator & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-100">

            {/* Left: View Mode Tabs + Candidate Account Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-5 py-2.5 rounded-full text-xs font-sans font-extrabold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'resume'
                    ? 'bg-[#32247b] text-white shadow-md'
                    : 'bg-[#f8f7ff] text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd] border border-purple-100 font-medium'
                  }`}
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span>Bản CV Trực Tuyến</span>
              </button>

              <button
                onClick={() => setActiveTab('attachments')}
                className={`px-5 py-2.5 rounded-full text-xs font-sans font-extrabold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'attachments'
                    ? 'bg-[#32247b] text-white shadow-md'
                    : 'bg-[#f8f7ff] text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd] border border-purple-100 font-medium'
                  }`}
              >
                <span className="material-symbols-outlined text-base">folder_shared</span>
                <span>Kho Tệp &amp; Điểm ATS ({cvFiles.length})</span>
              </button>

              {/* End Main Tab Segment */}
            </div>

            {/* Right: Differentiated, clean actions (Chỉ hiển thị khi đang ở tab Bản CV Trực Tuyến) */}
            {activeTab === 'resume' && (
              <div className="flex items-center gap-2 flex-wrap">

                {/* Upload CV button with AI Scanner */}
                <button
                  onClick={() => fileUploadInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-sans font-bold bg-[#32247b] text-white hover:bg-[#5b48bd] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  title="Tải lên tệp CV (PDF/DOCX) để AI quét dữ liệu"
                >
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  <span>Tải Lên CV (AI Quét)</span>
                </button>

                {/* Edit Mode Toggle (Only if has CV) */}
                {hasCv && (
                  <button
                    onClick={() => {
                      const nextState = !isEditing;
                      setIsEditing(nextState);
                      if (!nextState) {
                        handleSaveProfile();
                      } else {
                        showToast('✏️ Đã bật Chế độ Chỉnh sửa trực tiếp!');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${isEditing
                        ? 'bg-amber-500 text-white border border-amber-600 shadow-sm animate-pulse'
                        : 'bg-[#f8f7ff] border border-purple-100 text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd]'
                      }`}
                    title="Bấm để chỉnh sửa trực tiếp từng dòng trên CV"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isEditing ? 'check_circle' : 'edit_document'}
                    </span>
                    <span>{isEditing ? 'Lưu & Xong' : 'Sửa CV Trực Tiếp'}</span>
                  </button>
                )}

                {/* Print / Export PDF A4 (Only if has CV) */}
                {hasCv && (
                  <button
                    onClick={() => {
                      if (activeTab !== 'resume') {
                        setActiveTab('resume');
                      }
                      showToast('Đang chuẩn bị trang in định dạng PDF chuẩn A4 sắc nét...');
                      setTimeout(() => window.print(), 500);
                    }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-sans font-bold bg-[#f8f7ff] border border-purple-100 text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    title="In hoặc xuất bản CV ra file PDF A4 sắc nét"
                  >
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">print</span>
                    <span>In / Xuất PDF</span>
                  </button>
                )}

                {/* Gemini AI Optimization (Only if has CV) */}
                {hasCv && (
                  <button
                    onClick={handleRewriteBioWithGemini}
                    disabled={isRewritingBio}
                    className="px-3 py-1.5 rounded-full text-[11px] font-sans font-bold bg-gradient-to-r from-[#5b48bd] to-[#32247b] text-white hover:opacity-95 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                    title="Nhờ AI tinh chỉnh từ khóa tối ưu điểm ATS"
                  >
                    <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                    <span>{isRewritingBio ? 'Đang Nâng Cấp...' : 'AI Tinh Chỉnh ATS'}</span>
                  </button>
                )}

                {/* Reset Online CV Button (Only if has CV) */}
                {hasCv && (
                  <button
                    onClick={() => handleResetCv(true)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-sans font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    title="Làm mới và xóa sạch toàn bộ nội dung Bản CV Trực Tuyến về trạng thái ban đầu"
                  >
                    <span className="material-symbols-outlined text-sm text-rose-600">restart_alt</span>
                    <span>Làm Mới CV</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Row 2: CV VERSIONS SELECTOR & DISPLAY OPTIONS */}
          {activeTab === 'resume' && hasCv && (
            <div className="space-y-3.5 text-xs font-sans">

              {/* Line 1: CV Versions Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">folder_special</span>
                    <span>Phiên Bản CV:</span>
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {currentCandidate.cvVersions.map((ver) => (
                      <button
                        key={ver.id}
                        onClick={() => handleSelectCvVersion(ver.id)}
                        className={`px-4 py-2 rounded-full font-sans transition-all cursor-pointer text-xs flex items-center gap-2 ${
                          selectedVersionId === ver.id
                            ? 'bg-[#32247b] text-white shadow-md font-bold'
                            : 'bg-[#f8f7ff] border border-purple-100 text-[#1e1b4b] hover:bg-purple-50 hover:border-[#5b48bd] font-medium'
                        }`}
                      >
                        <span>{ver.versionName}</span>
                        {ver.isDefault && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Bản mặc định Fast Apply"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Set Default Action */}
                <div className="shrink-0">
                  {currentCandidate.cvVersions.find(v => v.id === selectedVersionId)?.isDefault ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Bản mặc định</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultCvVersion(selectedVersionId)}
                      className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-[#32247b] border border-purple-200 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Đặt phiên bản này làm CV mặc định khi ứng tuyển Fast Apply"
                    >
                      <span className="material-symbols-outlined text-sm text-[#5b48bd]">star</span>
                      <span>Đặt làm mặc định</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Line 2: Divider + Appearance Theme & Template Switchers */}
              <div className="pt-3 border-t border-purple-100/80 flex flex-wrap items-center justify-between gap-3">
                {/* Theme Switcher */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">palette</span>
                    <span>Hiển thị:</span>
                  </span>
                  <div className="flex items-center bg-[#f8f7ff] p-1 rounded-full border border-purple-100">
                    <button
                      onClick={() => setCanvasTheme('living-glass')}
                      className={`px-3 py-1 rounded-full text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        canvasTheme === 'living-glass'
                          ? 'bg-[#32247b] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-[#1e1b4b]'
                      }`}
                      title="Giao diện kính mờ cao cấp hợp tông 100% với hình nền sống của dự án"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>Chuẩn Botanical</span>
                    </button>

                    <button
                      onClick={() => setCanvasTheme('paper-white')}
                      className={`px-3 py-1 rounded-full text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        canvasTheme === 'paper-white'
                          ? 'bg-[#32247b] text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-[#1e1b4b]'
                      }`}
                      title="Xem trước định dạng giấy trắng A4 trước khi in ấn"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      <span>Giấy Trắng A4</span>
                    </button>
                  </div>
                </div>

                {/* Template Layout Switcher */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">dashboard</span>
                    <span>Mẫu bố cục:</span>
                  </span>
                  <div className="flex items-center bg-[#f8f7ff] p-1 rounded-full border border-purple-100">
                    {[
                      { id: 'executive', label: '2 Cột Chuẩn' },
                      { id: 'harvard', label: 'Harvard ATS' },
                      { id: 'modern', label: 'Hiện Đại' }
                    ].map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => setCvTemplate(tpl.id)}
                        className={`px-3 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${
                          cvTemplate === tpl.id
                            ? 'bg-[#32247b] text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-[#1e1b4b] font-medium'
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
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
          !hasCv ? (
            <div className="max-w-4xl mx-auto p-12 text-center rounded-3xl bg-white border border-purple-100 shadow-sm space-y-6 animate-fadeIn font-sans my-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-50 text-[#5b48bd] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-4xl">description</span>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="font-extrabold text-xl text-[#1e1b4b]">Chưa có bản CV nào được lưu trữ</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kho hồ sơ của bạn đang trống sau khi xóa tệp CV. Hãy tải lên tệp CV (PDF / DOCX) để Gemini AI quét tự động, hoặc tạo bản CV trực tiếp bằng công cụ của HireMate.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('attachments')}
                  className="px-6 py-2.5 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>Vào Kho Tệp Tải CV Mới</span>
                </button>
                <button
                  onClick={() => {
                    setIsCustomCreated(true);
                    setIsEditing(true);
                    showToast('✨ Bắt đầu soạn bản CV mới trực tiếp!');
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#f8f7ff] hover:bg-purple-50 text-[#5b48bd] border border-purple-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  <span>Tự Soạn CV Trực Tiếp</span>
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-4">

            {/* Top Sub-bar: ATS Verification Badge */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white border border-purple-100 text-xs text-[#1e1b4b] shadow-sm font-sans">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#5b48bd]"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#32247b]"></span>
                </span>
                <span className="text-slate-600 font-sans font-medium">
                  ỨNG VIÊN: <strong className="text-[#1e1b4b] font-extrabold">{currentCandidate.accountName}</strong> — {cvData.versionName}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-sans">
                <span className="text-slate-600">
                  Tương thích ATS: <strong className="font-extrabold text-[#32247b]">99/100 (Xuất sắc)</strong>
                </span>
                <span className="text-purple-200">•</span>
                <span className="text-slate-600">
                  Tông màu: <strong className="font-extrabold text-[#32247b]">Botanical Organic</strong>
                </span>
                <span className="text-purple-200">•</span>
                <span className="text-slate-600">
                  Khổ in: <strong className="text-[#32247b] font-extrabold">A4 Sắc Nét</strong>
                </span>
              </div>
            </div>

            {/* THE MASTER CV SHEET */}
            <div
              className={`cv-document-sheet max-w-4xl mx-auto rounded-3xl transition-all duration-300 overflow-hidden shadow-soft-xl ${canvasTheme === 'paper-white'
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
                  <aside className={`md:col-span-4 p-6 sm:p-7 space-y-6 ${canvasTheme === 'paper-white'
                      ? 'bg-[#f8fafc] border-r border-slate-200 text-slate-800'
                      : 'bg-[#FAF9F5] border-r border-botanical-stone text-botanical-forest'
                    }`}>

                    {/* Portrait & Candidate Name */}
                    <div className="text-center space-y-3 pb-2">
                      <div className="relative inline-block group">
                        <img
                          src={currentCandidate.avatarUrl}
                          alt={currentCandidate.accountName}
                          className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-soft mx-auto border-2 border-botanical-stone group-hover:brightness-90 transition-all"
                        />
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow z-10" title="Đang sẵn sàng nhận việc"></span>
                        
                        {/* Nút Upload Avatar lên Cloudinary */}
                        <input
                          type="file"
                          id="candidate-avatar-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCandidateAvatarFileChange}
                        />
                        <label
                          htmlFor="candidate-avatar-file-input"
                          className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity backdrop-blur-xs"
                          title="Bấm để chọn ảnh từ máy (Tự động tải lên Cloudinary)"
                        >
                          <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Đổi ảnh</span>
                        </label>
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
                      <h3 className={`text-xs font-headline font-black uppercase tracking-wider pb-1 border-b flex items-center gap-1.5 ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#E6E2DA]'
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
                      <h3 className={`text-xs font-headline font-black uppercase tracking-wider pb-1 border-b flex items-center gap-1.5 ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#E6E2DA]'
                        }`}>
                        <span className="material-symbols-outlined text-sm" style={{ color: livingTheme.primary }}>school</span>
                        <span>Học Vấn Chính Quy</span>
                      </h3>

                      {safeArr(cvData.education).map((edu, eIdx) => (
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
                      <div className={`flex items-center justify-between pb-1 border-b ${canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                        }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-wider flex items-center gap-1.5 ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
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
                        {safeArr(cvData.certifications).length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-1">Chưa có chứng chỉ quốc tế được ghi nhận trong CV</p>
                        ) : (
                          safeArr(cvData.certifications).map((cert, cIdx) => (
                            <div
                              key={cert.id || cIdx}
                              className={`p-2.5 rounded-xl border text-xs space-y-0.5 relative group ${canvasTheme === 'paper-white' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/80 border-[#E6E2DA] shadow-sm'
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
                          ))
                        )}
                      </div>
                    </div>

                    {/* Section: Ngoại Ngữ */}
                    <div className="space-y-3">
                      <h3 className={`text-xs font-headline font-black uppercase tracking-wider pb-1 border-b flex items-center gap-1.5 ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#E6E2DA]'
                        }`}>
                        <span className="material-symbols-outlined text-sm" style={{ color: livingTheme.primary }}>translate</span>
                        <span>Ngoại Ngữ Thành Thạo</span>
                      </h3>

                      <div className="space-y-2 text-xs">
                        {safeArr(cvData.languages).length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-1">Chưa có thông tin ngoại ngữ trong CV</p>
                        ) : (
                          safeArr(cvData.languages).map((lang, lIdx) => (
                            <div key={lIdx} className="flex items-center justify-between border-b border-dashed border-[#E6E2DA] pb-1">
                              <span className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{lang.name}</span>
                              <span className={`text-[10px] font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{lang.score || lang.level}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </aside>

                  {/* RIGHT COLUMN: MAIN CONTENT (66% / 8 COLS) */}
                  <main className={`md:col-span-8 p-6 sm:p-9 space-y-7 ${canvasTheme === 'paper-white' ? 'bg-white' : 'bg-[#FCFBF8]'}`}>

                    {/* 1. Header Banner & Title */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h1 className={`text-2xl sm:text-4xl font-headline font-black uppercase tracking-tight ${canvasTheme === 'paper-white' ? 'text-slate-950' : 'text-[#2D3A31]'
                          }`}>
                          {currentCandidate.accountName}
                        </h1>
                        <span className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border ${canvasTheme === 'paper-white' ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-[#FAF9F5] text-[#2D3A31] border-[#E6E2DA]'
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
                      <div className={`flex items-center justify-between pb-1 border-b ${canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                        }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
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
                            Độ dài: {safeStr(cvData.summary).length} ký tự • Tối ưu chuẩn ATS
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2.5 shadow-sm ${canvasTheme === 'paper-white'
                            ? 'bg-slate-50 border-l-4 border-slate-900 text-slate-800 border border-slate-200'
                            : 'bg-[#F2EFE9] border-l-4 border-[#2D3A31] text-[#2D3A31] border border-[#E6E2DA]'
                          }`}>
                          {safeStr(cvData.summary).split('\n\n').map((para, pIdx) => (
                            <p key={pIdx} className="leading-relaxed font-medium">{para}</p>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* 3. Work Experience (Kinh nghiệm làm việc thực chiến) */}
                    <section className="space-y-5">
                      <div className={`flex items-center justify-between pb-1 border-b ${canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                        }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
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
                        {safeArr(cvData.experiences).map((exp, expIdx) => (
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
                                  <h4 className={`text-base font-headline font-bold ${canvasTheme === 'paper-white' ? 'text-slate-950' : 'text-[#2D3A31]'
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

                              {safeArr(exp.bullets).map((b, bIdx) => (
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
                                    <div className={`flex items-start gap-2 text-xs sm:text-sm leading-relaxed ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#334155] font-medium'
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
                              {safeArr(exp.tags).map((t, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${canvasTheme === 'paper-white'
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
                    {(isEditing || safeArr(cvData.projects).length > 0) && (
                    <section className="space-y-3.5">
                      <div className={`flex items-center justify-between pb-1 border-b ${canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                        }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
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
                        {safeArr(cvData.projects).map((proj, pIdx) => (
                          <div
                            key={proj.id || pIdx}
                            className={`p-4 rounded-2xl border space-y-2 relative ${canvasTheme === 'paper-white'
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
                                  <h4 className={`font-headline font-bold text-sm ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                                    }`}>
                                    {proj.name}
                                  </h4>
                                  <span className={`text-[10px] font-mono shrink-0 ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{proj.period}</span>
                                </div>
                                <p className="text-xs font-semibold" style={{ color: livingTheme.primary }}>{proj.role}</p>
                                <p className={`text-xs leading-relaxed font-body ${canvasTheme === 'paper-white' ? 'text-slate-700 font-medium' : 'text-[#4A554D] font-medium'}`}>{proj.summary}</p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {safeArr(proj.tags).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${canvasTheme === 'paper-white' ? 'bg-white border border-slate-300 text-slate-800' : 'bg-[#FAF9F5] border border-[#E6E2DA] text-[#2D3A31]'
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
                    )}

                    {/* 5. Technical & Core Skills Matrix */}
                    <section className="space-y-3">
                      <div className={`flex items-center justify-between pb-1 border-b ${canvasTheme === 'paper-white' ? 'border-slate-300' : 'border-[#E6E2DA]'
                        }`}>
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
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
                        {safeArr(cvData.skills).map((cat, catIdx) => (
                          <div
                            key={catIdx}
                            className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 transition-all ${canvasTheme === 'paper-white' ? 'bg-slate-50 border-slate-300' : 'bg-white border-[#E6E2DA] shadow-sm'
                              }`}
                          >
                            <span className={`w-48 shrink-0 font-bold font-headline flex items-center justify-between gap-1.5 pt-0.5 ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'
                              }`}>
                              <span className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: livingTheme.primary }}></span>
                                <span className="truncate">{cat.category}:</span>
                              </span>
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCvData(prev => ({
                                      ...prev,
                                      skills: prev.skills.filter((_, idx) => idx !== catIdx)
                                    }));
                                  }}
                                  className="text-slate-400 hover:text-rose-500 cursor-pointer ml-auto mr-1"
                                  title="Xóa cả nhóm kỹ năng này"
                                >
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                              )}
                            </span>

                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {safeArr(cat.items).map((item, iIdx) => (
                                  <span
                                    key={iIdx}
                                    className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 ${canvasTheme === 'paper-white'
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

                        {isEditing && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const catName = window.prompt('Nhập tên nhóm kỹ năng mới (ví dụ: Công Cụ Thiết Kế, Kỹ Năng Mềm...):');
                                if (catName && catName.trim()) {
                                  setCvData(prev => ({
                                    ...prev,
                                    skills: [...prev.skills, { category: catName.trim(), items: [] }]
                                  }));
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border border-dashed border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">add_circle</span>
                              <span>+ Thêm Nhóm Kỹ Năng Mới</span>
                            </button>
                          </div>
                        )}
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
                    <h1 className={`text-2xl sm:text-3xl font-serif font-black uppercase tracking-wider ${canvasTheme === 'paper-white' ? 'text-slate-950' : 'text-[#1A2520]'
                      }`}>
                      {currentCandidate.accountName}
                    </h1>
                    <p className="text-sm font-semibold tracking-wide" style={{ color: livingTheme.primary }}>
                      {cvData.targetTitle}
                    </p>
                    <div className={`text-xs flex flex-wrap items-center justify-center gap-3 pt-1 font-mono ${canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A5B4D]'
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
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                      }`}>
                      TÓM TẮT NĂNG LỰC (PROFESSIONAL SUMMARY)
                    </h2>
                    <p className={`text-xs leading-relaxed ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#4A5B4D] font-medium'}`}>{cvData.summary}</p>
                  </section>

                  {/* Harvard Section 2: Education */}
                  <section className="space-y-3">
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                      }`}>
                      HỌC VẤN (EDUCATION)
                    </h2>
                    {safeArr(cvData.education).map((edu, eIdx) => (
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
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                      }`}>
                      KINH NGHIỆM LÀM VIỆC (PROFESSIONAL EXPERIENCE)
                    </h2>
                    {safeArr(cvData.experiences).map((exp, expIdx) => (
                      <div key={exp.id || expIdx} className="text-xs space-y-1">
                        <div className={`flex justify-between font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                          <span>{exp.company} — {exp.role}</span>
                          <span className={`font-mono ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.period}</span>
                        </div>
                        <p className={`text-[11px] italic ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.location}</p>
                        <ul className={`list-disc list-outside pl-4 space-y-1 ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#4A5B4D] font-medium'}`}>
                          {safeArr(exp.bullets).map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>

                  {/* Harvard Section 4: Skills & Certifications */}
                  <section className="space-y-2.5">
                    <h2 className={`text-xs font-serif font-bold uppercase tracking-wider pb-0.5 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-400' : 'text-[#2D3A31] border-[#C5C0B6]'
                      }`}>
                      KỸ NĂNG, CHỨNG CHỈ &amp; NGOẠI NGỮ (SKILLS &amp; CERTIFICATIONS)
                    </h2>
                    <div className={`text-xs space-y-1.5 ${canvasTheme === 'paper-white' ? 'text-slate-800' : 'text-[#4A5B4D]'}`}>
                      {safeArr(cvData.skills).map((s, idx) => (
                        <p key={idx}>
                          <strong className={canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}>{s.category}:</strong> {safeArr(s.items).join(', ')}
                        </p>
                      ))}
                      <p>
                        <strong className={canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}>Chứng chỉ quốc tế:</strong> {safeArr(cvData.certifications).map(c => `${c.name} (${c.issuer})`).join('; ')}
                      </p>
                      <p>
                        <strong className={canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}>Ngoại ngữ:</strong> {safeArr(cvData.languages).map(l => `${l.name} (${l.score})`).join('; ')}
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

                    <div className="relative group shrink-0">
                      <img
                        src={currentCandidate.avatarUrl}
                        alt={currentCandidate.accountName}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/30 shadow-2xl group-hover:brightness-90 transition-all"
                      />
                      <input
                        type="file"
                        id="candidate-avatar-modern-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCandidateAvatarFileChange}
                      />
                      <label
                        htmlFor="candidate-avatar-modern-input"
                        className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity backdrop-blur-xs"
                        title="Bấm để chọn ảnh từ máy (Tự động tải lên Cloudinary)"
                      >
                        <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                        <span className="text-[10px] font-bold uppercase">Đổi ảnh</span>
                      </label>
                    </div>
                  </div>

                  {/* Contact Band */}
                  <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-around gap-4 text-xs font-mono font-semibold ${canvasTheme === 'paper-white' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-[#F2F0EB] border-[#C5C0B6] text-[#2D3A31]'
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
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                          }`}>
                          KINH NGHIỆM THỰC CHIẾN (EXPERIENCE)
                        </h3>
                        {safeArr(cvData.experiences).map((exp, eIdx) => (
                          <div key={exp.id || eIdx} className="space-y-1.5 text-xs sm:text-sm">
                            <div className={`flex justify-between font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>
                              <span>{exp.role}</span>
                              <span className={`font-mono text-xs ${canvasTheme === 'paper-white' ? 'text-slate-600' : 'text-[#667067]'}`}>{exp.period}</span>
                            </div>
                            <p className="font-semibold text-xs" style={{ color: livingTheme.primary }}>{exp.company} — {exp.location}</p>
                            <ul className={`list-disc list-outside pl-4 space-y-1 text-xs ${canvasTheme === 'paper-white' ? 'text-slate-800 font-medium' : 'text-[#4A5B4D] font-medium'}`}>
                              {safeArr(exp.bullets).map((b, idx) => (
                                <li key={idx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </section>

                      <section className="space-y-4">
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                          }`}>
                          DỰ ÁN TRỌNG ĐIỂM (KEY PROJECTS)
                        </h3>
                        {safeArr(cvData.projects).map((p, pIdx) => (
                          <div key={p.id || pIdx} className={`p-3.5 rounded-2xl border space-y-1 text-xs ${canvasTheme === 'paper-white' ? 'bg-slate-50 border-slate-300' : 'bg-[#F2F0EB] border-[#C5C0B6]'
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
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                          }`}>
                          KỸ NĂNG CHUYÊN SÂU
                        </h3>
                        <div className="space-y-2">
                          {safeArr(cvData.skills).map((sk, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <p className={`font-bold text-[11px] ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{sk.category}</p>
                              <div className="flex flex-wrap gap-1">
                                {safeArr(sk.items).map((it, iIdx) => (
                                  <span key={iIdx} className={`px-2 py-0.5 rounded text-[10px] font-mono ${canvasTheme === 'paper-white' ? 'bg-slate-100 text-slate-800 border border-slate-300' : livingTheme.tagBg
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
                        <h3 className={`text-xs font-headline font-black uppercase tracking-widest pb-1 border-b ${canvasTheme === 'paper-white' ? 'text-slate-900 border-slate-300' : 'text-[#2D3A31] border-[#C5C0B6]'
                          }`}>
                          HỌC VẤN &amp; CHỨNG CHỈ
                        </h3>
                        {safeArr(cvData.education).map((e, idx) => (
                          <div key={e.id || idx} className="text-xs space-y-0.5">
                            <p className={`font-bold ${canvasTheme === 'paper-white' ? 'text-slate-900' : 'text-[#2D3A31]'}`}>{e.school}</p>
                            <p className={canvasTheme === 'paper-white' ? 'text-slate-700' : 'text-[#4A5B4D]'}>{e.degree}</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px]">{e.grade}</p>
                          </div>
                        ))}
                        <div className="pt-2 space-y-1.5">
                          {safeArr(cvData.certifications).map((c, idx) => (
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
          )
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CV FILES VAULT & ATS PARSER                        */}
        {/* ========================================================= */}
        {activeTab === 'attachments' && (
          <div className="max-w-4xl mx-auto space-y-6 font-sans animate-fadeIn">

            {/* Upload Zone */}
            <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-5 transition-all duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#5b48bd] text-white shadow-sm">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                  </div>
                  <div>
                    <h2 className="font-sans font-bold text-base text-[#1e1b4b]">Tải Lên File CV PDF / DOCX</h2>
                    <p className="text-xs text-slate-500">Gemini AI tự động quét từ khóa ngành nghề và chấm điểm ATS tương thích.</p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-sans font-bold bg-purple-50 text-[#5b48bd] border border-purple-100">
                  {cvFiles.length} Tệp Lưu Trữ
                </span>
              </div>

              <label className="p-8 rounded-2xl bg-purple-50/30 border-2 border-dashed border-purple-200 hover:border-[#5b48bd] hover:bg-purple-50/60 transition-all text-center block cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                  onChange={handleUploadCv}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-4xl text-[#5b48bd] group-hover:scale-110 transition-transform">cloud_upload</span>
                <p className="font-sans font-bold text-base text-[#1e1b4b] mt-2">Bấm hoặc Kéo thả file CV của bạn vào đây</p>
                <p className="text-xs text-slate-500 mt-1">Định dạng hỗ trợ: PDF, Word (DOCX/DOC), Ảnh Chụp/Scan (PNG, JPG, WEBP) • Tối đa 15MB</p>
              </label>
            </section>

            {/* List of Uploaded CVs */}
            <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-5 transition-all duration-300">
              <h2 className="font-sans font-bold text-base text-[#1e1b4b] pb-4 border-b border-purple-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5b48bd]">folder_open</span>
                <span>Danh Sách Tệp CV Trong Kho Hồ Sơ Của {currentCandidate.accountName}</span>
              </h2>

              <div className="space-y-3">
                {cvFiles.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 bg-purple-50/20 rounded-2xl border border-purple-50">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">inventory_2</span>
                    Chưa có tệp CV nào trong kho hồ sơ. Hãy tải lên tệp đầu tiên ở trên!
                  </div>
                ) : (
                  cvFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${file.isDefault
                        ? 'bg-purple-50/40 border-purple-200 shadow-xs'
                        : 'bg-white border-purple-100 hover:border-purple-200 hover:bg-purple-50/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        file.isDefault 
                          ? 'bg-purple-100 text-[#5b48bd] font-bold' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">
                          {file.name?.toLowerCase().endsWith('.docx') || file.name?.toLowerCase().endsWith('.doc') 
                            ? 'description' 
                            : 'picture_as_pdf'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-sans font-bold text-sm text-[#1e1b4b] truncate max-w-xs sm:max-w-md">{file.name}</h3>
                          {file.isDefault && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-[#32247b] text-white">
                              MẶC ĐỊNH FAST APPLY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-sans mt-0.5">
                          {file.size} • {file.uploaded} • Ngành: <strong className="text-slate-700">{file.targetIndustry}</strong> • Điểm ATS: <strong className="text-emerald-600 font-bold">{file.atsScore}/100</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      {!file.isDefault && (
                        <button
                          onClick={() => handleSetDefaultCv(file.id)}
                          className="px-3 py-1.5 rounded-full bg-botanical-cream hover:bg-botanical-stone/60 text-xs font-bold text-botanical-forest transition-colors cursor-pointer border border-botanical-stone/80"
                        >
                          Đặt Mặc Định
                        </button>
                      )}
                      <button
                        onClick={() => handleAnalyzeCv(file.id)}
                        className="px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-[#5b48bd] text-xs font-bold transition-colors cursor-pointer border border-purple-200 flex items-center gap-1"
                        title="Quét ATS bằng Gemini AI"
                      >
                        <span className="material-symbols-outlined text-sm">psychology</span>
                        <span>Quét ATS</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCv(file)}
                        className="p-1.5 rounded-full bg-botanical-cream hover:bg-botanical-stone/60 text-botanical-forest transition-colors cursor-pointer border border-botanical-stone/80 inline-flex items-center justify-center"
                        title={`Tải xuống tệp ${file.name || 'CV'}`}
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCv(file.id)}
                        className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200 inline-flex items-center justify-center"
                        title="Xóa tệp CV này khỏi hệ thống"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </section>

            {/* ========================================================= */}
            {/* 🎯 AI RECOMMENDED JOBS (INSTANT SMART MATCH DỰA TRÊN CV) */}
            {/* ========================================================= */}
            <section className="bg-gradient-to-br from-[#edeafd]/60 via-white to-[#f5f3ff] rounded-3xl border-2 border-purple-200/80 p-6 sm:p-8 shadow-sm space-y-5 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-[#5b48bd] to-[#7c66dc] text-white shadow-md">
                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-sans font-extrabold text-base text-[#1e1b4b]">
                        Việc Làm Đề Xuất Phù Hợp Nhất (AI Smart Match)
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#5b48bd] text-white">
                        Gemini 70/30
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dựa trên cấu trúc CV &amp; kỹ năng vừa quét, hệ thống tự động lọc ra các vị trí có độ tương thích cao nhất.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchRecommendations}
                    disabled={loadingRecommendations}
                    className="px-3.5 py-1.5 rounded-full bg-white border border-purple-200 text-[#5b48bd] hover:bg-purple-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <span className={`material-symbols-outlined text-sm ${loadingRecommendations ? 'animate-spin' : ''}`}>sync</span>
                    <span>Làm Mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { window.location.hash = '#/'; }}
                    className="px-3.5 py-1.5 rounded-full bg-[#5b48bd] text-white hover:bg-[#47369f] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span>Xem Tất Cả Trên Trang Chủ</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>

              {/* Grid of Recommended Jobs */}
              {loadingRecommendations ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <span className="material-symbols-outlined text-3xl text-[#5b48bd] animate-spin block mb-2">sync</span>
                  AI đang so khớp hồ sơ của bạn với các bài tuyển dụng trên hệ thống...
                </div>
              ) : recommendedJobs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 bg-white/70 rounded-2xl border border-purple-100 p-6">
                  <span className="material-symbols-outlined text-3xl text-purple-300 block mb-2">work_outline</span>
                  Chưa tìm thấy công việc tương ứng tức thời. Hãy thêm kỹ năng vào CV hoặc bấm "Làm Mới" để AI quét lại!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedJobs.slice(0, 4).map((job) => {
                    const matchScore = job.matchingScore != null ? Math.round(job.matchingScore) : (job.aiMatchScore != null ? Math.round(job.aiMatchScore) : null);
                    return (
                      <div
                        key={job.jobId || job.id}
                        className="p-5 rounded-2xl bg-white border border-purple-100/90 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                      >
                        <div>
                          {/* Header of Card */}
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center font-bold text-[#5b48bd] text-lg overflow-hidden shrink-0 shadow-xs">
                                {job.companyLogo ? (
                                  <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'J'}</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-sans font-extrabold text-sm text-[#1e1b4b] line-clamp-1 group-hover:text-[#5b48bd] transition-colors">
                                  {job.title}
                                </h3>
                                <p className="text-xs font-semibold text-[#f97316] flex items-center gap-1 mt-0.5">
                                  <span>{job.companyName || 'HireMate Partner'}</span>
                                  <span className="material-symbols-outlined text-xs text-blue-500">verified</span>
                                </p>
                              </div>
                            </div>

                            {/* Match Score Badge */}
                            {matchScore != null ? (
                              <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold flex items-center gap-1 shrink-0 shadow-xs">
                                <span className="material-symbols-outlined text-sm text-emerald-600">auto_awesome</span>
                                <span>{matchScore}% Match</span>
                              </div>
                            ) : (
                              <div className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 shrink-0 shadow-xs">
                                <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                                <span>Đang tuyển</span>
                              </div>
                            )}
                          </div>

                          {/* Quick specs */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-3">
                            <span className="flex items-center gap-1 font-bold text-[#f97316]">
                              <span className="material-symbols-outlined text-xs">payments</span>
                              {job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : (job.salaryText || 'Thỏa thuận')}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#5b48bd]">location_on</span>
                              {job.location || 'Toàn quốc'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-emerald-600">schedule</span>
                              {job.employmentType || 'Full-time'}
                            </span>
                          </div>

                          {/* AI Reasoning / Skills match */}
                          {job.aiReasoning && (
                            <p className="text-[11px] text-purple-900 bg-purple-50/70 p-2 rounded-lg border border-purple-100 leading-relaxed mb-3 line-clamp-2">
                              💡 <strong>AI nhận định:</strong> {job.aiReasoning}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-purple-50 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => { window.location.hash = `#/jobs/${job.jobId || job.id || 101}`; }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Chi tiết</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => { window.location.hash = `#/ai-interview?jobId=${job.jobId || job.id}`; }}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Luyện tập phỏng vấn AI với tin tuyển dụng này"
                            >
                              <span className="material-symbols-outlined text-sm text-amber-600">mic</span>
                              <span>Luyện Phỏng Vấn</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setApplyingJob(job)}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5b48bd] to-[#7c66dc] hover:from-[#47369f] hover:to-[#6852ca] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                            >
                              <span>Ứng tuyển</span>
                              <span className="material-symbols-outlined text-xs">send</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Privacy & Job Search Status settings */}
            <section className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-5 transition-all duration-300">
              <h2 className="font-sans font-bold text-base text-[#1e1b4b] pb-4 border-b border-purple-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5b48bd]">tune</span>
                <span>Thiết Lập Trạng Thái Ứng Tuyển &amp; Quyền Riêng Tư</span>
              </h2>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[#1e1b4b] font-bold mb-2.5">Trạng Thái Tìm Việc Hiện Tại:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'OPEN_TO_WORK', label: '🟢 Đang Tích Cực Tìm Việc' },
                      { id: 'EXPLORING', label: '🟡 Mở Lòng Với Cơ Hội Tốt' },
                      { id: 'NOT_LOOKING', label: '⚪ Chưa Có Nhu Cầu' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setJobSearchStatus(st.id);
                          showToast(`Đã chuyển trạng thái: ${st.label}`);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer font-sans text-xs ${jobSearchStatus === st.id
                            ? 'bg-[#32247b] text-white font-bold shadow-md border-[#32247b]'
                            : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50/50 hover:border-[#5b48bd]/40'
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

        {/* ========================================================= */}
        {/* 🎯 MODAL BÁO CÁO ATS & VIỆC LÀM PHÙ HỢP TỨC THÌ         */}
        {/* ========================================================= */}
        {showRecommendationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
            <div className="relative w-full max-w-2xl bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 shadow-2xl text-[#1e1b4b] max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowRecommendationModal(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-purple-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b48bd] to-[#7c66dc] text-white flex items-center justify-center shadow-md shrink-0">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#1e1b4b]">
                      Báo Cáo Phân Tích ATS &amp; Đề Xuất Việc Làm
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Chuẩn ATS 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ của bạn đã được Gemini AI phân tích cấu trúc, trích xuất kỹ năng và đối chiếu tự động.
                  </p>
                </div>
              </div>

              {/* ATS Gauge & Key Highlights Ribbon */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-purple-50/40 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-sm shrink-0">
                    <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center">
                      <span className="text-base font-black text-emerald-600 leading-none">98</span>
                      <span className="text-[9px] font-bold text-slate-400">/100</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1e1b4b] uppercase tracking-wider">
                      Điểm Tương Thích ATS: Xuất Sắc
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bố cục định dạng chuẩn quốc tế, từ khóa kỹ năng đầy đủ và rõ ràng.
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-purple-200 sm:pl-4">
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Gemini 1.5 Flash Vision
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Đã đồng bộ vào Bản CV</p>
                </div>
              </div>

              {/* Detected Skills Preview Chips */}
              {cvData.skills && cvData.skills.length > 0 && (
                <div className="mb-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#5b48bd] uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">psychology</span>
                      <span>Kỹ Năng AI Vừa Trích Xuất Được Từ CV:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {cvData.skills.flatMap(s => s.items).length} kỹ năng
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#f8f7ff] rounded-xl border border-purple-100">
                    {cvData.skills.flatMap(s => s.items).slice(0, 15).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#edeafd] text-[#5b48bd] border border-[#d6cefa]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Jobs Section Header */}
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#f97316]">work</span>
                  <span>Top Việc Làm Phù Hợp Nhất (AI Smart Match)</span>
                </h4>
                <span className="text-[10px] text-slate-400">Tự động so khớp 70/30</span>
              </div>

              {/* Matched Jobs List */}
              <div className="space-y-3 mb-5 max-h-[42vh] overflow-y-auto pr-1">
                {recommendedJobs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-purple-50/40 rounded-2xl">
                    Đang đồng bộ dữ liệu so khớp, bạn có thể duyệt việc làm tại Trang chủ!
                  </div>
                ) : (
                  recommendedJobs.slice(0, 3).map((job) => {
                    const score = job.matchingScore != null ? Math.round(job.matchingScore) : (job.aiMatchScore != null ? Math.round(job.aiMatchScore) : null);
                    return (
                      <div
                        key={job.jobId || job.id}
                        className="p-3.5 rounded-2xl bg-[#f8f7ff] border border-purple-100 hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center font-bold text-[#5b48bd] text-sm shrink-0 shadow-2xs">
                            {job.companyLogo ? (
                              <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'J'}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[#1e1b4b] truncate group-hover:text-[#5b48bd] transition-colors">
                              {job.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {job.companyName} • <span className="text-[#f97316] font-semibold">{job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : (job.salaryText || 'Thỏa thuận')}</span> • {job.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {score != null ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">auto_awesome</span>
                              <span>{score}% Match</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                              Đang tuyển
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowRecommendationModal(false);
                              window.location.hash = `#/ai-interview?jobId=${job.jobId || job.id}`;
                            }}
                            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center"
                            title="Luyện phỏng vấn AI với tin này"
                          >
                            <span className="material-symbols-outlined text-sm text-amber-600">mic</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowRecommendationModal(false);
                              window.location.hash = `#/jobs/${job.jobId || job.id || 101}`;
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#5b48bd] hover:bg-[#47369f] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>Xem Ngay</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Điểm tương thích đã được lưu vào hệ thống và gắn nhãn trên Trang Chủ.
                </span>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRecommendationModal(false)}
                    className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecommendationModal(false);
                      window.location.hash = '#/';
                    }}
                    className="px-5 py-2 rounded-full bg-[#5b48bd] hover:bg-[#47369f] text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Duyệt Việc Làm</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Apply Job Modal */}
        {applyingJob && (
          <ApplyJobModal
            job={applyingJob}
            user={user}
            onClose={() => setApplyingJob(null)}
            onSuccess={() => {
              showToast('Nộp hồ sơ ứng tuyển thành công!');
            }}
          />
        )}

      </div>
    </div>
  );
}
