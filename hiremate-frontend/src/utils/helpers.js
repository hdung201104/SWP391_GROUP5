/**
 * Utility helpers for HireMate AI frontend.
 */

/**
 * Safely parses a string or array into an array of clean string items.
 * Handles:
 * - null / undefined -> returns fallback
 * - Array of strings -> filters, trims strings, strips bullet points
 * - Comma / newline / bullet-separated string -> splits, trims, strips bullets
 * - Any other type -> fallback
 */
export const parseSkillList = (val, fallback = []) => {
  if (!val) return fallback;
  if (Array.isArray(val)) {
    const list = val
      .map((s) => (typeof s === 'string' ? s.replace(/^[\s\-\u2022]+/, '').trim() : String(s).trim()))
      .filter(Boolean);
    return list.length > 0 ? list : fallback;
  }
  if (typeof val === 'string') {
    const list = val
      .split(/,|\r?\n|\\n/)
      .map((s) => s.replace(/^[\s\-\u2022]+/, '').trim())
      .filter(Boolean);
    return list.length > 0 ? list : fallback;
  }
  return fallback;
};

export const parseStringOrArray = parseSkillList;

/**
 * Parses and sanitizes text that may contain raw JSON array or object
 * (e.g. educationsJson, experiencesJson, projectsJson) into human-readable text.
 */
export const sanitizeEvidenceText = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/(\[\s*\{[\s\S]*\}\s*\]|\{\s*"[\s\S]*"\s*:\s*[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const prefix = trimmed.substring(0, jsonMatch.index).trim();
      if (Array.isArray(parsed)) {
        const items = parsed.map((p) => {
          if (p.school || p.degree || p.major) {
            const parts = [];
            if (p.school) parts.push(p.school);
            if (p.degree || p.major) parts.push(p.degree || p.major);
            if (p.grade) parts.push(`(${p.grade})`);
            if (p.period || p.year) parts.push(`[Niên khóa: ${p.period || p.year}]`);
            return parts.join(' - ');
          }
          if (p.company || p.role) {
            const parts = [];
            if (p.role) parts.push(p.role);
            if (p.company) parts.push(`tại ${p.company}`);
            if (p.duration) parts.push(`(${p.duration})`);
            return parts.join(' ');
          }
          if (p.project_name || p.projectName || p.name) {
            return p.project_name || p.projectName || p.name;
          }
          return Object.values(p).filter((v) => typeof v === 'string' && v.trim()).join(' - ');
        }).filter(Boolean);
        return `${prefix ? prefix + ': ' : ''}${items.join(' | ')}`;
      } else if (typeof parsed === 'object') {
        const parts = Object.entries(parsed)
          .filter(([k, v]) => typeof v === 'string' && v.trim())
          .map(([k, v]) => `${k}: ${v}`);
        return `${prefix ? prefix + ': ' : ''}${parts.join(', ')}`;
      }
    } catch (e) {}
  }
  return trimmed;
};
