#!/usr/bin/env bash
# Roda, na máquina local, a sequência de verificações de um CI, no molde da
# seção T15 do manual de testes (pré-CI, com o modelo Node/TypeScript da T15.4).
# O repositório não tem CI na nuvem: este pré-CI fica no lugar dele. Sai no
# primeiro passo que falhar, para que o problema apareça antes do push, não depois.
#
# PRECI-SELETIVO: os passos de segurança rodam sempre (cifra, partição, travessão, geração,
# construção com o portão de pacote publicável, varreduras do dist e do restrito). Os de
# qualidade (lint, prettier, depcruise, vue-tsc, vitest, validação e citações do conteúdo,
# suíte PHP) rodam só quando a mudança desde o último pré-CI verde os toca; a regra vem impressa na
# linha do "── nome ──" de cada passo pulado. Sem último verde válido, ou com PRECI_COMPLETO=1, ou com
# mudança em scripts/ e configs da raiz, tudo roda (completo). O portão de pacote real roda
# sempre, mesmo quando a suíte PHP é pulada. Ver scripts/apoio/preciSeletivo.ts e
# scripts/apoio/preciBaseVerde.sh (o SHA do último verde mora fora do git).
set -uo pipefail
cd "$(dirname "$0")/.."

# Todo passo sai aqui no primeiro que falhar: nenhum passo seguinte roda. publicar.sh lê só o
# código de saída e as linhas "FALHOU:" do log, então um único FALHOU é o que ele precisa.
passo() {
  local nome="$1" inicio=$SECONDS
  shift
  if "$@"; then
    echo "── $nome ── $((SECONDS - inicio))s"
    return 0
  fi
  echo "── $nome ── $((SECONDS - inicio))s"
  echo "FALHOU: $nome" >&2
  echo "preci: parou neste passo, os seguintes não rodaram (total ${SECONDS}s)" >&2
  exit 1
}

# Passo seletivo pulado: a linha diz a regra, e o total não muda.
pular() {
  echo "── $1 ── $2"
}

# Portões da cifra (plano do CTO do login único, 6.2 a 6.3; L-36). Primeiro: se o git-crypt
# falhar, nenhum portão seguinte roda sobre ciphertext (T7). Sai no próprio passo().
passo "cifra: árvore destravada, blobs com magia, sem nome proibido" node --import tsx scripts/verificar-git-crypt.ts
passo "partição: trecho de texto de estudo cifrado (fonte: strings das unidades de src/conteudo, janela de 40) em arquivo em claro; caminho cifrado sem classe reprova" node --import tsx scripts/verificar-particao.ts
passo "travessão no que chega ao leitor (U+2014, U+2013; isenção só em blocos do texto integral)" bash scripts/verificar-travessao-arvore.sh

# Plano seletivo: arquivos mudados desde o último pré-CI verde. core.quotePath=false faz o git listar
# acento como está, e não entre aspas e em octal, que o classificador leria como outro caminho.
# O commit testado é o HEAD desta rodada, e só é gravado como verde se a árvore estava limpa (fim do script).
HEAD_TESTADO=$(git rev-parse HEAD 2>/dev/null || true)
ARVORE_LIMPA=0
[ -z "$(git status --porcelain --untracked-files=no 2>/dev/null)" ] && ARVORE_LIMPA=1
# Base: PRECI_BASE_VERDE definida (mesmo vazia) é o modo publicar, que lê o estado fora da caixa e
# grava depois da release, do lado de fora. Sem ela, o preci lê e grava o estado sozinho.
GRAVA_VERDE=0
if [ -n "${PRECI_BASE_VERDE+x}" ]; then
  BASE=$(bash scripts/apoio/preciBaseVerde.sh validar "$PRECI_BASE_VERDE")
else
  BASE=$(bash scripts/apoio/preciBaseVerde.sh ler)
  GRAVA_VERDE=1
fi
ARQUIVOS=$(mktemp)
if [ -n "$BASE" ]; then
  git -c core.quotePath=false diff --name-only "$BASE" HEAD > "$ARQUIVOS" ||
    { echo "FALHOU: plano do preci (git diff)" >&2; exit 1; }
fi
PLANO=$(node --import tsx scripts/apoio/preciSeletivo.ts --base "$BASE" --arquivos "$ARQUIVOS" --completo "${PRECI_COMPLETO:-0}") ||
  { echo "FALHOU: plano do preci (classificação)" >&2; exit 1; }
rm -f "$ARQUIVOS"
eval "$PLANO"
if [ "$PRECI_COMPLETO" = 1 ]; then
  echo "preci: modo completo ($PRECI_MOTIVO)"
else
  echo "preci: modo seletivo, base ${BASE:-nenhuma}"
fi

# Lista do plano em vetor de palavras (caminhos sem espaço: o classificador recusa o contrário).
alvo_em() { read -ra "$1" <<< "$2"; }

if [ "$PRECI_LINT_RODA" = 1 ]; then
  if [ "$PRECI_LINT_ALVO" = TODOS ]; then
    passo "lint" npx eslint . --max-warnings 0
  else
    alvo_em A "$PRECI_LINT_ALVO"
    passo "lint (arquivos mudados)" npx eslint --max-warnings 0 "${A[@]}"
  fi
else
  pular "lint" "$PRECI_LINT_MOTIVO"
fi

if [ "$PRECI_PRETTIER_RODA" = 1 ]; then
  if [ "$PRECI_PRETTIER_ALVO" = TODOS ]; then
    passo "formatação" npx prettier --check .
  else
    alvo_em A "$PRECI_PRETTIER_ALVO"
    passo "formatação (arquivos mudados)" npx prettier --check "${A[@]}"
  fi
else
  pular "formatação" "$PRECI_PRETTIER_MOTIVO"
fi

if [ "$PRECI_DEPCRUISE_RODA" = 1 ]; then
  passo "camadas (dependency-cruiser)" npx depcruise src --config .dependency-cruiser.cjs
else
  pular "camadas (dependency-cruiser)" "$PRECI_DEPCRUISE_MOTIVO"
fi

passo "v-html só de src/conteudo" bash scripts/verificar-v-html.sh

# Geração é pré-requisito do build e do vitest (os dispositivos são ignorados pelo git, então
# uma clone nova não os tem). Sempre roda.
passo "gerar subconjunto de dispositivos por unidade" node --import tsx scripts/gerar-dispositivos-por-unidade.ts
passo "gerar índice de busca" node --import tsx scripts/gerar-indice-busca.ts

if [ "$PRECI_VUE_TSC_RODA" = 1 ]; then
  passo "tipos (vue-tsc, depois da geração: vê o que o build vê)" npx vue-tsc --noEmit
else
  pular "tipos (vue-tsc)" "$PRECI_VUE_TSC_MOTIVO"
fi

if [ "$PRECI_CONTEUDO_RODA" = 1 ]; then
  passo "citações resolvem no catálogo" node --import tsx scripts/verificar-dispositivos.ts
  passo "validação do conteúdo, toda unidade descoberta" node --import tsx scripts/validar-conteudo.ts
  passo "termos proibidos (R3), fonte" bash scripts/verificar-proibicoes.sh src
else
  pular "citações resolvem no catálogo" "$PRECI_CONTEUDO_MOTIVO"
  pular "validação do conteúdo, toda unidade descoberta" "$PRECI_CONTEUDO_MOTIVO"
  pular "termos proibidos (R3), fonte" "$PRECI_CONTEUDO_MOTIVO"
fi

passo "termos proibidos (R3), público" bash scripts/verificar-proibicoes.sh public
# Incondicional (LU-F1.3-N3): README, CLAUDE, docs em claro e nomes de todos os rastreados, cifrados inclusive.
passo "termos proibidos (R3), amplo: README, CLAUDE, docs em claro e nomes rastreados" bash scripts/verificar-proibicoes.sh --amplo .

if [ "$PRECI_VITEST_RODA" = 1 ]; then
  if [ "$PRECI_VITEST_ALVO" = TODOS ]; then
    passo "testes unitários, de componente e de caracterização" npx vitest run tests/unidade tests/componente tests/caracterizacao
  else
    alvo_em A "$PRECI_VITEST_ALVO"
    passo "testes dos arquivos mudados (e caracterização, se o conteúdo mudou)" npx vitest related --run --passWithNoTests "${A[@]}"
  fi
else
  pular "testes unitários, de componente e de caracterização" "$PRECI_VITEST_MOTIVO"
fi

# Construção: vite, pacote separado (dist-pacote) e o portão de pacote publicável. Sempre roda.
# A parte de verificação do build (geração, vue-tsc, validação) é feita nos passos acima; o
# build:construir não a repete. npm run build, o comando completo, continua igual.
passo "construção (vite, pacote separado, portão de pacote publicável)" npm run build:construir
passo "webroot separado: só a lista fechada, sem termo e sem trecho de src/conteudo" node --import tsx scripts/verificar-webroot-sem-conteudo.ts
passo "nome do titular só na fonte permitida (árvore e pacote)" node --import tsx scripts/verificar-nome-autor.ts --arvore . --pacote dist-pacote
passo "termos proibidos (R3), dist" bash scripts/verificar-proibicoes.sh dist
passo "vazamento do conteúdo restrito (dist, árvore e histórico)" node --import tsx scripts/verificar-conteudo-restrito.ts
passo "vazamento do conteúdo da Júri (dist; sem JSON, só com a cadeira publicada)" node --import tsx scripts/verificar-conteudo-restrito-juri.ts
passo "e-mail fora da lista (sem endereço real na árvore; EM-B1)" bash scripts/verificar-emails.sh

# Suíte PHP inteira só quando o servidor mudou (ou completo). Ela inclui o grupo "pacote real".
# Quando não roda, o grupo "pacote real" (portao-pacote.teste.php: tipo e CSP por HTTP, com
# sessão, no pacote que este build acabou de gerar) roda SEMPRE, em toda publicação: o pacote
# muda a cada build, então o teste é portão de segurança, não seletivo (PRECI-CONFIG-PACOTE).
if [ "$PRECI_PHP_RODA" = 1 ]; then
  passo "suíte PHP da área restrita (servidor/testes)" php servidor/testes/rodar.php
else
  pular "suíte PHP da área restrita (servidor/testes)" "$PRECI_PHP_MOTIVO"
  if [ "$PRECI_PACOTE_REAL_RODA" = 1 ]; then
    passo "portão de pacote real, sempre (tipo e CSP por HTTP, com sessão, no pacote)" php servidor/testes/rodar.php "$PRECI_PACOTE_REAL_FILTRO"
  fi
fi

# Chegou aqui = todo passo passou (passo() sai no primeiro erro). Grava o HEAD testado como último verde
# só no modo direto (GRAVA_VERDE=1) e só com a árvore limpa; uma falha de gravação não reprova a rodada:
# só deixa a próxima rodada completa.
if [ "$GRAVA_VERDE" = 1 ]; then
  if [ "$ARVORE_LIMPA" = 1 ] && [ -n "$HEAD_TESTADO" ]; then
    bash scripts/apoio/preciBaseVerde.sh gravar "$HEAD_TESTADO" ||
      echo "preci: AVISO: não gravei o último verde (a próxima rodada sai completa)" >&2
  else
    echo "preci: AVISO: árvore suja, o último verde não foi gravado (a próxima rodada sai completa)" >&2
  fi
fi

echo "preci: tudo verde (total ${SECONDS}s)"
