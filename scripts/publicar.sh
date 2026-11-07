#!/usr/bin/env bash
# Publicação do Caderno de Direito (plano do CTO do login único, 7.1, 7.1.1 e 8; LU-F4.3).
#
# Uso:
#   npm run publicar -- <recurso|correcao|construcao> [--versao A.B.C.D] [--seco]
#   npm run publicar -- --preparar <recurso|correcao|construcao> [--versao A.B.C.D]
#   npm run publicar -- --concluir
#
# Modo normal: commit de release (só package.json), tag anotada, clone descartável em .worktrees/
# com git-crypt destravado e preci. Depois do preci: pacote separado (dist-pacote/webroot e
# dist-pacote/app), app em versoes/v<versão> (fora do webroot), webroot, ponteiro atual trocado
# com ln -sfn em nome temporário e mv -T (atômico), poda (guarda 2 versões: a nova e a anterior, que
# é o rollback). Conferência do ar: md5 de cada arquivo no disco (webroot e app, inclusive .htaccess
# e api/), conferir-portao no PHP do servidor, e a conferência anônima de verificar-publicacao.sh
# nos dois hosts. Só com tudo verde envia branch e tag ao git, e prova com git ls-remote.
#
# --preparar: a mesma sequência até o preci e P1 a P3 (app em versoes/, dados da Júri no privado
# aditivo, webroot em direito2026_webroot_novo). Não troca o que o público vê e não envia nada ao git.
# --concluir: depois da virada manual (V2 a V8 do plano), confere o ar, envia branch e tag e prova
# no remoto (ls-remote e clone fresco sem chave, 6.2).
#
# --seco: confere e imprime o plano, sem alterar nada.
# Se o preci falhar, desfaz SÓ o que este script fez (tag e commit de release locais). Depois do
# primeiro escrito no destino não desfaz nada: o remoto não tem desfazer automático.
# Nunca imprime segredo, nem conteúdo de CADERNO_RESTRITO, de CADERNO_RESTRITO_JURI nem da Júri.
# Sem --no-verify, sem force, sem amend (GODS_LAWS L-24, L-25).
#
# Variáveis de destino (PUBLICAR_*): padrão = produção (alias ssh hostinger). Vazio em
# PUBLICAR_DESTINO_HOST = destino local, só para ensaio (rsync local, sem ssh). Ver docs/publicacao.md.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$RAIZ"

BRANCH_PUBLICA=main
REMOTO="${PUBLICAR_REMOTO:-github}"
# Destino. DESTINO_HOST vazio = local (só ensaio). DESTINO_RAIZ é relativo ao home do destino.
DESTINO_HOST="${PUBLICAR_DESTINO_HOST-hostinger}"
DESTINO_RAIZ="${PUBLICAR_DESTINO_RAIZ-domains/drpetrus.top}"
DESTINO_WEBROOT="${PUBLICAR_DESTINO_WEBROOT-$DESTINO_RAIZ/public_html/direito2026}"
DESTINO_WEBROOT_NOVO="${PUBLICAR_DESTINO_WEBROOT_NOVO-$DESTINO_RAIZ/direito2026_webroot_novo}"
DESTINO_APP="${PUBLICAR_DESTINO_APP-$DESTINO_RAIZ/direito2026_app}"
DESTINO_PRIVADO="${PUBLICAR_DESTINO_PRIVADO-$DESTINO_RAIZ/direito2026_privado}"
DOMINIO="${PUBLICAR_DOMINIO-https://direito2026.drpetrus.top}"
DOMINIO_PAI="${PUBLICAR_DOMINIO_PAI-https://drpetrus.top}"
HOST_PUBLICO="${PUBLICAR_HOST_PUBLICO-direito2026.drpetrus.top}"
BORDA="${PUBLICAR_BORDA-1}"
RAIZ_PRINCIPAL="${PUBLICAR_RAIZ_PRINCIPAL-https://drpetrus.top/}"
MD5_RAIZ_PRINCIPAL="${PUBLICAR_MD5_RAIZ-6e66aeb03564}"
PRECI_TMPDIR=/var/tmp/preci-pub
# Pacote de cada versão, guardado entre --preparar e --concluir. Fica em pasta do usuário (700), fora
# do IDrive e fora de /var/tmp (caminho previsível em diretório compartilhado é risco: LU-F4.3).
PASTA_PACOTES="${PUBLICAR_PASTA_PACOTES-${XDG_STATE_HOME:-$HOME/.local/state}/caderno-publicar}"
# Clone descartável do preci (L-55: subpasta do projeto, ignorada pelo git).
PASTA_CLONES="$RAIZ/.worktrees"
CLONE=""
CHAVE_GIT_CRYPT="${CADERNO_CHAVE_GIT_CRYPT:-$HOME/.config/gusworld/git-crypt-key}"
CONTEUDO_RESTRITO="${CADERNO_RESTRITO:-/home/petrus/IDrive/Documentos/direito/site_direito2026_restrito/conteudo/interdisciplinar.json}"
# JSON privado da Júri e pasta do acervo (imagens/ e acervo.json): sem padrão de propósito.
CADERNO_RESTRITO_JURI="${CADERNO_RESTRITO_JURI:-}"
CADERNO_ACERVO_JURI="${CADERNO_ACERVO_JURI:-}"

# Funções de cópia dos dispositivos.ts (biblioteca sem efeito ao ser carregada).
# shellcheck source=scripts/apoio/dispositivos-publicacao.sh
source "$RAIZ/scripts/apoio/dispositivos-publicacao.sh"

TETO_APAGAR_WEBROOT=50
TETO_VERSOES=5
SSH_OPCOES="ssh -o BatchMode=yes -o ConnectTimeout=20"

MODO=normal
TIPO=""
VERSAO_FORCADA=""
FORCADA_DEFINIDA=0
SECO=0
VERSAO_ATUAL=""
VERSAO_NOVA=""
SHA_RELEASE=""
ESPACO=""
PACOTE_LOCAL=""
REGRAS=""
CAMINHOS=""

# Estado para desfazer só o que foi criado aqui (lido pelo trap de saída).
PACKAGE_ALTERADO=0
RELEASE_FEITO=0
TAG_CRIADA=0
DEPLOY_INICIADO=0
DIVERGENCIAS=0
PUSH_MAIN_FEITO=0
PUSH_TAG_FEITO=0

recusar() {
  echo "publicar: RECUSADO: $*" >&2
  exit 1
}

uso() {
  echo "uso: npm run publicar -- <recurso|correcao|construcao> [--versao A.B.C.D] [--seco]" >&2
  echo "     npm run publicar -- --preparar <recurso|correcao|construcao> [--versao A.B.C.D]" >&2
  echo "     npm run publicar -- --concluir" >&2
  exit 1
}

ler_argumentos() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --seco)
        SECO=1
        shift
        ;;
      --preparar)
        [ "$MODO" = normal ] || uso
        MODO=preparar
        shift
        ;;
      --concluir)
        [ "$MODO" = normal ] || uso
        MODO=concluir
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
  if [ "$MODO" = concluir ]; then
    [ -z "$TIPO" ] || recusar "--concluir não recebe tipo: a versão vem do package.json do HEAD"
    [ "$SECO" = 0 ] || recusar "--seco não se aplica a --concluir"
    [ "$FORCADA_DEFINIDA" = 0 ] || recusar "--concluir não recebe --versao"
    return 0
  fi
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
  local restrito=AUSENTE chave=AUSENTE
  if [ -f "$CONTEUDO_RESTRITO" ]; then
    restrito=presente
  fi
  if [ -f "$CHAVE_GIT_CRYPT" ]; then
    chave=presente
  fi
  cat <<PLANO
publicar: plano (--seco, nada foi alterado; modo: $MODO)
  tipo:                        $TIPO
  versão atual (package.json): $VERSAO_ATUAL
  versão nova:                 $VERSAO_NOVA
  destino:                     ${DESTINO_HOST:-LOCAL (ensaio)}${DESTINO_HOST:+:}$DESTINO_RAIZ
  1. grava package.json e commita chore(release): v$VERSAO_NOVA (só package.json); tag anotada v$VERSAO_NOVA
  2. clone descartável em $PASTA_CLONES/pub-clone.* no commit da tag (git-crypt unlock com a chave: $chave)
  3. preci nesse clone (TMPDIR=$PRECI_TMPDIR; conteúdo restrito: $restrito; caixa: ${CADERNO_CAIXA:-AUSENTE, a publicação real recusa})
     o preci roda o build, que separa o pacote em dist-pacote/webroot e dist-pacote/app
  4. app: $DESTINO_APP/versoes/v$VERSAO_NOVA (rsync), ponteiro atual com ln -sfn e mv -T
  5. webroot: $DESTINO_WEBROOT (rsync; apaga só o que não está no pacote, teto $TETO_APAGAR_WEBROOT)
  6. poda: guarda 2 versões em $DESTINO_APP/versoes (a nova e a anterior, que é o rollback)
  7. conferir o ar: md5 de cada arquivo do webroot e do app, conferir-portao no PHP do servidor,
     verificar-publicacao.sh anônimo nos dois hosts ($DOMINIO e $DOMINIO_PAI), raiz principal
  8. só com 7 verde: git push $REMOTO $BRANCH_PUBLICA e git push $REMOTO v$VERSAO_NOVA, provados por git ls-remote
  Em --preparar: 4 e 5 vão a versoes/ e a $DESTINO_WEBROOT_NOVO, com o ponteiro, sem trocar o webroot público; 7 e 8 ficam para --concluir.
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

# Destino: falha fechada. Um destino local com ':' seria lido pelo rsync como host remoto; e a Júri
# antiga (juri2026_privado) e a raiz public_html nunca são alvo deste script (E15 c).
conferir_destinos() {
  if [ -z "$DESTINO_HOST" ]; then
    case "$DESTINO_RAIZ$DESTINO_WEBROOT$DESTINO_WEBROOT_NOVO$DESTINO_APP$DESTINO_PRIVADO" in
      *:*) recusar "destino local com ':' (o rsync lê como host remoto); use caminho sem ':'" ;;
    esac
  fi
  case "$DESTINO_WEBROOT$DESTINO_WEBROOT_NOVO$DESTINO_APP$DESTINO_PRIVADO" in
    *juri2026*) recusar "destino aponta para juri2026_privado: fora do escopo deste script (E15 c)" ;;
  esac
  [ "$(basename -- "$DESTINO_WEBROOT")" = direito2026 ] ||
    recusar "o webroot de destino tem de se chamar direito2026 (nunca a raiz public_html)"
  [ "$(basename -- "$DESTINO_WEBROOT_NOVO")" = direito2026_webroot_novo ] ||
    recusar "o webroot de preparo tem de se chamar direito2026_webroot_novo"
  [ "$(basename -- "$DESTINO_APP")" = direito2026_app ] ||
    recusar "a pasta do app tem de se chamar direito2026_app"
  [ "$(basename -- "$DESTINO_PRIVADO")" = direito2026_privado ] ||
    recusar "a pasta privada tem de se chamar direito2026_privado"
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

# Clone do commit de release, com a árvore destravada pela chave do git-crypt.
# O clone é cópia própria (não é worktree): worktree não aceita o filtro do git-crypt (T5).
preparar_clone() {
  mkdir -p "$PASTA_CLONES"
  CLONE="$(mktemp -d "$PASTA_CLONES/pub-clone.XXXXXX")" ||
    recusar "não criei a pasta do clone em $PASTA_CLONES"
  git clone -q "$RAIZ" "$CLONE" || recusar "git clone do repositório falhou (mensagem acima)"
  git -C "$CLONE" checkout -q --detach "$SHA_RELEASE" ||
    recusar "não consegui pôr o clone no commit de release"
  (cd "$CLONE" && git-crypt unlock "$CHAVE_GIT_CRYPT") > "$ESPACO/unlock.log" 2>&1 ||
    recusar "git-crypt unlock falhou no clone (log privado em $ESPACO/unlock.log)"
  if [ -e "$CLONE/node_modules" ] && [ ! -L "$CLONE/node_modules" ]; then
    recusar "$CLONE/node_modules é diretório real: não sobrescrevo"
  fi
  ln -sfn "$RAIZ/node_modules" "$CLONE/node_modules"
}

# Apaga o clone deste script, por caminho exato. Nunca apaga nada fora de $PASTA_CLONES/pub-clone.*.
# Apagar o clone também apaga a cópia da chave do git-crypt que o unlock grava em .git/git-crypt/keys.
apagar_clone() {
  [ -n "$CLONE" ] || return 0
  if [ "$(dirname -- "$CLONE")" != "$PASTA_CLONES" ] ||
    [[ "$(basename -- "$CLONE")" != pub-clone.* ]]; then
    echo "publicar: AVISO: caminho do clone fora do padrão; não apago nada: $CLONE" >&2
    return 1
  fi
  if [ -L "$CLONE" ] || [ ! -d "$CLONE" ]; then
    CLONE=""
    return 0
  fi
  rm -rf -- "$CLONE"
  CLONE=""
}

# Antes de criar release: insumos presentes. Falha aqui não deixa commit nem tag.
conferir_insumos() {
  [ -f "$CHAVE_GIT_CRYPT" ] ||
    recusar "chave do git-crypt ausente (caminho padrão ou CADERNO_CHAVE_GIT_CRYPT); nada foi commitado"
  # L-50 e E9: o preci não roda na sessão viva. Sem caixa, recusa antes de qualquer commit.
  [ -n "${CADERNO_CAIXA:-}" ] ||
    recusar "CADERNO_CAIXA vazio: o preci não roda na sessão viva (L-50). Passe a caixa: CADERNO_CAIXA=/var/tmp/site-login-unico/caixa.sh npm run publicar -- <tipo>; nada foi commitado"
  if [ ! -x "$CADERNO_CAIXA" ]; then
    recusar "CADERNO_CAIXA não é executável; nada foi commitado"
  fi
  if [ "${MODO:-normal}" = preparar ]; then
    [ -d "${CADERNO_ACERVO_JURI:-/nao-definido}/imagens" ] && [ -f "${CADERNO_ACERVO_JURI:-/nao-definido}/acervo.json" ] ||
      recusar "--preparar precisa de CADERNO_ACERVO_JURI (pasta com imagens/ e acervo.json); nada foi commitado"
    [ -f "${CADERNO_RESTRITO_JURI:-/nao-definido}" ] ||
      recusar "--preparar precisa de CADERNO_RESTRITO_JURI (JSON da Júri); nada foi commitado"
  fi
}

copiar_dispositivos() {
  copiar_dispositivos_gerados "$RAIZ" "$CLONE" ||
    recusar "não copiei os dispositivos.ts para o clone (motivo acima)"
}

rodar_preci() {
  local log="$ESPACO/preci.log" rc=0
  local -a envoltorio=()
  mkdir -p "$PRECI_TMPDIR"
  # CADERNO_CAIXA (L-50): preci isolado num bwrap. Vazio = roda direto, na sessão.
  if [ -n "${CADERNO_CAIXA:-}" ]; then
    envoltorio=("$CADERNO_CAIXA")
  fi
  echo "publicar: preci no clone (saída em arquivo privado; não é exibida, pode citar trechos do conteúdo restrito)"
  (cd "$CLONE" && CADERNO_RESTRITO="$CONTEUDO_RESTRITO" CADERNO_RESTRITO_JURI="$CADERNO_RESTRITO_JURI" \
    TMPDIR="$PRECI_TMPDIR" "${envoltorio[@]}" bash scripts/preci.sh) \
    > "$log" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ]; then
    grep -E '^FALHOU' "$log" | sed 's/^/publicar: /' >&2 || true
    recusar "preci reprovou (código $rc); desfaço o commit e a tag locais"
  fi
  echo "publicar: preci verde"
}

# O pacote que o preci acabou de separar. Ausência é falha: nada foi publicado ainda.
conferir_pacote_local() {
  PACOTE_LOCAL="$CLONE/dist-pacote"
  [ -f "$PACOTE_LOCAL/app/manifesto.json" ] && [ -f "$PACOTE_LOCAL/webroot/api/portao.php" ] ||
    recusar "o preci não deixou dist-pacote/ no clone (webroot e app); nada foi publicado"
}

# Recusa pasta que não seja diretório real, do usuário atual, em 700, sem symlink no caminho.
# Symlink, dono de outro usuário ou modo aberto mudam o pacote guardado: nada é usado nem escrito.
conferir_pasta_segura() {
  local pasta="$1" dono modo fisico logico
  if [ -L "$pasta" ]; then
    recusar "$pasta é symlink: não uso caminho de pacote por symlink"
  fi
  if [ ! -d "$pasta" ]; then
    recusar "$pasta não é diretório"
  fi
  fisico="$(cd -P -- "$pasta" && pwd -P)"
  logico="$(cd -- "$pasta" && pwd)"
  if [ "$fisico" != "$logico" ]; then
    recusar "$pasta tem symlink no caminho (real: $fisico): recuso"
  fi
  dono="$(stat -c %u -- "$pasta")"
  if [ "$dono" != "$(id -u)" ]; then
    recusar "$pasta não é do usuário atual (dono uid $dono)"
  fi
  modo="$(stat -c %a -- "$pasta")"
  if [ "$modo" != 700 ]; then
    recusar "$pasta com modo $modo; esperado 700"
  fi
}

# Cria a pasta dos pacotes (700) se faltar, e confere antes de qualquer uso.
preparar_pasta_pacotes() {
  if [ ! -e "$PASTA_PACOTES" ] && [ ! -L "$PASTA_PACOTES" ]; then
    mkdir -p -m 700 -- "$PASTA_PACOTES" || recusar "não criei $PASTA_PACOTES"
  fi
  conferir_pasta_segura "$PASTA_PACOTES"
}

# Pasta de um pacote de versão: a mesma regra, para a pasta da versão.
destino_do_pacote() {
  printf '%s/v%s' "$PASTA_PACOTES" "$1"
}

# Apaga o pacote de uma versão por caminho exato, depois de conferir que é a pasta esperada (L-53).
apagar_pacote_versao() {
  local destino
  destino="$(destino_do_pacote "$1")"
  [[ "$1" =~ ^[0-9.]+$ ]] || recusar "versão fora do padrão: não apago pacote"
  if [ -L "$destino" ] || [ ! -d "$destino" ]; then
    recusar "$destino não é pasta de pacote: não apago"
  fi
  conferir_pasta_segura "$PASTA_PACOTES"
  rm -rf -- "$destino"
  echo "publicar: pacote da v$1 apagado ($destino)"
}

# Guarda o pacote desta versão, para --concluir conferir e enviar sem refazer o preci (700).
guardar_pacote() {
  local destino
  preparar_pasta_pacotes
  destino="$(destino_do_pacote "$VERSAO_NOVA")"
  if [ -e "$destino" ] || [ -L "$destino" ]; then
    apagar_pacote_versao "$VERSAO_NOVA"
  fi
  mkdir -m 700 -- "$destino" || recusar "não criei $destino"
  cp -a "$PACOTE_LOCAL/app" "$PACOTE_LOCAL/webroot" "$destino/"
  conferir_pacote_guardado "$destino"
  PACOTE_LOCAL="$destino"
  echo "publicar: pacote da v$VERSAO_NOVA guardado em $destino (700)"
}

# O pacote guardado: pasta real, sem symlink dentro, com o app e o webroot. Conferido antes de usar.
conferir_pacote_guardado() {
  local destino="$1"
  conferir_pasta_segura "$destino"
  if [ -n "$(find "$destino" -type l -print -quit)" ]; then
    recusar "$destino tem symlink dentro do pacote: não uso"
  fi
  [ -f "$destino/app/manifesto.json" ] && [ -f "$destino/webroot/api/portao.php" ] ||
    recusar "pacote guardado incompleto em $destino"
}

# Regras de proteção do envio: o que o servidor escreve sozinho e o que não é do pacote. Nunca apagado.
# Dados do Caderno ficam no privado, fora deste envio. As linhas da Júri (P /acervo.json, P /imagens/)
# são cinto de segurança (LU-F2.2): se algum dia caírem no destino, a publicação não os apaga.
regras_fixas_protecao() {
  cat <<'REGRAS'
# dados gravados pelo PHP (public/api/nucleo/contas.php:24, limite.php:51,
# armazenamento.php:177 e 208-218, respostas.php:83, sessao.php:20, contas.php:117/142)
P usuarios.json
P tentativas.json
P segredo.key
P erros.log
P verificacoes.log
P pausado-*
P *.lock
P sessoes/
P conteudo/
# Júri (public/api/nucleo/config.php, d26_dir_privado): cinto de segurança, LU-F2.2.
P /acervo.json
P /imagens/
# arquivos que a hospedagem põe no diretório
P error_log
P cgi-bin/
P .well-known/
P .user.ini
REGRAS
}

preparar_regras() {
  REGRAS="$ESPACO/protecao.rules"
  regras_fixas_protecao > "$REGRAS"
}

# Pasta de versão no destino: a anterior, a mais nova que não é esta. Vazio se não há.
anterior_no_destino() {
  no_destino "cd '$DESTINO_APP' 2>/dev/null && ls -1 versoes 2>/dev/null || true" |
    grep -E '^v[0-9.]+$' | grep -v -x "v$VERSAO_NOVA" | sort -V | tail -n 1 || true
}

# Executa um comando de shell no destino: ssh em produção, local no ensaio.
no_destino() {
  if [ -n "$DESTINO_HOST" ]; then
    # shellcheck disable=SC2086
    $SSH_OPCOES "$DESTINO_HOST" "$1"
  else
    bash -c "$1"
  fi
}

# rsync para o destino: origem local, destino no caminho do destino (ssh em produção, local no ensaio).
rsync_destino() {
  local origem="$1" destino="$2"
  shift 2
  local -a rsh=()
  local alvo="$destino"
  if [ -n "$DESTINO_HOST" ]; then
    rsh=(-e "$SSH_OPCOES")
    alvo="$DESTINO_HOST:$destino"
  fi
  timeout 900 rsync "${rsh[@]}" --timeout=60 "$@" "$origem" "$alvo"
}

# Confere, no destino, o md5 de cada arquivo de uma pasta local: mesmo conjunto, mesmo md5.
# Arquivo a mais no destino só é tolerado se for protegido (error_log, .user.ini, cgi-bin/, .well-known/).
# Zero arquivo local é falha (varredura quebrada, L-36).
conferir_md5_pasta() {
  local origem="$1" remoto="$2" rotulo="$3"
  local arquivo_local="$ESPACO/md5-$rotulo-local.txt" arquivo_ar="$ESPACO/md5-$rotulo-ar.txt"
  local hash nome encontrados=0 analisados=0 conferidos=0 divergencias=0
  declare -A esperado=() ar=()

  (cd "$origem" && find . -type f -print0 | sort -z | xargs -0 md5sum) > "$arquivo_local"
  if ! no_destino "cd '$remoto' && find . -type f -print0 | sort -z | xargs -0 md5sum" > "$arquivo_ar" 2> "$ESPACO/md5-$rotulo-ar.err"; then
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] $rotulo: não consegui listar o destino (rede, chave SSH ou pasta ausente)" >&2
    return 0
  fi
  while read -r hash nome; do esperado["${nome#./}"]="$hash"; done < "$arquivo_local"
  while read -r hash nome; do ar["${nome#./}"]="$hash"; done < "$arquivo_ar"
  encontrados=${#esperado[@]}
  [ "$encontrados" -gt 0 ] || recusar "$rotulo: pasta local sem arquivos (zero é varredura quebrada)"

  for nome in "${!esperado[@]}"; do
    analisados=$((analisados + 1))
    if [ -z "${ar[$nome]:-}" ]; then
      divergencias=$((divergencias + 1))
      echo "[DIVERGE] $rotulo/$nome: ausente no destino" >&2
    elif [ "${ar[$nome]}" = "${esperado[$nome]}" ]; then
      conferidos=$((conferidos + 1))
    else
      divergencias=$((divergencias + 1))
      echo "[DIVERGE] $rotulo/$nome: md5 do destino difere do pacote" >&2
    fi
  done
  for nome in "${!ar[@]}"; do
    if [ -z "${esperado[$nome]:-}" ]; then
      case "$nome" in
        error_log | .user.ini | cgi-bin/* | .well-known/*) ;;
        *)
          divergencias=$((divergencias + 1))
          echo "[DIVERGE] $rotulo/$nome: sobra no destino, fora do pacote" >&2
          ;;
      esac
    fi
  done
  echo "md5 $rotulo: encontrados=$encontrados analisados=$analisados conferidos=$conferidos divergencias=$divergencias"
  DIVERGENCIAS=$((DIVERGENCIAS + divergencias))
  [ "$analisados" -eq "$encontrados" ] || recusar "$rotulo: varredura incompleta: analisados $analisados de $encontrados"
}

# md5 de um arquivo único no destino (dados da Júri, P2).
conferir_md5_arquivo() {
  local local_arq="$1" remoto="$2" rotulo="$3" esperado ar
  esperado="$(md5sum < "$local_arq" | cut -c1-32)"
  ar="$(no_destino "md5sum < '$remoto' | cut -c1-32" 2>/dev/null || true)"
  if [ "$esperado" = "$ar" ] && [ -n "$ar" ]; then
    echo "[PASSOU] $rotulo: md5 confere no destino"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] $rotulo: md5 do destino difere do arquivo local" >&2
  fi
}

# Baixa um arquivo do destino para uma pasta local (ssh em produção, cópia local no ensaio).
baixar_do_destino() {
  local origem="$1" destino="$2"
  local -a rsh=()
  local alvo="$origem"
  if [ -n "$DESTINO_HOST" ]; then
    rsh=(-e "$SSH_OPCOES")
    alvo="$DESTINO_HOST:$origem"
  fi
  timeout 300 rsync "${rsh[@]}" --timeout=60 -t "$alvo" "$destino"
}

# Envia o app para uma pasta nova de versão. Nunca apaga nada.
enviar_app() {
  local destino="$DESTINO_APP/versoes/v$VERSAO_NOVA"
  DEPLOY_INICIADO=1
  no_destino "mkdir -p -m 700 '$DESTINO_APP/versoes' && mkdir -p '$destino'" ||
    recusar "não consegui criar $destino (nada publicado no ponteiro)"
  rsync_destino "$PACOTE_LOCAL/app/" "$destino/" -rlt --checksum ||
    recusar "rsync do app falhou (o ponteiro ainda não mudou)"
  echo "publicar: app enviado para versoes/v$VERSAO_NOVA"
}

# Troca o ponteiro atual de forma atômica: link em nome temporário e mv -T.
trocar_ponteiro() {
  no_destino "cd '$DESTINO_APP' && ln -sfn 'versoes/v$VERSAO_NOVA' atual.tmp && mv -T atual.tmp atual" ||
    recusar "troca do ponteiro atual falhou: o ar pode estar na versão anterior"
  echo "publicar: ponteiro atual aponta para versoes/v$VERSAO_NOVA"
}

# Envia o webroot por rsync, apagando só o que não é do pacote (com teste de teto e lista antes).
enviar_webroot() {
  local destino="$1" origem="$PACOTE_LOCAL/webroot/" simulacao="$ESPACO/simulacao-webroot.txt"
  local -a apagar=()
  local total
  no_destino "mkdir -p -- '$destino'" || recusar "não consegui criar $destino"
  rsync_destino "$origem" "$destino/" -rlt --checksum --delete -n -i --filter=". $REGRAS" \
    > "$simulacao" 2>&1 || recusar "simulação do envio do webroot falhou (nada foi apagado)"
  mapfile -t apagar < <(grep -E '^\*deleting' "$simulacao" | sed -E 's/^\*deleting +//' || true)
  total="${#apagar[@]}"
  [ "$total" -le "$TETO_APAGAR_WEBROOT" ] ||
    recusar "apagamento previsto no webroot ($total) passa do teto de $TETO_APAGAR_WEBROOT; nada foi apagado"
  echo "publicar: webroot: apagamento previsto: $total"
  if [ "$total" -gt 0 ]; then
    printf '%s\n' "${apagar[@]}" | sed 's/^/publicar:   apagar: /'
  fi
  DEPLOY_INICIADO=1
  rsync_destino "$origem" "$destino/" -rlt --checksum --delete --max-delete="$TETO_APAGAR_WEBROOT" \
    --filter=". $REGRAS" ||
    recusar "envio do webroot falhou (o ponteiro ainda não mudou)"
  echo "publicar: webroot enviado para $destino"
}

# Poda: mantém duas versões (a nova e a anterior, que é o rollback). Apaga por nome exato, listado antes (L-53).
podar_versoes() {
  local -a versoes=() apagar=()
  local versao
  mapfile -t versoes < <(no_destino "cd '$DESTINO_APP' 2>/dev/null && ls -1 versoes 2>/dev/null || true" |
    grep -E '^v[0-9.]+$' | sort -V -r || true)
  if [ "${#versoes[@]}" -le 2 ]; then
    echo "publicar: poda: ${#versoes[@]} versão(ões) no destino, nada a apagar"
    return 0
  fi
  apagar=("${versoes[@]:2}")
  [ "${#apagar[@]}" -le "$TETO_VERSOES" ] ||
    recusar "poda prevista (${#apagar[@]}) passa do teto de $TETO_VERSOES; nada foi apagado"
  echo "publicar: poda: apagando por nome exato: ${apagar[*]}"
  for versao in "${apagar[@]}"; do
    [[ "$versao" =~ ^v[0-9.]+$ ]] || recusar "nome de versão fora do padrão: não apago"
    no_destino "rm -rf -- '$DESTINO_APP/versoes/$versao'" || recusar "poda de $versao falhou"
  done
}

publicar_versao() {
  local anterior
  anterior="$(anterior_no_destino)"
  echo "publicar: versão anterior no destino: ${anterior:-nenhuma (primeira publicação com este comando)}"
  enviar_app
  enviar_webroot "$DESTINO_WEBROOT"
  trocar_ponteiro
  podar_versoes
}

# Lista dos caminhos que o anônimo não pode receber: os do app novo e os do anterior.
montar_caminhos_protegidos() {
  local anterior manifesto_anterior="$ESPACO/manifesto-anterior.json"
  CAMINHOS="$ESPACO/caminhos-protegidos.txt"
  anterior="$(anterior_no_destino)"
  {
    chaves_do_manifesto "$PACOTE_LOCAL/app/manifesto.json"
    if [ -n "$anterior" ]; then
      baixar_do_destino "$DESTINO_APP/versoes/$anterior/manifesto.json" "$manifesto_anterior" ||
        recusar "não consegui baixar o manifesto da versão anterior ($anterior)"
      chaves_do_manifesto "$manifesto_anterior"
    fi
  } | sort -u > "$CAMINHOS"
  echo "publicar: caminhos protegidos a conferir no anônimo: $(grep -c . "$CAMINHOS" || true)"
}

# Chaves de "arquivos" de um manifesto. Formato inválido é recusa (fail-closed).
chaves_do_manifesto() {
  python3 -c '
import json, sys
m = json.load(open(sys.argv[1], encoding="utf-8"))
arquivos = m.get("arquivos") if isinstance(m, dict) else None
if not isinstance(arquivos, dict) or not arquivos:
    sys.exit("manifesto sem arquivos")
for chave in arquivos:
    print(chave)
' "$1" || recusar "manifesto ilegível ou sem arquivos: $1"
}

# O conferir-portao roda no PHP do servidor, sem HTTP e sem conta (7.1 b). O CLI vai junto para um
# diretório temporário de 700, e sai ao fim, por caminho exato (E15 c).
conferir_portao_no_destino() {
  local nucleo="$1" atual="$2" pasta="$DESTINO_RAIZ/d26_cli_tmp" saida rc=0
  saida="$ESPACO/conferir-portao.txt"
  no_destino "mkdir -p -m 700 '$pasta/apoio'" || recusar "não criei $pasta"
  rsync_destino "$RAIZ/servidor/cli/conferir-portao.php" "$pasta/" -t
  rsync_destino "$RAIZ/servidor/cli/apoio/cli.php" "$pasta/apoio/" -t
  no_destino "cd '$pasta' && D26_NUCLEO='$nucleo' php conferir-portao.php '$atual'" > "$saida" 2> "$saida.err" || rc=$?
  cat "$saida"
  sed 's/^/publicar: /' "$saida.err" >&2 || true
  no_destino "rm -f -- '$pasta/conferir-portao.php' '$pasta/apoio/cli.php' && rmdir -- '$pasta/apoio' '$pasta'" ||
    echo "publicar: AVISO: não consegui apagar o CLI temporário em $pasta (apague por caminho exato)" >&2
  if [ "$rc" -eq 0 ]; then
    echo "[PASSOU] conferir-portao no PHP do servidor: manifesto e arquivos conferem"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] conferir-portao reprovou (código $rc)" >&2
  fi
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

  codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$DOMINIO/api/juri/conteudo.php" || true)"
  if [ "$codigo" = 401 ]; then
    echo "[PASSOU] api/juri/conteudo.php responde 401 sem sessão"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] api/juri/conteudo.php respondeu $codigo, esperado 401" >&2
  fi

  md5_raiz="$( (curl -sf --max-time 30 "$RAIZ_PRINCIPAL" || true) | md5sum | cut -c1-12)"
  if [ "$md5_raiz" = "$MD5_RAIZ_PRINCIPAL" ]; then
    echo "[PASSOU] raiz do site principal intacta (md5 $md5_raiz)"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] raiz do site principal mudou: md5 $md5_raiz, esperado $MD5_RAIZ_PRINCIPAL" >&2
  fi
}

# Conferência anônima (7.2): roda o verificador deste repositório contra os dois hosts.
conferir_anonimo() {
  local saida="$ESPACO/verificar.log" rc=0
  VERIFICAR_HOST_PUBLICO="$HOST_PUBLICO" VERIFICAR_BORDA="$BORDA" \
    bash "$RAIZ/scripts/verificar-publicacao.sh" "$DOMINIO" "$DOMINIO_PAI" "$CAMINHOS" "$PACOTE_LOCAL/webroot" \
    > "$saida" 2>&1 || rc=$?
  cat "$saida"
  if [ "$rc" -eq 0 ]; then
    echo "[PASSOU] scripts/verificar-publicacao.sh (anônimo, dois hosts)"
  else
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    grep -E '^\[FALHOU\]' "$saida" | sed 's/^/publicar: /' >&2 || true
    echo "[DIVERGE] scripts/verificar-publicacao.sh reprovou" >&2
  fi
}

# Conferência completa do ar (7.1 6 e 7.1.1). Vale para o modo normal e para --concluir.
conferir_ar() {
  DIVERGENCIAS=0
  conferir_md5_pasta "$PACOTE_LOCAL/webroot" "$DESTINO_WEBROOT" webroot
  conferir_md5_pasta "$PACOTE_LOCAL/app" "$DESTINO_APP/atual" app
  conferir_portao_no_destino "$DESTINO_WEBROOT/api/nucleo" "$DESTINO_APP/atual"
  conferir_api_e_raiz
  conferir_anonimo
  if [ "$DIVERGENCIAS" -ne 0 ]; then
    echo "publicar: CONFERÊNCIA FALHOU com $DIVERGENCIAS divergência(s). O deploy NÃO foi desfeito (decisão do líder). Nada foi enviado ao git." >&2
    exit 1
  fi
}

# Preparo (--preparar): P1 a P3. Nada que o público vê muda: o webroot novo fica em direito2026_webroot_novo.
preparar_destinos() {
  DEPLOY_INICIADO=1
  DIVERGENCIAS=0
  enviar_app
  trocar_ponteiro
  enviar_dados_juri
  enviar_webroot "$DESTINO_WEBROOT_NOVO"
  conferir_md5_pasta "$PACOTE_LOCAL/app" "$DESTINO_APP/versoes/v$VERSAO_NOVA" app-versao
  conferir_md5_pasta "$PACOTE_LOCAL/webroot" "$DESTINO_WEBROOT_NOVO" webroot-novo
  conferir_portao_no_destino "$DESTINO_WEBROOT_NOVO/api/nucleo" "$DESTINO_APP/atual"
  if [ "$DIVERGENCIAS" -ne 0 ]; then
    recusar "preparo com $DIVERGENCIAS divergência(s); nada foi virado (o público segue na versão atual)"
  fi
}

# P2: dados da Júri no privado, só aditivo (o v1.5 não lê estes caminhos). Permissões 700 e 600.
enviar_dados_juri() {
  local privado="$DESTINO_PRIVADO"
  no_destino "mkdir -p -m 700 '$privado/imagens' '$privado/conteudo'" || recusar "não criei as pastas do privado"
  rsync_destino "$CADERNO_ACERVO_JURI/imagens/" "$privado/imagens/" -rlt --checksum --chmod=D700,F600 ||
    recusar "envio das imagens da Júri falhou"
  rsync_destino "$CADERNO_ACERVO_JURI/acervo.json" "$privado/acervo.json" -t --checksum --chmod=F600 ||
    recusar "envio do acervo.json falhou"
  rsync_destino "$CADERNO_RESTRITO_JURI" "$privado/conteudo/juri.json" -t --checksum --chmod=F600 ||
    recusar "envio do juri.json falhou"
  conferir_md5_pasta "$CADERNO_ACERVO_JURI/imagens" "$privado/imagens" juri-imagens
  conferir_md5_arquivo "$CADERNO_ACERVO_JURI/acervo.json" "$privado/acervo.json" juri-acervo
  conferir_md5_arquivo "$CADERNO_RESTRITO_JURI" "$privado/conteudo/juri.json" juri-json
  echo "publicar: dados da Júri enviados ao privado (aditivo, 700/600)"
}

# Depois do envio ao git: o clone novo, sem chave, prova que nenhum arquivo cifrado foi para o remoto
# em claro (6.2). Zero arquivo cifrado analisado é falha.
provar_clone_fresco() {
  local url clone="$ESPACO/prova-clone" f magia n=0 claros=0
  local -a arquivos=()
  url="$(git remote get-url "$REMOTO")" || recusar "remoto $REMOTO sem URL"
  git clone -q "$url" "$clone" || recusar "clone fresco do remoto falhou"
  mapfile -d '' -t arquivos < <(git -C "$clone" ls-files -z)
  for f in "${arquivos[@]}"; do
    [ "$(git -C "$clone" check-attr filter -- "$f" | awk '{print $NF}')" = git-crypt ] || continue
    n=$((n + 1))
    if git -C "$clone" cat-file blob "HEAD:$f" | head -c 10 | cmp -s - <(printf '\0GITCRYPT\0'); then
      :
    else
      claros=$((claros + 1))
      echo "publicar: EM CLARO no remoto: $f" >&2
    fi
  done
  echo "prova do clone fresco (sem chave): encontrados=$n analisados=$n em_claro=$claros"
  [ "$n" -gt 0 ] || recusar "clone fresco sem arquivo cifrado: varredura quebrada (zero é falha)"
  [ "$claros" -eq 0 ] || recusar "$claros arquivo(s) cifrado(s) chegaram em claro ao remoto"
}

# Commit para onde a tag remota aponta. Tag anotada: o ls-remote devolve o objeto da tag em
# refs/tags/vX e o commit descascado em refs/tags/vX^{} (só aparece se a consulta pedir o conjunto
# de tags). Tag leve: a própria refs/tags/vX já é o commit. Vazio se a tag não existir.
commit_da_tag_remota() {
  local remoto="$1" tag="$2" linhas
  linhas="$(git ls-remote --tags "$remoto")" || return 1
  printf '%s\n' "$linhas" | awk -v t="refs/tags/$tag" '
    $2==t"^{}" {descascado=$1}
    $2==t {direto=$1}
    END { if (descascado != "") print descascado; else print direto }'
}

# Prova, só leitura, que branch e tag remotas apontam para o commit de release.
provar_envio() {
  local main_remota tag_comitada
  main_remota="$(git ls-remote "$REMOTO" "refs/heads/$BRANCH_PUBLICA" |
    awk -v r="refs/heads/$BRANCH_PUBLICA" '$2==r{print $1}')"
  tag_comitada="$(commit_da_tag_remota "$REMOTO" "v$VERSAO_NOVA")" || tag_comitada=""
  if [ "$main_remota" != "$SHA_RELEASE" ]; then
    echo "publicar: prova falhou: $BRANCH_PUBLICA em $REMOTO é '${main_remota:-vazio}', esperado $SHA_RELEASE" >&2
    return 1
  fi
  if [ "$tag_comitada" != "$SHA_RELEASE" ]; then
    echo "publicar: prova falhou: v$VERSAO_NOVA em $REMOTO aponta para '${tag_comitada:-nada}', esperado o commit de release $SHA_RELEASE" >&2
    return 1
  fi
  echo "publicar: git ls-remote confirma $BRANCH_PUBLICA e v$VERSAO_NOVA em $REMOTO"
}

enviar_ao_git() {
  git push "$REMOTO" "$BRANCH_PUBLICA"
  PUSH_MAIN_FEITO=1
  git push "$REMOTO" "v$VERSAO_NOVA"
  PUSH_TAG_FEITO=1
  provar_envio || recusar "prova do envio falhou (mensagem acima); confira com git ls-remote antes de agir"
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
  # Incondicional: sucesso ou falha, o clone (com a chave do git-crypt) sai.
  apagar_clone || echo "publicar: AVISO: não consegui apagar o clone; apague por caminho exato: $CLONE" >&2
  if [ "$codigo" -ne 0 ]; then
    if [ "$DEPLOY_INICIADO" = 1 ]; then
      echo "publicar: ABORTADO após iniciar o deploy (código $codigo). O remoto pode estar parcial." >&2
      if [ -n "$SHA_RELEASE" ]; then
        if [ "$TAG_CRIADA" = 1 ]; then
          echo "publicar: commit de release $SHA_RELEASE e tag local v$VERSAO_NOVA existem localmente." >&2
        else
          echo "publicar: commit de release $SHA_RELEASE existe localmente (sem tag)." >&2
        fi
        if [ "$PUSH_MAIN_FEITO" = 1 ] || [ "$PUSH_TAG_FEITO" = 1 ]; then
          echo "publicar: o script chegou a enviar ao git (branch=$PUSH_MAIN_FEITO, tag=$PUSH_TAG_FEITO). Confirme com git ls-remote antes de agir." >&2
        else
          echo "publicar: o script NÃO confirmou envio ao git. Confirme com git ls-remote $REMOTO refs/heads/main e git ls-remote --tags $REMOTO antes de repetir." >&2
        fi
        echo "publicar: decida com o líder antes de repetir: rodar de novo calcula outra versão." >&2
      else
        echo "publicar: nada foi commitado nem enviado ao git." >&2
      fi
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

# --concluir: o ar já tem a versão, conferido à mão pelo líder (V7). Confere, envia e prova.
concluir() {
  conferir_branch_e_arvore
  VERSAO_NOVA="$(node --import tsx scripts/apoio/versao-cli.ts ler package.json)" ||
    recusar "não consegui ler a versão de package.json"
  SHA_RELEASE="$(git rev-parse HEAD)"
  local tag_commit
  tag_commit="$(git rev-parse -q --verify "refs/tags/v$VERSAO_NOVA^{commit}" || true)"
  [ -n "$tag_commit" ] && [ "$tag_commit" = "$SHA_RELEASE" ] ||
    recusar "a tag local v$VERSAO_NOVA não aponta para HEAD: rode --preparar antes"
  conferir_remoto
  ESPACO="$(mktemp -d /var/tmp/publicar.XXXXXX)"
  PACOTE_LOCAL="$(destino_do_pacote "$VERSAO_NOVA")"
  [ -d "$PACOTE_LOCAL" ] || recusar "sem o pacote guardado de v$VERSAO_NOVA (rode --preparar antes)"
  preparar_pasta_pacotes
  conferir_pacote_guardado "$PACOTE_LOCAL"
  DEPLOY_INICIADO=1
  montar_caminhos_protegidos
  conferir_ar
  enviar_ao_git
  provar_clone_fresco
  apagar_pacote_versao "$VERSAO_NOVA"
  echo "concluído: v$VERSAO_NOVA sha=$(git rev-parse --short=12 HEAD) divergencias=0"
}

principal() {
  ler_argumentos "$@"
  if [ "$MODO" = concluir ]; then
    concluir
    return 0
  fi
  conferir_branch_e_arvore
  calcular_versoes
  conferir_tag_local
  if [ "$SECO" = 1 ]; then
    imprimir_plano
    exit 0
  fi
  conferir_destinos
  conferir_remoto
  conferir_insumos
  ESPACO="$(mktemp -d /var/tmp/publicar.XXXXXX)"
  gravar_e_commitar
  criar_tag
  preparar_clone
  copiar_dispositivos
  rodar_preci
  if [ "${CADERNO_PARAR_APOS_PRECI:-0}" = 1 ]; then
    # Ensaio: sai com código 4 de propósito, para que ao_sair desfaça o commit e a tag.
    echo "publicar: ensaio (CADERNO_PARAR_APOS_PRECI=1): parou após o preci; nada foi subido. Log: $ESPACO/preci.log" >&2
    exit 4
  fi
  conferir_pacote_local
  guardar_pacote
  preparar_regras
  if [ "$MODO" = preparar ]; then
    preparar_destinos
    echo "publicar: preparado: v$VERSAO_NOVA no destino (versoes/, webroot novo e privado aditivo). O público segue na versão atual."
    echo "publicar: próximo passo: a virada e a conferência manual (V1 a V8 do plano), depois: npm run publicar -- --concluir"
    exit 0
  fi
  publicar_versao
  montar_caminhos_protegidos
  conferir_ar
  enviar_ao_git
  apagar_pacote_versao "$VERSAO_NOVA"
  echo "publicado: v$VERSAO_NOVA sha=$(git rev-parse --short=12 HEAD) divergencias=0"
}

# Sinal durante o preci (LU-F1.3, L-25): sai com o código do próprio sinal, para que ao_sair leia
# código diferente de 0 e desfaça o commit e a tag locais. Bash só trata o sinal depois que o filho
# em primeiro plano (o preci) termina.
trap 'exit 143' TERM
trap 'exit 130' INT
trap 'exit 129' HUP
trap ao_sair EXIT
principal "$@"
