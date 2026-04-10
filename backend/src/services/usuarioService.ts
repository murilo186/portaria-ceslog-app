import { usuarioRepository } from "../repositories/usuarioRepository";
import { createUsuarioService as createUsuarioServiceFactory } from "./usuario/createUsuarioService";
import bcrypt from "bcryptjs";

const usuarioService = createUsuarioServiceFactory({
  repository: usuarioRepository,
  passwordHasher: {
    hash: (value, saltRounds) => bcrypt.hash(value, saltRounds),
  },
});

export const listUsuariosService = usuarioService.listUsuariosService;
export const createUsuarioService = usuarioService.createUsuarioService;
export const deleteUsuarioService = usuarioService.deleteUsuarioService;
export const updateUsuarioSenhaService = usuarioService.updateUsuarioSenhaService;
