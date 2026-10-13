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
