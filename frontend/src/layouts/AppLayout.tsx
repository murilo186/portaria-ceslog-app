import { clearAuthSession, getAuthSession } from "../services/authStorage";
import { subscribeAuthRequired } from "../services/authEvents";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import { IoArrowUndo } from "react-icons/io5";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
  const isLoginPage = location.pathname === "/";
  const showBackButton =
    location.pathname === "/relatorio" || location.pathname === "/registros" || location.pathname.startsWith("/registros/");

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
    navigate("/", { replace: true });
  };

  const handleBack = () => {
    if (location.pathname === "/relatorio" || location.pathname === "/registros") {
      navigate("/dashboard");
      return;
    }

    if (location.pathname.startsWith("/registros/")) {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {isLoginPage ? null : (
        <header className="bg-white">
          <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-3 items-center px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-start">
              {showBackButton ? (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Voltar"
                  className="flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                >
                  <IoArrowUndo className="h-5 w-5 text-brand-600" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-center">
              <img src="/logo-ceslog.png" alt="Ceslog" className="h-9 w-auto object-contain" />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sair"
                className="flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              >
                <FaArrowRightFromBracket className="h-5 w-5 text-brand-600" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
