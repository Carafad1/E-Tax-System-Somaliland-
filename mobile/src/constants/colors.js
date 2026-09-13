// Centralized theme — professional blue government/fintech palette.
// Every screen/component must reference these tokens instead of hardcoding
// hex values, so the whole app can be re-themed from this single file.
export const COLORS = {
  // Core palette
  primary: "#062E8A",
  primaryDark: "#041F61",
  primaryLight: "#EBF3FF",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  border: "#E2E8F0",
  success: "#16A34A",
  successLight: "#DCFCE7",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  error: "#DC2626",
  errorLight: "#FEE2E2",
  white: "#FFFFFF",
  gray: "#64748B",
  lightGray: "#F1F5F9",
  darkGray: "#1E293B",

  // Backward-compatible aliases
  primaryGreen: "#062E8A",
  primaryGreenDark: "#041F61",
  primaryGreenLight: "#EBF3FF",
  red: "#C1272D",
  redLight: "#FBE7E8",
  danger: "#C1272D",
  dangerLight: "#FBE7E8",
  info: "#1261A0",
  infoLight: "#E8F2FA",
  cardBackground: "#FFFFFF",
  textPrimary: "#17212B",
  textSecondary: "#64748B",
  textOnPrimary: "#FFFFFF",
};

export const STATUS_COLORS = {
  pending: { bg: COLORS.warningLight, text: COLORS.warning },
  processing: { bg: COLORS.primaryLight, text: COLORS.primary },
  completed: { bg: COLORS.successLight, text: COLORS.success },
  failed: { bg: COLORS.errorLight, text: COLORS.error },
  cancelled: { bg: COLORS.lightGray, text: COLORS.gray },
};

// Fixed per-method color, used consistently everywhere payment methods are
// charted (dashboard rankings, report charts) so the same method always
// reads as the same color regardless of its rank/position that day.
export const PAYMENT_METHOD_COLORS = {
  ZAAD: COLORS.primary,
  EVC_PLUS: COLORS.success,
  EDAHAB: "#7C3AED",
  CARD: COLORS.warning,
  // A distinct teal rather than COLORS.primaryDark - that shade reads as
  // near-identical to ZAAD's navy blue in a legend/chart.
  BANK: "#0891B2",
};
