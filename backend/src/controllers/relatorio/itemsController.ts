import { createAuditLog } from "../../services/auditService";
import {
  createRelatorioItemService,
  deleteRelatorioItemService,
  updateRelatorioItemService,
} from "../../services/relatorioService";
import { getRequestMetadata } from "../../utils/requestMetadata";
import { relatorioItemIdSchema, relatorioIdSchema, relatorioItemSchema } from "../../validation/relatorioSchemas";
import { asyncHandler } from "../helpers/asyncHandler";
import { ensureAuthenticatedUser } from "../helpers/ensureAuthenticatedUser";

export const createRelatorioItemController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const { relatorioId } = relatorioIdSchema.parse(req.params);
  const payload = relatorioItemSchema.parse(req.body);

  const item = await createRelatorioItemService(relatorioId, payload, user);
  const requestMeta = getRequestMetadata(req);

  console.info("relatorio_item_created", {
    requestId: requestMeta.requestId,
    userId: user.id,
    relatorioId,
    itemId: item.id,
  });

  await createAuditLog({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioLogin: user.usuario,
    acao: "RELATORIO_ITEM_CRIADO",
    entidade: "RELATORIO_ITEM",
    entidadeId: item.id,
    descricao: "Item adicionado ao relatorio.",
    detalhes: {
      relatorioId,
      perfilPessoa: item.perfilPessoa,
      empresa: item.empresa,
      placaVeiculo: item.placaVeiculo,
      nome: item.nome,
    },
    contexto: requestMeta,
  });

  return res.status(201).json(item);
});

export const updateRelatorioItemController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const { relatorioId, itemId } = relatorioItemIdSchema.parse(req.params);
  const payload = relatorioItemSchema.parse(req.body);

  const item = await updateRelatorioItemService(relatorioId, itemId, payload, user);
  const requestMeta = getRequestMetadata(req);

  console.info("relatorio_item_updated", {
    requestId: requestMeta.requestId,
    userId: user.id,
    relatorioId,
    itemId,
  });

  await createAuditLog({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioLogin: user.usuario,
    acao: "RELATORIO_ITEM_ATUALIZADO",
    entidade: "RELATORIO_ITEM",
    entidadeId: item.id,
    descricao: "Item do relatorio atualizado.",
    detalhes: {
      relatorioId,
      perfilPessoa: item.perfilPessoa,
      empresa: item.empresa,
      placaVeiculo: item.placaVeiculo,
      nome: item.nome,
    },
    contexto: requestMeta,
  });

  return res.status(200).json(item);
});

export const deleteRelatorioItemController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const { relatorioId, itemId } = relatorioItemIdSchema.parse(req.params);

  const result = await deleteRelatorioItemService(relatorioId, itemId, user);
  const requestMeta = getRequestMetadata(req);

  console.info("relatorio_item_deleted", {
    requestId: requestMeta.requestId,
    userId: user.id,
    relatorioId,
    itemId,
  });

  await createAuditLog({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioLogin: user.usuario,
    acao: "RELATORIO_ITEM_EXCLUIDO",
    entidade: "RELATORIO_ITEM",
    entidadeId: itemId,
    descricao: "Item removido do relatorio.",
    detalhes: {
      relatorioId,
    },
    contexto: requestMeta,
  });

  return res.status(200).json(result);
});
