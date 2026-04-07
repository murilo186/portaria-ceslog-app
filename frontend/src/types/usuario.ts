export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: "ADMIN" | "OPERADOR";
  turno: string | null;
}
