import type { Usuario } from "./usuario";

export interface LoginRequest {
  usuario: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface AuthState {
  usuario: Usuario;
  token: string;
}
