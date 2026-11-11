/**
 * Centralized Cloud Media Utilities for HireMate AI.
 * - Filters out dead local paths (/uploads/...), blob:, cdn.haitrieu.com, and Supabase storage URLs.
 * - Resolves verified corporate logos hosted on Cloudinary CDN.
 */

export const CLOUD_COMPANY_LOGOS = {
  fptSoftware: 'https://res.cloudinary.com/mezrtcb7/image/upload/v1794385931/hiremate/logos/fpt-software.png',
  fptDx: 'https://res.cloudinary.com/mezrtcb7/image/upload/v1794385931/hiremate/logos/fpt-dx.png',
  vng: 'https://res.cloudinary.com/mezrtcb7/image/upload/v1794385932/hiremate/logos/vng-corporation.png',
  viettel: 'https://res.cloudinary.com/mezrtcb7/image/upload/v1794385933/hiremate/logos/viettel-group.png',
  mbbank: 'https://res.cloudinary.com/mezrtcb7/image/upload/v1794385934/hiremate/logos/mbbank.png',
  kms: 'https://res.cloudinary.com/mezrtcb7/image/upload/v1794385934/hiremate/logos/kms-technology.png',
};

export function sanitizeMediaUrl(rawUrl, options = {}) {
  const { allowDataUri = false, allowUnsplash = true } = options;
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed === '#' ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined' ||
    trimmed.toLowerCase() === 'n/a'
  ) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('data:image/')) {
    return allowDataUri ? trimmed : null;
  }

  if (
    lower.startsWith('blob:') ||
    lower.startsWith('data:') ||
    lower.startsWith('/uploads/') ||
    lower.startsWith('uploads/') ||
    lower.includes('localhost:') ||
    lower.includes('127.0.0.1') ||
    lower.includes('cdn.haitrieu.com') ||
    lower.includes('supabase.co/storage') ||
    lower.includes('via.placeholder.com') ||
    lower.includes('placeholder.')
  ) {
    return null;
  }

  if (!allowUnsplash && lower.includes('images.unsplash.com')) {
    return null;
  }

  if (lower.startsWith('http://res.cloudinary.com/')) {
    return `https://${trimmed.slice('http://'.length)}`;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

export function matchOfficialCompanyLogo(companyName = '') {
  const norm = String(companyName || '').toLowerCase();
  if (!norm.trim()) return null;

  if (norm.includes('digital transformation') || norm.includes('fpt dx') || norm.includes('fpt digital')) {
    return CLOUD_COMPANY_LOGOS.fptDx;
  }
  if (norm.includes('fpt software') || norm.includes('fsoft') || norm.includes('fpt')) {
    return CLOUD_COMPANY_LOGOS.fptSoftware;
  }
  if (norm.includes('vng')) {
    return CLOUD_COMPANY_LOGOS.vng;
  }
  if (norm.includes('viettel')) {
    return CLOUD_COMPANY_LOGOS.viettel;
  }
  if (norm.includes('mbbank') || norm.includes('mb bank')) {
    return CLOUD_COMPANY_LOGOS.mbbank;
  }
  if (norm.includes('kms')) {
    return CLOUD_COMPANY_LOGOS.kms;
  }
  return null;
}

export function resolveCompanyLogo(companyName = '', logoUrl = null) {
  const cleanUrl = sanitizeMediaUrl(logoUrl, { allowUnsplash: false });
  if (cleanUrl && cleanUrl.includes('res.cloudinary.com')) {
    return cleanUrl;
  }

  const official = matchOfficialCompanyLogo(companyName);
  if (official) {
    return official;
  }

  return cleanUrl;
}

export function resolveCompanyCover(companyName = '') {
  const norm = String(companyName || '').toLowerCase();
  if (norm.includes('fpt')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('viettel')) {
    return 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&auto=format&fit=crop&q=80';
  }
  if (norm.includes('vng')) {
    return 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80';
}

export function resolveUserAvatar(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    return sanitizeMediaUrl(input, { allowDataUri: true });
  }
  const raw =
    input.avatarUrl ||
    input.avatar ||
    input.candidateAvatar ||
    input.candidateAvatarUrl ||
    input.recruiterAvatar ||
    null;
  return sanitizeMediaUrl(raw, { allowDataUri: true });
}

export function getNameInitials(name = '', maxChars = 2) {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'HM';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, maxChars).toUpperCase();
  }
  if (maxChars >= 3) {
    return words.map((w) => w[0]).join('').slice(0, maxChars).toUpperCase();
  }
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-[#5b48bd] to-[#3b2b8e]',
  'from-indigo-600 to-violet-700',
  'from-emerald-600 to-teal-700',
  'from-blue-600 to-indigo-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];

export function getAvatarGradient(seed = '') {
  const s = String(seed || 'HireMate');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

