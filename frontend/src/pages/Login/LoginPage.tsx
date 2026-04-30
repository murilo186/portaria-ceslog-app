import { getAuthSession, saveAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { login } from "../../services/authService";
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FeedbackMessage from "../../components/FeedbackMessage";
import Input from "../../components/Input";

type LoginLocationState = {
  authMessage?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const auth = getAuthSession();

    if (auth) {
      const target = auth.usuario.perfil === "ADMIN" ? "/admin" : "/dashboard";
      navigate(target, { replace: true });
    }
  }, [navigate]);

  const locationState = (location.state as LoginLocationState | null) ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await login({ usuario, senha });
      saveAuthSession({ token: response.token, usuario: response.usuario });
      const target = response.usuario.perfil === "ADMIN" ? "/admin" : "/dashboard";
      navigate(target, { replace: true });
    } catch (error) {
      const message = getUserErrorMessage(error, "Não foi possível fazer login");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center", gap: 2 }}>
          <img src="/logo-ceslog.png" alt="Ceslog" className="h-14 w-auto object-contain sm:h-16" />
          <img src="/logo-ucc.png" alt="UCC" className="h-14 w-auto object-contain sm:h-16" />
        </Box>

        <Card className="w-full border-0">
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Acesso ao sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Entre com seu usuário e senha para continuar.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1 }}>
            <Input
              id="usuario"
              label="Usuário"
              type="text"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
            />

            <Input
              id="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />

            {locationState?.authMessage ? <FeedbackMessage message={locationState.authMessage} tone="warning" /> : null}
            {errorMessage ? <FeedbackMessage message={errorMessage} tone="error" /> : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
