import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

/** A cross drawn as a highlighter stroke over a pulse line. */
export function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MediBuddy"
    >
      <rect width="32" height="32" rx="9" fill="#0B5563" />
      <rect x="12.5" y="6" width="7" height="20" rx="2" fill="#F6D860" />
      <rect x="6" y="12.5" width="20" height="7" rx="2" fill="#F6D860" />
      <path
        d="M4 16h6l2-4 3 9 2.5-7 1.5 2H28"
        stroke="#0B5563"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
