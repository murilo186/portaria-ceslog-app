import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import LoginPage from "../pages/Login/LoginPage";
import RelatorioPage from "../pages/Relatorio/RelatorioPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/relatorio" element={<RelatorioPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
