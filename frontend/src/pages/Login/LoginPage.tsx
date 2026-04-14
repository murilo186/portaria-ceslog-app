import { getAuthSession, saveAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { login } from "../../services/authService";
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
      const message = getUserErrorMessage(error, "Nao foi possivel fazer login");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-4">
          <img src="/logo-ceslog.png" alt="Ceslog" className="h-14 w-auto object-contain sm:h-16" />
          <img src="/logo-ucc.png" alt="UCC" className="h-14 w-auto object-contain sm:h-16" />
        </div>

        <Card className="w-full border-0 p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold text-text-900">Acesso ao sistema</h1>
            <p className="text-sm text-text-700">Entre com seu usuario e senha para continuar.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="usuario"
              label="Usuario"
              type="text"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              placeholder="Digite seu usuario"
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

            <Button
              type="submit"
              className="mt-2 w-full !bg-black !text-white hover:!bg-zinc-900 focus-visible:!ring-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
