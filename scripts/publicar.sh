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
# Nunca imprime segredo nem o conteúdo de CADERNO_RESTRITO nem de
# CADERNO_RESTRITO_JURI. Sem --no-verify, sem force, sem amend (GODS_LAWS L-24, L-25).
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
# JSON privado da Júri: sem padrão de propósito. Cadeira publicada sem ele
# reprova o preci (falha fechada); string vazia conta como ausente.
CADERNO_RESTRITO_JURI="${CADERNO_RESTRITO_JURI:-}"

# Funções de cópia dos dispositivos.ts (biblioteca sem efeito ao ser carregada).
# shellcheck source=scripts/apoio/dispositivos-publicacao.sh
source "$RAIZ/scripts/apoio/dispositivos-publicacao.sh"

# Higiene da produção, com uma geração de folga. Só apaga o que não está no
# pacote atual, nem no manifesto publicado antes (que está no ar), e nunca fora
# de assets/ e workbox-*.js sem --apagar-fora-de-assets. Teto por publicação:
TETO_APAGAR=500
MANIFESTO_ATUAL=.publicacao-manifesto.txt
MANIFESTO_ANTERIOR=.publicacao-manifesto-anterior.txt
SSH_OPCOES="ssh -o BatchMode=yes -o ConnectTimeout=20"
# Etapa 1: tudo menos os arquivos de entrada (que sobem por último, na etapa 2).
ETAPA1_EXCLUI=(--exclude=/index.html --exclude=/sw.js --exclude=/404.html --exclude=/manifest.webmanifest)
ETAPA2_INCLUI=(--include=/index.html --include=/sw.js --include=/404.html --include=/manifest.webmanifest --exclude='*')
APAGAR_FORA=0
APAGAR_HABILITADO=1
MANIFESTO_ATUAL_EXISTE=0
PUSH_MAIN_FEITO=0
PUSH_TAG_FEITO=0

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
  echo "uso: npm run publicar -- <recurso|correcao|construcao> [--versao A.B.C.D] [--seco] [--apagar-fora-de-assets]" >&2
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
      --apagar-fora-de-assets)
        APAGAR_FORA=1
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
  3. prepara $WT no commit da tag, apaga os dispositivos.ts que sobraram de geração anterior e copia os atuais
  4. preci em $WT (TMPDIR=$PRECI_TMPDIR; conteúdo restrito: $restrito)
  5. rsync em 2 etapas para $DESTINO_RSYNC
     etapa 1: tudo menos index.html, sw.js, 404.html, manifest.webmanifest; apaga no
              servidor só assets/ e workbox-*.js fora do pacote e do manifesto anterior
              (teto $TETO_APAGAR; fora disso aborta, salvo --apagar-fora-de-assets)
     etapa 2: index.html, sw.js, 404.html, manifest.webmanifest (sem apagar nada)
     dados do servidor (usuarios.json, sessoes/, conteudo/ etc.) ficam protegidos
  6. conferência: md5 de cada arquivo do dist, api/saude.php, api/conteudo.php (401),
     api/juri/conteudo.php (401), raiz $RAIZ_PRINCIPAL (md5 $MD5_RAIZ_PRINCIPAL),
     scripts/verificar-publicacao.sh
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
  copiar_dispositivos_gerados "$RAIZ" "$WT" ||
    recusar "não copiei os dispositivos.ts para $WT (motivo acima)"
}

rodar_preci() {
  local log="$ESPACO/preci.log" rc=0
  mkdir -p "$PRECI_TMPDIR"
  echo "publicar: preci em $WT (saída em arquivo privado; não é exibida, pode citar trechos do conteúdo restrito)"
  (cd "$WT" && CADERNO_RESTRITO="$CONTEUDO_RESTRITO" CADERNO_RESTRITO_JURI="$CADERNO_RESTRITO_JURI" \
    TMPDIR="$PRECI_TMPDIR" bash scripts/preci.sh) \
    > "$log" 2>&1 || rc=$?
  if [ "$rc" -ne 0 ]; then
    grep -E '^FALHOU' "$log" | sed 's/^/publicar: /' >&2 || true
    recusar "preci reprovou (código $rc); desfaço o commit e a tag locais"
  fi
  echo "publicar: preci verde"
}

# Regras de proteção fixas: o que o servidor escreve sozinho. Hoje isso fica
# FORA de direito2026/ (public/api/nucleo/config.php:32-37 resolve $priv como
# irmão de public_html; armazenamento.php:208-216 e respostas.php:83 gravam lá).
# Estas regras são cinto de segurança: se algum dia caírem dentro do destino,
# nunca são apagadas.
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
# manifestos da própria higiene
P .publicacao-manifesto.txt
P .publicacao-manifesto-anterior.txt
# Júri (public/api/nucleo/config.php, d26_dir_privado): o diretório privado é
# juri2026_privado, irmão de public_html, logo FORA de public_html/direito2026/ e
# fora do alcance deste rsync. Mesmo assim, por cinto de segurança, acervo.json
# e imagens/ ficam protegidos: se algum dia caírem no destino, a próxima publicação
# não os apaga. Os demais arquivos da Júri
# (usuarios.json, tentativas.json, segredo.key, sessoes/, conteudo/) já estão
# acima, em comum com o Interdisciplinar.
P /acervo.json
P /imagens/
# arquivos que a hospedagem põe no diretório
P error_log
P cgi-bin/
P .well-known/
P .user.ini
REGRAS
}

# Baixa do destino os manifestos publicados (atual e anterior). Antes, lista o
# destino: se a listagem falhar, aborta (não tratar falha de rede como "sem
# manifesto", que liberaria apagar a geração que está no ar).
ler_manifestos_remotos() {
  local listagem="$ESPACO/listagem-destino.txt" nome
  APAGAR_HABILITADO=1
  MANIFESTO_ATUAL_EXISTE=0
  mkdir -p "$ESPACO/manifestos-remotos"
  rsync --list-only -e "$SSH_OPCOES" "$DESTINO_RSYNC" > "$listagem" ||
    recusar "não consegui listar o destino (rede ou chave SSH); nada foi apagado nem enviado"
  for nome in "$MANIFESTO_ATUAL" "$MANIFESTO_ANTERIOR"; do
    if awk -v n="$nome" '$NF==n{achou=1} END{exit !achou}' "$listagem"; then
      rsync -e "$SSH_OPCOES" "$DESTINO_RSYNC$nome" "$ESPACO/manifestos-remotos/" ||
        recusar "$nome existe no destino mas não foi baixado"
      if [ "$nome" = "$MANIFESTO_ATUAL" ]; then
        MANIFESTO_ATUAL_EXISTE=1
      fi
    fi
  done
  if [ "$MANIFESTO_ATUAL_EXISTE" = 0 ]; then
    protege_versao_no_ar
  fi
}

# Primeira publicação com este comando (sem manifesto no servidor): a versão no
# ar é lida da lista de precache do sw.js publicado, que é o que o navegador já
# tem em cache. Se não der para ler, NÃO se apaga nada nesta publicação.
protege_versao_no_ar() {
  local sw="$ESPACO/sw-no-ar.js" lista="$ESPACO/versao-no-ar.txt" qtd
  if ! curl -sf --max-time 30 -o "$sw" "$DOMINIO/sw.js"; then
    avisar_sem_apagar "não consegui baixar $DOMINIO/sw.js"
    return 0
  fi
  qtd=$(grep -o -E "url *: *[\"'][^\"']+[\"']" "$sw" | wc -l || true)
  if [ "${qtd:-0}" -eq 0 ]; then
    avisar_sem_apagar "o sw.js publicado não tem lista de precache legível"
    return 0
  fi
  {
    printf '%s\n' index.html sw.js 404.html manifest.webmanifest
    grep -o -E "url *: *[\"'][^\"']+[\"']" "$sw" | sed -E "s/^url *: *[\"']//; s/[\"']\$//" || true
    grep -o -E '\./workbox-[A-Za-z0-9_-]+' "$sw" | sed -E 's|^\./||; s|$|.js|' || true
  } | sed -E 's|^\./||; s|^/||' | sort -u > "$lista"
  if grep -q -v -E '^[A-Za-z0-9._/-]+$' "$lista"; then
    avisar_sem_apagar "a lista de precache tem nome fora do padrão seguro"
    return 0
  fi
  cp -- "$lista" "$ESPACO/manifestos-remotos/$MANIFESTO_ANTERIOR"
  echo "publicar: primeira publicação: versão no ar protegida por $(grep -c . "$lista") caminho(s) lidos do sw.js"
}

avisar_sem_apagar() {
  APAGAR_HABILITADO=0
  echo "publicar: AVISO: $1. Esta publicação segue SEM apagar nada no servidor." >&2
}

# Regras de proteção = fixas + tudo que está nos dois manifestos remotos.
montar_regras_protecao() {
  local arq
  REGRAS="$ESPACO/protecao.rules"
  for arq in "$ESPACO/manifestos-remotos/$MANIFESTO_ATUAL" "$ESPACO/manifestos-remotos/$MANIFESTO_ANTERIOR"; do
    if [ -f "$arq" ] && grep -q -v -E '^([A-Za-z0-9._/-]+)?$' "$arq"; then
      recusar "manifesto remoto com nome fora do padrão seguro: $arq"
    fi
  done
  {
    regras_fixas_protecao
    printf 'P %s\nP %s\n' "$MANIFESTO_ATUAL" "$MANIFESTO_ANTERIOR"
    for arq in "$ESPACO/manifestos-remotos/$MANIFESTO_ATUAL" "$ESPACO/manifestos-remotos/$MANIFESTO_ANTERIOR"; do
      if [ -f "$arq" ]; then
        sed -n '/./s|^|P /|p' "$arq"
      fi
    done
  } > "$REGRAS"
}

# Simula a etapa 1 com --dry-run (-n): não escreve nada no destino. Lista o que
# apagaria, separa o que está dentro do escopo (assets/ e workbox-*.js) e aborta
# se passar do teto ou se houver algo fora do escopo sem --apagar-fora-de-assets.
calcular_apagamentos() {
  local origem="$WT/dist/" simulacao="$ESPACO/simulacao.txt" lista="$ESPACO/apagar.txt"
  local total fora assets workbox
  timeout 300 rsync -n -i -rlt --checksum --delete --timeout=60 -e "$SSH_OPCOES" \
    --filter=". $REGRAS" "${ETAPA1_EXCLUI[@]}" \
    "$origem" "$DESTINO_RSYNC" > "$simulacao" 2>&1 ||
    recusar "simulação de apagamento falhou (nada foi apagado)"
  grep -E '^\*deleting' "$simulacao" | sed -E 's/^\*deleting +//; s|/$||' > "$lista" || true
  total=$(grep -c . "$lista" || true)
  assets=$(grep -c -E '^assets/' "$lista" || true)
  workbox=$(grep -c -E '^workbox-[^/]*\.js$' "$lista" || true)
  fora=$(grep -v -E '^(assets/|workbox-[^/]*\.js$)' "$lista" | grep -c . || true)
  echo "publicar: apagamento previsto: $total (assets/: $assets, workbox-*.js: $workbox, fora do escopo: $fora)"
  if [ "$fora" -gt 0 ]; then
    grep -v -E '^(assets/|workbox-[^/]*\.js$)' "$lista" | head -n 50 | sed 's/^/publicar:   fora do escopo: /' >&2
  fi
  [ "$total" -le "$TETO_APAGAR" ] ||
    recusar "apagamento previsto ($total) passa do teto de $TETO_APAGAR; nada foi apagado"
  if [ "$fora" -gt 0 ] && [ "$APAGAR_FORA" != 1 ]; then
    recusar "$fora caminho(s) fora de assets/ e workbox-*.js a apagar; revise a lista acima e rode de novo com --apagar-fora-de-assets"
  fi
}

# Grava no destino o manifesto deste pacote e move o atual para o anterior.
# Depois do rsync das duas etapas, para que o manifesto só mude com o pacote no ar.
publicar_manifestos() {
  local novo="$ESPACO/manifestos-enviar"
  mkdir -p "$novo"
  (cd "$WT/dist" && find . -type f -printf '%P\n' | sort) > "$novo/$MANIFESTO_ATUAL"
  if [ -f "$ESPACO/manifestos-remotos/$MANIFESTO_ATUAL" ]; then
    cp -- "$ESPACO/manifestos-remotos/$MANIFESTO_ATUAL" "$novo/$MANIFESTO_ANTERIOR"
  elif [ -f "$ESPACO/manifestos-remotos/$MANIFESTO_ANTERIOR" ]; then
    cp -- "$ESPACO/manifestos-remotos/$MANIFESTO_ANTERIOR" "$novo/$MANIFESTO_ANTERIOR"
  fi
  # --checksum: sem ele, rsync compara tamanho e mtime, e dois manifestos de
  # mesmo tamanho gravados no mesmo segundo parecem iguais e não são atualizados.
  timeout 300 rsync -rlt --checksum --timeout=60 -e "$SSH_OPCOES" "$novo/" "$DESTINO_RSYNC"
}

publicar_arquivos() {
  local origem="$WT/dist/"
  local -a apagar=()
  ler_manifestos_remotos
  montar_regras_protecao
  if [ "$APAGAR_HABILITADO" = 1 ]; then
    calcular_apagamentos
    apagar=(--delete --max-delete="$TETO_APAGAR")
  else
    echo "publicar: sem apagamento nesta publicação"
  fi
  DEPLOY_INICIADO=1
  timeout 900 rsync -rlt --checksum "${apagar[@]}" --timeout=60 \
    -e "$SSH_OPCOES" --filter=". $REGRAS" "${ETAPA1_EXCLUI[@]}" \
    "$origem" "$DESTINO_RSYNC"
  timeout 300 rsync -rlt --checksum --timeout=60 \
    -e "$SSH_OPCOES" "${ETAPA2_INCLUI[@]}" \
    "$origem" "$DESTINO_RSYNC"
  publicar_manifestos
  echo "publicar: rsync (duas etapas) e manifestos concluídos"
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

# Commit para onde a tag remota aponta. Tag anotada: o ls-remote devolve o objeto
# da tag em refs/tags/vX e o commit descascado em refs/tags/vX^{} (só aparece se a
# consulta pedir o conjunto de tags, não um padrão exato). Tag leve: a própria
# refs/tags/vX já é o commit. Devolve vazio se a tag não existir.
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
          echo "publicar: o script NÃO confirmou envio ao git. Confirme com git ls-remote github refs/heads/main e git ls-remote --tags github antes de repetir." >&2
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
