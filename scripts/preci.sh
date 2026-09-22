#!/usr/bin/env bash
# Roda, na máquina local, a mesma sequência que o CI roda (seção 14 e T15.4
# do manual de testes). Sai no primeiro passo que falhar, para que o
# problema apareça antes do push, não depois.
set -uo pipefail
cd "$(dirname "$0")/.."

falhou=0
passo() {
  local nome="$1"
  shift
  echo "── $nome ──"
  if ! "$@"; then
    echo "FALHOU: $nome" >&2
    falhou=1
  fi
}

passo "tipos (vue-tsc)" npx vue-tsc --noEmit
passo "lint" npx eslint . --max-warnings 0
passo "formatação" npx prettier --check .
passo "camadas (dependency-cruiser)" npx depcruise src --config .dependency-cruiser.cjs
passo "v-html só de src/conteudo" bash scripts/verificar-v-html.sh
passo "gerar subconjunto de dispositivos por unidade" node --import tsx scripts/gerar-dispositivos-por-unidade.ts
passo "gerar índice de busca" node --import tsx scripts/gerar-indice-busca.ts
passo "citações resolvem no catálogo" node --import tsx scripts/verificar-dispositivos.ts
passo "termos proibidos (R3), fonte" bash scripts/verificar-proibicoes.sh src
passo "termos proibidos (R3), público" bash scripts/verificar-proibicoes.sh public
passo "testes unitários e de componente" npx vitest run tests/unidade tests/componente

if [ "$falhou" -ne 0 ]; then
  echo "preci: um ou mais passos falharam" >&2
  exit 1
fi

echo "preci: tudo verde"
