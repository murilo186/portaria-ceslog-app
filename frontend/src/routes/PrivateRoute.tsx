import { getAuthSession } from "../services/authStorage";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PrivateRoute() {
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

  return <Outlet />;
}

