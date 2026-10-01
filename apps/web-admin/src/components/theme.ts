import { CSSProperties } from 'react';

export const THEME = {
  colors: {
    bgCanvas: '#f9fafb', // Warm bone / off-white
    bgSurface: '#ffffff', // Pure white card surfaces
    bgInset: '#f3f4f6', // Light gray container inset
    bgMuted: '#f8fafc',
    
    borderHairline: '#e5e7eb', // Crisp 1px hairline border
    borderSubtle: '#f3f4f6',
    borderFocus: '#1e3a5f',
    
    inkPrimary: '#111827', // Deep charcoal / off-black
    inkBody: '#374151', // High contrast body gray
    inkMuted: '#6b7280', // Slate label gray
    inkSubtle: '#9ca3af',
    
    // Institutional accents
    navyPrimary: '#1e3a5f',
    navyHover: '#152942',
    navyLight: '#eff6ff',
    
    // Status pills (desaturated, dignified)
    status: {
      success: {
        bg: '#f0fdf4',
        text: '#166534',
        border: '#bbf7d0',
      },
      info: {
        bg: '#f8fafc',
        text: '#1e3a5f',
        border: '#cbd5e1',
      },
      warning: {
        bg: '#fefce8',
        text: '#854d0e',
        border: '#fef08a',
      },
      error: {
        bg: '#fef2f2',
        text: '#991b1b',
        border: '#fecaca',
      },
      neutral: {
        bg: '#f3f4f6',
        text: '#374151',
        border: '#e5e7eb',
      },
      apex: {
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
      },
    },
  },
  
  fonts: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Lyon Text', 'Newsreader', 'Playfair Display', Georgia, serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  
  radii: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '10px',
    pill: '9999px',
  },
  
  shadows: {
    card: '0 1px 3px rgba(0,0,0,0.03)',
    dropdown: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
    modal: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.08)',
  },
};

export const cardStyle: CSSProperties = {
  backgroundColor: THEME.colors.bgSurface,
  border: `1px solid ${THEME.colors.borderHairline}`,
  borderRadius: THEME.radii.md,
  padding: '1.25rem',
  boxShadow: THEME.shadows.card,
};

export const bentoHeaderStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: THEME.colors.inkMuted,
  marginBottom: '0.25rem',
};

export const bentoValueStyle: CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: THEME.colors.inkPrimary,
  fontFeatureSettings: '"tnum" 1',
  letterSpacing: '-0.02em',
  margin: '0.2rem 0',
};

export const buttonPrimaryStyle: CSSProperties = {
  backgroundColor: THEME.colors.navyPrimary,
  color: '#ffffff',
  border: 'none',
  borderRadius: THEME.radii.sm,
  padding: '0.55rem 1rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  transition: 'background-color 0.15s ease',
};

export const buttonSecondaryStyle: CSSProperties = {
  backgroundColor: THEME.colors.bgSurface,
  color: THEME.colors.inkBody,
  border: `1px solid ${THEME.colors.borderHairline}`,
  borderRadius: THEME.radii.sm,
  padding: '0.55rem 1rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
};

export const pillBadge = (type: keyof typeof THEME.colors.status = 'neutral'): CSSProperties => {
  const token = THEME.colors.status[type] || THEME.colors.status.neutral;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: THEME.radii.pill,
    backgroundColor: token.bg,
    color: token.text,
    border: `1px solid ${token.border}`,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  };
};

export const tableHeaderStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: THEME.colors.inkMuted,
  backgroundColor: THEME.colors.bgMuted,
  borderBottom: `1px solid ${THEME.colors.borderHairline}`,
};

export const tableCellStyle: CSSProperties = {
  padding: '0.85rem 1rem',
  fontSize: '0.85rem',
  color: THEME.colors.inkBody,
  borderBottom: `1px solid ${THEME.colors.borderHairline}`,
  verticalAlign: 'middle',
};
