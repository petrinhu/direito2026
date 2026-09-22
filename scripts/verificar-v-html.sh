#!/usr/bin/env bash
# Portão de RI5 (docs/arquitetura.md, seção 4.4 e 18): v-html só recebe
# valor vindo de src/conteudo/ (campos que terminam em "Html": corpoHtml,
# exemploHtml, comentarioHtml, notaHtml). ESLint não distingue a ORIGEM de
# um dado, só a sintaxe do template (eslint.config.js já documenta isso);
# este script faz a parte que falta.
set -uo pipefail

ARQUIVOS_VUE=0
OCORRENCIAS_V_HTML=0
FALHARAM=0

while IFS= read -r -d '' arquivo; do
  ARQUIVOS_VUE=$((ARQUIVOS_VUE + 1))
  # Extrai o valor de cada v-html="..." do arquivo.
  while IFS= read -r valor; do
    [ -z "$valor" ] && continue
    OCORRENCIAS_V_HTML=$((OCORRENCIAS_V_HTML + 1))
    if ! printf '%s' "$valor" | grep -qE '(^|\.)[A-Za-z0-9_]*Html$'; then
      echo "v-html com origem suspeita em $arquivo: v-html=\"$valor\"" >&2
      FALHARAM=$((FALHARAM + 1))
    fi
  done < <(grep -oE 'v-html="[^"]*"' "$arquivo" | sed -E 's/^v-html="(.*)"$/\1/')
done < <(find src/ui -name '*.vue' -print0)

echo "arquivos .vue varridos: $ARQUIVOS_VUE / ocorrências de v-html analisadas: $OCORRENCIAS_V_HTML"

if [ "$ARQUIVOS_VUE" -eq 0 ]; then
  echo "verificar-v-html: zero arquivo .vue varrido é portão quebrado" >&2
  exit 1
fi

if [ "$FALHARAM" -gt 0 ]; then
  exit 1
fi

exit 0
