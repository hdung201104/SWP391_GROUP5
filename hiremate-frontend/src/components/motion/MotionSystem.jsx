import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig, useInView, useReducedMotion } from 'framer-motion';
import { useAutoReveal } from './autoReveal';
import { consumeSharedOrigin, buildSharedInitial, clearSharedOrigin } from './sharedElement';

/**
 * ==============================================================================
 * HIREMATE AI - PREMIUM GLASSY DASHBOARD V2 & CINEMATIC MOTION SYSTEM
 * ==============================================================================
 * Reusable motion primitives for:
 * 1. Cinematic Page Transitions (Fade, Slide, Scale, Blur-to-Sharp)
 * 2. Staggered Content Reveal (Orchestrated container & items)
 * 3. Glassmorphism V2 Cards & Panels (Specular reflection, backdrop blur, hover lift)
 * 4. Micro Interactions (Tactile buttons, tabs, modals, badges)
 */

// Global Spring Physics Constants
export const SPRING_SMOOTH = { type: 'spring', stiffness: 280, damping: 26 };
export const SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 20 };
export const EASE_CINEMATIC = [0.16, 1, 0.3, 1]; // Custom cubic-bezier for silky deceleration

/**
 * 0. MotionProvider:
 * Bao toàn ứng dụng. reducedMotion="user" => framer-motion tự tắt transform/layout animation
 * khi hệ điều hành bật prefers-reduced-motion (chỉ giữ opacity).
 */
export function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * 1. PageTransition:
 * Wraps entire page routes. Trình tự: trang cũ fade-out mềm (AnimatePresence mode="wait")
 * -> trang mới fade + slide-up + scale nhẹ -> nội dung từng khối reveal (autoReveal).
 *
 * LƯU Ý: KHÔNG animate `filter` ở cấp trang. `filter` (kể cả blur(0px)) tạo containing block
 * làm hỏng position:fixed (modal) và sticky bên trong trang. Blur->Sharp chỉ áp cho ảnh/biểu đồ.
 */
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 18, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: EASE_CINEMATIC },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.995,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const SHARED_SPRING = { type: 'spring', stiffness: 210, damping: 26, mass: 0.9 };

export function PageTransition({ children, className = '', routeKey = '', ...props }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  // Job Card -> Job Detail: trang chi tiết bụng ra từ vị trí card vừa click
  const [sharedInitial] = useState(() =>
    /#\/jobs?\/\d+/i.test(routeKey) ? buildSharedInitial(consumeSharedOrigin()) : null
  );
  useEffect(() => {
    const t = setTimeout(clearSharedOrigin, 1200);
    return () => clearTimeout(t);
  }, []);

  useAutoReveal(ref);

  const useShared = !!sharedInitial && !reduce;
  return (
    <motion.div
      ref={ref}
      variants={pageTransitionVariants}
      initial={useShared ? sharedInitial : 'initial'}
      animate={useShared ? { opacity: 1, x: 0, y: 0, scale: 1, transition: SHARED_SPRING } : 'animate'}
      exit="exit"
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 2. StaggerContainer:
 * Orchestrates child items to appear one by one sequentially with custom delays.
 */
export const containerStaggerVariants = {
  hidden: { opacity: 0 },
  visible: (custom = { stagger: 0.07, delay: 0.05 }) => ({
    opacity: 1,
    transition: {
      delayChildren: custom.delay || 0.05,
      staggerChildren: custom.stagger || 0.07,
    },
  }),
};

export function StaggerContainer({
  children,
  stagger = 0.07,
  delay = 0.05,
  className = '',
  as = 'div',
  ...props
}) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      variants={containerStaggerVariants}
      initial="hidden"
      animate="visible"
      custom={{ stagger, delay }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * 3. StaggerItem:
 * Individual child inside StaggerContainer. Smoothly slides up, scales from 0.97, and blurs to sharp.
 */
export const itemFadeUpVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: EASE_CINEMATIC,
    },
  },
};

export function StaggerItem({ children, className = '', as = 'div', ...props }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      variants={itemFadeUpVariants}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * 4. GlassCard:
 * Premium Glassmorphism V2 card with:
 * - Frosted backdrop blur
 * - 1px specular white gradient border
 * - Light reflection sheen
 * - Hover lift + multi-tiered shadow glow
 */
export function GlassCard({
  children,
  className = '',
  variant = 'light', // 'light' | 'dark' | 'emerald' | 'purple'
  hoverEffect = true,
  onClick,
  ...props
}) {
  const baseClasses = 'relative rounded-3xl transition-colors duration-300 overflow-hidden';
  
  let variantStyles = '';
  if (variant === 'light') {
    variantStyles = 'bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_10px_35px_-5px_rgba(59,43,142,0.08)]';
  } else if (variant === 'dark') {
    variantStyles = 'bg-[#1e1458]/70 backdrop-blur-xl border border-white/15 text-white shadow-[0_20px_50px_-10px_rgba(15,10,45,0.4)]';
  } else if (variant === 'emerald') {
    variantStyles = 'bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/30 text-emerald-950 shadow-[0_10px_35px_-5px_rgba(16,185,129,0.12)]';
  } else if (variant === 'purple') {
    variantStyles = 'bg-gradient-to-br from-[#5b48bd]/15 via-purple-500/10 to-indigo-500/15 backdrop-blur-xl border border-purple-300/40 shadow-[0_15px_40px_-8px_rgba(91,72,189,0.18)]';
  }

  const hoverMotion = hoverEffect ? {
    whileHover: {
      y: -4,
      scale: 1.008,
      boxShadow: variant === 'dark'
        ? '0 25px 50px -12px rgba(15, 10, 45, 0.6), inset 0 1px 0 rgba(255,255,255,0.25)'
        : '0 25px 50px -12px rgba(59, 43, 142, 0.16), inset 0 1px 0 rgba(255,255,255,0.9)',
      borderColor: variant === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,1)',
      transition: SPRING_SMOOTH,
    },
    whileTap: { scale: 0.99 },
  } : {};

  return (
    <motion.div
      className={`${baseClasses} ${variantStyles} ${className}`}
      onClick={onClick}
      {...hoverMotion}
      {...props}
    >
      {/* Subtle Specular Top Sheen Highlight */}
      <div 
        className="pointer-events-none absolute -top-px left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70"
        aria-hidden="true" 
      />
      {children}
    </motion.div>
  );
}

/**
 * 5. GlassPanel:
 * Larger container for Sidebars, Filter panels, and Tables with multi-layer depth.
 */
export function GlassPanel({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-[0_15px_40px_-10px_rgba(30,20,90,0.07)] relative ${className}`}
      {...props}
    >
      <div 
        className="pointer-events-none absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" 
        aria-hidden="true" 
      />
      {children}
    </div>
  );
}

/**
 * 6. BlurReveal:
 * Sharpens images, charts, or hero graphics from blur(8px) -> blur(0px) with spring scale.
 */
export function BlurReveal({ children, delay = 0.15, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.96 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      transition={{ duration: 0.55, delay, ease: EASE_CINEMATIC }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 7. CinematicTitle:
 * Hero / Page title that slides up with fade and subtle scale.
 */
export function CinematicTitle({ children, subtitle, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, ease: EASE_CINEMATIC }}
      className={`space-y-1.5 ${className}`}
      {...props}
    >
      {children}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: EASE_CINEMATIC }}
          className="text-xs sm:text-sm text-slate-500 font-medium"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

/**
 * 8. InteractiveButton:
 * Tactile motion button with micro-press compression and subtle hover lift.
 */
export function InteractiveButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? {} : { scale: 1.025, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={SPRING_SMOOTH}
      className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * 9. GlassyModal:
 * Fullscreen modal with animated backdrop blur fade and centered modal container spring scale.
 */
export function GlassyModal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  className = '',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0e0928]/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(3px)' }}
            transition={SPRING_SMOOTH}
            className={`relative w-full ${maxWidth} bg-white/90 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(20,10,60,0.3)] my-auto overflow-hidden z-10 ${className}`}
          >
            {/* Top Specular Sheen */}
            <div 
              className="pointer-events-none absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#5b48bd]/40 to-transparent" 
              aria-hidden="true" 
            />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 10. ScrollReveal:
 * Reveals content as it enters viewport without re-triggering repeatedly on scroll.
 */
export function ScrollReveal({
  children,
  className = '',
  threshold = 0.15,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.5, ease: EASE_CINEMATIC }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 11. SlidingTabs:
 * Tab bar với indicator trượt (shared layout, layoutId) đến tab mới bằng spring.
 * tabs: [{ key, label, icon? }]  •  value/onChange: controlled.
 */
export function SlidingTabs({ tabs, value, onChange, className = '', tabClassName = '', activeClassName = 'text-[#5b48bd]', idleClassName = 'text-slate-500 hover:text-slate-800', groupId = 'tabs' }) {
  return (
    <div role="tablist" className={`relative inline-flex items-center gap-1 p-1 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 ${className}`}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange && onChange(t.key)}
            className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-colors ${active ? activeClassName : idleClassName} ${tabClassName}`}
          >
            {active && (
              <motion.span
                layoutId={`${groupId}-indicator`}
                transition={SPRING_SMOOTH}
                className="absolute inset-0 -z-10 rounded-xl bg-white shadow-[0_6px_18px_-6px_rgba(59,43,142,0.25)] border border-white"
              />
            )}
            {t.icon}{t.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 12. Skeleton: shimmer thay cho màn hình trống khi đang tải dữ liệu thật.
 */
export function Skeleton({ className = 'h-4 w-full', rounded = 'rounded-xl' }) {
  return <div aria-hidden="true" className={`hm-skeleton ${rounded} ${className}`} />;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-5 space-y-3 ${className}`} aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12" rounded="rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

/**
 * 13. DropdownPanel: mở bằng Scale + Fade (origin tùy chỉnh), đóng mượt.
 */
export function DropdownPanel({ open, children, className = '', origin = 'top right' }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING_SMOOTH }}
          exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.14 } }}
          style={{ transformOrigin: origin }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 14. InViewStagger: nhóm phần tử reveal lần lượt khi cuộn tới viewport (useInView, once).
 */
export function InViewStagger({ children, className = '', stagger = 0.07, amount = 0.15 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  return (
    <motion.div
      ref={ref}
      variants={containerStaggerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={{ stagger, delay: 0.04 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default {
  PageTransition,
  MotionProvider,
  SlidingTabs,
  Skeleton,
  SkeletonCard,
  DropdownPanel,
  InViewStagger,
  StaggerContainer,
  StaggerItem,
  GlassCard,
  GlassPanel,
  BlurReveal,
  CinematicTitle,
  InteractiveButton,
  GlassyModal,
  ScrollReveal,
  SPRING_SMOOTH,
  SPRING_BOUNCY,
  EASE_CINEMATIC,
};
