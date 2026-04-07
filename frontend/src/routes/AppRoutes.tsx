import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AdminPage from "../pages/Admin/AdminPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import LoginPage from "../pages/Login/LoginPage";
import RegistroDetalhePage from "../pages/Registros/RegistroDetalhePage";
import RegistrosPage from "../pages/Registros/RegistrosPage";
import RelatorioPage from "../pages/Relatorio/RelatorioPage";
import PrivateRoute from "./PrivateRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppLayout>
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
      </AppLayout>
    </BrowserRouter>
  );
}

