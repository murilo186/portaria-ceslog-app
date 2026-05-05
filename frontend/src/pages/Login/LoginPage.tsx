import { getAuthSession, saveAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { login } from "../../services/authService";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
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
  const [capsLockAtivo, setCapsLockAtivo] = useState(false);

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

  const handleSenhaKeyEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockAtivo(event.getModifierState("CapsLock"));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background:
          "linear-gradient(135deg, rgba(241,132,7,0.18) 0%, rgba(122,118,168,0.16) 50%, rgba(26,95,168,0.16) 100%)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "center", gap: 2 }}>
          <img src="/logo-ceslog.png" alt="Ceslog" className="h-14 w-auto object-contain sm:h-16" />
          <img src="/logo-ucc.png" alt="UCC" className="h-14 w-auto object-contain sm:h-16" />
        </Box>

        <Card className="w-full border-0" noShadow transparent>
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ mb: 1.5, height: 4, width: 72, bgcolor: "#7a76a8" }} />
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
              onKeyUp={handleSenhaKeyEvent}
              onKeyDown={handleSenhaKeyEvent}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />

            {capsLockAtivo ? <FeedbackMessage message="CAPS LOCK ATIVO" tone="warning" /> : null}

            {locationState?.authMessage ? <FeedbackMessage message={locationState.authMessage} tone="warning" /> : null}
            {errorMessage ? <FeedbackMessage message={errorMessage} tone="error" /> : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              sx={{
                backgroundColor: "rgba(255,255,255,0.35)",
                color: "#111827",
                border: "1px solid rgba(17,24,39,0.25)",
                backdropFilter: "blur(2px)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.55)",
                  borderColor: "rgba(17,24,39,0.4)",
                },
              }}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
