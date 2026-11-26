#!/usr/bin/env bash
# Publicação do Caderno de Direito (plano do CTO do login único, 7.1, 7.1.1 e 8; LU-F4.3).
#
# Uso:
#   npm run publicar -- <recurso|correcao|construcao> [--versao A.B.C.D] [--seco]
#   npm run publicar -- --preparar <recurso|correcao|construcao> [--versao A.B.C.D]
#   npm run publicar -- --concluir
#
# Modo normal: clone descartável em .worktrees/ no commit base (HEAD de main), com git-crypt destravado.
# A versão e as novidades são gravadas só nesse clone, e o preci roda nele. Só com o preci verde: commit de
# release (só package.json e docs/versoes/novidades.json, copiados do clone) e tag anotada. Depois do preci:
# pacote separado (dist-pacote/webroot e
# dist-pacote/app), app em versoes/v<versão> (fora do webroot), webroot, ponteiro atual trocado
# com ln -sfn em nome temporário e mv -T (atômico), poda (guarda 2 versões: a nova e a anterior, que
# é o rollback). Conferência do ar: md5 de cada arquivo no disco (webroot e app, inclusive .htaccess
# e api/), conferir-portao no PHP do servidor, e a conferência anônima de verificar-publicacao.sh
# nos dois hosts. Só com tudo verde envia branch e tag ao git, e prova com git ls-remote.
#
# --preparar: a mesma sequência até o preci e P1 a P3 (app em versoes/, dados da Júri no privado
# aditivo, webroot em direito2026_webroot_novo). Troca o ponteiro atual para a versão nova (o webroot
# público lê o app por esse ponteiro, em portao.php), mas não troca o webroot público, e não envia nada ao git.
# --concluir: depois da virada (V2 a V8 do plano; a prova com login, V7, é o e2e no ar, scripts/e2e-ar.sh modo pos), confere o ar, envia branch e tag e prova
# no remoto (ls-remote e clone fresco sem chave, 6.2).
#
# --seco: confere e imprime o plano, sem alterar nada.
# Antes da release (commit e tag), preci reprovado ou sinal não deixam nada para desfazer: a release só nasce
# depois do preci verde. Entre a release e o primeiro escrito no destino, desfaz SÓ o que este script fez
# (commit e tag locais). Depois do primeiro escrito no destino não desfaz nada: o remoto não tem desfazer
# automático.
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
MD5_RAIZ_PRINCIPAL="${PUBLICAR_MD5_RAIZ-9010464df712}"
PRECI_TMPDIR=/var/tmp/preci-pub
# Pacote de cada versão, guardado entre --preparar e --concluir. Depois do sucesso ficam só o da versão no
# ar e o da anterior (reter_pacotes_apos_sucesso). Fica em pasta do usuário (700), fora
# do IDrive e fora de /var/tmp (caminho previsível em diretório compartilhado é risco: LU-F4.3).
PASTA_PACOTES="${PUBLICAR_PASTA_PACOTES-${XDG_STATE_HOME:-$HOME/.local/state}/caderno-publicar}"
# Marca de execução em andamento (LU-F4.3-N8): fica na pasta privada e sobrevive a kill -9. Ver registrar_marca.
MARCA_PUBLICACAO="$PASTA_PACOTES/publicacao-em-andamento"
MARCA_ESCRITA=0
# Clone descartável do preci (L-55: subpasta do projeto, ignorada pelo git).
PASTA_CLONES="$RAIZ/.worktrees"
CLONE=""
CHAVE_GIT_CRYPT="${CADERNO_CHAVE_GIT_CRYPT:-$HOME/.config/gusworld/git-crypt-key}"
# Obrigatória, sem padrão: o caminho do JSON é pessoal de quem roda (repositório público). Vazia recusa em conferir_remoto.
CONTEUDO_RESTRITO="${CADERNO_RESTRITO:-}"
# JSON privado da Júri e pasta do acervo (imagens/ e acervo.json): sem padrão de propósito.
CADERNO_RESTRITO_JURI="${CADERNO_RESTRITO_JURI:-}"
CADERNO_ACERVO_JURI="${CADERNO_ACERVO_JURI:-}"
# Código da ponte de novidades e de versão (AV-F5). Em produção é a própria árvore. Os specs de
# fixture apontam PUBLICAR_CODIGO para o código real, porque a fixture não tem tsconfig nem currículo.
CODIGO="${PUBLICAR_CODIGO:-$RAIZ}"

# Funções de cópia dos dispositivos.ts (biblioteca sem efeito ao ser carregada).
# shellcheck source=scripts/apoio/dispositivos-publicacao.sh
source "$RAIZ/scripts/apoio/dispositivos-publicacao.sh"

TETO_APAGAR_WEBROOT=50
TETO_VERSOES=5
SSH_OPCOES="ssh -o BatchMode=yes -o ConnectTimeout=20"
# Lista fechada de destinos que este script escreve, relativos a PUBLICAR_DESTINO_RAIZ (revisão F5.2,
# C-1). A raiz da hospedagem (public_html, com .htaccess e arquivos da raiz) nunca entra aqui, nem
# juri2026_privado (E15 c, em conferir_destinos).
DESTINOS_PERMITIDOS=(public_html/direito2026 direito2026_webroot_novo direito2026_app direito2026_privado)
FORMATO_CAMINHO='^[A-Za-z0-9_./-]+$'
FORMATO_HOST='^[A-Za-z0-9][A-Za-z0-9_.-]*$'

MODO=normal
TIPO=""
VERSAO_FORCADA=""
FORCADA_DEFINIDA=0
SECO=0
VERSAO_ATUAL=""
VERSAO_NOVA=""
SHA_RELEASE=""
# HEAD de main no início da publicação: o clone sai daqui, e R só anda depois do preci verde.
BASE=""
ESPACO=""
PACOTE_LOCAL=""
REGRAS=""
CAMINHOS=""
# Novidades da versão (AV-F5): --novidade repetível; ITENS_NOVIDADE guarda o formato estruturado
# (tipo:valor ou tecnica), nunca o texto final, e é o que vai para docs/versoes/novidades.json.
NOVIDADES=()
ITENS_NOVIDADE=()

# Estado para desfazer só o que foi criado aqui (lido pelo trap de saída).
PACKAGE_ALTERADO=0
# "arquivo sha256" do que o publicar copiou para R: o desfazer só restaura o que ainda é isso (LU-F1.3-N2).
SHA_ESCRITO=()
RELEASE_FEITO=0
TAG_CRIADA=0
DEPLOY_INICIADO=0
# Publicado no ar e no git; só a poda pode ter falhado depois disso (ao_sair não trata como remoto parcial).
PUBLICADO=0
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
      --novidade)
        [ $# -ge 2 ] || uso
        NOVIDADES+=("$2")
        shift 2
        ;;
      --novidade=*)
        NOVIDADES+=("${1#--novidade=}")
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
    [ "${#NOVIDADES[@]}" -eq 0 ] || recusar "--concluir não recebe --novidade: a novidade já foi gravada no commit de release"
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
  BASE="$(git rev-parse HEAD)"
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
  validar_versao "$VERSAO_NOVA"
}

# A versão vai para comando remoto (ln -sfn versoes/vX): só números e pontos (F5.2, I-2).
validar_versao() {
  [[ "$1" =~ ^[0-9]+(\.[0-9]+)*$ ]] || recusar "versão fora do formato numérico: '$1' (nada foi executado)"
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
  1. clone descartável em $PASTA_CLONES/pub-clone.* no commit base (git-crypt unlock com a chave: $chave); versão e novidades gravadas SÓ no clone
  2. preci nesse clone (TMPDIR=$PRECI_TMPDIR; conteúdo restrito: $restrito; caixa: ${CADERNO_CAIXA:-AUSENTE, a publicação real recusa})
     o preci roda o build, que separa o pacote em dist-pacote/webroot e dist-pacote/app
  3. só com o preci verde: commit de release chore(release): v$VERSAO_NOVA (só package.json e docs/versoes/novidades.json, copiados do clone) e tag anotada v$VERSAO_NOVA
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
  [ -n "$CONTEUDO_RESTRITO" ] ||
    recusar "CADERNO_RESTRITO vazio: informe o JSON do conteúdo restrito, por exemplo CADERNO_RESTRITO=<caminho/interdisciplinar.json> npm run publicar -- <tipo>; nada foi commitado"
  [ -f "$CONTEUDO_RESTRITO" ] ||
    recusar "CADERNO_RESTRITO aponta para arquivo inexistente (o conteúdo não é mostrado)"
}

# Destino: falha fechada. Um destino local com ':' seria lido pelo rsync como host remoto; e a Júri
# antiga (juri2026_privado) e a raiz public_html nunca são alvo deste script (E15 c).
conferir_destinos() {
  validar_host_destino
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
  conferir_destino_seguro "$DESTINO_WEBROOT"
  conferir_destino_seguro "$DESTINO_WEBROOT_NOVO"
  conferir_destino_seguro "$DESTINO_APP"
  conferir_destino_seguro "$DESTINO_PRIVADO"
}

# Formato do caminho antes de ele entrar em comando (I-2): só letras, números, _ . / -, sem '..'.
validar_formato_caminho() {
  [[ "$1" =~ $FORMATO_CAMINHO ]] && [[ "$1" != *..* ]] ||
    recusar "caminho do destino fora de [A-Za-z0-9_./-] ou com '..' (nada foi executado): $1"
}

# Host de ssh antes de qualquer execução (I-3): alias simples, nunca opção de ssh (sem '-' inicial).
validar_host_destino() {
  if [ -n "$DESTINO_HOST" ] && ! [[ "$DESTINO_HOST" =~ $FORMATO_HOST ]]; then
    recusar "PUBLICAR_DESTINO_HOST fora do formato de alias ssh (nada foi executado): não pode começar com '-'"
  fi
}

# Confere o destino ANTES de tocá-lo (revisão F5.2, C-1, C-2, I-2). Recebe o caminho completo
# (PUBLICAR_DESTINO_RAIZ/sufixo[/sub]) e recusa: raiz vazia ou que não termina em domains/drpetrus.top
# (C-2); sufixo fora da lista fechada; formato inválido; qualquer componente, do pai da raiz até o
# destino, que seja symlink; realpath do destino diferente de realpath(raiz)/sufixo. Chamada em todo
# ponto que escreve, lê ou apaga no destino. Não se aplica a atual (ponteiro do app, link por desenho).
conferir_destino_seguro() {
  local caminho="${1%/}" resto="" sufixo permitido=0 pai acumulado="" parte cmd saida
  local -a partes=() checar=()
  [ -n "$DESTINO_RAIZ" ] ||
    recusar "PUBLICAR_DESTINO_RAIZ vazio: a raiz da hospedagem não pode ser o destino (C-2); nada foi tocado"
  case "$DESTINO_RAIZ" in
    */domains/drpetrus.top | domains/drpetrus.top) ;;
    *) recusar "PUBLICAR_DESTINO_RAIZ tem de terminar em domains/drpetrus.top: $DESTINO_RAIZ" ;;
  esac
  validar_formato_caminho "$DESTINO_RAIZ"
  validar_formato_caminho "$caminho"
  case "$caminho" in
    "$DESTINO_RAIZ"/*) resto="${caminho#"$DESTINO_RAIZ"/}" ;;
    *) recusar "destino fora da raiz do Caderno ($DESTINO_RAIZ): $caminho" ;;
  esac
  for sufixo in "${DESTINOS_PERMITIDOS[@]}"; do
    if [ "$resto" = "$sufixo" ] || [[ "$resto" == "$sufixo"/* ]]; then
      permitido=1
    fi
  done
  [ "$permitido" = 1 ] || recusar "destino fora da lista fechada: $resto"
  if [ -z "$DESTINO_HOST" ]; then
    case "$DESTINO_RAIZ" in
      /*) ;;
      *) recusar "destino local exige PUBLICAR_DESTINO_RAIZ absoluto: $DESTINO_RAIZ" ;;
    esac
  fi
  validar_host_destino
  # Componentes do pai da raiz até o destino (cada um é testado com test ! -L).
  pai="$(dirname -- "$DESTINO_RAIZ")"
  IFS=/ read -r -a partes <<< "${caminho#"$pai"/}"
  for parte in "${partes[@]}"; do
    acumulado="${acumulado:+$acumulado/}$parte"
    checar+=("$pai/$acumulado")
  done
  cmd=""
  for parte in "${checar[@]}"; do
    cmd+="test ! -L '$parte' && "
  done
  cmd+="[ \"\$(realpath -m -- '$caminho')\" = \"\$(realpath -e -- '$DESTINO_RAIZ')/$resto\" ] && echo SEGURO"
  saida="$(no_destino "$cmd" 2>/dev/null || true)"
  grep -qx SEGURO <<< "$saida" ||
    recusar "destino com symlink, fora do caminho esperado ou inacessível: $caminho (nada foi tocado)"
}

# Novidades (AV-F5, docs/publicacao.md, "Aviso de versão nova"). Recusa antes de qualquer commit:
# recurso e correcao exigem ao menos uma --novidade; construcao não aceita nenhuma (leva tecnica);
# cada item passa pela validação e pelas travas (scripts/apoio/novidades-cli.ts). Mostra o texto
# final, como o aluno vai vê-lo. Nada é gravado aqui.
validar_novidades_publicacao() {
  local erro saida rc=0
  erro="$(mktemp)"
  # O CLI roda a partir de $CODIGO: é lá que moram o tsconfig (alias @/core) e o node_modules.
  saida="$(cd "$CODIGO" && node --import tsx "$CODIGO/scripts/apoio/novidades-cli.ts" validar "$TIPO" \
    ${NOVIDADES[@]+"${NOVIDADES[@]}"} 2> "$erro")" || rc=$?
  if [ "$rc" -ne 0 ]; then
    sed 's/^/publicar: /' "$erro" >&2 || true
    rm -f -- "$erro"
    recusar "novidade ausente ou inválida (nada foi commitado nem marcado)"
  fi
  rm -f -- "$erro"
  ITENS_NOVIDADE=()
  local bruto final
  while IFS=$'\t' read -r bruto final; do
    [ -n "$bruto" ] || continue
    ITENS_NOVIDADE+=("$bruto")
    echo "publicar: novidade (texto final): $final"
  done <<< "$saida"
  [ "${#ITENS_NOVIDADE[@]}" -gt 0 ] || recusar "nenhum item de novidade validado"
}

# Acrescenta a entrada desta versão em docs/versoes/novidades.json DO CLONE, no topo (itens estruturados).
# Só no clone: R recebe o arquivo depois do preci verde (gravar_e_commitar).
gravar_entrada_novidades() {
  (cd "$CODIGO" && node --import tsx "$CODIGO/scripts/apoio/novidades-cli.ts" gravar \
    "$CLONE/docs/versoes/novidades.json" "$VERSAO_NOVA" ${ITENS_NOVIDADE[@]+"${ITENS_NOVIDADE[@]}"}) >/dev/null ||
    recusar "não consegui gravar a entrada de novidades no clone (nada foi commitado)"
}

# Release, depois do preci verde (L-25, regra 3 do CLAUDE.md do site). R não foi tocado até aqui: tem de
# estar no commit base, com a árvore rastreada limpa. Os dois arquivos vêm do clone, que é o que o preci
# testou: são copiados sem regerar e conferidos byte a byte (cmp) antes do commit.
gravar_e_commitar() {
  local alterados mensagem arquivo
  [ "$(git rev-parse HEAD)" = "$BASE" ] ||
    recusar "HEAD mudou desde o início da publicação; nada foi commitado"
  alterados="$(git status --porcelain --untracked-files=no)"
  [ -z "$alterados" ] || recusar "árvore rastreada suja antes da release; nada foi commitado"
  for arquivo in package.json docs/versoes/novidades.json; do
    if [ -L "$CLONE/$arquivo" ] || [ -L "$RAIZ/$arquivo" ]; then
      recusar "$arquivo é link simbólico: não copio (nada foi commitado)"
    fi
    PACKAGE_ALTERADO=1
    cp -- "$CLONE/$arquivo" "$RAIZ/$arquivo" || recusar "não copiei $arquivo do clone (nada foi commitado)"
    SHA_ESCRITO+=("$arquivo $(sha256sum -- "$RAIZ/$arquivo" | cut -d' ' -f1)")
    cmp -s -- "$CLONE/$arquivo" "$RAIZ/$arquivo" ||
      recusar "$arquivo copiado diverge do testado pelo preci (nada foi commitado)"
  done
  alterados="$(git status --porcelain --untracked-files=no | sort)"
  [ "$alterados" = $' M docs/versoes/novidades.json\n M package.json' ] ||
    recusar "esperava só package.json e docs/versoes/novidades.json alterados, veio: $alterados"
  git diff -- package.json docs/versoes/novidades.json
  mensagem="$ESPACO/mensagem-release.txt"
  {
    printf 'chore(release): v%s\n' "$VERSAO_NOVA"
    printf '\nVersão %s do Caderno de Direito (tipo: %s).\n' "$VERSAO_NOVA" "$TIPO"
    if [ -n "${PUBLICAR_ATRIBUICAO:-}" ]; then
      printf '\n%s\n' "$PUBLICAR_ATRIBUICAO"
    fi
  } > "$mensagem"
  git commit -q -F "$mensagem" -- package.json docs/versoes/novidades.json
  PACKAGE_ALTERADO=0
  RELEASE_FEITO=1
  SHA_RELEASE="$(git rev-parse HEAD)"
  [ "$(git diff-tree --no-commit-id --name-only -r HEAD | sort)" = $'docs/versoes/novidades.json\npackage.json' ] ||
    recusar "o commit de release tocou arquivos além de package.json e docs/versoes/novidades.json"
  git show --stat --format='%h %s' HEAD
}

criar_tag() {
  git tag -a "v$VERSAO_NOVA" -m "Caderno de Direito v$VERSAO_NOVA"
  TAG_CRIADA=1
  registrar_marca
}

# Clone descartável no commit base (BASE, lido em conferir_branch_e_arvore), com a árvore destravada pela
# chave do git-crypt. O clone é cópia própria (não é worktree): worktree não aceita o filtro do git-crypt (T5).
# A versão e as novidades da release são gravadas SÓ no clone, depois do unlock (o unlock exige árvore
# limpa): é nele que o preci roda. R não é tocado até o preci ficar verde.
preparar_clone() {
  mkdir -p "$PASTA_CLONES"
  # LU-F1.3-N1: o caminho entra em CLONE ANTES de a pasta existir. Um kill no grupo entre a criação e o
  # registro deixava órfão um pub-clone.* que o trap não conhecia. O nome é desta execução (pid e aleatório),
  # e uma pasta que já exista não é nossa: não é registrada, nem apagada.
  CLONE="$PASTA_CLONES/pub-clone.$$.$RANDOM$RANDOM"
  [ ! -e "$CLONE" ] || { CLONE=""; recusar "caminho do clone já existe em $PASTA_CLONES (nada foi feito)"; }
  mkdir -m 700 -- "$CLONE" || recusar "não criei a pasta do clone em $PASTA_CLONES"
  git clone -q "$RAIZ" "$CLONE" || recusar "git clone do repositório falhou (mensagem acima)"
  git -C "$CLONE" checkout -q --detach "$BASE" ||
    recusar "não consegui pôr o clone no commit base"
  (cd "$CLONE" && git-crypt unlock "$CHAVE_GIT_CRYPT") > "$ESPACO/unlock.log" 2>&1 ||
    recusar "git-crypt unlock falhou no clone (log privado em $ESPACO/unlock.log)"
  if [ -e "$CLONE/node_modules" ] && [ ! -L "$CLONE/node_modules" ]; then
    recusar "$CLONE/node_modules é diretório real: não sobrescrevo"
  fi
  ln -sfn "$RAIZ/node_modules" "$CLONE/node_modules"
  (cd "$CODIGO" && node --import tsx "$CODIGO/scripts/apoio/versao-cli.ts" gravar "$CLONE/package.json" "$VERSAO_NOVA") >/dev/null ||
    recusar "não consegui gravar a versão nova no clone (nada foi commitado)"
  gravar_entrada_novidades
  registrar_marca
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

# LU-C1 (incidente de 08/11/2026): o acervo da Júri tem de estar no formato claro, o contrato de
# scripts/juri/conferir.ts. Antes deste portão só se testava que imagens/ e acervo.json existiam, e uma
# pasta cifrada de 28/10 passou e foi enviada. A saída vai para uma variável, não para arquivo: ESPACO
# ainda é vazio neste ponto do fluxo. Falha fecha: recusa antes de qualquer commit ou virada.
conferir_acervo_claro() {
  local acervo saida rc=0
  acervo="$(realpath -- "$1")" || recusar "acervo da Júri não resolve para caminho real; nada foi commitado"
  saida="$(cd "$RAIZ" && node --import tsx scripts/juri/acervo.ts conferir --saida "$acervo" 2>&1)" || rc=$?
  if [ "$rc" -ne 0 ]; then
    printf '%s\n' "$saida" | sed 's/^/publicar: /' >&2 || true
    recusar "acervo fora do formato claro (conferir código $rc); nada foi commitado"
  fi
  printf '%s\n' "$saida"
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
    conferir_acervo_claro "$CADERNO_ACERVO_JURI"
    [ -f "${CADERNO_RESTRITO_JURI:-/nao-definido}" ] ||
      recusar "--preparar precisa de CADERNO_RESTRITO_JURI (JSON da Júri); nada foi commitado"
  fi
}

copiar_dispositivos() {
  copiar_dispositivos_gerados "$RAIZ" "$CLONE" ||
    recusar "não copiei os dispositivos.ts para o clone (motivo acima)"
}

rodar_preci() {
  local log="$ESPACO/preci.log" rc=0 base_verde=""
  local -a envoltorio=()
  mkdir -p "$PRECI_TMPDIR"
  # Base do seletivo (decisão do líder de 26/11): o último verde é lido AQUI, fora da caixa, cujo HOME é
  # outro (não enxerga nem grava o estado do usuário). Vai para o preci por variável, que atravessa a caixa.
  # Sem estado, ou SHA inválido, fica vazio: rodada completa. Quem grava o verde é gravar_ultimo_verde.
  base_verde="$(cd "$CLONE" && env -u PRECI_BASE_VERDE bash scripts/apoio/preciBaseVerde.sh ler)" || base_verde=""
  # CADERNO_CAIXA (L-50): preci isolado num bwrap. Vazio = roda direto, na sessão.
  if [ -n "${CADERNO_CAIXA:-}" ]; then
    envoltorio=("$CADERNO_CAIXA")
  fi
  echo "publicar: preci no clone (saída em arquivo privado; não é exibida, pode citar trechos do conteúdo restrito)"
  (cd "$CLONE" && CADERNO_RESTRITO="$CONTEUDO_RESTRITO" CADERNO_RESTRITO_JURI="$CADERNO_RESTRITO_JURI" \
    TMPDIR="$PRECI_TMPDIR" PRECI_BASE_VERDE="$base_verde" "${envoltorio[@]}" bash scripts/preci.sh) \
    > "$log" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ]; then
    grep -E '^FALHOU' "$log" | sed 's/^/publicar: /' >&2 || true
    recusar "preci reprovou (código $rc); nada foi commitado nem tagueado"
  fi
  echo "publicar: preci verde"
}

# Último pré-CI verde (decisão do líder de 26/11): o SHA da release é a árvore que o preci testou, porque o
# cmp de gravar_e_commitar garante os dois arquivos copiados do clone. Gravado do lado de fora, depois da
# release. Falhar aqui não desfaz nada: a próxima rodada só sai completa.
gravar_ultimo_verde() {
  (cd "$RAIZ" && bash scripts/apoio/preciBaseVerde.sh gravar "$SHA_RELEASE") ||
    echo "publicar: AVISO: não gravei o último pré-CI verde (a próxima rodada sai completa)" >&2
}

# Recibo da rodada de navegador (CISO-52-PUBLICAR, decisão do líder de 25/11/2026): se as partes do navegador
# (public/api e tests/e2e-portao) mudaram desde a última tag, a publicação exige o recibo verde delas. Sem
# recibo, ou com recibo de outro conteúdo, recusa antes de qualquer escrita. A mensagem traz o comando.
conferir_recibo_navegador() {
  RECIBO_PASTA="$PASTA_PACOTES/recibos" bash "$RAIZ/scripts/apoio/recibo-navegador.sh" conferir ||
    recusar "recibo do teste de navegador não confere; nada foi publicado (comando na mensagem acima)"
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

# Depois do sucesso (conferir_ar e enviar_ao_git já passaram), guarda só o pacote da versão no ar e o da
# versão anterior (o alvo do rollback). Apaga os demais pacotes da pasta, por caminho exato. Antes do
# sucesso esta função não roda, e recusa sem apagar nada se o pacote da versão nova não existir.
reter_pacotes_apos_sucesso() {
  local versao anterior="" ordenadas_linha
  local -a ordenadas=()
  preparar_pasta_pacotes
  [ -d "$(destino_do_pacote "$VERSAO_NOVA")" ] && [ ! -L "$(destino_do_pacote "$VERSAO_NOVA")" ] ||
    recusar "sem o pacote guardado de v$VERSAO_NOVA: nada foi apagado"
  [[ "$VERSAO_NOVA" =~ ^[0-9.]+$ ]] || recusar "versão fora do padrão: nada foi apagado"
  mapfile -t ordenadas < <(
    find "$PASTA_PACOTES" -mindepth 1 -maxdepth 1 -type d -name 'v[0-9]*' -printf '%f\n' |
      sed 's/^v//' | grep -E '^[0-9.]+$' | sort -V || true
  )
  # A anterior é a versão imediatamente antes da nova na ordem de versão (sort -V, não de texto).
  for ordenadas_linha in "${ordenadas[@]}"; do
    [ "$ordenadas_linha" = "$VERSAO_NOVA" ] && break
    anterior="$ordenadas_linha"
  done
  for ordenadas_linha in "${ordenadas[@]}"; do
    if [ "$ordenadas_linha" = "$VERSAO_NOVA" ] || [ "$ordenadas_linha" = "$anterior" ]; then
      continue
    fi
    apagar_pacote_versao "$ordenadas_linha"
  done
  echo "publicar: pacotes guardados: v$VERSAO_NOVA (no ar)${anterior:+ e v$anterior (anterior)}"
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
P poda-lgpd.json
P poda-lgpd.marca
P poda-quarentena/
P incidentes.log
P incidentes-linhas.txt
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
  conferir_destino_seguro "$DESTINO_APP"
  no_destino "cd '$DESTINO_APP' 2>/dev/null && ls -1 versoes 2>/dev/null || true" |
    grep -E '^v[0-9.]+$' | grep -v -x "v$VERSAO_NOVA" | sort -V | tail -n 1 || true
}

# Executa um comando de shell no destino: ssh em produção, local no ensaio.
no_destino() {
  validar_host_destino
  if [ -n "$DESTINO_HOST" ]; then
    # shellcheck disable=SC2086
    $SSH_OPCOES -- "$DESTINO_HOST" "$1"
  else
    bash -c "$1"
  fi
}

# rsync para o destino: origem local, destino no caminho do destino (ssh em produção, local no ensaio).
# Todo rsync passa pelo destino seguro antes de rodar, inclusive a simulação e o --delete (F5.2, C-1).
rsync_destino() {
  local origem="$1" destino="$2"
  shift 2
  local -a rsh=()
  local alvo="$destino"
  validar_host_destino
  conferir_destino_seguro "$destino"
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
  local hash nome encontrados=0 analisados=0 conferidos=0 divergencias=0 seguro links
  declare -A esperado=() ar=()

  # xargs -r: origem sem arquivo não vira md5 de entrada vazia (revisão F5.2, item 6).
  (cd "$origem" && find . -type f -print0 | sort -z | xargs -0 -r md5sum) > "$arquivo_local"
  [ -s "$arquivo_local" ] ||
    recusar "$rotulo: pasta local sem arquivos (origem vazia; zero é varredura quebrada, L-36)"
  # A pasta do app (atual) é ponteiro por symlink de propósito: confere-se a pasta que o contém.
  seguro="$remoto"
  if [ "$(basename -- "$seguro")" = atual ]; then
    seguro="$(dirname -- "$seguro")"
  fi
  conferir_destino_seguro "$seguro"
  if ! no_destino "cd '$remoto' && find . -type f -print0 | sort -z | xargs -0 -r md5sum" > "$arquivo_ar" 2> "$ESPACO/md5-$rotulo-ar.err"; then
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] $rotulo: não consegui listar o destino (rede, chave SSH ou pasta ausente)" >&2
    return 0
  fi
  # Symlink no destino reprova (I-1): find -type f ignora link, então procura-se o link à parte.
  links="$(no_destino "cd '$remoto' && find . -type l -print" 2>/dev/null || true)"
  if [ -n "$links" ]; then
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] $rotulo: symlink no destino, fora do pacote: $(echo "$links" | tr '\n' ' ')" >&2
  fi
  if [ ! -s "$arquivo_ar" ]; then
    DIVERGENCIAS=$((DIVERGENCIAS + 1))
    echo "[DIVERGE] $rotulo: destino sem arquivos" >&2
  fi
  while read -r hash nome; do esperado["${nome#./}"]="$hash"; done < "$arquivo_local"
  while read -r hash nome; do ar["${nome#./}"]="$hash"; done < "$arquivo_ar"
  encontrados=${#esperado[@]}
  [ "$encontrados" -gt 0 ] ||
    recusar "$rotulo: pasta local sem arquivos (zero é varredura quebrada)"

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
  conferir_destino_seguro "$(dirname -- "$remoto")"
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
  validar_host_destino
  conferir_destino_seguro "$(dirname -- "$origem")"
  if [ -n "$DESTINO_HOST" ]; then
    rsh=(-e "$SSH_OPCOES")
    alvo="$DESTINO_HOST:$origem"
  fi
  timeout 300 rsync "${rsh[@]}" --timeout=60 -t "$alvo" "$destino"
}

# Envia o app para uma pasta nova de versão. Nunca apaga nada.
enviar_app() {
  local destino="$DESTINO_APP/versoes/v$VERSAO_NOVA"
  conferir_destino_seguro "$DESTINO_APP"
  DEPLOY_INICIADO=1
  no_destino "mkdir -p -m 700 '$DESTINO_APP/versoes' && mkdir -p '$destino'" ||
    recusar "não consegui criar $destino (nada publicado no ponteiro)"
  rsync_destino "$PACOTE_LOCAL/app/" "$destino/" -rlt --checksum ||
    recusar "rsync do app falhou (o ponteiro ainda não mudou)"
  echo "publicar: app enviado para versoes/v$VERSAO_NOVA"
}

# Troca o ponteiro atual de forma atômica: link em nome temporário e mv -T.
trocar_ponteiro() {
  validar_versao "$VERSAO_NOVA"
  # Conferido de novo logo antes do ln e do mv (F5.2, C-1): o destino pode ter mudado desde o início.
  conferir_destino_seguro "$DESTINO_APP"
  no_destino "cd '$DESTINO_APP' && ln -sfn 'versoes/v$VERSAO_NOVA' atual.tmp && mv -T atual.tmp atual" ||
    recusar "troca do ponteiro atual falhou: o ar pode estar na versão anterior"
  echo "publicar: ponteiro atual aponta para versoes/v$VERSAO_NOVA"
}

# Envia o webroot por rsync, apagando só o que não é do pacote (com teste de teto e lista antes).
enviar_webroot() {
  local destino="$1" origem="$PACOTE_LOCAL/webroot/" simulacao="$ESPACO/simulacao-webroot.txt"
  local -a apagar=()
  local total
  [ -d "$PACOTE_LOCAL/webroot/api/nucleo" ] ||
    recusar "pacote sem webroot/api/nucleo: não envio o webroot (nada foi apagado)"
  conferir_destino_seguro "$destino"
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
  enviar_nucleo_primeiro "$PACOTE_LOCAL/webroot" "$destino"
  rsync_destino "$origem" "$destino/" -rlt --checksum --delete --max-delete="$TETO_APAGAR_WEBROOT" \
    --filter=". $REGRAS" ||
    recusar "envio do webroot falhou (o ponteiro ainda não mudou)"
  echo "publicar: webroot enviado para $destino"
}

# PUBLICAR-NUCLEO-ANTES (LU-F4.3): o núcleo (api/nucleo/) vai numa passada própria, sem --delete, ANTES do
# webroot inteiro. Sem isso, um api/*.php novo chegava ao servidor antes do núcleo que ele chama, e dava 500
# por segundos. Só acrescenta: o --delete continua na passada completa, com o teto e a simulação de antes.
enviar_nucleo_primeiro() {
  local webroot="$1" destino="$2"
  no_destino "mkdir -p -- '$destino/api/nucleo'" ||
    recusar "não consegui criar $destino/api/nucleo (o webroot não foi enviado)"
  rsync_destino "$webroot/api/nucleo/" "$destino/api/nucleo" -rlt --checksum ||
    recusar "envio do núcleo (api/nucleo) falhou antes do webroot (o ponteiro ainda não mudou)"
  echo "publicar: núcleo (api/nucleo) enviado antes do webroot"
}

# Comando remoto da quarentena (AV-F5, docs/publicacao.md): MOVE a versão para
# desativadas/<versão>-<data>, em pasta 700, sem sobrescrever e sem apagar nada. Nunca rm.
# Recebe a versão sem o v (1.10.0.0) e a data (AAAAMMDD); imprime o comando para no_destino.
comando_quarentena() {
  local versao="$1" data="$2" alvo
  alvo="$versao-$data"
  printf "cd '%s' && mkdir -p -m 700 desativadas && test ! -e 'desativadas/%s' && mv -- 'versoes/v%s' 'desativadas/%s'" \
    "$DESTINO_APP" "$alvo" "$versao" "$alvo"
}

# Confere, depois do preci no clone, que o histórico do pacote começa pela versão nova (AV-F5). Se
# não começar, recusa antes da release: nada foi commitado nem tagueado.
conferir_historico_pacote() {
  (cd "$CODIGO" && node --import tsx "$CODIGO/scripts/apoio/novidades-cli.ts" conferir-historico \
    "$CLONE/dist-pacote/app/versao.json" "$VERSAO_NOVA") ||
    recusar "versao.json do pacote: historico[0] não é a versão nova; nada foi commitado nem tagueado"
}

# Poda (AV-F5): mantém duas versões (a nova e a anterior, que é o rollback). A mais velha vai para a
# quarentena (desativadas/), por MOVIMENTO, nunca por rm. Apagar só por ordem expressa do líder, 48 h
# depois da publicação, com assinatura (sub-fase 5.3 da L-70).
# Versões que a poda move: todas, menos as duas mais novas. Só leitura: nada é escrito no destino.
versoes_a_podar() {
  local -a versoes=()
  mapfile -t versoes < <(no_destino "cd '$DESTINO_APP' 2>/dev/null && ls -1 versoes 2>/dev/null || true" |
    grep -E '^v[0-9.]+$' | sort -V -r || true)
  if [ "${#versoes[@]}" -le 2 ]; then
    return 0
  fi
  printf '%s\n' "${versoes[@]:2}"
}

# Pré-checagem SÓ DE LEITURA, antes de qualquer escrita pública (AV-F5, OS-1): o teto da poda e a
# colisão na quarentena. Se falhar, recusa antes de trocar o ponteiro ou enviar qualquer coisa.
checar_poda_previa() {
  local -a apagar=()
  local versao
  conferir_destino_seguro "$DESTINO_APP"
  mapfile -t apagar < <(versoes_a_podar)
  [ "${#apagar[@]}" -le "$TETO_VERSOES" ] ||
    recusar "poda prevista (${#apagar[@]}) passa do teto de $TETO_VERSOES; nada foi publicado"
  for versao in ${apagar[@]+"${apagar[@]}"}; do
    no_destino "cd '$DESTINO_APP' && test ! -e 'desativadas/${versao#v}-$(date +%Y%m%d)'" ||
      recusar "a quarentena de $versao já está ocupada; nada foi publicado"
  done
}

# Poda (quarentena): a última etapa da publicação, depois do ar conferido e do envio ao git (AV-F5).
podar_versoes() {
  local -a apagar=()
  local versao data
  conferir_destino_seguro "$DESTINO_APP"
  mapfile -t apagar < <(versoes_a_podar)
  if [ "${#apagar[@]}" -eq 0 ]; then
    echo "publicar: poda: nada a mover"
    return 0
  fi
  [ "${#apagar[@]}" -le "$TETO_VERSOES" ] ||
    recusar "poda prevista (${#apagar[@]}) passa do teto de $TETO_VERSOES; nada foi movido"
  data="$(date +%Y%m%d)"
  echo "publicar: poda: movendo para a quarentena (desativadas/): ${apagar[*]}"
  for versao in "${apagar[@]}"; do
    [[ "$versao" =~ ^v[0-9.]+$ ]] || recusar "nome de versão fora do padrão: não movo"
    conferir_destino_seguro "$DESTINO_APP/versoes/$versao"
    no_destino "$(comando_quarentena "${versao#v}" "$data")" ||
      recusar "quarentena de $versao falhou (a versão no ar não mudou por causa dela)"
  done
}

# Fase pública, sem a poda: pré-checagem, anterior, envio do app e do webroot, e o ponteiro.
publicar_versao() {
  local anterior
  checar_poda_previa
  anterior="$(anterior_no_destino)"
  echo "publicar: versão anterior no destino: ${anterior:-nenhuma (primeira publicação com este comando)}"
  enviar_senhas_comuns
  enviar_app
  enviar_webroot "$DESTINO_WEBROOT"
  trocar_ponteiro
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
  # O CLI temporário fica dentro da pasta do app (LU-F4.3, F5.2): nunca na raiz da hospedagem.
  local nucleo="$1" atual="$2" pasta="$DESTINO_APP/d26_cli_tmp" saida rc=0
  saida="$ESPACO/conferir-portao.txt"
  conferir_destino_seguro "$pasta"
  no_destino "mkdir -p -m 700 '$pasta/apoio'" || recusar "não criei $pasta"
  rsync_destino "$RAIZ/servidor/cli/conferir-portao.php" "$pasta/" -t
  rsync_destino "$RAIZ/servidor/cli/apoio/cli.php" "$pasta/apoio/" -t
  # LU-C1: --privado faz o CLI conferir também o acervo da Júri (imagens/ e acervo.json) no privado do destino.
  no_destino "D26_NUCLEO='$nucleo' php '$pasta/conferir-portao.php' '$atual' --privado '$DESTINO_PRIVADO'" > "$saida" 2> "$saida.err" || rc=$?
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

# Preparo (--preparar): P1 a P3. Troca o ponteiro atual (trocar_ponteiro) para a versão nova, que o webroot
# público serve por portao.php; o webroot público não é trocado, e o novo fica em direito2026_webroot_novo.
preparar_destinos() {
  DEPLOY_INICIADO=1
  DIVERGENCIAS=0
  enviar_senhas_comuns
  enviar_app
  trocar_ponteiro
  enviar_dados_juri
  enviar_webroot "$DESTINO_WEBROOT_NOVO"
  conferir_md5_pasta "$PACOTE_LOCAL/app" "$DESTINO_APP/versoes/v$VERSAO_NOVA" app-versao
  conferir_md5_pasta "$PACOTE_LOCAL/webroot" "$DESTINO_WEBROOT_NOVO" webroot-novo
  conferir_portao_no_destino "$DESTINO_WEBROOT_NOVO/api/nucleo" "$DESTINO_APP/atual"
  if [ "$DIVERGENCIAS" -ne 0 ]; then
    recusar "preparo com $DIVERGENCIAS divergência(s); o ponteiro atual já aponta para v$VERSAO_NOVA (trocado antes da conferência e não desfeito), e quem está logado já recebe essa versão pelo portão. O webroot público não foi trocado."
  fi
}

# P2: dados da Júri no privado, só aditivo (o v1.5 não lê estes caminhos). Permissões 700 e 600.
enviar_dados_juri() {
  local privado="$DESTINO_PRIVADO"
  conferir_destino_seguro "$privado"
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

# Prova de cifra (6.2): em DIR, no commit REF, todo arquivo com filter=git-crypt tem a magia do
# git-crypt no blob. A magia é lida em hexadecimal, sem pipe com status: com pipefail, o head que
# fecha cedo dava SIGPIPE e reprovava arquivo cifrado grande (falso positivo, LU-F4.3).
# Zero arquivo cifrado é falha (varredura quebrada).
# NIST-SENHAS-PROIBIDAS: a lista de senhas comuns vai ao privado do destino antes do app novo, que a lê para
# recusar senha comum. Sai do clone do commit base; a cópia no destino é conferida por md5 e divergência recusa.
# Sem a lista no privado, a criação, a redefinição e a troca de senha recusam (fail secure).
enviar_senhas_comuns() {
  local origem="$CLONE/servidor/dados/senhas-proibidas.txt" antes="$DIVERGENCIAS"
  [ -s "$origem" ] ||
    recusar "lista de senhas comuns ausente ou vazia no clone (NIST-SENHAS-PROIBIDAS): sem ela a troca recusa tudo"
  conferir_destino_seguro "$DESTINO_PRIVADO"
  no_destino "mkdir -p -m 700 '$DESTINO_PRIVADO'" || recusar "não criei a pasta privada para a lista de senhas comuns"
  rsync_destino "$origem" "$DESTINO_PRIVADO/senhas-proibidas.txt" -t --checksum --chmod=F600 ||
    recusar "envio da lista de senhas comuns falhou (nada do app foi trocado)"
  conferir_md5_arquivo "$origem" "$DESTINO_PRIVADO/senhas-proibidas.txt" senhas-comuns
  [ "$DIVERGENCIAS" = "$antes" ] ||
    recusar "cópia da lista de senhas comuns diverge no destino (md5); nada do app foi trocado"
  echo "publicar: lista de senhas comuns no privado (md5 conferido, 600)"
}

contar_cifra() {
  local dir="$1" ref="$2" f magia encontrados=0 claros=0
  local -a arquivos=()
  mapfile -d '' -t arquivos < <(git -C "$dir" ls-tree -r -z --name-only "$ref")
  for f in "${arquivos[@]}"; do
    [ "$(git -C "$dir" check-attr filter -- "$f" | awk '{print $NF}')" = git-crypt ] || continue
    encontrados=$((encontrados + 1))
    magia="$(git -C "$dir" cat-file blob "$ref:$f" | head -c 10 | od -An -tx1 | tr -d ' \n')" || true
    if [ "$magia" != 00474954435259505400 ]; then
      claros=$((claros + 1))
      echo "publicar: EM CLARO: $f" >&2
    fi
  done
  echo "cifra em $ref: encontrados=$encontrados analisados=$encontrados em_claro=$claros"
  [ "$encontrados" -gt 0 ] || recusar "sem arquivo cifrado em $ref: varredura quebrada (zero é falha)"
  [ "$claros" -eq 0 ] || recusar "$claros arquivo(s) cifrado(s) em claro em $ref; nada foi enviado"
}

# Ponta de main no remoto, agora: é dela que sai a faixa de commits que vai subir.
ler_main_remota() {
  git ls-remote "$REMOTO" "refs/heads/$BRANCH_PUBLICA" | awk -v r="refs/heads/$BRANCH_PUBLICA" '$2==r{print $1}'
}

# As refs locais que vão subir têm de apontar para o commit de release (e não para um nome que mudou).
conferir_refs_antes_do_envio() {
  local ref_main ref_tag
  ref_main="$(git rev-parse -q --verify "refs/heads/$BRANCH_PUBLICA^{commit}" || true)"
  ref_tag="$(git rev-parse -q --verify "refs/tags/v$VERSAO_NOVA^{commit}" || true)"
  [ "$ref_main" = "$SHA_RELEASE" ] ||
    recusar "refs/heads/$BRANCH_PUBLICA aponta para '${ref_main:-nada}', não para o commit de release $SHA_RELEASE; nada foi enviado"
  [ "$ref_tag" = "$SHA_RELEASE" ] ||
    recusar "refs/tags/v$VERSAO_NOVA aponta para '${ref_tag:-nada}', não para o commit de release $SHA_RELEASE; nada foi enviado"
}

# Prova de cifra da faixa que vai ao remoto: cada commit de main_remota..release, com o .gitattributes
# de cada um (scripts/apoio/cifra-faixa.py). Um commit do meio em claro reprova, mesmo com a ponta limpa.
# Segunda prova (LU-F5.2, I-4): nenhum blob que a faixa introduz, em caminho nenhum, tem janela de texto
# de estudo cifrado (scripts/apoio/textoEmClaroNaFaixa.ts). Cópia sem filtro que some depois também reprova.
conferir_cifra_da_faixa() {
  local base saida="$ESPACO/cifra-faixa.txt" rc=0 saida_texto="$ESPACO/texto-na-faixa.txt" rc_texto=0
  base="$(ler_main_remota)"
  if [ -n "$base" ]; then
    git cat-file -e "$base^{commit}" 2>/dev/null ||
      recusar "$REMOTO/$BRANCH_PUBLICA tem commit que não existe aqui; nada foi enviado"
    git merge-base --is-ancestor "$base" "$SHA_RELEASE" ||
      recusar "$REMOTO/$BRANCH_PUBLICA divergiu do commit de release; nada foi enviado"
  else
    base="-"
  fi
  python3 "$RAIZ/scripts/apoio/cifra-faixa.py" "$RAIZ" "$base" "$SHA_RELEASE" > "$saida" 2> "$saida.err" || rc=$?
  cat "$saida"
  sed 's/^/publicar: /' "$saida.err" >&2 || true
  [ "$rc" -eq 0 ] || recusar "prova de cifra da faixa reprovou (código $rc); nada foi enviado ao git"
  (cd "$RAIZ" && node --import tsx scripts/apoio/textoEmClaroNaFaixa.ts "$RAIZ" "$base" "$SHA_RELEASE") > "$saida_texto" 2>&1 || rc_texto=$?
  cat "$saida_texto"
  [ "$rc_texto" -eq 0 ] || recusar "prova de texto de estudo na faixa reprovou (código $rc_texto); nada foi enviado ao git"
  echo "publicar: prova de cifra da faixa conferiu (base=${base:0:12}); texto de estudo na faixa conferiu"
}

# Depois do envio ao git: o clone novo, sem chave, confere a mesma prova no remoto (6.2).
provar_clone_fresco() {
  local url clone="$ESPACO/prova-clone"
  url="$(git remote get-url "$REMOTO")" || recusar "remoto $REMOTO sem URL"
  git clone -q "$url" "$clone" || recusar "clone fresco do remoto falhou"
  contar_cifra "$clone" HEAD
  echo "prova do clone fresco (sem chave): OK"
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
  conferir_refs_antes_do_envio
  conferir_cifra_da_faixa
  # Envia o objeto validado (SHA), não o nome móvel da branch: o que foi conferido é o que sobe.
  git push "$REMOTO" "$SHA_RELEASE:refs/heads/$BRANCH_PUBLICA"
  PUSH_MAIN_FEITO=1
  git push "$REMOTO" "refs/tags/v$VERSAO_NOVA:refs/tags/v$VERSAO_NOVA"
  PUSH_TAG_FEITO=1
  provar_envio || recusar "prova do envio falhou (mensagem acima); confira com git ls-remote antes de agir"
}

# Desfaz só o que este script copiou para R (LU-F1.3-N2, L-25): volta ao base o arquivo que ainda é o
# que foi copiado. Se alguém editou depois da cópia, não toca e avisa: apagar o trecho de outra pessoa
# seria perda de dado. A cópia do publicar continua lá, e o aviso diz como voltar à mão.
desfazer_arquivos_escritos() {
  local i arquivo sha_copiado
  for ((i = 0; i < ${#SHA_ESCRITO[@]}; i++)); do
    arquivo="${SHA_ESCRITO[i]% *}"
    sha_copiado="${SHA_ESCRITO[i]##* }"
    if [ "$(sha256sum -- "$RAIZ/$arquivo" 2>/dev/null | cut -d' ' -f1)" = "$sha_copiado" ]; then
      git checkout -- "$arquivo" >/dev/null 2>&1 || true
    else
      echo "publicar: AVISO: $arquivo foi editado depois da cópia do publicar; não restaurei, para não apagar a sua edição. Conferir e voltar ao base à mão: git diff -- $arquivo; git checkout -- $arquivo" >&2
    fi
  done
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
  git restore --staged -- package.json docs/versoes/novidades.json || true
  desfazer_arquivos_escritos
  RELEASE_FEITO=0
  PACKAGE_ALTERADO=0
  echo "publicar: desfeito: commit de release e tag local v$VERSAO_NOVA removidos; package.json de volta a $VERSAO_ATUAL" >&2
}

# LU-F4.3-N8: uma morte abrupta (kill -9, queda de energia) não passa pelo trap, e deixava commit de release,
# tag local e envio parcial sem nenhum aviso na execução seguinte. A marca é escrita antes do primeiro passo que
# muda R (ou o remoto) e só o fim tratado (ao_sair) a apaga. Marca presente = a execução anterior não terminou:
# esta recusa e não desfaz, não apaga e não envia nada. A decisão de repetir é do líder.
registrar_marca() {
  [ "${MARCA_ESCRITA:-0}" = 1 ] || return 0
  (
    umask 077
    {
      printf 'pid=%s\n' "$$"
      printf 'modo=%s\n' "$MODO"
      printf 'versao=%s\n' "${VERSAO_NOVA:-}"
      printf 'base=%s\n' "${BASE:-}"
      printf 'release=%s\n' "${SHA_RELEASE:-}"
      printf 'tag_criada=%s\n' "${TAG_CRIADA:-0}"
      printf 'espaco=%s\n' "${ESPACO:-}"
      printf 'clone=%s\n' "${CLONE:-}"
    } > "$MARCA_PUBLICACAO"
  )
}

marcar_em_andamento() {
  preparar_pasta_pacotes
  MARCA_ESCRITA=1
  registrar_marca
}

conferir_publicacao_interrompida() {
  local pid
  if [ ! -e "$MARCA_PUBLICACAO" ] && [ ! -L "$MARCA_PUBLICACAO" ]; then
    return 0
  fi
  echo "publicar: marca da execução anterior em $MARCA_PUBLICACAO:" >&2
  sed 's/^/publicar:   /' "$MARCA_PUBLICACAO" >&2 || true
  pid="$(sed -n 's/^pid=//p' "$MARCA_PUBLICACAO" 2>/dev/null | head -n 1)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    recusar "outra execução do publicar parece estar em andamento (pid $pid); espere ela terminar. Nada foi feito por esta execução."
  fi
  recusar "a publicação anterior não terminou (pid ${pid:-desconhecido}): pode ter ficado commit de release ou tag local, e envio ao git parcial. Antes de repetir, confira: git log -1 --format='%H %s'; git tag --list 'v*'; git ls-remote $REMOTO refs/heads/$BRANCH_PUBLICA; git ls-remote --tags $REMOTO. Depois, e só depois, remova a marca pelo caminho exato: $MARCA_PUBLICACAO. Nada foi desfeito nem enviado por esta execução."
}

ao_sair() {
  local codigo=$?
  # Fim tratado (qualquer código, inclusive sinal que o trap leu): a marca de execução em andamento sai aqui.
  # Só remove a marca que ESTA execução escreveu (LU-F4.3-N8): uma execução recusada não a apaga.
  if [ "${MARCA_ESCRITA:-0}" = 1 ]; then
    rm -f -- "$MARCA_PUBLICACAO"
    MARCA_ESCRITA=0
  fi
  # Incondicional: sucesso ou falha, o clone (com a chave do git-crypt) sai.
  apagar_clone || echo "publicar: AVISO: não consegui apagar o clone; apague por caminho exato: $CLONE" >&2
  # Publicado e só a poda falhou: o aviso "poda pendente" já foi dado por principal. Não é remoto parcial.
  if [ "$codigo" -ne 0 ] && [ "$PUBLICADO" = 1 ]; then
    exit "$codigo"
  fi
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
        desfazer_arquivos_escritos
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

# --concluir: o ar já tem a versão, com a prova com login (V7) feita pelo e2e no ar (scripts/e2e-ar.sh, modo pos). Confere, envia e prova.
concluir() {
  conferir_branch_e_arvore
  VERSAO_NOVA="$(node --import tsx scripts/apoio/versao-cli.ts ler package.json)" ||
    recusar "não consegui ler a versão de package.json"
  validar_versao "$VERSAO_NOVA"
  SHA_RELEASE="$(git rev-parse HEAD)"
  local tag_commit
  tag_commit="$(git rev-parse -q --verify "refs/tags/v$VERSAO_NOVA^{commit}" || true)"
  [ -n "$tag_commit" ] && [ "$tag_commit" = "$SHA_RELEASE" ] ||
    recusar "a tag local v$VERSAO_NOVA não aponta para HEAD: rode --preparar antes"
  conferir_remoto
  conferir_destinos
  ESPACO="$(mktemp -d /var/tmp/publicar.XXXXXX)"
  PACOTE_LOCAL="$(destino_do_pacote "$VERSAO_NOVA")"
  [ -d "$PACOTE_LOCAL" ] || recusar "sem o pacote guardado de v$VERSAO_NOVA (rode --preparar antes)"
  preparar_pasta_pacotes
  conferir_pacote_guardado "$PACOTE_LOCAL"
  marcar_em_andamento
  DEPLOY_INICIADO=1
  montar_caminhos_protegidos
  conferir_ar
  enviar_ao_git
  provar_clone_fresco
  reter_pacotes_apos_sucesso
  echo "concluído: v$VERSAO_NOVA sha=$(git rev-parse --short=12 HEAD) divergencias=0"
}

principal() {
  ler_argumentos "$@"
  conferir_publicacao_interrompida
  if [ "$MODO" = concluir ]; then
    concluir
    return 0
  fi
  conferir_branch_e_arvore
  calcular_versoes
  conferir_tag_local
  # Novidades antes do --seco e antes de qualquer commit: recusa com falha visível, sem gravar nada.
  validar_novidades_publicacao
  if [ "$SECO" = 1 ]; then
    imprimir_plano
    exit 0
  fi
  conferir_recibo_navegador
  conferir_destinos
  conferir_remoto
  conferir_insumos
  marcar_em_andamento
  ESPACO="$(mktemp -d /var/tmp/publicar.XXXXXX)"
  preparar_clone
  copiar_dispositivos
  rodar_preci
  if [ "${CADERNO_PARAR_APOS_PRECI:-0}" = 1 ]; then
    # Ensaio: sai com código 4 de propósito. A release ainda não existe, então não há commit nem tag a desfazer.
    echo "publicar: ensaio (CADERNO_PARAR_APOS_PRECI=1): parou após o preci; nada foi subido. Log: $ESPACO/preci.log" >&2
    exit 4
  fi
  conferir_pacote_local
  conferir_historico_pacote
  gravar_e_commitar
  gravar_ultimo_verde
  criar_tag
  guardar_pacote
  preparar_regras
  if [ "$MODO" = preparar ]; then
    preparar_destinos
    echo "publicar: preparado: v$VERSAO_NOVA no destino (versoes/, webroot novo e privado aditivo). O ponteiro atual já aponta para v$VERSAO_NOVA: quem está logado já recebe essa versão pelo portão, com o webroot público antigo, até a virada."
    echo "publicar: próximo passo: a virada (V1 a V8 de docs/publicacao.md; a V7 é o e2e no ar, scripts/e2e-ar.sh pos), depois: npm run publicar -- --concluir"
    exit 0
  fi
  publicar_versao
  montar_caminhos_protegidos
  conferir_ar
  enviar_ao_git
  reter_pacotes_apos_sucesso
  # A versão já está no ar, conferida e no git. A poda é a última etapa (AV-F5, OS-1): se ela falhar,
  # nada é desfeito; sai com código 3 e avisa só da poda, sem a mensagem de remoto parcial.
  PUBLICADO=1
  (podar_versoes) || {
    echo "publicar: publicado, poda pendente: v$VERSAO_NOVA está no ar, conferida e no git; a quarentena da versão antiga falhou e pode ser refeita." >&2
    exit 3
  }
  echo "publicado: v$VERSAO_NOVA sha=$(git rev-parse --short=12 HEAD) divergencias=0"
}

# Sinal durante o preci (LU-F1.3, L-25): sai com o código do próprio sinal, para que ao_sair leia
# código diferente de 0. Antes da release não há commit nem tag: nada a desfazer. Bash só trata o sinal depois que o filho
# em primeiro plano (o preci) termina.
trap 'exit 143' TERM
trap 'exit 130' INT
trap 'exit 129' HUP
trap ao_sair EXIT
principal "$@"
