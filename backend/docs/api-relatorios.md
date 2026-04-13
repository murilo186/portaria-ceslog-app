# API de Relatorios

Base path: `/api/relatorios`

## Autenticacao

Todas as rotas exigem `Authorization: Bearer <token>`.

## Endpoints

### `GET /hoje`
Retorna o relatorio aberto do dia atual. Se nao existir, cria um novo.

Resposta `200`:

```json
{
  "id": 12,
  "dataRelatorio": "2026-04-13T00:00:00.000Z",
  "status": "ABERTO",
  "criadoEm": "2026-04-13T07:00:00.000Z",
  "finalizadoEm": null,
  "itens": []
}
```

### `GET /aberto`
Retorna o relatorio em aberto.

Erros:
- `404 OPEN_REPORT_NOT_FOUND`

### `POST /novo`
Cria um novo relatorio, somente quando nao existe relatorio aberto.

Erros:
- `409 OPEN_REPORT_EXISTS`
- `409 DAILY_REPORT_ALREADY_EXISTS`

### `GET /fechados?page=1&pageSize=10&data=AAAA-MM-DD&busca=termo`
Lista relatorios fechados com paginacao.

Resposta `200`:

```json
{
  "data": [
    {
      "id": 11,
      "dataRelatorio": "2026-04-12T00:00:00.000Z",
      "status": "FECHADO",
      "criadoEm": "2026-04-12T07:00:00.000Z",
      "finalizadoEm": "2026-04-13T00:00:00.000Z",
      "_count": { "itens": 104 }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /:relatorioId`
Retorna detalhes do relatorio.

Query opcional de cursor para itens:
- `itemLimit` (max 100)
- `itemCursor` (id do ultimo item da pagina anterior)

Quando cursor e usado, inclui `itensPage`:

```json
{
  "id": 12,
  "dataRelatorio": "2026-04-13T00:00:00.000Z",
  "status": "ABERTO",
  "criadoEm": "2026-04-13T07:00:00.000Z",
  "finalizadoEm": null,
  "itens": [],
  "itensPage": {
    "itemLimit": 50,
    "nextItemCursor": null,
    "hasMore": false
  }
}
```

### `POST /:relatorioId/itens`
Cria item no relatorio aberto.

Body:

```json
{
  "perfilPessoa": "VISITANTE",
  "empresa": "CESLOG",
  "placaVeiculo": "ABC1D23",
  "nome": "Joao da Silva",
  "horaEntrada": "08:00",
  "horaSaida": null,
  "observacoes": "Entrega de material"
}
```

Erros:
- `404 REPORT_NOT_FOUND`
- `409 REPORT_CLOSED`

### `PUT /:relatorioId/itens/:itemId`
Atualiza item existente.

Erros:
- `404 ITEM_NOT_FOUND`
- `403 FORBIDDEN_ITEM_OWNER`
- `409 REPORT_CLOSED`

### `DELETE /:relatorioId/itens/:itemId`
Exclui item existente.

Erros:
- `404 ITEM_NOT_FOUND`
- `403 FORBIDDEN_ITEM_OWNER`
- `409 REPORT_CLOSED`

### `POST /:relatorioId/fechar`
Fecha o relatorio.

Erros:
- `404 REPORT_NOT_FOUND`

### `GET /relogio`
Retorna snapshot do relogio de negocio.

### `POST /relogio/simulacao`
Define horario de simulacao em ambiente nao-producao.

Body:

```json
{
  "start": "23:58"
}
```

Erros:
- `403 CLOCK_SIMULATION_FORBIDDEN`
