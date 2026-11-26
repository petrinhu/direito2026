#!/usr/bin/env bash
# Recibo da rodada de navegador do portão (CISO-52-PUBLICAR, decisão do líder de 25/11/2026: "Recibo
# do teste (Recomendado). O teste roda na fila normal e grava um recibo. A publicação recusa se essas
# partes mudaram e o recibo não confere. Custa quase nada na hora de publicar.").
#
# Partes cobertas (cadência CISO-CAD-E2E): public/api (inclui as telas do servidor, public/api/nucleo/telas.php)
# e tests/e2e-portao. A rodada é `npm run test:e2e:portao` (chromium e brave), inteira, sem filtro.
#
# Uso:
#   recibo-navegador.sh caminho     imprime o caminho do recibo (fora do git)
#   recibo-navegador.sh hash        imprime o hash do conteúdo das partes no HEAD
#   recibo-navegador.sh gravar      roda a rodada inteira e, com rc=0 e partes limpas, grava o recibo
#   recibo-navegador.sh conferir    rc=0 se as partes estão intactas desde a última tag v* ou se o recibo
#                                   confere (hash atual e resultado verde); senão rc=1 e a frase com o comando
#
# A rodada é para a fila normal: rode `gravar` com ~/.claude/bin/pesado -- (um pesado por vez na máquina).
#
# "Mudaram" = o hash das partes no HEAD difere do hash delas na última tag v*. Sem tag v*, não há base:
# as partes contam como mudadas. O hash é de conteúdo (ls-tree), não do disco e não do SHA, então um commit
# de release que não toca as partes não exige recibo novo.
#
# RECIBO_RAIZ troca a árvore (uso dos testes). RECIBO_PASTA troca a pasta do recibo (uso dos testes).
# Sem elas: a árvore do próprio script, e $XDG_STATE_HOME ou $HOME/.local/state em caderno-publicar/recibos (700).
set -uo pipefail

RAIZ="${RECIBO_RAIZ:-$(cd "$(dirname "$0")/../.." && pwd -P)}"
PARTES=(public/api tests/e2e-portao)
COMANDO_GRAVAR="bash scripts/apoio/recibo-navegador.sh gravar"

pasta() {
  if [ -n "${RECIBO_PASTA:-}" ]; then
    printf '%s\n' "$RECIBO_PASTA"
    return 0
  fi
  printf '%s\n' "${XDG_STATE_HOME:-$HOME/.local/state}/caderno-publicar/recibos"
}

caminho() {
  printf '%s/navegador.recibo\n' "$(pasta)"
}

# Hash do conteúdo das partes num commit: ids de árvore e de blob, que não dependem do disco.
hash_no_commit() {
  git -C "$RAIZ" ls-tree -r "$1" -- "${PARTES[@]}" | sha256sum | cut -d' ' -f1
}

ultima_tag() {
  git -C "$RAIZ" tag --list 'v[0-9]*' --sort=-v:refname | head -n 1
}

hash_da_ultima_tag() {
  local tag
  tag="$(ultima_tag)"
  [ -n "$tag" ] || return 0
  hash_no_commit "$(git -C "$RAIZ" rev-list -n 1 "$tag")"
}

gravar() {
  local sha hash rc dir tmp arquivo
  sha="$(git -C "$RAIZ" rev-parse HEAD)" || return 1
  if [ -n "$(git -C "$RAIZ" status --porcelain -- "${PARTES[@]}")" ]; then
    echo "recibo: as partes têm mudança sem commit; commite antes de gravar o recibo (nada gravado)" >&2
    return 1
  fi
  hash="$(hash_no_commit HEAD)"
  (cd "$RAIZ" && npm run test:e2e:portao)
  rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "recibo: a rodada de navegador reprovou (rc=$rc); nada gravado" >&2
    return 1
  fi
  arquivo="$(caminho)"
  dir="$(dirname -- "$arquivo")"
  (umask 077 && mkdir -p -- "$dir") || return 1
  tmp="$(mktemp -- "$dir/.recibo.XXXXXX")" || return 1
  if printf 'sha=%s\npartes=%s\nresultado=verde\nnavegadores=chromium,brave\ndata=%s\n' \
    "$sha" "$hash" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$tmp" &&
    chmod 600 -- "$tmp" && mv -f -- "$tmp" "$arquivo"; then
    echo "recibo: gravado para o SHA $sha (partes $hash)"
    return 0
  fi
  rm -f -- "$tmp"
  return 1
}

conferir() {
  local atual base arquivo hash_recibo resultado motivo tag
  atual="$(hash_no_commit HEAD)"
  base="$(hash_da_ultima_tag)"
  tag="$(ultima_tag)"
  if [ -n "$base" ] && [ "$atual" = "$base" ]; then
    echo "recibo: partes do navegador intactas desde $tag: não precisam de recibo"
    return 0
  fi
  arquivo="$(caminho)"
  if [ -f "$arquivo" ] && [ ! -L "$arquivo" ]; then
    hash_recibo="$(grep -m1 '^partes=' -- "$arquivo" | cut -d= -f2-)"
    resultado="$(grep -m1 '^resultado=' -- "$arquivo" | cut -d= -f2-)"
    if [ "$hash_recibo" = "$atual" ] && [ "$resultado" = verde ]; then
      echo "recibo: confere com as partes atuais (verde)"
      return 0
    fi
    motivo="o recibo não confere com as partes atuais (outro conteúdo, ou resultado que não é verde)"
  elif [ -z "$tag" ]; then
    motivo="não há tag v* para comparar, e não há recibo"
  else
    motivo="não há recibo"
  fi
  echo "recibo: as partes do navegador (public/api e tests/e2e-portao) mudaram desde ${tag:-a origem}, e $motivo." >&2
  echo "recibo: rode a rodada pela fila do pesado: ~/.claude/bin/pesado -- $COMANDO_GRAVAR" >&2
  return 1
}

case "${1:-}" in
  caminho) caminho ;;
  hash) hash_no_commit HEAD ;;
  gravar) gravar ;;
  conferir) conferir ;;
  *)
    echo "uso: recibo-navegador.sh caminho | hash | gravar | conferir" >&2
    exit 2
    ;;
esac
