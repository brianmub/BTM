import { Platform } from "react-native";

const primaryRed = "#DA291C"; // BTM Red
const goldColor = "#FFD700";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A0A0A0",
    tabIconSelected: "#DA291C",
    link: "#DA291C",
    primary: "#DA291C",
    accent: "#000000",
    backgroundRoot: "#0D0D0D",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#333333",
    card: "#1A1A1A",
    border: "#2A2A2A",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#DA291C",
    progressTrack: "#2A2A2A",
    gold: "#FFD700",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A0A0A0",
    tabIconSelected: "#DA291C",
    link: "#DA291C",
    primary: "#DA291C",
    accent: "#FFD700",
    backgroundRoot: "#0D0D0D",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#333333",
    card: "#1A1A1A",
    border: "#2A2A2A",
    success: "#22C55E",
    warning: "#FBBF24",
    error: "#DA291C",
    progressTrack: "#2A2A2A",
    gold: "#FFD700",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 52,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
