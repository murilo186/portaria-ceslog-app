# PORTARIA CESLOG APP

Sistema interno de portaria com relatorio diario, autenticacao por tenant e trilha de auditoria.

## VISÃO GERAL

Monorepo com frontend e backend:
- `frontend`: React + Vite + TypeScript
- `backend`: Node.js + Express + TypeScript
- Banco atual de execucao: SQL Server (com transicao de origem PostgreSQL/Supabase)

Objetivo principal:
- Manter um relatorio diario por tenant
- Registrar entradas/saidas por item com autoria
- Bloquear edicao apos fechamento do relatorio
- Garantir isolamento entre tenants (ex.: CESLOG e UCC)

## ESTRUTURA DE PASTAS

- `frontend/` aplicacao web
- `backend/` API REST
- `backend/prisma/` schema/migrations/scripts SQL
- `docs/` materiais auxiliares
- `scripts/` scripts utilitarios de desenvolvimento

## FUNCIONALIDADES IMPLEMENTADAS

### AUTENTICACAO E SESSAO
- Login com `usuario` e `senha`
- JWT para rotas protegidas
- Sessao associada a usuario (`auth_sessions`)
- Middleware de autenticacao no backend

### TENANCY E SEGURANCA
- Cada usuario pertence a um tenant
- Consultas filtradas por `tenantId`
- Admin so visualiza/gerencia usuarios do proprio tenant
- Isolamento validado entre CESLOG e UCC

### RELATORIOS
- Regra: 1 relatorio por dia por tenant
- Usuario continua no relatorio do dia
- Itens com dados de pessoa/veiculo/horarios/turno
- Relatorio fechado fica imutavel para operacao normal

### ADMIN
- Cadastro e gestao de usuarios por tenant
- Ativar/Inativar usuario
- Logs de auditoria

### REGISTROS E EXPORTACAO
- Lista de relatorios fechados com filtros/paginacao
- Detalhe com carregamento em lotes (melhora de performance)
- Exportacao CSV (cabecalho ajustado sem acento: `SAIDA`)

### UX/UI
- Tema com variacao por tenant
- Login com gradiente e aviso de CAPS LOCK
- Padronizacao de botoes sem arredondamento
- Ajustes mobile (botao flutuante para descer rapido no detalhe)

## REQUISITOS

- Node.js 20+
- npm 10+
- SQL Server acessivel pela rede

## VARIAVEIS DE AMBIENTE

Usar os arquivos de exemplo:
- `backend/.env.example`
- `frontend/.env.example` (se existir no ambiente)

No backend, preencher principalmente:
- `DATABASE_URL` (quando usar Prisma diretamente)
- ou variaveis segmentadas de SQL Server (conforme scripts do projeto)
- `JWT_SECRET`
- porta e demais configs da API

## COMO RODAR

### 1) INSTALAR DEPENDENCIAS
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2) BACKEND
```bash
cd backend
npm run dev
```
API padrao: `http://localhost:3000`

Health check:
- `GET /health` (status app/db)

### 3) FRONTEND
```bash
cd frontend
npm run dev
```
UI padrao: `http://localhost:5173`

## BANCO DE DADOS

### PADRAO DE NOMES NO AMBIENTE COMPARTILHADO
Para evitar conflito com outros sistemas, foi adotado prefixo `portaria_` nas tabelas e schema dedicado quando permitido.

Exemplos:
- `portaria_usuarios`
- `portaria_relatorios`
- `portaria_relatorio_itens`
- `portaria_tenants`
- `portaria_audit_logs`

### OBSERVACOES IMPORTANTES
- Em ambiente com permissao limitada, pode falhar `CREATE SCHEMA`.
- Nesse caso, criar objetos no schema permitido (ex.: `dbo`) mantendo prefixo `portaria_`.
- Garantir indices de busca/paginacao para endpoints de registros.

## ENDPOINTS PRINCIPAIS

- `POST /api/auth/login`
- `GET /api/relatorios/aberto`
- `POST /api/relatorios/novo`
- `GET /api/relatorios/:id`
- `GET /api/relatorios/fechados`
- `GET /api/admin/usuarios`
- `GET /api/admin/logs`

## TESTE DE PERFORMANCE

Ferramenta usada: `autocannon`.

Exemplo:
```bash
autocannon -c 20 -d 30 -H "Authorization: Bearer <TOKEN>" "http://localhost:3000/api/relatorios/fechados?page=1&pageSize=50&busca=001"
```

Notas:
- Sem token valido, resultados viram `non 2xx` e nao servem para benchmark.
- Endpoint de detalhe ficou muito melhor com limitacao/paginacao de itens.

## PONTOS DE ATENCAO PARA CONTINUIDADE

- Consolidar totalmente a camada de acesso a dados (evitar residuos de caminho antigo).
- Revisar todos os fluxos de fechamento/reabertura para evitar estado inconsistente.
- Manter filtros por tenant em qualquer novo repositorio/servico.
- Expandir testes automatizados (servicos criticos e rotas de admin).

## HANDOFF RAPIDO PARA NOVO RESPONSAVEL

1. Clonar repo e instalar dependencias.
2. Configurar `.env` do backend com SQL Server valido.
3. Subir backend e validar `/health` com `database: up`.
4. Subir frontend e testar login admin de cada tenant.
5. Validar isolamento: admin CESLOG nao ve usuarios UCC e vice-versa.
6. Rodar smoke de relatorio: criar, listar, fechar, consultar fechados, exportar CSV.

## CONTATO DE CONTEXTO

Este README foi preparado como documento de passagem tecnica para continuidade do projeto sem dependencia do autor original.
