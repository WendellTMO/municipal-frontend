/**
 * BusKá Color Palette
 * 
 * Design Direction: Professional, Trustworthy, Tech-Forward
 * 
 * Primary: Deep Navy Blue - conveys trust, reliability, and professionalism
 * Secondary: Electric Teal - adds modern, tech-forward accent
 * The combination creates a sophisticated yet approachable identity
 */

export const colors = {
  // ===========================================
  // PRIMARY - Brand Blue (matches Login palette)
  // ===========================================
  primary: {
    main: '#156EF2',        // Login button blue — primary CTA
    light: '#4A8EF5',       // Lighter blue for hover states
    lighter: '#DBEAFE',     // Very light blue for backgrounds
    dark: '#0D5BCF',        // Header backgrounds, status bar
    contrast: '#FFFFFF',    // Text on primary backgrounds
  },

  // ===========================================
  // SECONDARY - Electric Teal (Tech-Forward)
  // ===========================================
  secondary: {
    main: '#00B4D8',        // Vibrant teal - accent color
    light: '#48CAE4',       // Light teal for hover
    lighter: '#90E0EF',     // Subtle accents
    dark: '#0096C7',        // Darker teal for pressed states
    contrast: '#0F2942',    // Text on secondary backgrounds
  },

  // ===========================================
  // ACCENT - Warm Gold (Energy & Attention)
  // ===========================================
  accent: {
    main: '#F7B32B',        // Warm gold - CTAs, highlights
    light: '#FFD166',       // Light gold
    dark: '#E09F1F',        // Darker gold
    contrast: '#0F2942',    // Text on accent backgrounds
  },

  // ===========================================
  // SEMANTIC COLORS
  // ===========================================
  success: {
    main: '#10B981',        // Modern green
    light: '#D1FAE5',       // Background
    lighter: '#ECFDF5',     // Subtle background
    dark: '#059669',        // Emphasized
    contrast: '#FFFFFF',
  },

  warning: {
    main: '#F59E0B',        // Amber
    light: '#FEF3C7',       // Background
    lighter: '#FFFBEB',     // Subtle background
    dark: '#D97706',        // Emphasized
    contrast: '#0F2942',
  },

  error: {
    main: '#EF4444',        // Modern red
    light: '#FEE2E2',       // Background
    lighter: '#FFF5F5',     // Subtle background
    dark: '#DC2626',        // Emphasized
    contrast: '#FFFFFF',
  },

  info: {
    main: '#3B82F6',        // Clear blue
    light: '#DBEAFE',       // Background
    dark: '#2563EB',        // Emphasized
    contrast: '#FFFFFF',
  },

  // ===========================================
  // NEUTRALS
  // ===========================================
  neutral: {
    50: '#F8FAFC',          // Lightest background
    100: '#F1F5F9',         // Card backgrounds
    200: '#E2E8F0',         // Borders, dividers
    300: '#CBD5E1',         // Disabled borders
    400: '#94A3B8',         // Placeholder text
    500: '#64748B',         // Secondary text
    600: '#475569',         // Body text
    700: '#334155',         // Headings
    800: '#1E293B',         // Dark text
    900: '#0F172A',         // Darkest text
  },

  // ===========================================
  // BACKGROUNDS
  // ===========================================
  background: {
    default: '#EEF3FB',     // Main app background (matches login safeArea)
    paper: '#FFFFFF',       // Cards, modals
    elevated: '#FFFFFF',    // Elevated surfaces
    dark: '#0D5BCF',        // Dark sections (headers)
  },

  // ===========================================
  // TEXT COLORS
  // ===========================================
  text: {
    primary: '#1E293B',     // Main text
    secondary: '#64748B',   // Secondary text
    disabled: '#94A3B8',    // Disabled text
    hint: '#CBD5E1',        // Hints, placeholders
    inverse: '#FFFFFF',     // Text on dark backgrounds
  },

  // ===========================================
  // BORDERS
  // ===========================================
  border: {
    light: '#E2E8F0',       // Default borders
    medium: '#CBD5E1',      // Emphasized borders
    dark: '#94A3B8',        // Strong borders
    focus: '#156EF2',       // Focus state (primary blue)
  },

  // ===========================================
  // ROLE-SPECIFIC COLORS (for badges, indicators)
  // ===========================================
  roles: {
    aluno: '#00B4D8',       // Student - Teal
    motorista: '#0F2942',   // Driver - Navy
    gestor: '#F7B32B',      // Manager - Gold
  },

  // ===========================================
  // STATUS COLORS (for trips, routes)
  // ===========================================
  status: {
    active: '#10B981',      // Active/Running
    pending: '#F59E0B',     // Waiting/Pending
    completed: '#64748B',   // Completed/Past
    cancelled: '#EF4444',   // Cancelled
  },

  // ===========================================
  // GRADIENTS (for headers, cards)
  // ===========================================
  gradients: {
    primary: ['#0D5BCF', '#156EF2'],
    secondary: ['#00B4D8', '#48CAE4'],
    accent: ['#F7B32B', '#FFD166'],
    dark: ['#0D5BCF', '#143D86'],
  },

  // ===========================================
  // SOLID (quadrados de ícone branco; todos com 3:1 ou mais contra o branco)
  // ===========================================
  solid: {
    blue: '#156EF2',
    green: '#059669',
    amber: '#D97706',
    teal: '#0E7490',
  },

  // ===========================================
  // OVERLAYS
  // ===========================================
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(15, 41, 66, 0.7)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export default colors;
