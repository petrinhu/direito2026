#!/usr/bin/env bash
# Comando único de publicação do Caderno de Direito (npm run publicar).
#
# Uso:
#   npm run publicar -- <recurso|correcao|construcao> [--versao A.B.C.D] [--seco]
#
# Ordem: confere branch e árvore; calcula a versão pela regra A.B.C.D; grava
# package.json e commita chore(release); cria a tag anotada; prepara
# .worktrees/pub no commit da tag e roda o preci; publica por rsync em duas
# etapas; confere o ar (md5 de cada arquivo, API, raiz intacta e
# scripts/verificar-publicacao.sh); só então envia branch e tag ao GitHub.
#
# --seco: confere e imprime o plano, sem alterar nada.
# Se o preci falhar, desfaz SÓ o que este script fez (tag e commit de release
# locais). Depois do rsync não desfaz nada: remoto não tem desfazer automático.
# Nunca imprime segredo nem o conteúdo de CADERNO_RESTRITO. Sem --no-verify,
# sem force, sem amend (GODS_LAWS L-24, L-25).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$RAIZ"

BRANCH_PUBLICA=main
REMOTO=github
DOMINIO=https://direito2026.drpetrus.top
DESTINO_RSYNC=hostinger:domains/drpetrus.top/public_html/direito2026/
RAIZ_PRINCIPAL=https://drpetrus.top/
MD5_RAIZ_PRINCIPAL=6e66aeb03564
CONTEUDO_RESTRITO_PADRAO=/home/petrus/IDrive/Documentos/direito/site_direito2026_restrito/conteudo/interdisciplinar.json
PRECI_TMPDIR=/var/tmp/preci-pub
WT="$RAIZ/.worktrees/pub"
CONTEUDO_RESTRITO="${CADERNO_RESTRITO:-$CONTEUDO_RESTRITO_PADRAO}"

TIPO=""
VERSAO_FORCADA=""
FORCADA_DEFINIDA=0
SECO=0
VERSAO_ATUAL=""
VERSAO_NOVA=""
SHA_RELEASE=""
ESPACO=""

# Estado para desfazer só o que foi criado aqui (lido pelo trap de saída).
PACKAGE_ALTERADO=0
RELEASE_FEITO=0
TAG_CRIADA=0
DEPLOY_INICIADO=0
DIVERGENCIAS=0

recusar() {
  echo "publicar: RECUSADO: $*" >&2
  exit 1
}

uso() {
  echo "uso: npm run publicar -- <recurso|correcao|construcao> [--versao A.B.C.D] [--seco]" >&2
  exit 1
}

ler_argumentos() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --seco)
        SECO=1
        shift
        ;;
      --versao)
        [ $# -ge 2 ] || uso
        VERSAO_FORCADA="$2"
        FORCADA_DEFINIDA=1
        shift 2
        ;;
      --versao=*)
        VERSAO_FORCADA="${1#--versao=}"
        FORCADA_DEFINIDA=1
        shift
        ;;
      -*)
        echo "publicar: opção desconhecida: $1" >&2
        uso
        ;;
      *)
        [ -z "$TIPO" ] || uso
        TIPO="$1"
        shift
        ;;
    esac
  done
  [ -n "$TIPO" ] || uso
  case "$TIPO" in
    recurso | correcao | construcao) ;;
    *) recusar "tipo \"$TIPO\" inválido: use recurso, correcao ou construcao" ;;
  esac
}

conferir_branch_e_arvore() {
  local ramo sujos
  ramo="$(git symbolic-ref --short -q HEAD || true)"
  [ "$ramo" = "$BRANCH_PUBLICA" ] ||
    recusar "a publicação só sai da branch $BRANCH_PUBLICA (agora: ${ramo:-HEAD destacado})"
  sujos="$(git status --porcelain --untracked-files=no)"
  if [ -n "$sujos" ]; then
    echo "$sujos" >&2
    recusar "há mudanças não commitadas em arquivos rastreados (listadas acima); commite ou descarte antes"
  fi
}

calcular_versoes() {
  VERSAO_ATUAL="$(node --import tsx scripts/apoio/versao-cli.ts ler package.json)" ||
    recusar "não consegui ler a versão de package.json"
  local -a argumentos=(calcular "$TIPO" "$VERSAO_ATUAL")
  if [ "$FORCADA_DEFINIDA" = 1 ]; then
    argumentos+=("$VERSAO_FORCADA")
  fi
  VERSAO_NOVA="$(node --import tsx scripts/apoio/versao-cli.ts "${argumentos[@]}")" ||
    recusar "cálculo da versão falhou (mensagem acima)"
}

conferir_tag_local() {
  if git rev-parse -q --verify "refs/tags/v$VERSAO_NOVA" >/dev/null; then
    recusar "a tag v$VERSAO_NOVA já existe localmente"
  fi
}

imprimir_plano() {
  local restrito=AUSENTE
  if [ -f "$CONTEUDO_RESTRITO" ]; then
    restrito=presente
  fi
  cat <<PLANO
publicar: plano (--seco, nada foi alterado)
  tipo:                        $TIPO
  versão atual (package.json): $VERSAO_ATUAL
  versão nova:                 $VERSAO_NOVA
  1. grava package.json e commita chore(release): v$VERSAO_NOVA (só package.json)
  2. cria a tag anotada v$VERSAO_NOVA
  3. prepara $WT no commit da tag e copia os dispositivos.ts gerados
  4. preci em $WT (TMPDIR=$PRECI_TMPDIR; conteúdo restrito: $restrito)
  5. rsync em 2 etapas para $DESTINO_RSYNC
     etapa 1: tudo menos os 5 arquivos de entrada, com --delete (limite 200)
     etapa 2: index.html, sw.js, 404.html, workbox-*.js, manifest.webmanifest, sem --delete
  6. conferência: md5 de cada arquivo do dist, api/saude.php, api/conteudo.php (401),
     raiz $RAIZ_PRINCIPAL (md5 $MD5_RAIZ_PRINCIPAL), scripts/verificar-publicacao.sh
  7. só com 6 verde: git push $REMOTO $BRANCH_PUBLICA e git push $REMOTO v$VERSAO_NOVA,
     provados por git ls-remote
PLANO
}

conferir_remoto() {
  git config --get "remote.$REMOTO.url" >/dev/null ||
    recusar "remoto '$REMOTO' não configurado"
  local tag_remota main_remota
  tag_remota="$(git ls-remote --tags "$REMOTO" "refs/tags/v$VERSAO_NOVA")" ||
    recusar "não consegui consultar $REMOTO (rede ou chave SSH)"
  [ -z "$tag_remota" ] || recusar "a tag v$VERSAO_NOVA já existe em $REMOTO"
  main_remota="$(git ls-remote "$REMOTO" "refs/heads/$BRANCH_PUBLICA" | cut -f1)" ||
    recusar "não consegui ler $BRANCH_PUBLICA em $REMOTO"
  if [ -n "$main_remota" ]; then
    git cat-file -e "$main_remota^{commit}" 2>/dev/null ||
      recusar "$REMOTO/$BRANCH_PUBLICA tem commit que não existe aqui; resolva antes de publicar"
    git merge-base --is-ancestor "$main_remota" HEAD ||
      recusar "$REMOTO/$BRANCH_PUBLICA divergiu de HEAD: o push não seria fast-forward"
  fi
  [ -f "$CONTEUDO_RESTRITO" ] ||
    recusar "CADERNO_RESTRITO aponta para arquivo inexistente (o conteúdo não é mostrado)"
}

gravar_e_commitar() {
  local alterados mensagem
  PACKAGE_ALTERADO=1
  node --import tsx scripts/apoio/versao-cli.ts gravar package.json "$VERSAO_NOVA" >/dev/null
  alterados="$(git status --porcelain --untracked-files=no)"
  [ "$alterados" = " M package.json" ] ||
    recusar "esperava só package.json alterado, veio: $alterados"
  git diff -- package.json
  mensagem="$ESPACO/mensagem-release.txt"
  {
    printf 'chore(release): v%s\n' "$VERSAO_NOVA"
    printf '\nVersão %s do Caderno de Direito (tipo: %s).\n' "$VERSAO_NOVA" "$TIPO"
    if [ -n "${PUBLICAR_ATRIBUICAO:-}" ]; then
      printf '\n%s\n' "$PUBLICAR_ATRIBUICAO"
    fi
  } > "$mensagem"
  git commit -q -F "$mensagem" -- package.json
  PACKAGE_ALTERADO=0
  RELEASE_FEITO=1
  SHA_RELEASE="$(git rev-parse HEAD)"
  [ "$(git diff-tree --no-commit-id --name-only -r HEAD)" = "package.json" ] ||
    recusar "o commit de release tocou arquivos além de package.json"
  git show --stat --format='%h %s' HEAD
}

criar_tag() {
  git tag -a "v$VERSAO_NOVA" -m "Caderno de Direito v$VERSAO_NOVA"
  TAG_CRIADA=1
}

preparar_worktree() {
  if [ -e "$WT" ]; then
    local topo registrada sujo
    topo="$(git -C "$WT" rev-parse --show-toplevel 2>/dev/null || true)"
    [ "$topo" = "$WT" ] || recusar "$WT existe e não é worktree deste repositório: não mexo nele"
    registrada="$(git worktree list --porcelain)"
    grep -qxF "worktree $WT" <<<"$registrada" ||
      recusar "$WT não aparece em git worktree list: não mexo nele"
    sujo="$(git -C "$WT" status --porcelain --untracked-files=no)"
    [ -z "$sujo" ] || recusar "$WT tem mudanças rastreadas; não sobrescrevo (sem reset --hard)"
    git -C "$WT" checkout -q --detach "$SHA_RELEASE"
  else
    git worktree add -q --detach "$WT" "$SHA_RELEASE"
  fi
  if [ -e "$WT/node_modules" ] && [ ! -L "$WT/node_modules" ]; then
    recusar "$WT/node_modules é diretório real: não sobrescrevo"
  fi
  ln -sfn ../../node_modules "$WT/node_modules"
}

copiar_dispositivos() {
  local -a dispositivos=()
  mapfile -d '' -t dispositivos < <(cd "$RAIZ" && find src/conteudo -name dispositivos.ts -print0)
  [ "${#dispositivos[@]}" -gt 0 ] ||
    recusar "nenhum dispositivos.ts gerado em src/conteudo na árvore principal"
  (cd "$RAIZ" && cp --parents -- "${dispositivos[@]}" "$WT/")
  echo "publicar: dispositivos.ts copiados: ${#dispositivos[@]}"
}

rodar_preci() {
  local log="$ESPACO/preci.log" rc=0
  mkdir -p "$PRECI_TMPDIR"
  echo "publicar: preci em $WT (saída em arquivo privado; não é exibida, pode citar trechos do conteúdo restrito)"
  (cd "$WT" && CADERNO_RESTRITO="$CONTEUDO_RESTRITO" TMPDIR="$PRECI_TMPDIR" bash scripts/preci.sh) \
    > "$log" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ]; then
    grep -E '^FALHOU' "$log" | sed 's/^/publicar: /' >&2 || true
    recusar "preci reprovou (código $rc); desfaço o commit e a tag locais"
  fi
  echo "publicar: preci verde"
}

publicar_arquivos() {
  local origem="$WT/dist/"
  local ssh_opcoes="ssh -o BatchMode=yes -o ConnectTimeout=20"
  DEPLOY_INICIADO=1
  # Etapa 1: tudo menos os 5 arquivos de entrada. --delete apaga no destino o
  # que saiu do pacote; os 5 excluídos não são tocados por esta etapa.
  timeout 900 rsync -rlt --checksum --delete --max-delete=200 --timeout=60 \
    -e "$ssh_opcoes" \
    --exclude=/index.html --exclude=/sw.js --exclude=/404.html \
    --exclude='/workbox-*.js' --exclude=/manifest.webmanifest \
    "$origem" "$DESTINO_RSYNC"
  # Etapa 2: só os 5, por último. SEM --delete: com --exclude='*' um --delete
  # aqui apagaria todo o resto do destino.
  timeout 300 rsync -rlt --checksum --timeout=60 \
    -e "$ssh_opcoes" \
    --include=/index.html --include=/sw.js --include=/404.html \
    --include='/workbox-*.js' --include=/manifest.webmanifest --exclude='*' \
    "$origem" "$DESTINO_RSYNC"
  echo "publicar: rsync em duas etapas concluído"
}

conferir_md5_dos_arquivos() {
  local lista="$ESPACO/arquivos.txt" cfg="$ESPACO/curl.cfg" remoto="$ESPACO/remoto"
  local nome hash total analisados=0 conferidos=0 curl_rc=0
  local -a arquivos=()
  declare -A md5_local=() md5_remoto=()

  (cd "$WT/dist" && find . -type f ! -name '*.png' ! -name '*.jpg' ! -name '.htaccess' \
    ! -path './api/*' -printf '%P\n' | sort) > "$lista"
  mapfile -t arquivos < "$lista"
  total=${#arquivos[@]}
  [ "$total" -gt 0 ] || recusar "dist sem arquivos para conferir (varredura vazia é falha)"
  for nome in "${arquivos[@]}"; do
    [[ "$nome" =~ ^[A-Za-z0-9._/-]+$ ]] ||
      recusar "nome de arquivo fora do padrão seguro para conferir: $nome"
  done

  # Uma só chamada de curl para todos os arquivos (config com url/output).
  mkdir -p "$remoto"
  {
    printf 'silent\nshow-error\ncreate-dirs\nmax-time = 60\n'
    printf 'header = "Cache-Control: no-cache"\n'
    for nome in "${arquivos[@]}"; do
      printf 'url = "%s/%s"\noutput = "%s/%s"\n' "$DOMINIO" "$nome" "$remoto" "$nome"
    done
  } > "$cfg"
  curl --config "$cfg" >/dev/null 2>"$ESPACO/curl.err" || curl_rc=$?
  if [ "$curl_rc" -ne 0 ]; then
    echo "publicar: curl terminou com código $curl_rc (arquivos que não vieram aparecem como divergência)" >&2
  fi

  (cd "$WT/dist" && md5sum -- "${arquivos[@]}") > "$ESPACO/md5-local.txt"
  (cd "$remoto" && md5sum -- "${arquivos[@]}") > "$ESPACO/md5-remoto.txt" 2>/dev/null || true
  while read -r hash nome; do md5_local["$nome"]="$hash"; done < "$ESPACO/md5-local.txt"
  while read -r hash nome; do md5_remoto["$nome"]="$hash"; done < "$ESPACO/md5-remoto.txt"

  for nome in "${arquivos[@]}"; do
    analisados=$((analisados + 1))
    if [ -z "${md5_remoto[$nome]:-}" ]; then
      DIVERGENCIAS=$((DIVERGENCIAS + 1))
      echo "[DIVERGE] $nome: não obtido do ar" >&2
    elif [ "${md5_local[$nome]:-x}" = "${md5_remoto[$nome]}" ]; then
      conferidos=$((conferidos + 1))
    else
      DIVERGENCIAS=$((DIVERGENCIAS + 1))
      echo "[DIVERGE] $nome: md5 do ar difere do pacote" >&2
    fi
  done
  echo "md5: encontrados=$total analisados=$analisados conferidos=$conferidos divergencias=$DIVERGENCIAS"
  [ "$analisados" -eq "$total" ] || recusar "varredura incompleta: analisados $analisados de $total"
}

conferir_api_e_raiz() {
  local corpo codigo md5_raiz
  corpo="$(curl -s --max-time 30 "$DOMINIO/api/saude.php" || true)"
  if [ "$corpo" = '{"ok":true}' ]; then
    echo "[PASSOU] api/saude.php responde {\"ok\":true}"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] api/saude.php não respondeu {\"ok\":true}" >&2
  fi

  codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$DOMINIO/api/conteudo.php" || true)"
  if [ "$codigo" = 401 ]; then
    echo "[PASSOU] api/conteudo.php responde 401 sem sessão"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] api/conteudo.php respondeu $codigo, esperado 401" >&2
  fi

  md5_raiz="$( (curl -sf --max-time 30 "$RAIZ_PRINCIPAL" || true) | md5sum | cut -c1-12)"
  if [ "$md5_raiz" = "$MD5_RAIZ_PRINCIPAL" ]; then
    echo "[PASSOU] raiz do site principal intacta (md5 $md5_raiz)"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] raiz do site principal mudou: md5 $md5_raiz, esperado $MD5_RAIZ_PRINCIPAL" >&2
  fi
}

conferir_com_verificador_existente() {
  if bash "$WT/scripts/verificar-publicacao.sh" "$DOMINIO" > "$ESPACO/verificar.log" 2>&1; then
    echo "[PASSOU] scripts/verificar-publicacao.sh"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    grep -E '^\[FALHOU\]' "$ESPACO/verificar.log" | sed 's/^/publicar: /' >&2 || true
    echo "[DIVERGE] scripts/verificar-publicacao.sh reprovou" >&2
  fi
}

conferir_ar() {
  conferir_md5_dos_arquivos
  conferir_api_e_raiz
  conferir_com_verificador_existente
  if [ "$DIVERGENCIAS" -ne 0 ]; then
    echo "publicar: CONFERÊNCIA FALHOU com $DIVERGENCIAS divergência(s). O deploy NÃO foi desfeito (decisão do líder). Nada foi enviado ao git." >&2
    exit 1
  fi
}

enviar_ao_git() {
  local tag_remota tag_comitada main_remota
  git push "$REMOTO" "$BRANCH_PUBLICA"
  git push "$REMOTO" "v$VERSAO_NOVA"
  main_remota="$(git ls-remote "$REMOTO" "refs/heads/$BRANCH_PUBLICA" |
    awk -v r="refs/heads/$BRANCH_PUBLICA" '$2==r{print $1}')"
  tag_remota="$(git ls-remote --tags "$REMOTO" "refs/tags/v$VERSAO_NOVA")"
  tag_comitada="$(printf '%s\n' "$tag_remota" | awk -v r="refs/tags/v$VERSAO_NOVA^{}" '$2==r{print $1}')"
  [ "$main_remota" = "$SHA_RELEASE" ] || recusar "ls-remote: $BRANCH_PUBLICA remoto não é o commit de release"
  [ "$tag_comitada" = "$SHA_RELEASE" ] || recusar "ls-remote: tag v$VERSAO_NOVA remota não aponta para o commit de release"
  echo "publicar: git ls-remote confirma $BRANCH_PUBLICA e v$VERSAO_NOVA em $REMOTO"
}

desfazer_release() {
  local atual
  atual="$(git rev-parse HEAD 2>/dev/null || true)"
  if [ "$atual" != "$SHA_RELEASE" ]; then
    echo "publicar: HEAD não é mais o commit de release ($SHA_RELEASE). NADA foi desfeito por segurança. Desfaça à mão: git tag -d v$VERSAO_NOVA (se existir) e o commit $SHA_RELEASE." >&2
    return 0
  fi
  if [ "$TAG_CRIADA" = 1 ]; then
    git tag -d "v$VERSAO_NOVA" >/dev/null || true
    TAG_CRIADA=0
  fi
  git reset -q --soft HEAD~1 || return 0
  git restore --staged -- package.json || true
  git checkout -- package.json || true
  RELEASE_FEITO=0
  PACKAGE_ALTERADO=0
  echo "publicar: desfeito: commit de release e tag local v$VERSAO_NOVA removidos; package.json de volta a $VERSAO_ATUAL" >&2
}

ao_sair() {
  local codigo=$?
  if [ "$codigo" -ne 0 ]; then
    if [ "$DEPLOY_INICIADO" = 1 ]; then
      echo "publicar: ABORTADO após iniciar o deploy (código $codigo). O remoto pode estar parcial; nada foi enviado ao git. Decida com o líder antes de repetir." >&2
    else
      if [ "$PACKAGE_ALTERADO" = 1 ]; then
        git checkout -- package.json >/dev/null 2>&1 || true
        PACKAGE_ALTERADO=0
      fi
      if [ "$RELEASE_FEITO" = 1 ]; then
        desfazer_release || true
      fi
      echo "publicar: abortado (código $codigo) antes do deploy; nada foi publicado." >&2
    fi
    if [ -n "$ESPACO" ]; then
      echo "publicar: arquivos de diagnóstico mantidos em $ESPACO (permissão 700)" >&2
    fi
  elif [ -n "$ESPACO" ] && [ -d "$ESPACO" ]; then
    rm -rf -- "$ESPACO"
  fi
  exit "$codigo"
}

principal() {
  ler_argumentos "$@"
  conferir_branch_e_arvore
  calcular_versoes
  conferir_tag_local
  if [ "$SECO" = 1 ]; then
    imprimir_plano
    exit 0
  fi
  conferir_remoto
  ESPACO="$(mktemp -d /var/tmp/publicar.XXXXXX)"
  gravar_e_commitar
  criar_tag
  preparar_worktree
  copiar_dispositivos
  rodar_preci
  publicar_arquivos
  conferir_ar
  enviar_ao_git
  echo "publicado: v$VERSAO_NOVA sha=$(git rev-parse --short=12 HEAD) divergencias=0"
}

trap ao_sair EXIT
principal "$@"
