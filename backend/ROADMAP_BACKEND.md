# Backend Roadmap - Performance, Refatoracao e Escalabilidade

## Objetivo
Melhorar performance, reduzir latencia de consultas, reforcar regras de negocio criticas e deixar o backend mais facil de manter e evoluir.

## Fase 1 - Query Performance (ROI imediato)

### Task 1.1 - Revisar indices criticos do dominio
- Objetivo: reduzir custo de leitura e escrita nos fluxos principais.
- Acoes:
  - Garantir `UNIQUE` em `relatorios(dataRelatorio)`.
  - Criar indice em `relatorios(status, dataRelatorio)`.
  - Criar indice em `relatorio_itens(relatorioId, criadoEm)`.
  - Criar indice em `relatorio_itens(usuarioId, criadoEm)`.
  - Avaliar busca textual (`nome`, `placaVeiculo`) com `GIN + pg_trgm` quando houver volume.
- Criterio de aceite:
  - Plano de execucao (EXPLAIN) melhora em listagens e busca.
  - Sem quebra de migration em ambiente de dev/homolog.

### Task 1.2 - Reduzir payload com `select` minimo no Prisma
- Objetivo: evitar transferencia de campos nao utilizados.
- Acoes:
  - Revisar queries de listagem e detalhe para retornar apenas campos usados pelo front.
  - Padronizar `select` em repositories/services.
- Criterio de aceite:
  - Respostas menores e endpoints com menor tempo medio de resposta.

### Task 1.3 - Padronizar paginacao para alto volume
- Objetivo: manter performance previsivel em historico grande.
- Acoes:
  - Migrar listagens de historico para cursor pagination onde fizer sentido.
  - Manter offset apenas para telas pequenas/administrativas.
- Criterio de aceite:
  - Paginacao sem degradacao perceptivel em pagina alta.

## Fase 2 - Regras de negocio blindadas

### Task 2.1 - Garantir regra "1 relatorio por dia" no banco + service
- Objetivo: eliminar condicoes de corrida.
- Acoes:
  - Tratar erro de unique constraint com retorno `409` consistente.
  - Manter validacao no service antes da escrita.
- Criterio de aceite:
  - Concorrencia de criacao nunca gera dois relatorios no mesmo dia.

### Task 2.2 - Bloqueio de escrita em relatorio fechado
- Objetivo: assegurar imutabilidade apos fechamento.
- Acoes:
  - Centralizar guard de status no service de `RelatorioItem`.
  - Cobrir create/update/delete com a mesma regra.
- Criterio de aceite:
  - Escrita em relatorio fechado retorna `409` sempre.

### Task 2.3 - Regra de autoria/admin unificada
- Objetivo: evitar divergencia entre endpoints.
- Acoes:
  - Criar utilitario/guard unico: autor OU admin.
  - Aplicar em update/delete de item e endpoints sensiveis.
- Criterio de aceite:
  - Operador nao altera item de outro operador.
  - Admin altera conforme politica prevista.

## Fase 3 - Refatoracao de arquitetura

### Task 3.1 - Introduzir camada Repository
- Objetivo: separar acesso a dados de regra de negocio.
- Acoes:
  - Mover Prisma calls de services para repositories.
  - Services ficam somente com orquestracao e regras.
- Criterio de aceite:
  - Controllers finos, services focados em negocio, repositories focados em dados.

### Task 3.2 - Contratos tipados com Zod (entrada e saida)
- Objetivo: padronizar API e reduzir regressao por contrato.
- Acoes:
  - Validar payloads e query params com Zod.
  - Definir schemas de resposta dos endpoints principais.
- Criterio de aceite:
  - Erros `400/422` padronizados por violacao de contrato.

### Task 3.3 - Padrao unico de erro de dominio
- Objetivo: facilitar tratamento no frontend.
- Acoes:
  - Consolidar `code`, `message`, `status` em todas as falhas de regra.
  - Normalizar `403`, `404`, `409`, `422`.
- Criterio de aceite:
  - Front nao precisa tratar casos especiais por endpoint.

## Fase 4 - Observabilidade

### Task 4.1 - Logging estruturado com contexto
- Objetivo: acelerar diagnostico em producao.
- Acoes:
  - Incluir `requestId`, `usuarioId`, `rota`, `duracaoMs`, `statusCode`.
  - Logar exceptions com contexto minimo obrigatorio.
- Criterio de aceite:
  - Cada erro de API e rastreavel por `requestId`.

### Task 4.2 - Endpoint `/health` completo
- Objetivo: monitoramento real da saude da aplicacao.
- Acoes:
  - Health app + ping ao banco.
  - Retornar latencia basica da verificacao.
- Criterio de aceite:
  - Endpoint diferencia falha de app vs falha de banco.

### Task 4.3 - Metricas basicas de API
- Objetivo: enxergar gargalos cedo.
- Acoes:
  - Coletar latencia por endpoint, taxa de erro e top queries lentas.
- Criterio de aceite:
  - Painel simples com tendencias de latencia/erro.

## Fase 5 - Escalabilidade

### Task 5.1 - Cache seletivo para leitura pesada
- Objetivo: aliviar consultas repetidas.
- Acoes:
  - Cachear historico de relatorios fechados e detalhes de leitura frequente.
  - Invalidar por chave em operacoes de escrita.
- Criterio de aceite:
  - Menor latencia em endpoints de consulta sem inconsistencias.

### Task 5.2 - Revisar pool/conexao Prisma + Supabase
- Objetivo: estabilidade sob carga e evitar saturacao.
- Acoes:
  - Revisar limites de conexao e timeout.
  - Ajustar estrategia para ambiente de deploy.
- Criterio de aceite:
  - Queda de erro por timeout/conexao em testes de carga.

## Fase 6 - Qualidade e seguranca

### Task 6.1 - Testes de integracao dos fluxos criticos
- Objetivo: blindar regras centrais do produto.
- Acoes:
  - Cobrir auth, 1 relatorio por dia, bloqueio pos-fechamento e autoria.
- Criterio de aceite:
  - Suite verde antes de merge em main.

### Task 6.2 - Hardening de seguranca
- Objetivo: reduzir superficie de ataque.
- Acoes:
  - Revisar rate limit de auth e endpoints sensiveis.
  - Garantir sanitizacao/validacao server-side consistente.
- Criterio de aceite:
  - Politica de bloqueio e validacao aplicada em todos os endpoints sensiveis.

## Ordem recomendada de execucao
1. Fase 1 (indices + queries + paginacao)
2. Fase 2 (regras criticas)
3. Fase 6.1 (testes de integracao)
4. Fase 3 (refatoracao estrutural)
5. Fase 4 (observabilidade)
6. Fase 5 (cache e tuning de conexao)

## Definicao de pronto (DoD)
- Migration aplicada e validada em homolog.
- Testes automatizados cobrindo regras alteradas.
- Lint e build verdes.
- Sem regressao nos fluxos de operador/admin.
