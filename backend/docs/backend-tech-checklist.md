# Backend Tech Checklist

Data: 2026-04-13

## 1) Limpeza final (imports/lint/build)

- [x] Build TypeScript (`npm run build`)
- [x] Testes (`npm run test`)
- [x] Check de segurança SQL raw (`npm run security:check-sql`)
- [x] Pipeline CI local (`npm run test:ci`)

Observacao:
- O projeto atualmente nao possui script de lint dedicado (`eslint`). A validacao usada nesta fase foi por build estrito + testes + checks de seguranca.

## 2) Riscos remanescentes (priorizados)

### Alto

- [ ] Drift de migrations no banco remoto (historico alterado apos aplicacao)
  - Impacto: bloqueio de `prisma migrate dev` em ambientes compartilhados.
  - Acao sugerida: congelar migrations historicas e usar `prisma migrate resolve` + nova migration corretiva.

### Medio

- [ ] Picos de latencia esporadicos (max > 1s em benchmark curto)
  - Impacto: experiencia intermitente pior em horarios de carga.
  - Acao sugerida: investigar cold start/pool de conexoes, adicionar metricas de query por endpoint e revisar TTL de cache.

- [ ] Falta de lint padronizado no backend
  - Impacto: divergencia de estilo/imports e maior custo de revisao.
  - Acao sugerida: adicionar ESLint + regras de import/order e no-unused-vars.

### Baixo

- [ ] Documentacao de erro por endpoint pode evoluir com tabela completa `code/status`.
  - Acao sugerida: expandir docs de contrato com matriz de erro por rota.

## 3) Benchmark curto (read endpoints)

Comando:

```powershell
npm run benchmark:read
```

Amostra: 30 requests por endpoint.

Resultados:

- `GET /api/relatorios/aberto`:
  - min: `157.78ms`
  - avg: `211.01ms`
  - p50: `164.85ms`
  - p95: `179.28ms`
  - max: `1473.61ms`

- `GET /api/relatorios/fechados?page=1&pageSize=10`:
  - min: `164.46ms`
  - avg: `217.27ms`
  - p50: `166.30ms`
  - p95: `194.51ms`
  - max: `1478.22ms`

- `GET /api/relatorios/fechados?page=1&pageSize=10&busca=abc`:
  - min: `162.49ms`
  - avg: `180.27ms`
  - p50: `166.89ms`
  - p95: `200.52ms`
  - max: `482.39ms`

- `GET /api/relatorios/:id` (id 39 no teste):
  - min: `161.66ms`
  - avg: `179.89ms`
  - p50: `164.60ms`
  - p95: `180.23ms`
  - max: `587.11ms`

Leitura rapida:
- Mediana e p95 estao estaveis na faixa ~160-200ms.
- Existem outliers altos; proximo passo e instrumentar query-time por rota/consulta para identificar origem dos picos.
