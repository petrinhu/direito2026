#!/usr/bin/env bash
# Portão pós-build (achado do líder, 22/09/2026): o pacote publicado nunca
# pode conter arquivo de mapa de código nem caminho absoluto de máquina.
# Um mapa de código (sw.js.map, workbox-*.js.map, *.js.map) carrega o
# caminho de disco de quem construiu; publicar isso expõe a estrutura de
# pastas pessoal do líder num site aberto.
#
# Uso: scripts/verificar-pacote-publicavel.sh [dist]
set -uo pipefail

DIST="${1:-dist}"

if [ ! -d "$DIST" ]; then
  echo "verificar-pacote-publicavel: pasta ausente: $DIST (rode 'npm run build' antes)" >&2
  exit 1
fi

ARQUIVOS_ANALISADOS=0
FALHARAM=0

# 1) nenhum arquivo de mapa de código.
MAPAS_ENCONTRADOS=$(find "$DIST" -name '*.map' | wc -l)
if [ "$MAPAS_ENCONTRADOS" -gt 0 ]; then
  echo "arquivo(s) de mapa de código encontrado(s) em $DIST:" >&2
  find "$DIST" -name '*.map' >&2
  FALHARAM=$((FALHARAM + MAPAS_ENCONTRADOS))
fi

# 2) nenhum caminho absoluto de máquina. Três padrões, sem depender de
# conhecer o usuário: o $HOME real desta máquina (mais específico), e os
# formatos genéricos de home de Linux/macOS/Windows (para pegar também
# caminho de OUTRA máquina que tenha vazado para dentro do bundle).
PADROES=("$HOME" '/home/[a-zA-Z0-9_-]+/' '/Users/[a-zA-Z0-9_-]+/' 'C:\\\\Users\\\\')

while IFS= read -r -d '' arquivo; do
  ARQUIVOS_ANALISADOS=$((ARQUIVOS_ANALISADOS + 1))
  for padrao in "${PADROES[@]}"; do
    if grep -aqE -- "$padrao" "$arquivo" 2>/dev/null; then
      echo "caminho absoluto de máquina encontrado em $arquivo (padrão: $padrao)" >&2
      grep -aoE -- "$padrao[^\"'\`) ]*" "$arquivo" 2>/dev/null | sort -u | sed 's/^/    /' >&2
      FALHARAM=$((FALHARAM + 1))
    fi
  done
done < <(find "$DIST" -type f -print0)

echo "encontrados: $MAPAS_ENCONTRADOS mapa(s) de código / analisados: $ARQUIVOS_ANALISADOS arquivo(s) / falharam: $FALHARAM"

if [ "$ARQUIVOS_ANALISADOS" -eq 0 ]; then
  echo "verificar-pacote-publicavel: zero arquivo analisado é portão quebrado, não pacote limpo" >&2
  exit 1
fi

if [ "$FALHARAM" -gt 0 ]; then
  exit 1
fi

exit 0
