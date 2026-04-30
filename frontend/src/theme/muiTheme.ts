import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#f18407",
      dark: "#d97406",
      light: "#fff4e6",
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
        },
      },
    },
  },
});

