/**
 * Shared element (Job Card -> Job Detail) helper.
 * Ghi nhớ vị trí card được click; trang chi tiết sẽ "bung" ra từ đúng vị trí đó
 * bằng spring (chỉ transform + opacity). Không phụ thuộc cấu trúc router (hash routing).
 */
let origin = null;
let installed = false;

export function installSharedElementCapture() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target && e.target.closest ? e.target.closest('[data-shared-card]') : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      origin = {
        rect: { left: r.left, top: r.top, width: r.width, height: r.height },
        t: performance.now(),
      };
    },
    true
  );
}

/** Đọc vị trí card đã click nếu còn mới (<2.5s). Không xóa (an toàn với StrictMode). */
export function consumeSharedOrigin() {
  if (!origin || performance.now() - origin.t > 2500) return null;
  return origin.rect;
}

export function clearSharedOrigin() {
  origin = null;
}

/** Tính trạng thái initial (FLIP gần đúng) từ rect của card. */
export function buildSharedInitial(rect) {
  if (!rect || typeof window === 'undefined') return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return {
    opacity: 0,
    x: clamp(cx - vw / 2, -vw * 0.35, vw * 0.35),
    y: clamp(cy - vh * 0.45, -vh * 0.3, vh * 0.3),
    scale: clamp(rect.width / (vw * 0.9), 0.55, 0.95),
  };
}
