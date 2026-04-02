import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold text-text-900">Acesso ao sistema</h1>
          <p className="text-sm text-text-700">Entre com seu e-mail e senha para continuar.</p>
          <p className="text-xs text-text-700">Ambiente local sem backend: acesso liberado para visualização.</p>
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

          <Button type="submit" className="mt-2 w-full">
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  );
}
