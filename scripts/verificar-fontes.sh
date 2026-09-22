#!/usr/bin/env bash
# Portão da seção 10 da arquitetura: reprova a construção se algum .woff2
# em dist/ passar de 60 KB, ou se sobrar a sequência "data:font" em
# qualquer arquivo de dist/ (fonte embutida em base64, o problema medido
# no piloto: ~490 KB de @font-face inline).
#
# Achado do líder, 22/09/2026: nada aqui embaixo conferia se a fonte SERVE
# de verdade, só se HÁ arquivo. O recorte do commit a68fc44 tinha 129
# glifos por arquivo (passava neste portão sem problema), dos quais só a
# letra "A" maiúscula - zero minúsculas, zero dígitos, zero acentuação.
# scripts/verificar-fontes-glifos.py fecha esse buraco, lendo o arquivo de
# verdade (fontTools) e conferindo o conjunto mínimo (26 maiúsculas, 26
# minúsculas, dígitos, acentuação pt-br).
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="${1:-dist}"

if [ ! -d "$DIST" ]; then
  echo "verificar-fontes: pasta ausente: $DIST (rode 'npm run build' antes)" >&2
  exit 1
fi

TETO_BYTES=$((60 * 1024))
ARQUIVOS_WOFF2=0
FALHOU=0

while IFS= read -r -d '' arquivo; do
  ARQUIVOS_WOFF2=$((ARQUIVOS_WOFF2 + 1))
  tamanho=$(stat -c%s "$arquivo" 2>/dev/null || stat -f%z "$arquivo")
  if [ "$tamanho" -gt "$TETO_BYTES" ]; then
    echo "fonte grande demais: $arquivo tem $tamanho bytes (teto $TETO_BYTES)" >&2
    FALHOU=1
  fi
done < <(find "$DIST" -name '*.woff2' -print0)

echo "arquivos .woff2 varridos: $ARQUIVOS_WOFF2"

if [ "$ARQUIVOS_WOFF2" -eq 0 ]; then
  echo "verificar-fontes: zero .woff2 encontrado em dist/, verifique se as fontes foram servidas" >&2
  FALHOU=1
fi

OCORRENCIAS_DATA_FONT=$(grep -rl 'data:font' "$DIST" 2>/dev/null | wc -l || true)
if [ "$OCORRENCIAS_DATA_FONT" -gt 0 ]; then
  echo "fonte embutida em base64 encontrada em $OCORRENCIAS_DATA_FONT arquivo(s) de $DIST" >&2
  grep -rl 'data:font' "$DIST" >&2 || true
  FALHOU=1
fi

if ! python3 "$AQUI/verificar-fontes-glifos.py" "$DIST"; then
  FALHOU=1
fi

if [ "$FALHOU" -ne 0 ]; then
  exit 1
fi

exit 0
