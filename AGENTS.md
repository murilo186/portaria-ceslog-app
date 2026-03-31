# AGENTS.md

## Contexto do Projeto

Sistema interno de portaria em formato de relatório diário.

Stack:
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Banco: PostgreSQL (Supabase) usando Prisma
- Arquitetura: monorepo com /frontend e /backend

O sistema possui:
- autenticação de usuários
- relatório diário único
- múltiplos turnos no mesmo relatório
- controle de autoria por linha
- bloqueio de edição entre usuários
- fechamento de relatório (imutável)
- exportação futura para Excel

---

## Regras Gerais

- Sempre usar TypeScript (strict mode)
- Nunca usar JavaScript puro
- Não usar any sem necessidade
- Código deve ser modular e legível
- Evitar duplicação de lógica
- Separar responsabilidades corretamente

---

## Backend (Node + Express)

### Arquitetura obrigatória

Organizar em camadas:

- routes → define endpoints
- controllers → recebe req/res
- services → regras de negócio
- lib → utilitários (jwt, prisma)
- middlewares → auth, erro, rate limit
- types → tipagens globais

Nunca colocar regra de negócio nas rotas.

---

### Banco de dados

- Usar Prisma como ORM
- Nunca escrever SQL direto (salvo exceções justificadas)
- Modelos principais:
  - Usuario
  - Relatorio
  - RelatorioItem

- Sempre usar migrations
- Campos de auditoria obrigatórios:
  - criadoEm
  - usuarioId (quando aplicável)

---

### Autenticação

- Usar JWT
- Nunca armazenar senha em texto puro
- Sempre usar bcrypt

Fluxo:
- login gera token
- rotas protegidas validam token
- middleware de autenticação obrigatório

---

### Segurança

- Usar helmet
- Usar rate limiting (login e endpoints sensíveis)
- Validar inputs com Zod
- Nunca confiar no frontend

---

### Regras de negócio críticas

- Apenas 1 relatório por dia
- Usuários continuam o mesmo relatório no mesmo dia
- Um usuário NÃO pode editar dados de outro
- Após finalização → relatório bloqueado
- Backend deve validar TODAS essas regras

---

## Frontend (React)

### Estrutura obrigatória

- pages → telas
- components → componentes reutilizáveis
- services → chamadas API (axios)
- routes → rotas da aplicação
- types → interfaces

---

### Regras

- Usar axios para API
- Centralizar baseURL
- Nunca fazer fetch direto espalhado
- Usar React Router

---

### Autenticação

- Guardar token de forma segura
- Proteger rotas privadas
- Redirecionar usuário não autenticado

---

## Integração Front + Back

- Comunicação via HTTP (REST)
- JSON como padrão
- Backend define regras
- Front apenas consome

---

## Padrões de Código

- Nomes claros e descritivos
- Funções pequenas e objetivas
- Evitar lógica complexa em um único lugar
- Preferir composição ao invés de funções gigantes

---

## O que EVITAR

- ❌ SQL direto sem necessidade
- ❌ lógica de negócio no frontend
- ❌ validação apenas no frontend
- ❌ código duplicado
- ❌ uso excessivo de any
- ❌ rotas sem autenticação quando necessário

---

## Objetivo do código gerado

O código deve ser:
- escalável
- seguro
- legível
- fácil de manter
- preparado para produção

---

## Instrução final para o agente

Sempre gerar código completo, funcional e organizado seguindo todas as regras acima.
Nunca simplificar estrutura em troca de rapidez.
Priorizar qualidade, organização e boas práticas.