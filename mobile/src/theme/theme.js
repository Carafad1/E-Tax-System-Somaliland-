import { MD3LightTheme } from "react-native-paper";
import { COLORS } from "../constants/colors";

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.white,
    secondary: COLORS.primaryDark,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
  },
  roundness: 10,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
};
