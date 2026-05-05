import { createTheme } from "@mui/material/styles";
import { getTenantTheme } from "./tenantTheme";

export function createMuiTheme(slug?: string | null) {
  const tenantTheme = getTenantTheme(slug);

  return createTheme({
    palette: {
      primary: {
        main: tenantTheme.colors.brand500,
        dark: tenantTheme.colors.brand600,
        light: tenantTheme.colors.brand50,
      },
      background: {
        default: "#f7f8fa",
        paper: "#ffffff",
      },
      text: {
        primary: "#111827",
        secondary: "#374151",
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"IBM Plex Sans", "Source Sans 3", "Noto Sans", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h2: {
        fontWeight: 700,
        letterSpacing: "-0.01em",
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(17, 24, 39, 0.06)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 0,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
          },
        },
      },
    },
  });
}
