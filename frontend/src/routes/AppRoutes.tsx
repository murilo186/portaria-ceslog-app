import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import LoginPage from "../pages/Login/LoginPage";
import RegistroDetalhePage from "../pages/Registros/RegistroDetalhePage";
import RegistrosPage from "../pages/Registros/RegistrosPage";
import RelatorioPage from "../pages/Relatorio/RelatorioPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/relatorio" element={<RelatorioPage />} />
          <Route path="/registros" element={<RegistrosPage />} />
          <Route path="/registros/:relatorioId" element={<RegistroDetalhePage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
