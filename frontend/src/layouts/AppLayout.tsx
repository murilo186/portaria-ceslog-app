import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white">
      {isLoginPage ? null : (
        <header className="border-b border-surface-200 bg-white">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <img src="/logo-ceslog.png" alt="Ceslog" className="h-9 w-auto object-contain" />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-surface-200 bg-white px-3 py-2 text-xs font-semibold text-text-900 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              Sair
            </button>
          </div>
        </header>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
