import { getAuthSession, saveAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { login } from "../../services/authService";
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";

type LoginLocationState = {
  authMessage?: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const auth = getAuthSession();

    if (auth) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const locationState = (location.state as LoginLocationState | null) ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await login({ email, senha });
      saveAuthSession({ token: response.token, usuario: response.usuario });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = getUserErrorMessage(error, "Não foi possível fazer login");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img src="/logo-ceslog.png" alt="Ceslog" className="h-20 w-auto object-contain sm:h-24" />
        </div>

        <Card className="w-full p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold text-text-900">Acesso ao sistema</h1>
            <p className="text-sm text-text-700">Entre com seu e-mail e senha para continuar.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu.nome@empresa.com"
              autoComplete="email"
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

            {locationState?.authMessage ? <p className="text-sm text-amber-700">{locationState.authMessage}</p> : null}
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

