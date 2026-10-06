#!/usr/bin/env bash
# Portão de RI5 (docs/arquitetura.md, seção 4.4 e 18): v-html só recebe
# valor vindo de src/conteudo/ (campos que terminam em "Html": corpoHtml,
# exemploHtml, comentarioHtml, notaHtml). ESLint não distingue a ORIGEM de
# um dado, só a sintaxe do template (eslint.config.js já documenta isso);
# este script faz a parte que falta.
#
# Regras (cada uma provada vermelha, ver docs/arquitetura.md, "Área restrita"):
#   1. a expressão do v-html termina em "Html";
#   2. v-html só pode existir nos componentes da ALLOWLIST nominal abaixo
#      (caminhos relativos a src/ui). Um v-html novo, mesmo com expressão
#      terminada em "Html", falha até alguém decidir, por escrito, que aquele
#      componente pode receber HTML;
#   3. nenhum innerHTML, outerHTML, insertAdjacentHTML nem document.write em src/.
#
# A allowlist mora aqui, e não num arquivo de dados, de propósito: mexer nela
# aparece no diff como mudança de segurança.
#
# VERIFICAR_V_HTML_RAIZ (opcional) aponta para uma cópia de src/ui, para provar
# o portão vermelho fora da árvore (L-36).
set -uo pipefail

RAIZ_UI="${VERIFICAR_V_HTML_RAIZ:-src/ui}"
RAIZ_SRC="$(dirname "$RAIZ_UI")"

# Componentes que podem usar v-html, e de onde vem o HTML de cada um:
#   componentes/BlocoTeorico.vue       corpoHtml, exemploHtml: src/conteudo OU conteúdo
#                                      restrito, este SÓ depois de validarConteudoRestrito
#   componentes/CartaoPergunta.vue     enunciado, alternativas e explicação: idem
#   componentes/PecaComentadaVisor.vue petição comentada: src/conteudo
ALLOWLIST_V_HTML=(
  "componentes/BlocoTeorico.vue"
  "componentes/CartaoPergunta.vue"
  "componentes/PecaComentadaVisor.vue"
)

ARQUIVOS_VUE=0
OCORRENCIAS_V_HTML=0
FALHARAM=0

na_allowlist() {
  local relativo="$1" item
  for item in "${ALLOWLIST_V_HTML[@]}"; do
    [ "$item" = "$relativo" ] && return 0
  done
  return 1
}

while IFS= read -r -d '' arquivo; do
  ARQUIVOS_VUE=$((ARQUIVOS_VUE + 1))
  relativo="${arquivo#"$RAIZ_UI"/}"
  tem_v_html=0
  # Extrai o valor de cada v-html="..." do arquivo.
  while IFS= read -r valor; do
    [ -z "$valor" ] && continue
    tem_v_html=1
    OCORRENCIAS_V_HTML=$((OCORRENCIAS_V_HTML + 1))
    if ! printf '%s' "$valor" | grep -qE '(^|\.)[A-Za-z0-9_]*Html$'; then
      echo "v-html com origem suspeita em $arquivo: v-html=\"$valor\"" >&2
      FALHARAM=$((FALHARAM + 1))
    fi
  done < <(grep -oE 'v-html="[^"]*"' "$arquivo" | sed -E 's/^v-html="(.*)"$/\1/')
  # v-html com aspas simples ou sem aspas também conta como uso (menção em comentário não).
  if [ "$tem_v_html" -eq 0 ] && grep -qE 'v-html[[:space:]]*=' "$arquivo"; then
    tem_v_html=1
    OCORRENCIAS_V_HTML=$((OCORRENCIAS_V_HTML + 1))
    echo "v-html em forma não analisável em $arquivo" >&2
    FALHARAM=$((FALHARAM + 1))
  fi
  if [ "$tem_v_html" -eq 1 ] && ! na_allowlist "$relativo"; then
    echo "v-html fora da allowlist nominal em $arquivo (ver scripts/verificar-v-html.sh)" >&2
    FALHARAM=$((FALHARAM + 1))
  fi
done < <(find "$RAIZ_UI" -name '*.vue' -print0)

ARQUIVOS_FONTE=0
INJECOES_DIRETAS=0
while IFS= read -r -d '' arquivo; do
  ARQUIVOS_FONTE=$((ARQUIVOS_FONTE + 1))
  if grep -qE 'innerHTML|outerHTML|insertAdjacentHTML|document\.write' "$arquivo"; then
    echo "injeção direta de HTML em $arquivo (innerHTML, outerHTML, insertAdjacentHTML ou document.write)" >&2
    INJECOES_DIRETAS=$((INJECOES_DIRETAS + 1))
    FALHARAM=$((FALHARAM + 1))
  fi
done < <(find "$RAIZ_SRC" \( -name '*.vue' -o -name '*.ts' \) -print0)

echo "arquivos .vue varridos: $ARQUIVOS_VUE / ocorrências de v-html analisadas: $OCORRENCIAS_V_HTML / arquivos de src varridos para injeção direta: $ARQUIVOS_FONTE / injeções diretas: $INJECOES_DIRETAS"

if [ "$ARQUIVOS_VUE" -eq 0 ] || [ "$ARQUIVOS_FONTE" -eq 0 ]; then
  echo "verificar-v-html: zero arquivo varrido é portão quebrado" >&2
  exit 1
fi

if [ "$FALHARAM" -gt 0 ]; then
  exit 1
fi

exit 0
