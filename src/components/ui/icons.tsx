"use client";

import React from "react";

export const Icons = {
  Spinner: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  
  Crown: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),

  Silver: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#1a1a1a" fontWeight="bold">2</text>
    </svg>
  ),

  Bronze: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#1a1a1a" fontWeight="bold">3</text>
    </svg>
  ),

  Trophy: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <path d="M8 21h8M12 17v4M17 4H7a1 1 0 0 0-1 1v4a6 6 0 1 0 12 0V5a1 1 0 0 0-1-1Z" />
      <path d="M6 9H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h3M18 9h2a2 2 0 0 0 2-2V6a1 1 0 0 0-1-1h-3" />
    </svg>
  ),
};









