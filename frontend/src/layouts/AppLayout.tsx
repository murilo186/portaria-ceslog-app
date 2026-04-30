import { clearAuthSession, getAuthSession } from "../services/authStorage";
import { subscribeAuthRequired } from "../services/authEvents";
import { applyTenantTheme, getTenantTheme } from "../theme/tenantTheme";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import { IoArrowUndo } from "react-icons/io5";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppBar, Box, Container, IconButton, Toolbar } from "@mui/material";

type AppLayoutProps = {
  children: ReactNode;
};

function redirectToLogin(
  navigate: ReturnType<typeof useNavigate>,
  pathname: string,
  message: string,
  replace = true,
) {
  if (pathname === "/") {
    return;
  }

  clearAuthSession();
  applyTenantTheme("ceslog");
  navigate("/", {
    replace,
    state: {
      authMessage: message,
    },
  });
}

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const authSession = getAuthSession();
  const tenantTheme = getTenantTheme(authSession?.usuario?.tenant?.slug);
  const isLoginPage = location.pathname === "/";
  const showBackButton =
    location.pathname === "/relatorio" || location.pathname === "/registros" || location.pathname.startsWith("/registros/");

  useEffect(() => {
    applyTenantTheme(authSession?.usuario?.tenant?.slug ?? "ceslog");
  }, [authSession?.usuario?.tenant?.slug]);

  useEffect(() => {
    const unsubscribe = subscribeAuthRequired((payload) => {
      const message =
        payload.reason === "expired"
          ? "Sua sessão expirou. Faça login novamente."
          : "Sessão inválida. Faça login novamente.";

      redirectToLogin(navigate, location.pathname, payload.message || message);
    });

    return unsubscribe;
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const auth = getAuthSession();

      if (!auth) {
        redirectToLogin(navigate, location.pathname, "Sua sessão expirou. Faça login novamente.");
      }
    }, 15_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoginPage, location.pathname, navigate]);

  const handleLogout = () => {
    clearAuthSession();
    applyTenantTheme("ceslog");
    navigate("/", { replace: true });
  };

  const handleBack = () => {
    if (location.pathname === "/relatorio" || location.pathname === "/registros") {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/dashboard", { replace: true });
      }
      return;
    }

    if (location.pathname.startsWith("/registros/")) {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/registros", { replace: true });
      }
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {isLoginPage ? null : (
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #e5e7eb" }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ minHeight: "64px", display: "grid", gridTemplateColumns: "1fr auto 1fr" }}>
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                {showBackButton ? (
                  <IconButton onClick={handleBack} aria-label="Voltar" color="primary">
                    <IoArrowUndo className="h-5 w-5" />
                  </IconButton>
                ) : null}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <img src={tenantTheme.logoSrc} alt={tenantTheme.nome} className="h-9 w-auto object-contain" />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton onClick={handleLogout} aria-label="Sair" color="primary">
                  <FaArrowRightFromBracket className="h-5 w-5" />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      )}

      <Container maxWidth="xl" sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
        {children}
      </Container>
    </Box>
  );
}
