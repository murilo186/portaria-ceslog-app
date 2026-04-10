import type { TurnoUsuario } from "../../../types/usuario";

export type Feedback = {
  type: "error" | "success";
  message: string;
};

export type NovoUsuarioForm = {
  nome: string;
  usuario: string;
  senha: string;
  turno: TurnoUsuario;
};

export const initialNovoUsuarioForm: NovoUsuarioForm = {
  nome: "",
  usuario: "",
  senha: "",
  turno: "MANHA",
};