import { getAuthSession } from "../services/authStorage";
import type { Usuario } from "../types/usuario";
import { Navigate, Outlet, useLocation } from "react-router-dom";

type PrivateRouteProps = {
  allowedProfiles?: Usuario["perfil"][];
  redirectTo?: string;
};

export default function PrivateRoute({ allowedProfiles, redirectTo = "/dashboard" }: PrivateRouteProps) {
  const location = useLocation();
  const auth = getAuthSession();

  if (!auth) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          authMessage: "Faça login para continuar.",
          from: location.pathname,
        }}
      />
    );
  }

  if (allowedProfiles && !allowedProfiles.includes(auth.usuario.perfil)) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          authMessage: "Você não tem permissão para acessar esta área.",
        }}
      />
    );
  }

  return <Outlet />;
}
