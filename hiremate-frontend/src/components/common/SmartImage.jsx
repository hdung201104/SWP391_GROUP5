import React, { useEffect, useState } from 'react';
import {
  getAvatarGradient,
  getNameInitials,
  resolveCompanyLogo,
  resolveUserAvatar,
} from '../../utils/mediaUtils';

/**
 * Resilient Avatar component:
 * - Sanitizes stale /uploads/, blob:, or invalid URLs
 * - Resets error state when src changes
 * - Adds referrerPolicy="no-referrer" for OAuth avatars (Google / GitHub)
 * - Gracefully falls back to deterministic gradient initials with zero broken img icons
 */
export function AvatarImg({
  src,
  name = '',
  alt,
  className = 'w-10 h-10 rounded-full object-cover',
  fallbackClassName = 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0',
  textSizeClass = '',
  showIconOnFallback = false,
}) {
  const safeUrl = resolveUserAvatar(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [safeUrl]);

  if (safeUrl && !hasError) {
    return (
      <img
        src={safeUrl}
        alt={alt || name || 'Avatar'}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  const initials = getNameInitials(name || 'UV', 2);
  const gradient = getAvatarGradient(name || 'HireMate');
  return (
    <div
      className={`bg-gradient-to-br ${gradient} ${fallbackClassName} ${textSizeClass}`}
      aria-label={alt || name || 'Avatar'}
      title={name || undefined}
    >
      {showIconOnFallback ? (
        <span className="material-symbols-outlined text-lg">person</span>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/**
 * Resilient Company Logo component:
 * - Always prioritizes Cloudinary logoUrl, otherwise resolves verified official brand logo from Cloudinary CDN
 * - Resets error state cleanly on company change
 * - Falls back to clean monogram initials inside consistent rounded container
 */
export function CompanyLogoImg({
  src,
  companyName = '',
  alt,
  className = 'w-full h-full object-contain',
  fallbackClassName = 'w-full h-full flex items-center justify-center font-black text-[#5b48bd]',
  maxInitials = 3,
}) {
  const safeUrl = resolveCompanyLogo(companyName, src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [safeUrl]);

  if (safeUrl && !hasError) {
    return (
      <img
        src={safeUrl}
        alt={alt || companyName || 'Company Logo'}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  const initials = getNameInitials(companyName || 'ENT', maxInitials);
  return <span className={fallbackClassName}>{initials}</span>;
}

