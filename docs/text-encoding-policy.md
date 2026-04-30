# Política de Texto e Encoding

## Padrão do projeto
- Idioma de interface: PT-BR com acentuação correta.
- Encoding obrigatório: UTF-8 sem BOM.
- Quebra de linha: LF (`\n`).

## Regras práticas
- Não usar substituição ASCII para palavras PT-BR de UI (ex.: usar `usuário`, não `usuario`).
- Evitar copiar conteúdo de fontes que podem inserir caracteres invisíveis sem revisar o diff.
- Em caso de dúvida, rodar checagem de encoding antes de commit.

## Comandos
- Validar encoding no repositório:
  - `npm run encoding:check`
- Corrigir BOM em massa:
  - `npm run encoding:fix`

## Observação
- O script de check falha se encontrar BOM ou padrões comuns de mojibake.
