import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal:
 * Teleports modals and dialogs directly to document.body.
 * This guarantees modals are never trapped or displaced by parent containers
 * having CSS transform, filter, backdrop-filter, or overflow-hidden.
 * Also locks body scroll when modal is active.
 */
export default function ModalPortal({ children, isOpen = true }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll while modal is visible
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  return createPortal(children, document.body);
}
