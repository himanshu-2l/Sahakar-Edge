import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

/**
 * Authentic 24-Spoke Ashok Chakra SVG Emblem (15° Spoke Intervals)
 */
export function AshokChakraIcon({
  size = 24,
  color = '#0649a2',
  ...props
}: IconProps) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Outer sovereign ring */}
      <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="0.8" />
      <circle cx="12" cy="12" r="10.2" stroke={color} strokeWidth="0.25" />
      {/* Central hub */}
      <circle cx="12" cy="12" r="1.8" fill={color} />
      <circle cx="12" cy="12" r="0.75" fill="#ffffff" />
      {/* 24 Symmetrical spokes with outer pinheads */}
      {spokes.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 12 12)`}>
          <line x1="12" y1="12" x2="12" y2="1.8" stroke={color} strokeWidth="0.45" />
          <polygon points="11.6,2.2 12.4,2.2 12,1.2" fill={color} />
        </g>
      ))}
    </svg>
  );
}

/**
 * Authentic Bilingual NCCT Crest SVG Emblem
 */
export function NcctEmblemIcon({
  size = 24,
  color = '#0649a2',
  accentColor = '#feb505',
  greenColor = '#1ab452',
  ...props
}: IconProps & { accentColor?: string; greenColor?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="11.2" stroke={color} strokeWidth="0.9" fill="#ffffff" />
      <circle cx="12" cy="12" r="10.2" stroke={accentColor} strokeWidth="0.4" />
      <circle cx="12" cy="11.2" r="4.2" stroke={greenColor} strokeWidth="0.6" fill="#f0fdf4" />
      <path
        d="M7.8 14.2 C7 10 9.5 7.5 12 7 C14.5 7.5 17 10 16.2 14.2 Z"
        fill="none"
        stroke={greenColor}
        strokeWidth="0.5"
      />
      <path
        d="M8.5 13.2 Q12 12.4 12 14.8 Q12 12.4 15.5 13.2 L15.5 15.6 Q12 14.8 12 16.8 Q12 14.8 8.5 15.6 Z"
        fill={color}
      />
      <circle cx="12" cy="4.8" r="1.4" stroke={color} strokeWidth="0.35" />
      <circle cx="12" cy="4.8" r="0.4" fill={color} />
      <path d="M4.5 18.2 L19.5 18.2 L18.3 20.6 L5.7 20.6 Z" fill={color} />
      <line x1="6.5" y1="19.4" x2="17.5" y2="19.4" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />
    </svg>
  );
}

export function MinistryEmblemIcon(props: IconProps) {
  return <NcctEmblemIcon {...props} />;
}

// ---------------------------------------------------------------------------
// MOBILE BOTTOM NAVIGATION TAB ICONS
// ---------------------------------------------------------------------------

export function HomeIcon({ size = 20, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function LearnIcon({ size = 20, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
      <line x1="9" y1="7" x2="16" y2="7" />
      <line x1="9" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function ProgressIcon({ size = 20, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function CredentialsIcon({ size = 20, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function OpportunitiesIcon({ size = 20, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export function ProfileIcon({ size = 20, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DOMAIN ACTIONS & MODAL ICONS
// ---------------------------------------------------------------------------

export function QrCodeIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
      <line x1="17" y1="7" x2="17.01" y2="7" />
      <line x1="7" y1="17" x2="7.01" y2="17" />
      <line x1="17" y1="17" x2="17.01" y2="17" />
    </svg>
  );
}

export function FaceScanIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M10 16c1 1 3 1 4 0" />
    </svg>
  );
}

export function PacsLabIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-4a3 3 0 0 1 6 0v4M9 10h.01M15 10h.01" />
    </svg>
  );
}

export function SchemeIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="3" x2="12" y2="12" />
      <path d="m18.36 5.64-6.36 6.36" />
    </svg>
  );
}

export function GrievanceIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
    </svg>
  );
}

export function HostelLogisticsIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 20V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11" />
      <path d="M3 14h18" />
      <path d="M7 11v3" />
      <path d="M17 11v3" />
      <circle cx="7" cy="10" r="1" />
    </svg>
  );
}

export function RotatableProfileIcon({ size = 18, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <path d="M19 19l2 2" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function PrinterIcon({ size = 16, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export function CloseIcon({ size = 16, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
