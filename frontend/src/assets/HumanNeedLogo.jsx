import React from 'react';

export const HumanNeedIcon = ({ className = "w-9 h-9" }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#14213D" />
    {/* Left Pillar */}
    <rect x="12" y="13" width="6" height="22" rx="3" fill="#FFFFFF" />
    {/* Right Pillar */}
    <rect x="30" y="13" width="6" height="22" rx="3" fill="#2563EB" />
    {/* Center Bar */}
    <rect x="16" y="21" width="16" height="6" rx="2" fill="#FFFFFF" />
    {/* Bag Handle Arc in Soft Orange */}
    <path
      d="M 19 13 C 19 8, 29 8, 29 13"
      stroke="#F59E0B"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Subtle Shopping Smile Curve */}
    <path
      d="M 16 38 C 21 42, 27 42, 32 38"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

export const HumanNeedLogo = ({
  showTagline = true,
  className = "",
  variant = "dark", // "dark" (for white/light background) or "light" (for navy navbar)
  size = "normal", // "small", "normal", "large"
}) => {
  const isDark = variant === "dark";
  const iconSize = size === "small" ? "w-7 h-7" : size === "large" ? "w-12 h-12" : "w-10 h-10";
  const titleSize = size === "small" ? "text-lg" : size === "large" ? "text-2xl" : "text-xl";
  const taglineSize = size === "small" ? "text-[10px]" : "text-xs";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <HumanNeedIcon className={iconSize} />
      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight leading-none ${titleSize}`}>
          <span className={isDark ? "text-brand-navy" : "text-white"}>Human</span>
          <span className="text-brand-royal">Need</span>
          <span className="text-brand-orange ml-0.5">.</span>
        </div>
        {showTagline && (
          <span
            className={`font-medium tracking-tight mt-0.5 ${taglineSize} ${
              isDark ? "text-brand-muted" : "text-slate-300"
            }`}
          >
            Everything You Need, All in One Place
          </span>
        )}
      </div>
    </div>
  );
};

export default HumanNeedLogo;
