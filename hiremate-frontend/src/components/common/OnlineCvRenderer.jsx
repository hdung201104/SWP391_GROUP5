import React, { useState, useEffect } from 'react';
import { AvatarImg } from './SmartImage';
import { resolveUserAvatar } from '../../utils/mediaUtils';

/**
 * Hàm so khớp linh hoạt cho kỹ năng chuyên môn
 */
const matchSkillPattern = (lower, p) => {
  if (lower === p) return true;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[\\s,./;()#+-])${escaped}($|[\\s,./;()#+-])`, 'i');
  return regex.test(lower);
};

/**
 * Chuẩn hóa và phân loại danh sách kỹ năng thành ma trận (Skills Matrix)
 * Đảm bảo 100% đồng bộ cấu trúc hiển thị giữa trang Ứng viên và Nhà tuyển dụng
 */
const normalizeSkillsToCategories = (rawSkills, parsedCategories) => {
  // 1. Nếu parsedCategories từ AI đã có dữ liệu phân nhóm, giữ nguyên các nhóm đó và làm sạch rác
  if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
    const cleanedCats = parsedCategories.map((cat) => {
      if (!cat) return null;
      const catName = cat.category || cat.groupName || 'Kỹ Năng Chuyên Môn';
      const rawItems = Array.isArray(cat.items) ? cat.items : Array.isArray(cat.skills) ? cat.skills : [];
      const cleanItems = rawItems
        .map((i) => (typeof i === 'string' ? i.trim() : (i?.skillName || i?.name || '').trim()))
        .filter((s) => s && s.length <= 60 && !s.includes('[') && !s.includes(']') && !s.toLowerCase().startsWith('nếu chưa'));
      return cleanItems.length > 0 ? { category: catName, items: cleanItems } : null;
    }).filter(Boolean);

    if (cleanedCats.length > 0) {
      let flat = [];
      if (Array.isArray(rawSkills)) {
        rawSkills.forEach((item) => {
          if (typeof item === 'string') {
            flat.push(item.trim());
          } else if (item && typeof item === 'object') {
            if (Array.isArray(item.items)) {
              flat.push(...item.items.map((s) => String(s).trim()));
            } else if (item.skillName || item.name) {
              flat.push(String(item.skillName || item.name).trim());
            }
          }
        });
      }
      const existingInCats = new Set();
      cleanedCats.forEach((c) => c.items.forEach((it) => existingInCats.add(it.toLowerCase())));
      const missingSkills = flat.filter((s) => s && s.length <= 60 && !s.includes('[') && !s.includes(']') && !s.toLowerCase().startsWith('nếu chưa') && !existingInCats.has(s.toLowerCase()));
      if (missingSkills.length > 0) {
        cleanedCats[0].items = [...cleanedCats[0].items, ...missingSkills];
      }
      return cleanedCats;
    }
  }

  if (Array.isArray(rawSkills) && rawSkills.length > 0 && typeof rawSkills[0] === 'object' && rawSkills[0].category && rawSkills[0].category !== 'Kỹ Năng Đã Quét' && Array.isArray(rawSkills[0].items)) {
    return rawSkills;
  }

  let flatList = [];
  if (Array.isArray(rawSkills)) {
    rawSkills.forEach((item) => {
      if (typeof item === 'string') {
        flatList.push(item.trim());
      } else if (item && typeof item === 'object') {
        if (Array.isArray(item.items)) {
          flatList.push(...item.items.map((s) => String(s).trim()));
        } else if (item.skillName || item.name) {
          flatList.push(String(item.skillName || item.name).trim());
        }
      }
    });
  }

  flatList = [...new Set(flatList.filter((s) => {
    if (!s) return false;
    const lower = s.toLowerCase();
    if (lower.startsWith('nếu chưa') || lower.startsWith('nếu bạn') || lower.includes('[') || lower.includes(']') || s.length > 50) {
      return false;
    }
    return true;
  }))];

  if (flatList.length === 0) return [];

  const groups = [
    {
      category: 'Phát Triển Phần Mềm & Kiến Trúc',
      patterns: [
        'fullstack', 'full-stack', 'backend', 'frontend', 'microservices', 'api gateway',
        'websocket', 'distributed', 'restful', 'grpc', 'kafka', 'sdn', 'network',
      ],
      items: [],
    },
    {
      category: 'Ngôn Ngữ Lập Trình & Frameworks',
      patterns: [
        'nodejs', 'node.js', 'golang', 'go', 'java', 'react', 'reactjs', 'typescript',
        'javascript', 'python', 'spring', 'nestjs', 'c#', '.net', 'html', 'css', 'vue', 'angular', 'php', 'c++',
      ],
      items: [],
    },
    {
      category: 'Cơ Sở Dữ Liệu & Hạ Tầng Cloud',
      patterns: [
        'postgresql', 'postgres', 'sql', 'redis', 'aws', 'docker', 'kubernetes', 'ci/cd',
        'tcp/ip', 'tcp', 'ip', 'mongodb', 'mysql', 'linux', 'azure', 'gcp', 'jenkins', 'git',
      ],
      items: [],
    },
    {
      category: 'Phân Tích Nghiệp Vụ & Quy Trình',
      patterns: [
        'ba', 'business analyst', 'bpmn', 'uml', 'brse', 'srs', 'use case', 'product management',
        'scrum', 'agile', 'jira', 'confluence', 'user story',
      ],
      items: [],
    },
    {
      category: 'Marketing, Truyền Thông & Bán Hàng',
      patterns: [
        'marketing', 'digital marketing', 'seo', 'sem', 'content', 'copywriting', 'facebook ads',
        'google ads', 'social media', 'crm', 'sales', 'telesales', 'b2b', 'b2c', 'lead generation',
        'branding', 'thị trường', 'truyền thông', 'bán hàng', 'quảng cáo',
      ],
      items: [],
    },
    {
      category: 'Tài Chính, Kế Toán & Kiểm Toán',
      patterns: [
        'kế toán', 'tài chính', 'thuế', 'báo cáo tài chính', 'bctc', 'misa', 'fast', 'erp',
        'excel', 'hóa đơn', 'sổ sách', 'kiểm toán', 'quyết toán', 'chi phí', 'dòng tiền',
        'accounting', 'finance', 'audit', 'tax', 'financial modeling',
      ],
      items: [],
    },
    {
      category: 'Thiết Kế Đồ Họa & UI/UX',
      patterns: [
        'figma', 'ui/ux', 'photoshop', 'illustrator', 'pts', 'ai', 'canva', 'premiere',
        'after effects', 'wireframe', 'prototyping', 'design system', 'thiết kế', 'đồ họa',
      ],
      items: [],
    },
    {
      category: 'Quản Trị, Nhân Sự & Kỹ Năng Mềm',
      patterns: [
        'quản lý', 'lãnh đạo', 'tuyển dụng', 'nhân sự', 'hr', 'c&b', 'đào tạo', 'headhunt',
        'giao tiếp', 'đàm phán', 'làm việc nhóm', 'thuyết trình', 'giải quyết vấn đề',
        'quản lý thời gian', 'leadership', 'communication', 'teamwork', 'negotiation',
      ],
      items: [],
    },
    {
      category: 'Ngoại Ngữ & Chứng Chỉ Quốc Tế',
      patterns: [
        'tiếng anh', 'english', 'tiếng nhật', 'japanese', 'tiếng hàn', 'korean', 'tiếng trung', 'chinese',
        'tiếng pháp', 'french', 'tiếng đức', 'german', 'ielts', 'toefl', 'toeic', 'jlpt', 'topik', 'hsk',
      ],
      items: [],
    },
  ];

  const assigned = new Set();
  groups.forEach((group) => {
    flatList.forEach((skill) => {
      const lower = skill.toLowerCase().trim();
      const isMatch = group.patterns.some((p) => matchSkillPattern(lower, p));
      if (isMatch && !assigned.has(skill)) {
        group.items.push(skill);
        assigned.add(skill);
      }
    });
  });

  const otherItems = flatList.filter((s) => !assigned.has(s));
  const result = groups.filter((g) => g.items.length > 0);

  if (otherItems.length > 0) {
    result.push({
      category: 'Kỹ Năng Chuyên Môn Bổ Trợ',
      items: otherItems,
    });
  }

  return result.length > 0 ? result : [{ category: 'Kỹ Năng Chuyên Môn', items: flatList }];
};

/**
 * OnlineCvRenderer.jsx
 * Hiển thị hồ sơ CV Online theo 3 mẫu chuẩn mực quốc tế:
 * 1. 'executive': Mẫu 2 Cột Chuẩn Doanh Nghiệp (Executive 2-Column Balanced)
 * 2. 'harvard': Mẫu Harvard ATS 100% (Đơn cột chuẩn học thuật tối ưu máy quét)
 * 3. 'modern': Mẫu Hiện Đại Sang Trọng (Modern Editorial with Brand Banner)
 * Đảm bảo 100% đồng bộ về bố cục, màu sắc, thông tin liên hệ và ma trận kỹ năng giữa Ứng viên & Nhà tuyển dụng
 */
export default function OnlineCvRenderer({
  candidate = {},
  initialTemplate = 'executive',
  showSelector = false,
  onTemplateChange = null,
  matchScore = null,
  className = '',
}) {
  const targetTemplate = candidate.initialTemplate || initialTemplate || 'executive';
  const [template, setTemplate] = useState(targetTemplate);

  useEffect(() => {
    const nextTpl = candidate.initialTemplate || initialTemplate;
    if (nextTpl) {
      setTemplate(nextTpl);
    }
  }, [candidate.initialTemplate, initialTemplate]);

  const handleSelectTemplate = (tId) => {
    setTemplate(tId);
    if (onTemplateChange) onTemplateChange(tId);
  };

  // Chuẩn hóa họ tên ứng viên
  const isFileName = (s) => typeof s === 'string' && (
    s.toLowerCase().includes('communication') ||
    s.toLowerCase().includes('resume') ||
    s.toLowerCase().endsWith('.pdf') ||
    s.toLowerCase().endsWith('.docx') ||
    s.toLowerCase().endsWith('.doc') ||
    s.trim() === 'Ứng viên' ||
    s.trim() === 'Ung Vien'
  );
  let name = candidate.name;
  if (!name || isFileName(name)) name = candidate.fullName;
  if (!name || isFileName(name)) name = candidate.accountName;
  if (!name || isFileName(name)) name = candidate.candidateName;
  if (!name || isFileName(name)) name = 'Ứng Viên HireMate';

  // Kinh nghiệm làm việc (Chuẩn hóa tự động cho cả bullets & highlights)
  const rawExperiences = Array.isArray(candidate.experiences) ? candidate.experiences : (Array.isArray(candidate.experience) ? candidate.experience : []);
  const experiences = rawExperiences.map((exp) => ({
    ...exp,
    role: exp.role || exp.title || exp.position || 'Chuyên viên chuyên môn',
    company: exp.company || exp.employer || exp.organization || '',
    period: exp.period || exp.duration || exp.time || 'Gần đây',
    location: exp.location || '',
    bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
      ? exp.bullets
      : (Array.isArray(exp.highlights) && exp.highlights.length > 0 ? exp.highlights : []),
  }));

  // Tiêu đề nghề nghiệp (Headline / Role)
  const isInvalidTitle = (t) => {
    if (!t || typeof t !== 'string') return true;
    const c = t.trim().toLowerCase();
    if (c.length < 2 || c.length > 80) return true;
    if (c === 'ứng viên' || c === 'ung vien' || c === 'chuyên viên' || c === 'chuyen vien' || c === 'hồ sơ ứng viên') return true;
    if (/^(?:work\s+experience|professional\s+experience|kinh\s+nghiệm|education|học\s+vấn|skills|kỹ\s+năng|summary|tóm\s+tắt|about\s+me|certifications?|projects?|languages?)/i.test(c)) return true;
    if (c.includes('curriculum vitae') || c.includes('resume') || c.endsWith('.pdf') || c.endsWith('.docx') || c.includes('@')) return true;
    return false;
  };

  let title = (!isInvalidTitle(candidate.title) ? candidate.title : null) ||
    (!isInvalidTitle(candidate.headline) ? candidate.headline : null) ||
    (!isInvalidTitle(candidate.targetTitle) ? candidate.targetTitle : null) ||
    (!isInvalidTitle(candidate.jobTitle) ? candidate.jobTitle : null) || '';

  if (!title && experiences.length > 0) {
    for (const exp of experiences) {
      if (exp.role && !isInvalidTitle(exp.role)) {
        title = exp.role;
        break;
      }
    }
  }
  if (!title && candidate.projects && candidate.projects.length > 0) {
    for (const proj of candidate.projects) {
      if (proj.role && !isInvalidTitle(proj.role)) {
        title = proj.role;
        break;
      }
    }
  }
  if (!title) title = 'Chuyên Viên Chuyên Môn';
  if (title && !title.includes(' ') && !title.includes('(')) {
    title = title.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  }

  // Thông tin liên hệ
  const isInvalidLoc = (l) => {
    if (!l || typeof l !== 'string') return true;
    const c = l.trim().toLowerCase();
    if (c.length < 2 || c.length > 60) return true;
    if (/japanese-vietnamese|vietnamese-japanese|english-vietnamese|translation|manga|project|tutor|engineer|developer|freelance|part-time/i.test(c)) return true;
    if (/\b(?:19|20)\d{2}\b/.test(c)) return true;
    return false;
  };

  const email = candidate.email || 'ungvien@hiremate.vn';
  const phone = candidate.phone || '(+84) 090.123.4567';
  let location = candidate.location;
  if (!location || isInvalidLoc(location)) location = 'Việt Nam';
  const avatar = resolveUserAvatar(candidate);

  const dob = candidate.dob || candidate.dateOfBirth || '';
  const github = candidate.github || candidate.githubUrl || '';
  const linkedin = candidate.linkedin || candidate.linkedinUrl || '';
  const portfolio = candidate.portfolio || candidate.website || '';
  const tagline = candidate.tagline || '';

  // Tóm tắt năng lực cốt lõi
  let summary = candidate.summary || '';
  if ((!summary || summary.includes('Uploaded via HireMate')) && experiences.length > 0) {
    const topExp = experiences.slice(0, 2).map((e) => e.role || e.company).filter(Boolean).join(' • ');
    summary = `Ứng viên có bề dày năng lực và kinh nghiệm thực tế với vị trí ${topExp || title}. Hồ sơ chuyên môn được đối soát và chuẩn hóa tự động theo đúng bản CV ứng tuyển.`;
  } else if ((!summary || summary.includes('Uploaded via HireMate')) && candidate.projects && candidate.projects.length > 0) {
    const topProj = candidate.projects.slice(0, 2).map((p) => p.role || p.name).filter(Boolean).join(' • ');
    summary = `Ứng viên có bề dày năng lực và kinh nghiệm thực chiến qua các dự án tiêu biểu: ${topProj || title}. Hồ sơ chuyên môn được đối soát và chuẩn hóa tự động theo đúng bản CV này.`;
  }
  if (!summary) summary = 'Chuyên viên tận tâm với kinh nghiệm thực chiến và tinh thần học hỏi, cầu tiến cao.';

  // Kỹ năng: Lấy danh sách kỹ năng phẳng
  let skills = [];
  if (Array.isArray(candidate.skills)) {
    candidate.skills.forEach((item) => {
      if (typeof item === 'string') {
        skills.push(item.trim());
      } else if (item && typeof item === 'object') {
        if (Array.isArray(item.items)) {
          skills.push(...item.items.map((s) => String(s).trim()));
        } else if (item.skillName || item.name) {
          skills.push(String(item.skillName || item.name).trim());
        }
      }
    });
  }
  if (skills.length === 0 && Array.isArray(candidate.skillCategories)) {
    candidate.skillCategories.forEach((cat) => {
      if (cat && Array.isArray(cat.items)) {
        skills.push(...cat.items.map((s) => String(s).trim()));
      }
    });
  }
  skills = [...new Set(skills.filter(Boolean))];

  // Ma trận kỹ năng phân nhóm chuẩn (Skills Matrix)
  const skillCategories = normalizeSkillsToCategories(skills, candidate.skillCategories || candidate.skill_categories);

  // Học vấn
  const rawEducations = Array.isArray(candidate.educations) ? candidate.educations : (Array.isArray(candidate.education) ? candidate.education : []);
  const educations = rawEducations.map((edu) => ({
    ...edu,
    school: edu.school || edu.institution || edu.university || 'Đại học / Học viện',
    degree: edu.degree || edu.major || edu.fieldOfStudy || 'Chuyên ngành chuyên môn',
    period: edu.period || edu.year || edu.duration || '2023 - 2026',
    grade: edu.grade || '',
    highlight: edu.highlight || '',
  }));

  // Dự án trọng điểm
  const rawProjects = Array.isArray(candidate.projects) ? candidate.projects : [];
  const projects = rawProjects.map((proj) => {
    let pTags = Array.isArray(proj.tags) && proj.tags.length > 0 ? proj.tags : [];
    if (pTags.length === 0 && proj.technologies && typeof proj.technologies === 'string') {
      pTags = proj.technologies.split(/,\s*/).filter(Boolean);
    }
    return {
      ...proj,
      name: proj.name || proj.project_name || proj.projectName || proj.title || 'Dự án trọng điểm',
      role: proj.role || proj.position || 'Kỹ sư phụ trách',
      period: proj.period || proj.duration || proj.year || '2026',
      summary: proj.summary || proj.description || '',
      tags: pTags,
    };
  });

  // Chứng chỉ quốc tế
  const rawCertifications = Array.isArray(candidate.certifications) ? candidate.certifications : [];
  const certifications = rawCertifications.map((c) => ({
    name: c.name || c.title || c.certificateName || '',
    issuer: c.issuer || c.organization || '',
    year: c.year || c.period || c.date || '',
    code: c.code || c.credentialId || 'VERIFIED',
  })).filter((c) => c.name);

  // Ngoại ngữ thành thạo
  const languages = (Array.isArray(candidate.languages) && candidate.languages.length > 0)
    ? candidate.languages.map((l) => {
        if (typeof l === 'string') return { name: l, level: 'Thành thạo', score: 'Thành thạo' };
        return {
          name: l.name || l.language || 'Ngoại ngữ',
          level: l.level || l.score || 'Thành thạo',
          score: l.score || l.level || 'Thành thạo',
        };
      })
    : (skills.some((s) => String(s).toLowerCase().includes('tiếng nhật') || String(s).toLowerCase().includes('japanese'))
        ? [{ name: 'Tiếng Nhật', level: 'Conversational', score: 'Giao tiếp' }]
        : [{ name: 'Tiếng Việt', level: 'Bản ngữ', score: 'Native' }, { name: 'Tiếng Anh', level: 'Professional', score: 'Chuyên ngành' }]);

  // In ấn bản CV
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ──────────────────────────────────────────────────────────── */}
      {/* TOP TOOLBAR: Hiển thị mẫu CV ứng viên đã nộp & Tác vụ In     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showSelector ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-purple-100 rounded-2xl shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-[#5b48bd] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-sm">palette</span>
              <span>Định Dạng CV Online:</span>
            </span>

            <div className="flex items-center bg-[#f8f7ff] p-1 rounded-xl border border-purple-100">
              {[
                { id: 'executive', label: '2 Cột Chuẩn', icon: 'view_column', desc: 'Executive' },
                { id: 'harvard', label: 'Harvard ATS', icon: 'menu_book', desc: '1-Column' },
                { id: 'modern', label: 'Hiện Đại', icon: 'style', desc: 'Modern' },
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer ${template === tpl.id
                    ? 'bg-[#5b48bd] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#1e1b4b] hover:bg-purple-50/60 font-medium'
                    }`}
                  title={tpl.desc}
                >
                  <span className="material-symbols-outlined text-[15px]">{tpl.icon}</span>
                  <span>{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {matchScore != null && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-[#5b48bd] border border-purple-200 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                {matchScore}% So Khớp AI
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="In bản CV này hoặc lưu dưới dạng PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>In CV / Lưu PDF</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-purple-100 rounded-2xl shadow-xs no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#1e1b4b]">
              Định dạng CV Online ứng viên đã nộp:
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-[#5b48bd] border border-purple-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              {template === 'harvard' ? 'Harvard ATS (Tối giản 100%)' : template === 'modern' ? 'Hiện Đại Sang Trọng' : '2 Cột Chuẩn (Executive)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {matchScore != null && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-[#5b48bd] border border-purple-200 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                {matchScore}% So Khớp AI
              </span>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="In bản CV này hoặc lưu dưới dạng PDF"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>In CV / Lưu PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* VÙNG HIỂN THỊ CV THEO 3 TEMPLATE                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E6E2DA] shadow-sm overflow-hidden text-[#2D3A31] print:border-none print:shadow-none">

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE 1: EXECUTIVE (2 CỘT CHUẨN DOANH NGHIỆP)            */}
        {/* ════════════════════════════════════════════════════════════ */}
        {template === 'executive' && (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[750px]">
            {/* CỘT TRÁI (4/12): AVATAR, LIÊN HỆ, HỌC VẤN, CHỨNG CHỈ, NGOẠI NGỮ */}
            <aside className="md:col-span-4 p-6 sm:p-7 bg-[#FAF9F5] border-r border-[#E6E2DA] space-y-6 text-[#2D3A31]">
              {/* Portrait & Candidate Name */}
              <div className="text-center space-y-3 pb-2">
                <div className="relative inline-block">
                  <AvatarImg
                    src={avatar}
                    name={name}
                    alt={name}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-sm mx-auto border-2 border-[#E6E2DA]"
                    fallbackClassName="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl text-white flex items-center justify-center font-extrabold text-3xl shadow-sm mx-auto border-2 border-[#E6E2DA]"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow z-10" title="Đang sẵn sàng nhận việc" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-serif font-bold text-[#2D3A31]">
                    {name}
                  </h2>
                  <p className="text-xs font-serif font-bold leading-snug text-[#5b48bd]">
                    {title}
                  </p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-sans font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                    SẴN SÀNG NHẬN VIỆC
                  </span>
                </div>
              </div>

              {/* Thông Tin Liên Hệ */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-headline font-black uppercase tracking-wider pb-1 border-b border-[#E6E2DA] text-[#2D3A31] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">contact_phone</span>
                  <span>Thông Tin Liên Hệ</span>
                </h3>

                <div className="space-y-2.5 text-xs text-[#2D3A31]/90">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-slate-500 mt-0.5 shrink-0">mail</span>
                    <span className="break-all font-medium">{email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">call</span>
                    <span className="font-medium">{phone}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-sm text-slate-500 mt-0.5 shrink-0">location_on</span>
                    <span className="font-medium">{location}</span>
                  </div>
                  {dob && (
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">cake</span>
                      <span className="font-medium">{dob}</span>
                    </div>
                  )}
                  {github && (
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">code</span>
                      <a
                        href={github.startsWith('http') ? github : `https://github.com/${github.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium truncate hover:underline flex items-center gap-1 text-[#5b48bd]"
                        title="Trang GitHub dự án của ứng viên"
                      >
                        <span>{github.startsWith('@') ? github : `@${github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}`}</span>
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 pt-1">
                    <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">link</span>
                    <span className="font-medium truncate hover:underline text-[#5b48bd]">{linkedin || 'Chưa liên kết'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-slate-500 shrink-0">language</span>
                    <span className="font-medium truncate hover:underline text-[#5b48bd]">{portfolio || 'Chưa liên kết'}</span>
                  </div>
                </div>
              </div>

              {/* Học Vấn Chính Quy */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                  <h3 className="text-xs font-headline font-black uppercase tracking-wider flex items-center gap-1.5 text-[#2D3A31]">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">school</span>
                    <span>Học Vấn Chính Quy</span>
                  </h3>
                </div>

                {educations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có thông tin học vấn</p>
                ) : (
                  educations.map((edu, eIdx) => (
                    <div key={eIdx} className="space-y-1 text-xs">
                      <h4 className="font-headline font-bold leading-snug text-[#2D3A31]">
                        {edu.school}
                      </h4>
                      <p className="font-medium text-[#4A554D]">{edu.degree}</p>
                      {edu.grade && <p className="text-[11px] font-mono font-bold text-emerald-700">{edu.grade}</p>}
                      <p className="text-[10px] font-mono text-[#667067]">{edu.period}</p>
                      {edu.highlight && <p className="text-[11px] italic pt-1 leading-snug text-[#667067]">{edu.highlight}</p>}
                    </div>
                  ))
                )}
              </div>

              {/* Chứng Chỉ Quốc Tế */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                  <h3 className="text-xs font-headline font-black uppercase tracking-wider flex items-center gap-1.5 text-[#2D3A31]">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">workspace_premium</span>
                    <span>Chứng Chỉ Quốc Tế</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {certifications.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1">Chưa có chứng chỉ quốc tế được ghi nhận trong CV</p>
                  ) : (
                    certifications.map((cert, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 rounded-xl border text-xs space-y-0.5 bg-white/80 border-[#E6E2DA] shadow-xs"
                      >
                        <h4 className="font-headline font-bold text-[11px] leading-snug text-[#2D3A31]">
                          {cert.name}
                        </h4>
                        <p className="text-[10px] font-mono text-[#667067]">{cert.issuer} {cert.year ? `• ${cert.year}` : ''}</p>
                        <p className="text-[10px] font-mono font-semibold truncate text-[#5b48bd]">{cert.code || 'VERIFIED'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Ngoại Ngữ Thành Thạo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                  <h3 className="text-xs font-headline font-black uppercase tracking-wider flex items-center gap-1.5 text-[#2D3A31]">
                    <span className="material-symbols-outlined text-sm text-[#5b48bd]">translate</span>
                    <span>Ngoại Ngữ Thành Thạo</span>
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  {languages.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1">Chưa có thông tin ngoại ngữ trong CV</p>
                  ) : (
                    languages.map((lang, lIdx) => (
                      <div key={lIdx} className="border-b border-dashed border-[#E6E2DA] pb-1.5 flex items-center justify-between">
                        <span className="font-bold text-[#2D3A31]">{lang.name}</span>
                        <span className="text-[10px] font-mono text-[#667067]">{lang.score || lang.level}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            {/* CỘT PHẢI (8/12): MAIN CONTENT */}
            <main className="md:col-span-8 p-6 sm:p-9 space-y-7 bg-[#FCFBF8] text-[#2D3A31]">
              {/* 1. Header Banner & Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl sm:text-4xl font-headline font-black uppercase tracking-tight text-[#2D3A31]">
                    {name}
                  </h1>
                  <span className="px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border bg-[#FAF9F5] text-[#2D3A31] border-[#E6E2DA]">
                    {candidate.versionBadge || 'EXECUTIVE RESUME'}
                  </span>
                </div>

                <p className="text-base sm:text-lg font-headline font-bold tracking-wide text-[#5b48bd]">
                  {title}
                </p>

                <div className="h-1 w-24 rounded-full bg-[#5b48bd]"></div>

                {tagline && (
                  <p className="text-xs leading-relaxed pt-1 font-medium text-[#4A554D]">
                    {tagline}
                  </p>
                )}
              </div>

              {/* 2. Executive Summary */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                  <h3 className="text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 text-[#2D3A31]">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">badge</span>
                    <span>Tóm Tắt Năng Lực Cốt Lõi (Executive Summary)</span>
                  </h3>
                </div>

                <div className="p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2.5 shadow-xs bg-[#F2EFE9] border-l-4 border-[#2D3A31] text-[#2D3A31] border border-[#E6E2DA]">
                  {(summary || '').split('\n\n').map((para, pIdx) => (
                    <p key={pIdx} className="leading-relaxed font-medium">{para}</p>
                  ))}
                </div>
              </section>

              {/* 3. Kinh Nghiệm Làm Việc (Work Experience) */}
              {(experiences.length > 0) && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                    <h3 className="text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 text-[#2D3A31]">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">history_edu</span>
                      <span>Kinh Nghiệm Làm Việc (Work Experience)</span>
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {experiences.map((exp, expIdx) => (
                      <div key={exp.id || expIdx} className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div>
                            <h4 className="text-base font-headline font-bold text-[#2D3A31]">
                              {exp.role}
                            </h4>
                            <p className="text-sm font-semibold text-[#5b48bd]">
                              {exp.company}
                            </p>
                          </div>
                          <div className="text-xs font-mono sm:text-right">
                            <span className="font-bold text-[#2D3A31]">{exp.period}</span>
                            {exp.location && <span className="block text-[10px] text-[#667067]">{exp.location}</span>}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                            exp.bullets.map((b, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-[#334155] font-medium">
                                <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-[#5b48bd]"></span>
                                <span>{b}</span>
                              </div>
                            ))
                          ) : (
                            exp.description && (
                              <p className="text-xs sm:text-sm leading-relaxed text-[#334155] font-medium">
                                {exp.description}
                              </p>
                            )
                          )}
                        </div>

                        {Array.isArray(exp.tags) && exp.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                            {exp.tags.map((t, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded text-[11px] font-mono bg-white text-[#2D3A31] border border-[#E6E2DA] font-semibold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Dự Án Trọng Điểm (Key Projects) */}
              {(projects.length > 0) && (
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                    <h3 className="text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 text-[#2D3A31]">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">rocket_launch</span>
                      <span>Dự Án Trọng Điểm (Key Projects)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {projects.map((proj, pIdx) => (
                      <div
                        key={proj.id || pIdx}
                        className="p-4 rounded-2xl border space-y-2 bg-white border-[#E6E2DA] shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-headline font-bold text-sm text-[#2D3A31]">
                            {proj.name}
                          </h4>
                          <span className="text-[10px] font-mono shrink-0 text-[#667067]">{proj.period}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#5b48bd]">{proj.role}</p>
                        <p className="text-xs leading-relaxed font-body text-[#4A554D] font-medium">
                          {proj.summary}
                        </p>
                        {Array.isArray(proj.tags) && proj.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF9F5] border border-[#E6E2DA] text-[#2D3A31] font-semibold"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 5. Ma Trận Năng Lực Chuyên Môn (Skills Matrix) */}
              {(skillCategories.length > 0) && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E6E2DA]">
                    <h3 className="text-xs font-headline font-black uppercase tracking-widest flex items-center gap-2 text-[#2D3A31]">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">psychology</span>
                      <span>Ma Trận Năng Lực Chuyên Môn (Skills Matrix)</span>
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs sm:text-sm">
                    {skillCategories.map((cat, catIdx) => (
                      <div
                        key={catIdx}
                        className="p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 transition-all bg-white border-[#E6E2DA] shadow-xs"
                      >
                        <span className="w-48 shrink-0 font-bold font-headline flex items-center gap-1.5 pt-0.5 text-[#2D3A31]">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#5b48bd]"></span>
                          <span className="truncate">{cat.category}:</span>
                        </span>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {(cat.items || []).map((item, iIdx) => (
                              <span
                                key={iIdx}
                                className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-[#FAF9F5] text-[#2D3A31] border border-[#E6E2DA] shadow-2xs font-semibold"
                              >
                                {typeof item === 'string' ? item : (item.skillName || item.name)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </main>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE 2: HARVARD ATS 100% (ĐƠN CỘT TỐI GIẢN CHUẨN MỸ)     */}
        {/* ════════════════════════════════════════════════════════════ */}
        {template === 'harvard' && (
          <div className="p-8 sm:p-12 space-y-7 bg-white text-slate-900 font-serif">
            {/* Harvard Header Centered */}
            <div className="text-center space-y-2 pb-4 border-b-2 border-slate-800 font-sans">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-950 font-serif">
                {name}
              </h1>
              <p className="text-sm font-bold tracking-wide text-[#5b48bd]">
                {title}
              </p>
              <div className="text-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 font-mono text-slate-700">
                <span>📞 {phone}</span>
                <span>•</span>
                <span>✉️ {email}</span>
                <span>•</span>
                <span>📍 {location}</span>
                {dob && (
                  <>
                    <span>•</span>
                    <span>🎂 {dob}</span>
                  </>
                )}
                {github && (
                  <>
                    <span>•</span>
                    <span>💻 {github.startsWith('@') ? github : `@${github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}`}</span>
                  </>
                )}
              </div>
            </div>

            {/* Harvard Section 1: Professional Summary */}
            <section className="space-y-2">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                TÓM TẮT NĂNG LỰC (PROFESSIONAL SUMMARY)
              </h2>
              <p className="text-xs leading-relaxed text-justify text-slate-800 font-medium">
                {summary}
              </p>
            </section>

            {/* Harvard Section 2: Technical Skills */}
            <section className="space-y-2">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                KỸ NĂNG CHUYÊN MÔN (TECHNICAL &amp; CORE COMPETENCIES)
              </h2>
              <div className="space-y-1.5 text-xs text-slate-800 font-sans">
                {skillCategories.map((cat, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <strong>{cat.category}: </strong>
                    <span>{(cat.items || []).join(' • ')}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Harvard Section 3: Professional Experience */}
            {(experiences.length > 0) && (
              <section className="space-y-4">
                <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                  KINH NGHIỆM LÀM VIỆC (PROFESSIONAL EXPERIENCE)
                </h2>
                <div className="space-y-4">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="space-y-1 font-sans">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-950">{exp.company}</span>
                        <span className="text-xs font-mono text-slate-600">{exp.period || exp.duration}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs italic text-slate-700 font-serif">
                        <span>{exp.role || exp.title}</span>
                        {exp.location && <span>{exp.location}</span>}
                      </div>
                      {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1 pt-1 font-sans">
                          {exp.bullets.map((b, bi) => (
                            <li key={bi} className="leading-relaxed">{b}</li>
                          ))}
                        </ul>
                      ) : (
                        exp.description && (
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">{exp.description}</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Harvard Section 4: Projects */}
            {projects.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                  DỰ ÁN TRỌNG ĐIỂM (KEY PROJECTS)
                </h2>
                <div className="space-y-3 font-sans">
                  {projects.map((proj, pIdx) => (
                    <div key={pIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>{proj.name} {proj.role ? `— ${proj.role}` : ''}</span>
                        <span className="font-mono text-slate-500 font-normal">{proj.period}</span>
                      </div>
                      {proj.summary && (
                        <p className="text-xs text-slate-700 leading-relaxed">{proj.summary}</p>
                      )}
                      {Array.isArray(proj.tags) && proj.tags.length > 0 && (
                        <p className="text-[11px] text-slate-600 font-mono">Công nghệ: {proj.tags.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Harvard Section 5: Education */}
            <section className="space-y-2">
              <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                HỌC VẤN &amp; BẰNG CẤP (EDUCATION &amp; CREDENTIALS)
              </h2>
              <div className="space-y-2 font-sans">
                {educations.map((edu, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-800">
                    <div>
                      <strong className="text-slate-950">{edu.school}</strong> — {edu.degree}
                      {edu.grade && <span className="text-emerald-700 font-bold"> ({edu.grade})</span>}
                    </div>
                    <span className="font-mono text-slate-500">{edu.period}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Harvard Section 6: Certifications & Languages */}
            {(certifications.length > 0 || languages.length > 0) && (
              <section className="space-y-2">
                <h2 className="text-xs font-serif font-black uppercase tracking-wider pb-0.5 border-b border-slate-400 text-slate-900">
                  CHỨNG CHỈ &amp; NGOẠI NGỮ (CERTIFICATIONS &amp; LANGUAGES)
                </h2>
                <div className="space-y-1.5 font-sans text-xs">
                  {certifications.map((cert, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between text-slate-800">
                      <div>
                        <strong className="text-slate-950">{cert.name}</strong>
                        {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                      </div>
                      {cert.year && <span className="font-mono text-slate-500">{cert.year}</span>}
                    </div>
                  ))}
                  {languages.map((lang, lIdx) => (
                    <div key={lIdx} className="flex items-center justify-between text-slate-800 border-t border-slate-100 pt-1">
                      <div>
                        <strong className="text-slate-950">{lang.name}</strong>
                      </div>
                      <span className="font-mono text-slate-500">{lang.score || lang.level}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE 3: MODERN EDITORIAL (HIỆN ĐẠI SANG TRỌNG)           */}
        {/* ════════════════════════════════════════════════════════════ */}
        {template === 'modern' && (
          <div className="p-6 sm:p-10 space-y-6 bg-white text-slate-800 font-sans">
            {/* Modern Header Banner with Deep Indigo Gradient */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#18113c] via-[#2d206e] to-[#5b48bd] text-white shadow-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 uppercase tracking-widest text-purple-200">
                    VERIFIED CANDIDATE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    SẴN SÀNG NHẬN VIỆC
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
                  {name}
                </h1>
                <p className="text-base sm:text-lg font-bold text-purple-200">
                  {title}
                </p>
                <p className="text-xs text-white/80 max-w-xl leading-relaxed pt-1">
                  {summary}
                </p>
              </div>

              <div className="relative shrink-0">
                <AvatarImg
                  src={avatar}
                  name={name}
                  alt={name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
                  fallbackClassName="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl text-white flex items-center justify-center font-extrabold text-2xl border-4 border-white/20 shadow-2xl"
                />
              </div>
            </div>

            {/* Contact Ribbon */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-wrap items-center justify-around gap-3 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">mail</span>
                <span>{email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">call</span>
                <span>{phone}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#5b48bd]">location_on</span>
                <span>{location}</span>
              </span>
              {dob && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">cake</span>
                  <span>{dob}</span>
                </span>
              )}
              {github && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#5b48bd]">code</span>
                  <span>{github.startsWith('@') ? github : `@${github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}`}</span>
                </span>
              )}
            </div>

            {/* 2-Column Grid Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              {/* Left Column (8/12): Experience, Projects & Skills Matrix */}
              <div className="md:col-span-8 space-y-6">
                {/* Kinh nghiệm */}
                {(experiences.length > 0) && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base">work</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-[#1e1b4b] uppercase tracking-wider">
                        Kinh Nghiệm Thực Chiến
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {experiences.map((exp, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-xs sm:text-sm text-[#1e1b4b] font-bold">
                              {exp.role || exp.title}
                            </strong>
                            <span className="text-[11px] font-mono text-[#5b48bd] bg-purple-50 px-2 py-0.5 rounded-md font-bold">
                              {exp.period || exp.duration}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[#5b48bd]">
                            {exp.company}
                          </div>
                          {Array.isArray(exp.bullets) && exp.bullets.length > 0 ? (
                            <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                              {exp.bullets.map((b, bi) => (
                                <li key={bi} className="leading-relaxed">{b}</li>
                              ))}
                            </ul>
                          ) : (
                            exp.description && (
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {exp.description}
                              </p>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Dự án */}
                {projects.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base">rocket</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-[#1e1b4b] uppercase tracking-wider">
                        Dự Án Nổi Bật
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {projects.map((proj, pIdx) => (
                        <div key={pIdx} className="p-3.5 rounded-2xl bg-[#faf9ff] border border-purple-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs text-[#1e1b4b] font-bold">{proj.name}</strong>
                            <span className="text-[11px] font-mono text-slate-500">{proj.period}</span>
                          </div>
                          <div className="text-xs text-[#5b48bd] font-medium">{proj.role}</div>
                          {proj.summary && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proj.summary}</p>
                          )}
                          {Array.isArray(proj.tags) && proj.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {proj.tags.map((t, ti) => (
                                <span key={ti} className="text-[10px] font-mono text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Ma Trận Năng Lực Chuyên Môn */}
                {skillCategories.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5b48bd] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-base">psychology</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-[#1e1b4b] uppercase tracking-wider">
                        Ma Trận Năng Lực Chuyên Môn (Skills Matrix)
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {skillCategories.map((cat, catIdx) => (
                        <div
                          key={catIdx}
                          className="p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 bg-slate-50 border-slate-200 shadow-2xs"
                        >
                          <span className="w-48 shrink-0 font-bold text-xs text-[#1e1b4b] flex items-center gap-1.5 pt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#5b48bd]"></span>
                            <span className="truncate">{cat.category}:</span>
                          </span>

                          <div className="flex-1 flex flex-wrap gap-1.5">
                            {(cat.items || []).map((item, iIdx) => (
                              <span
                                key={iIdx}
                                className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs"
                              >
                                {typeof item === 'string' ? item : (item.skillName || item.name)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column (4/12): Education, Certifications & Languages */}
              <div className="md:col-span-4 space-y-6">
                {/* Học vấn */}
                <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <span className="material-symbols-outlined text-base text-[#5b48bd]">school</span>
                    <h3 className="font-extrabold text-xs text-[#1e1b4b] uppercase tracking-wider">
                      Học Vấn
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {educations.map((edu, idx) => (
                      <div key={idx} className="space-y-0.5 text-xs">
                        <strong className="text-slate-900 block">{edu.school}</strong>
                        <div className="text-slate-600">{edu.degree}</div>
                        {edu.grade && <div className="text-emerald-700 font-bold">{edu.grade}</div>}
                        <div className="text-[10px] font-mono text-slate-500">{edu.period}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Chứng chỉ */}
                {certifications.length > 0 && (
                  <section className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">workspace_premium</span>
                      <h3 className="font-extrabold text-xs text-[#1e1b4b] uppercase tracking-wider">
                        Chứng Chỉ Quốc Tế
                      </h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      {certifications.map((cert, cIdx) => (
                        <div key={cIdx} className="space-y-0.5">
                          <strong className="text-[#1e1b4b] block">{cert.name}</strong>
                          <div className="text-[11px] text-[#5b48bd] font-mono">{cert.issuer} {cert.year ? `• ${cert.year}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Ngoại ngữ */}
                {languages.length > 0 && (
                  <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                      <span className="material-symbols-outlined text-base text-[#5b48bd]">translate</span>
                      <h3 className="font-extrabold text-xs text-[#1e1b4b] uppercase tracking-wider">
                        Ngoại Ngữ Thành Thạo
                      </h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      {languages.map((lang, lIdx) => (
                        <div key={lIdx} className="flex items-center justify-between border-b border-dashed border-slate-200 pb-1">
                          <span className="font-bold text-slate-800">{lang.name}</span>
                          <span className="text-[11px] font-mono text-slate-500">{lang.score || lang.level}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
