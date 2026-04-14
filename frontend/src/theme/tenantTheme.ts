type TenantTheme = {
  slug: string;
  nome: string;
  logoSrc: string;
  colors: {
    brand50: string;
    brand500: string;
    brand600: string;
  };
};

const DEFAULT_THEME: TenantTheme = {
  slug: "ceslog",
  nome: "CESLOG",
  logoSrc: "/logo-ceslog.png",
  colors: {
    brand50: "#fff4e6",
    brand500: "#f18407",
    brand600: "#d97406",
  },
};

const THEMES: Record<string, TenantTheme> = {
  ceslog: DEFAULT_THEME,
  ucc: {
    slug: "ucc",
    nome: "UCC",
    logoSrc: "/logo-ucc.png",
    colors: {
      brand50: "#eaf2fb",
      brand500: "#1a5fa8",
      brand600: "#114a86",
    },
  },
};

export function getTenantTheme(slug?: string | null): TenantTheme {
  if (!slug) {
    return DEFAULT_THEME;
  }

  return THEMES[slug.toLowerCase()] ?? DEFAULT_THEME;
}

export function applyTenantTheme(slug?: string | null) {
  const theme = getTenantTheme(slug);
  const root = document.documentElement;

  root.style.setProperty("--color-brand-50", theme.colors.brand50);
  root.style.setProperty("--color-brand-500", theme.colors.brand500);
  root.style.setProperty("--color-brand-600", theme.colors.brand600);
}
