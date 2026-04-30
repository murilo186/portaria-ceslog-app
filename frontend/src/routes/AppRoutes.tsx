import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import PrivateRoute from "./PrivateRoute";

const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const DashboardPage = lazy(() => import("../pages/Dashboard/DashboardPage"));
const RelatorioPage = lazy(() => import("../pages/Relatorio/RelatorioPage"));
const RegistrosPage = lazy(() => import("../pages/Registros/RegistrosPage"));
const RegistroDetalhePage = lazy(() => import("../pages/Registros/RegistroDetalhePage"));
const AdminPage = lazy(() => import("../pages/Admin/AdminPage"));

function RouteLoadingFallback() {
  return <p className="p-4 text-sm text-text-700">Carregando...</p>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/relatorio" element={<RelatorioPage />} />
              <Route path="/registros" element={<RegistrosPage />} />
              <Route path="/registros/:relatorioId" element={<RegistroDetalhePage />} />

              <Route element={<PrivateRoute allowedProfiles={["ADMIN"]} />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  );
}

