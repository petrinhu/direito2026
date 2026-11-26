#!/usr/bin/env bash
# Último pré-CI verde do Caderno: o SHA do commit que passou no preci inteiro, guardado FORA do git,
# por usuário (decisão do líder de 26/11, L-35). É a base do pré-CI seletivo: o preci compara o HEAD
# com esse SHA. Sem SHA válido, a rodada sai completa.
#
# Uso:
#   preciBaseVerde.sh caminho            imprime o caminho do arquivo de estado
#   preciBaseVerde.sh ler                imprime o SHA gravado, se for válido neste repositório; senão nada
#   preciBaseVerde.sh validar <sha>      imprime o SHA, se for válido neste repositório; senão nada
#   preciBaseVerde.sh gravar <sha>       grava o SHA no arquivo de estado (modo 600, escrita atômica)
#
# Válido = 40 hexadecimais, commit que existe no repositório e ancestral do HEAD. Qualquer outra coisa
# vira "nada", e "nada" quer dizer rodada completa: a dúvida nunca vira seletivo.
#
# CADERNO_PRECI_ESTADO troca o caminho do arquivo (uso dos testes). Sem ele: $XDG_STATE_HOME ou
# $HOME/.local/state, em caderno-preci/ultimo-verde.
set -uo pipefail

caminho() {
  if [ -n "${CADERNO_PRECI_ESTADO:-}" ]; then
    printf '%s\n' "$CADERNO_PRECI_ESTADO"
    return 0
  fi
  printf '%s\n' "${XDG_STATE_HOME:-$HOME/.local/state}/caderno-preci/ultimo-verde"
}

validar() {
  local sha="${1:-}"
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || return 0
  git cat-file -e "$sha^{commit}" 2>/dev/null || return 0
  git merge-base --is-ancestor "$sha" HEAD 2>/dev/null || return 0
  printf '%s\n' "$sha"
}

ler() {
  local arquivo sha=""
  arquivo="$(caminho)"
  if [ -f "$arquivo" ]; then
    sha="$(head -c 100 -- "$arquivo" | tr -d '[:space:]')"
  fi
  validar "$sha"
}

gravar() {
  local sha="${1:-}" arquivo dir tmp
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "preciBaseVerde: SHA inválido, nada gravado" >&2; return 1; }
  git cat-file -e "$sha^{commit}" 2>/dev/null ||
    { echo "preciBaseVerde: commit não existe neste repositório, nada gravado" >&2; return 1; }
  arquivo="$(caminho)"
  dir="$(dirname -- "$arquivo")"
  (umask 077 && mkdir -p -- "$dir") || return 1
  tmp="$(mktemp -- "$dir/.ultimo-verde.XXXXXX")" || return 1
  if printf '%s\n' "$sha" > "$tmp" && chmod 600 -- "$tmp" && mv -f -- "$tmp" "$arquivo"; then
    return 0
  fi
  rm -f -- "$tmp"
  return 1
}

case "${1:-}" in
  caminho) caminho ;;
  ler) ler ;;
  validar) validar "${2:-}" ;;
  gravar) gravar "${2:-}" ;;
  *)
    echo "uso: preciBaseVerde.sh caminho | ler | validar <sha> | gravar <sha>" >&2
    exit 2
    ;;
esac
