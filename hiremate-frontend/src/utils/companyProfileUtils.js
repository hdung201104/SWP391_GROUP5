import { resolveCompanyLogo, resolveCompanyCover, sanitizeMediaUrl } from './mediaUtils';

export const FALLBACK_COVER_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80';

export const FALLBACK_WORKPLACE_IMAGE =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80';

export const DEFAULT_WORKPLACE_PHOTOS = [
  {
    title: 'Khuôn viên xanh & Không gian làm việc sinh thái',
    desc: 'Môi trường làm việc mở, hài hòa thiên nhiên với cảnh quan cây xanh và không gian thư giãn sinh thái.',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Không gian làm việc sáng tạo Open Workspace',
    desc: 'Trang bị bàn làm việc công thái học, ánh sáng tự nhiên và thiết bị máy trạm hiệu năng cao.',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Pantry, Coffee Lounge & Không gian trao đổi ý tưởng',
    desc: 'Khu vực giải lao tiện nghi với đồ uống miễn phí, trà, cà phê và quầy ăn nhẹ.',
    url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Khu thể thao, Bể bơi vô cực & Tiện ích nội khu',
    desc: 'Sân bóng đá cỏ nhân tạo, phòng gym đa năng, bể bơi giải tỏa căng thẳng sau giờ làm việc.',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_COMPANY_BENEFITS = [
  {
    icon: 'savings',
    title: 'Thưởng hiệu suất & Tháng 13, 14, 15',
    desc: 'Chính sách đãi ngộ cạnh tranh, xét tăng lương 2 lần/năm, gói thưởng theo kết quả kinh doanh dự án hấp dẫn.',
  },
  {
    icon: 'health_and_safety',
    title: 'Bảo hiểm sức khỏe cao cấp & Bảo lãnh người thân',
    desc: 'Gói chăm sóc sức khỏe toàn diện hạn mức cao (nội trú, ngoại trú, nha khoa) cho nhân viên và bảo lãnh người thân tại các bệnh viện quốc tế.',
  },
  {
    icon: 'laptop_mac',
    title: 'Chế độ Hybrid & Thiết bị xịn',
    desc: 'Linh hoạt làm việc tại nhà 2 ngày/tuần. Trang bị MacBook Pro hoặc laptop cấu hình cao, màn hình chuyên dụng cho kỹ sư.',
  },
  {
    icon: 'workspace_premium',
    title: 'Tài trợ 100% chứng chỉ quốc tế',
    desc: 'Hỗ trợ toàn bộ chi phí thi các chứng chỉ AWS, GCP, Azure, CKA, PMP và thưởng nóng cho nhân sự đạt thành tích xuất sắc.',
  },
  {
    icon: 'directions_bus',
    title: 'Tuyến xe đưa đón & Trợ cấp di chuyển',
    desc: 'Hỗ trợ các chuyến xe đưa đón nhân viên thuận tiện tại các điểm chính hoặc trợ cấp chi phí đi lại.',
  },
  {
    icon: 'fitness_center',
    title: 'Tiện ích thể thao & Thư giãn nội khu',
    desc: 'Khu vực Pantry giải lao tiện nghi với đồ uống miễn phí, phòng Gym, câu lạc bộ thể thao và teambuilding định kỳ.',
  },
];

export const DEFAULT_COMPANY_CULTURE = [
  {
    icon: 'diversity_3',
    title: 'Minh bạch & Trao quyền',
    desc: 'Khuyến khích trao đổi cởi mở, tôn trọng ý kiến đa chiều và trao quyền chủ động trong công việc.',
  },
  {
    icon: 'lightbulb',
    title: 'Đổi mới & Học hỏi liên tục',
    desc: 'Tech talk định kỳ, thư viện học liệu phong phú và ngân sách đào tạo nâng cao chuyên môn hằng năm.',
  },
  {
    icon: 'balance',
    title: 'Cân bằng công việc & Đời sống',
    desc: 'Giờ làm việc linh hoạt theo hiệu suất, trân trọng sức khỏe tinh thần và thời gian bên gia đình.',
  },
  {
    icon: 'handshake',
    title: 'Đồng hành & Phát triển sự nghiệp',
    desc: 'Chương trình mentoring 1-1 cùng các Senior/Lead và lộ trình thăng tiến rõ ràng 2 kỳ/năm.',
  },
];

export function formatCompanyDisplayName(name) {
  if (!name) return 'Doanh Nghiệp Tuyển Dụng';
  return String(name).trim().replace(/\b\w/g, (l) => l.toUpperCase());
}

export function isMetadataBranchItem(item) {
  return Boolean(
    item &&
      typeof item === 'object' &&
      (item.isMetadata || item.__companyMeta || item.id === 'company-extended-metadata')
  );
}

function safeParseArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function readScopedJson(compId, keyPrefix) {
  if (!compId) return null;
  try {
    const raw = localStorage.getItem(`${keyPrefix}_${compId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function extractBranchesAndMeta(comp) {
  if (!comp || typeof comp !== 'object') {
    return { branches: [], extendedMeta: null };
  }

  const fromJson = safeParseArray(comp.branchesJson);
  const fromProp = safeParseArray(comp.branches);
  const combined = fromJson.length > 0 ? fromJson : fromProp;

  const extendedMeta =
    fromJson.find(isMetadataBranchItem) ||
    fromProp.find(isMetadataBranchItem) ||
    null;

  const rawBranches = (fromProp.length > 0 ? fromProp : fromJson).filter(
    (item) => item && typeof item === 'object' && !isMetadataBranchItem(item)
  );

  // Deduplicate by branchName + address if branches came through multiple sources
  const seen = new Set();
  const branches = rawBranches.filter((b) => {
    const key = `${String(b.branchName || b.name || '').trim().toLowerCase()}|${String(b.address || '').trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (branches.length === 0 && comp.address) {
    branches.push({
      branchId: `branch-main-${comp.companyId || comp.id || 'hq'}`,
      branchName: 'Trụ sở chính',
      address: comp.address,
      scale: comp.companySize || '50-100 nhân sự',
      hotline: '',
      isHeadquarters: true,
    });
  }

  return { branches, extendedMeta };
}

export function getSmartCompanyIndustry(company) {
  if (company?.industry && String(company.industry).trim()) return company.industry.trim();
  const name = String(company?.companyName || '').toLowerCase();
  if (name.includes('vng')) return 'Internet, FinTech, Cloud & AI Ecosystem';
  if (name.includes('digital') || name.includes('transformation')) return 'Chuyển Đổi Số & Giải Pháp AI Doanh Nghiệp';
  if (name.includes('đa quốc gia')) return 'Tập Đoàn Đa Quốc Gia & Global Tech';
  if (name.includes('fpt')) return 'Công Nghệ Thông Tin & Phần Mềm';
  return 'Công Nghệ Thông Tin & Giải Pháp Số';
}

export function getSmartCompanySize(company) {
  if (company?.companySize && String(company.companySize).trim()) return company.companySize.trim();
  const name = String(company?.companyName || '').toLowerCase();
  if (name.includes('vng')) return '5,000+ nhân viên';
  if (name.includes('fpt software')) return '10,000+ nhân sự';
  if (name.includes('transformation')) return '500 - 1,000 nhân viên';
  if (name.includes('đa quốc gia')) return '1,000 - 5,000 nhân sự';
  return '500+ nhân sự';
}

export function getSmartCompanyDescription(company) {
  if (company?.description && String(company.description).trim()) return company.description.trim();
  const name = String(company?.companyName || '').toLowerCase();
  if (name.includes('transformation')) {
    return 'Đơn vị tiên phong triển khai giải pháp Chuyển đổi số, kiến trúc Cloud và AI toàn diện cho các tổ chức quy mô lớn.';
  }
  if (name.includes('đa quốc gia')) {
    return 'Tập đoàn công nghệ đa quốc gia hàng đầu, triển khai các dự án phần mềm quy mô toàn cầu với môi trường làm việc chuẩn quốc tế.';
  }
  return 'Tập đoàn công nghệ đối tác chiến lược của HireMate AI, cung cấp môi trường làm việc chuyên nghiệp, hiện đại và cơ hội phát triển sự nghiệp bền vững.';
}

export function normalizeCompanyProfile(comp) {
  if (!comp || typeof comp !== 'object') return null;

  const compId = comp.companyId || comp.id || comp.rawId || null;
  const companyName = comp.companyName || comp.name || 'Doanh nghiệp';
  const { branches, extendedMeta } = extractBranchesAndMeta(comp);

  let savedCover = null;
  if (compId) {
    try {
      savedCover = sanitizeMediaUrl(localStorage.getItem(`hiremate_company_cover_${compId}`));
    } catch {}
  }

  const coverUrl =
    sanitizeMediaUrl(extendedMeta?.coverUrl) ||
    sanitizeMediaUrl(comp.coverUrl) ||
    savedCover ||
    resolveCompanyCover(companyName);

  const logoUrl = resolveCompanyLogo(companyName, comp.logoUrl);

  // Resolve workplace photos
  const metaPhotos = Array.isArray(extendedMeta?.workplacePhotos)
    ? extendedMeta.workplacePhotos.filter((p) => p?.url && sanitizeMediaUrl(p.url))
    : [];
  const jsonPhotos = safeParseArray(comp.workplacePhotosJson).filter((p) => p?.url && sanitizeMediaUrl(p.url));
  const propPhotos = Array.isArray(comp.photos) ? comp.photos.filter((p) => p?.url && sanitizeMediaUrl(p.url)) : [];
  const lsPhotos = safeParseArray(readScopedJson(compId, 'hiremate_workplace_photos')).filter(
    (p) => p?.url && sanitizeMediaUrl(p.url)
  );

  const workplacePhotos =
    propPhotos.length > 0
      ? propPhotos
      : metaPhotos.length > 0
      ? metaPhotos
      : jsonPhotos.length > 0
      ? jsonPhotos
      : lsPhotos.length > 0
      ? lsPhotos
      : DEFAULT_WORKPLACE_PHOTOS;

  // Resolve benefits
  const propBenefits = safeParseArray(comp.benefits);
  const jsonBenefits = safeParseArray(comp.benefitsJson);
  const metaBenefits = safeParseArray(extendedMeta?.companyBenefits);
  const lsBenefits = safeParseArray(readScopedJson(compId, 'hiremate_company_benefits'));

  const rawBenefits =
    propBenefits.length > 0
      ? propBenefits
      : jsonBenefits.length > 0
      ? jsonBenefits
      : metaBenefits.length > 0
      ? metaBenefits
      : lsBenefits.length > 0
      ? lsBenefits
      : DEFAULT_COMPANY_BENEFITS;

  const benefits = rawBenefits.map((b, idx) =>
    typeof b === 'string'
      ? { icon: 'check_circle', title: b, desc: '' }
      : {
          icon: b.icon || DEFAULT_COMPANY_BENEFITS[idx % DEFAULT_COMPANY_BENEFITS.length]?.icon || 'star',
          title: b.title || b.name || 'Phúc lợi nhân sự',
          desc: b.desc || b.description || '',
        }
  );

  // Resolve culture
  const propCulture = safeParseArray(comp.culture);
  const metaCulture = safeParseArray(extendedMeta?.companyCulture);
  const lsCulture = safeParseArray(readScopedJson(compId, 'hiremate_company_culture'));
  const culture =
    propCulture.length > 0
      ? propCulture
      : metaCulture.length > 0
      ? metaCulture
      : lsCulture.length > 0
      ? lsCulture
      : DEFAULT_COMPANY_CULTURE;

  // Locations list combining job locations & branch cities
  const jobLocs = Array.isArray(comp.locations) ? comp.locations.filter(Boolean) : [];
  const branchLocs = branches.map((b) => b.address).filter(Boolean);
  const mergedLocations = [...new Set([...jobLocs, ...branchLocs])];
  const locations =
    mergedLocations.length > 0
      ? mergedLocations
      : comp.address
      ? [comp.address]
      : ['Toàn quốc'];

  const hrTeam = Array.isArray(comp.teamMembers) && comp.teamMembers.length > 0
    ? comp.teamMembers
    : Array.isArray(comp.hrTeam)
    ? comp.hrTeam
    : [];

  return {
    ...comp,
    companyId: compId,
    companyName,
    displayName: formatCompanyDisplayName(companyName),
    logoUrl,
    coverUrl,
    industry: getSmartCompanyIndustry(comp),
    companySize: getSmartCompanySize(comp),
    description: getSmartCompanyDescription(comp),
    tagline: extendedMeta?.tagline || comp.tagline || '',
    establishedYear: extendedMeta?.establishedYear || comp.establishedYear || '',
    markets: extendedMeta?.markets || comp.markets || '',
    branches,
    locations,
    workplacePhotos,
    benefits,
    culture,
    hrTeam,
    teamMembers: hrTeam,
  };
}

export function saveCompanyPreviewCache(companyId, data, { authoritative = false } = {}) {
  if (!companyId || !data || typeof data !== 'object') return;
  const key = `hiremate_company_preview_${companyId}`;
  try {
    let existing = {};
    if (!authoritative) {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') existing = parsed;
      }
    }
    const merged = { ...existing };
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v) && v.length === 0 && Array.isArray(existing[k]) && existing[k].length > 0) continue;
      merged[k] = v;
    }
    sessionStorage.setItem(key, JSON.stringify(merged));
  } catch {}
}
