import { CSSProperties } from 'react';

export const THEME = {
  colors: {
    // Official NCCT Government Canvas & Surface Colors
    bgCanvas: '#f8fafc', // Crisp institutional off-white canvas
    bgSurface: '#ffffff', // Pure white inner container surface
    bgInset: '#f1f5f9', // Slate-100 container inset
    bgMuted: '#f8fafc', // Slate-50 background

    // Double-Bezel Structural Borders
    borderHairline: '#e2e8f0', // Crisp 1px inner container border (Slate-200)
    borderOuter: '#cbd5e1', // Double-bezel outer frame border (Slate-300)
    borderSubtle: '#f1f5f9',
    borderFocus: '#0649a2', // Sovereign blue focus ring
    borderGold: 'rgba(254, 181, 5, 0.45)', // Cooperative gold accent bezel
    borderEmerald: 'rgba(26, 180, 82, 0.40)', // Cooperative green accent bezel

    // High-Contrast Government Typography Inks (WCAG AAA >= 7:1)
    inkPrimary: '#081854', // Sovereign Deep Navy (Contrast on white: 16.7:1)
    inkBody: '#334155', // Slate-700 readable body text (Contrast on white: 10.2:1)
    inkMuted: '#64748b', // Slate-500 institutional metadata (Contrast on white: 4.6:1)
    inkSubtle: '#94a3b8', // Slate-400 subtle dividers

    // Authentic NCCT Institutional Colorways
    navyDeep: '#081854', // Official NCCT Top Utility Bar & Deep Authority
    navyPrimary: '#0649a2', // Sovereign Blue: buttons, active tabs, seals (Contrast: 7.7:1)
    navySovereign: '#1b4698', // Official NCCT Right Footer & Heading Accent
    navyHover: '#053d88', // Darkened Sovereign Blue hover
    navyLight: '#eff6ff', // Pale blue tint for selected items

    // National & Cooperative Brand Accents
    goldCoop: '#feb505', // Official NCCT Cooperative Marigold
    emeraldCoop: '#1ab452', // Official NCCT Cooperative Emerald Green
    saffronFlag: '#ff9933', // Official Indian National Flag Saffron (Tiranga Top)
    greenFlag: '#138808', // Official Indian National Flag Green (Tiranga Bottom)
    orangeAction: '#ff8906', // NCCT Interactive CTA Accent

    // Status Pills (WCAG AA Compliant >= 4.5:1 Contrast)
    status: {
      success: {
        bg: '#f0fdf4',
        text: '#166534',
        border: '#bbf7d0',
      },
      info: {
        bg: '#eff6ff',
        text: '#0649a2',
        border: '#bfdbfe',
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
        bg: '#f1f5f9',
        text: '#334155',
        border: '#cbd5e1',
      },
      apex: {
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
      },
      coop: {
        bg: '#f0fdf4',
        text: '#166534',
        border: '#86efac',
      },
      saffron: {
        bg: '#fff7ed',
        text: '#9a3412',
        border: '#fed7aa',
      },
    },
  },

  fonts: {
    sans: "'Inter', 'Noto Sans Devanagari', 'Mukta', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    devanagari: "'Noto Sans Devanagari', 'Mukta', -apple-system, BlinkMacSystemFont, sans-serif",
    heading: "'Poppins', 'Noto Sans Devanagari', sans-serif",
    serif: "'Lyon Text', 'Newsreader', 'Playfair Display', Georgia, serif",
    mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  },

  radii: {
    sharp: '2px',
    xs: '3px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    pill: '9999px',
  },

  shadows: {
    card: '0 1px 3px rgba(8, 24, 84, 0.04)',
    doubleBezel: '0 1px 3px rgba(8, 24, 84, 0.05)',
    dropdown: '0 4px 6px -1px rgba(8, 24, 84, 0.08), 0 2px 4px -2px rgba(8, 24, 84, 0.05)',
    modal: '0 20px 25px -5px rgba(8, 24, 84, 0.15), 0 8px 10px -6px rgba(8, 24, 84, 0.1)',
  },
};

// ---------------------------------------------------------------------------
// DOUBLE-BEZEL CARD PATTERN TOKENS & HELPERS
// ---------------------------------------------------------------------------

/**
 * Standard Double-Bezel Outer Frame (Slate neutral)
 */
export const doubleBezelCardOuterStyle: CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '3px',
  boxShadow: THEME.shadows.doubleBezel,
};

/**
 * Standard Double-Bezel Inner Container
 */
export const doubleBezelCardInnerStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '2px',
  padding: '1.75rem',
  boxSizing: 'border-box',
  width: '100%',
};

/**
 * Apex Statutory Double-Bezel Outer Frame (Cooperative Marigold accent)
 */
export const doubleBezelApexCardOuterStyle: CSSProperties = {
  backgroundColor: '#fefce8',
  border: '1px solid #fde047',
  borderRadius: '4px',
  padding: '3px',
  boxShadow: '0 1px 3px rgba(202, 138, 4, 0.08)',
};

/**
 * Apex Statutory Double-Bezel Inner Container
 */
export const doubleBezelApexCardInnerStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #fef08a',
  borderRadius: '2px',
  padding: '1.75rem',
  boxSizing: 'border-box',
  width: '100%',
};

/**
 * Emerald Certified Double-Bezel Outer Frame (Cooperative Green accent)
 */
export const doubleBezelEmeraldCardOuterStyle: CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '4px',
  padding: '3px',
  boxShadow: '0 1px 3px rgba(22, 101, 52, 0.06)',
};

/**
 * Emerald Certified Double-Bezel Inner Container
 */
export const doubleBezelEmeraldCardInnerStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #bbf7d0',
  borderRadius: '2px',
  padding: '1.75rem',
  boxSizing: 'border-box',
  width: '100%',
};

/**
 * Single-Element Double-Bezel Helper (combines inner border + outer outline moat)
 */
export const doubleBezelCard = (accent: 'navy' | 'gold' | 'emerald' | 'neutral' = 'navy'): CSSProperties => {
  const outerBorder = accent === 'gold' ? '#fde047' : accent === 'emerald' ? '#86efac' : '#cbd5e1';
  const innerBorder = accent === 'gold' ? '#fef08a' : accent === 'emerald' ? '#bbf7d0' : '#e2e8f0';
  return {
    backgroundColor: '#ffffff',
    border: `1px solid ${innerBorder}`,
    outline: `1px solid ${outerBorder}`,
    outlineOffset: '2px',
    borderRadius: '3px',
    padding: '1.5rem',
    boxShadow: THEME.shadows.card,
  };
};

/**
 * Upgraded standard cardStyle with outline double-bezel boundary
 */
export const cardStyle: CSSProperties = {
  backgroundColor: THEME.colors.bgSurface,
  border: `1px solid ${THEME.colors.borderHairline}`,
  outline: '1px solid #cbd5e1',
  outlineOffset: '2px',
  borderRadius: '3px',
  padding: '1.5rem',
  boxShadow: THEME.shadows.card,
};

export const bentoHeaderStyle: CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: THEME.colors.inkMuted,
  marginBottom: '0.35rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const bentoValueStyle: CSSProperties = {
  fontSize: '1.85rem',
  fontWeight: 800,
  color: THEME.colors.inkPrimary,
  fontFeatureSettings: '"tnum" 1',
  letterSpacing: '-0.025em',
  margin: '0.2rem 0',
};

export const buttonPrimaryStyle: CSSProperties = {
  backgroundColor: THEME.colors.navyPrimary,
  color: '#ffffff',
  border: '1px solid #053d88',
  borderRadius: THEME.radii.sharp,
  padding: '0.55rem 1.15rem',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  boxShadow: '0 1px 2px rgba(8, 24, 84, 0.08)',
  transition: 'background-color 0.15s ease',
};

export const buttonSecondaryStyle: CSSProperties = {
  backgroundColor: THEME.colors.bgSurface,
  color: THEME.colors.inkBody,
  border: `1px solid ${THEME.colors.borderOuter}`,
  borderRadius: THEME.radii.sharp,
  padding: '0.55rem 1.15rem',
  fontSize: '0.82rem',
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
    fontSize: '0.70rem',
    fontWeight: 700,
    padding: '0.15rem 0.55rem',
    borderRadius: THEME.radii.pill,
    backgroundColor: token.bg,
    color: token.text,
    border: `1px solid ${token.border}`,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  };
};

export const tableHeaderStyle: CSSProperties = {
  padding: '0.8rem 1rem',
  textAlign: 'left',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: THEME.colors.inkMuted,
  backgroundColor: THEME.colors.bgInset,
  borderBottom: `1px solid ${THEME.colors.borderHairline}`,
};

export const tableCellStyle: CSSProperties = {
  padding: '0.85rem 1rem',
  fontSize: '0.82rem',
  color: THEME.colors.inkBody,
  borderBottom: `1px solid ${THEME.colors.borderHairline}`,
  verticalAlign: 'middle',
};
