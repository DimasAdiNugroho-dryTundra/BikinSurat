import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = 28,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 relative flex items-center justify-center rounded-lg overflow-hidden shadow-sm select-none ${className}`}
    >
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="45%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>

          <linearGradient id="brandBorderGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#93c5fd" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0" />
          </linearGradient>

          <linearGradient id="brandPaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#f1f5f9" />
          </linearGradient>

          <linearGradient id="brandFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>

          <linearGradient id="brandPenBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa" />
            <stop offset="50%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>

          <linearGradient id="brandPenTipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>

          <linearGradient id="brandSwooshGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2" />
            <stop offset="50%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#60a5fa" />
          </linearGradient>

          <filter id="brandDocShadow" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#090d16" flood-opacity="0.45" />
          </filter>

          <filter id="brandPenShadow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="4" dy="12" stdDeviation="10" flood-color="#020617" flood-opacity="0.35" />
          </filter>
        </defs>

        {/* Squircle Background */}
        <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#brandBgGrad)" />
        <rect x="16" y="16" width="480" height="480" rx="108" fill="none" stroke="url(#brandBorderGlow)" stroke-width="4" />

        {/* Document Sheet */}
        <g filter="url(#brandDocShadow)">
          <path
            d="M 140 100 L 285 100 L 370 185 L 370 400 A 18 18 0 0 1 352 418 L 140 418 A 18 18 0 0 1 122 400 L 122 118 A 18 18 0 0 1 140 100 Z"
            fill="url(#brandPaperGrad)"
          />
          <path d="M 285 100 L 285 170 A 15 15 0 0 0 300 185 L 370 185 Z" fill="url(#brandFoldGrad)" />
          <path d="M 285 185 L 300 185 L 285 170 Z" fill="#64748b" opacity="0.3" />

          {/* Document Lines */}
          <rect x="165" y="152" width="95" height="14" rx="7" fill="#3b82f6" opacity="0.85" />
          <rect x="165" y="215" width="165" height="9" rx="4.5" fill="#94a3b8" opacity="0.75" />
          <rect x="165" y="243" width="145" height="9" rx="4.5" fill="#94a3b8" opacity="0.65" />
          <rect x="165" y="271" width="155" height="9" rx="4.5" fill="#94a3b8" opacity="0.65" />
          <rect x="165" y="299" width="115" height="9" rx="4.5" fill="#94a3b8" opacity="0.55" />
        </g>

        {/* Dynamic Signature Stroke */}
        <path
          d="M 165 372 C 200 360, 240 380, 280 366 C 310 355, 335 348, 355 352"
          fill="none"
          stroke="url(#brandSwooshGrad)"
          stroke-width="8"
          stroke-linecap="round"
        />

        {/* Stylus / Fountain Pen */}
        <g filter="url(#brandPenShadow)" transform="rotate(-38, 360, 310)">
          <rect x="338" y="110" width="34" height="175" rx="12" fill="url(#brandPenBodyGrad)" />
          <rect x="338" y="275" width="34" height="10" fill="#38bdf8" />
          <path d="M 338 285 L 347 335 L 363 335 L 372 285 Z" fill="#1e293b" />
          <path d="M 347 335 L 355 358 L 363 335 Z" fill="url(#brandPenTipGrad)" />
          <line x1="355" y1="337" x2="355" y2="352" stroke="#0f172a" stroke-width="1.5" />
          <rect x="350" y="125" width="10" height="80" rx="4" fill="#93c5fd" opacity="0.9" />
        </g>

        {/* Accent Sparkle */}
        <circle cx="370" cy="185" r="4" fill="#38bdf8" opacity="0.8" />
      </svg>
    </div>
  );
};

