# shellcheck shell=bash
# Cópia dos dispositivos.ts gerados para a cópia de publicação ($WT).
# Biblioteca: só define funções. Carregada com `source` por scripts/publicar.sh;
# não tem set -e nem comandos de topo, para não mudar o modo do chamador.
# Os argumentos são caminhos absolutos: RAIZ (árvore principal) e WT (cópia de
# publicação). Nunca lê variável global do chamador.

# Apaga de $WT/src/conteudo as sobras de dispositivos.ts: arquivos com esse nome
# que o git ignora (são gerados, não rastreados). Nunca apaga arquivo rastreado,
# nem arquivo ignorado de outro nome, nem nada fora de src/conteudo. Depois
# remove só as pastas que ficaram vazias por causa disso: rmdir nunca apaga
# pasta com conteúdo. Devolve 1 (motivo em stderr) se $WT não for a raiz de um
# worktree git, para não varrer a árvore principal por engano.
# Atenção: quem chama com `||` desliga o set -e aqui dentro; por isso cada
# comando que pode falhar tem seu próprio `|| return 1`.
limpar_dispositivos_antigos() {
  local wt="$1" wt_real topo lista arq dir
  local -a achados=() apagar=()

  wt_real="$(cd "$wt" 2>/dev/null && pwd -P)" || wt_real=""
  topo="$(git -C "$wt" rev-parse --show-toplevel 2>/dev/null)" || topo=""
  if [ -z "$wt_real" ] || [ "$topo" != "$wt_real" ]; then
    echo "$wt não é a raiz de um worktree git: não apago dispositivos.ts ali" >&2
    return 1
  fi

  lista="$(mktemp "${TMPDIR:-/var/tmp}/dispositivos-lista.XXXXXX")" || return 1
  if ! git -C "$wt" ls-files --others --ignored --exclude-standard -z -- src/conteudo > "$lista"; then
    rm -f -- "$lista"
    echo "não consegui listar os arquivos ignorados de $wt" >&2
    return 1
  fi
  mapfile -d '' -t achados < "$lista"
  rm -f -- "$lista" || return 1

  for arq in "${achados[@]}"; do
    [ "${arq##*/}" = dispositivos.ts ] || continue
    case "$arq" in
      src/conteudo/*) ;;
      *) continue ;;
    esac
    case "$arq" in
      */../* | */..) continue ;;
    esac
    apagar+=("$arq")
  done

  if [ "${#apagar[@]}" -gt 0 ]; then
    (cd "$wt" && rm -f -- "${apagar[@]}") || return 1
  fi
  for arq in "${apagar[@]}"; do
    dir="${arq%/*}"
    while [ "${dir#src/conteudo/}" != "$dir" ] && [ -d "$wt/$dir" ]; do
      [ -z "$(ls -A -- "$wt/$dir")" ] || break
      rmdir -- "$wt/$dir" || return 1
      dir="${dir%/*}"
    done
  done
  echo "publicar: dispositivos.ts antigos removidos: ${#apagar[@]}"
}

# Limpa $WT e copia para lá os dispositivos.ts que existem hoje em
# $RAIZ/src/conteudo. Confere a árvore principal antes de apagar qualquer coisa:
# sem dispositivos.ts na origem, a cópia de publicação fica intacta e a função
# devolve 1 (motivo em stderr).
copiar_dispositivos_gerados() {
  local raiz="$1" wt="$2"
  local -a dispositivos=()
  mapfile -d '' -t dispositivos < <(cd "$raiz" && find src/conteudo -name dispositivos.ts -print0)
  if [ "${#dispositivos[@]}" -eq 0 ]; then
    echo "nenhum dispositivos.ts gerado em src/conteudo na árvore principal" >&2
    return 1
  fi
  limpar_dispositivos_antigos "$wt" || return 1
  (cd "$raiz" && cp --parents -- "${dispositivos[@]}" "$wt/") || return 1
  echo "publicar: dispositivos.ts copiados: ${#dispositivos[@]}"
}
