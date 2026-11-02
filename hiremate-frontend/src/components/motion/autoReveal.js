import { useLayoutEffect } from 'react';

/**
 * ==============================================================================
 * AUTO REVEAL ENGINE
 * ==============================================================================
 * Áp dụng hiệu ứng "Staggered Content Reveal + Scroll Reveal" thống nhất cho MỌI trang
 * mà không phải sửa từng file page (nhiều page > 100KB).
 *
 * Nguyên tắc:
 *  - Chỉ animate opacity + translate + scale (GPU, không gây layout shift).
 *  - Mỗi phần tử chỉ reveal MỘT lần khi vào viewport (không chạy lại khi cuộn lên/xuống).
 *  - Phần tử cùng xuất hiện trong một đợt được stagger theo thứ tự trên màn hình.
 *  - Nội dung tải muộn từ API (MutationObserver) cũng được reveal.
 *  - Sau khi xong, dọn sạch class/style -> không ảnh hưởng hover/transform của component.
 *  - Bỏ qua modal/overlay/absolute/fixed, nút, input, phần tử nhỏ.
 *  - Tôn trọng prefers-reduced-motion.
 */

const CANDIDATE_SELECTOR = '[data-reveal],.hm-reveal';

const SKIP_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'OPTION', 'SVG', 'IMG', 'TR', 'TD', 'TH']);
const MAX_CANDIDATES = 400;
const STAGGER_MS = 70;
const MAX_STAGGER_MS = 490;
const BASE_DELAY_FIRST_BATCH_MS = 140;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isEligible(el, rect) {
  if (!el || el.nodeType !== 1) return false;
  if (el.dataset.hm) return false;
  if (SKIP_TAGS.has(el.tagName.toUpperCase())) return false;
  if (el.hasAttribute('data-hm-skip')) return false;
  if (el.closest('[data-hm-skip],[role="dialog"],[aria-modal="true"],.fixed')) return false;
  if (el.style && el.style.opacity !== '') return false; // đã được framer-motion điều khiển
  if (rect.height < 56 || rect.width < 160) return false;
  const cs = window.getComputedStyle(el);
  if (cs.position === 'fixed' || cs.position === 'absolute' || cs.position === 'sticky') return false;
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  return true;
}

function pickTargets(root) {
  const nodes = Array.from(root.querySelectorAll(CANDIDATE_SELECTOR)).slice(0, MAX_CANDIDATES * 2);
  const candidates = [];
  for (const el of nodes) {
    if (el.closest('[data-hm]')) continue; // đã nằm trong phần tử được reveal
    const rect = el.getBoundingClientRect();
    if (isEligible(el, rect)) candidates.push(el);
    if (candidates.length >= MAX_CANDIDATES) break;
  }
  // Bỏ container bao quanh >= 2 candidate khác (để con được stagger riêng)
  const leaves = candidates.filter((c) => {
    let inner = 0;
    for (const o of candidates) {
      if (o !== c && c.contains(o)) {
        inner += 1;
        if (inner >= 2) return false;
      }
    }
    return true;
  });
  // Chỉ giữ phần tử ngoài cùng nếu lồng nhau
  const chosen = [];
  for (const el of leaves) {
    if (chosen.some((p) => p.contains(el))) continue;
    chosen.push(el);
  }
  return chosen;
}

function cleanup(el) {
  el.classList.remove('hm-pre', 'hm-in');
  el.style.removeProperty('--hm-delay');
  el.querySelectorAll('.hm-sharpen').forEach((i) => i.classList.remove('hm-sharpen'));
}

export function setupAutoReveal(root) {
  if (!root || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    return () => {};
  }

  const mountedAt = performance.now();
  let firstBatch = true;
  const timers = new Set();

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      if (!visible.length) return;
      const base = firstBatch ? BASE_DELAY_FIRST_BATCH_MS : 0;
      firstBatch = false;
      visible.forEach((entry, i) => {
        const el = entry.target;
        io.unobserve(el);
        const delay = base + Math.min(i * STAGGER_MS, MAX_STAGGER_MS);
        el.style.setProperty('--hm-delay', `${delay}ms`);
        // đọc layout xong mới ghi class để tránh thrash
        requestAnimationFrame(() => {
          el.classList.add('hm-in');
          el.querySelectorAll('img,canvas').forEach((m, k) => {
            if (k < 40) m.classList.add('hm-sharpen');
          });
          const t = setTimeout(() => {
            cleanup(el);
            timers.delete(t);
          }, delay + 1000);
          timers.add(t);
        });
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -4% 0px' }
  );

  const scan = () => {
    const targets = pickTargets(root);
    targets.forEach((el) => {
      el.dataset.hm = '1';
      el.classList.add('hm-pre');
      io.observe(el);
    });
  };

  // Pop-in cho dropdown / modal được mở SAU khi trang đã ổn định
  const enhanceLate = (node) => {
    if (node.nodeType !== 1 || performance.now() - mountedAt < 600) return;
    const cls = node.classList;
    if (cls.contains('fixed') && cls.contains('inset-0') && node.style.opacity === '') {
      cls.add('hm-overlay');
      const panel = node.querySelector(
        '[class*="rounded-2xl"],[class*="rounded-3xl"],[class*="rounded-[2"],[class*="rounded-[3"],[class*="rounded-xl"]'
      );
      if (panel && panel.style.opacity === '') panel.classList.add('hm-modal');
      return;
    }
    const cs = window.getComputedStyle(node);
    if (
      cs.position === 'absolute' &&
      (cls.contains('shadow-xl') || cls.contains('shadow-2xl') || cls.contains('shadow-lg') || /shadow-\[/.test(node.className || '')) &&
      /rounded/.test(node.className || '') &&
      node.style.opacity === ''
    ) {
      cls.add('hm-pop');
    }
  };

  let rafId = 0;
  const mo = new MutationObserver((mutations) => {
    let added = false;
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) {
          added = true;
          enhanceLate(n);
        }
      });
    }
    if (!added || rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      scan();
    });
  });

  scan();
  mo.observe(root, { childList: true, subtree: true });

  return () => {
    mo.disconnect();
    io.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
  };
}

/** Hook gắn vào wrapper của trang: useAutoReveal(ref) */
export function useAutoReveal(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    return setupAutoReveal(el);
  }, [ref]);
}
