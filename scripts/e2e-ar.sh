#!/usr/bin/env bash
# E2E no ar (V17-F3, contrato OS 3.6). Cria, usa e apaga contas temporárias pela própria administração do site.
#
# Uso: bash scripts/e2e-ar.sh <base|pos|limpar> (--caixa <pasta> | --ar)
#   base   : administradora do robô; aluno criado pelo painel; convite #t=; senha; troca; abas; imagens; saída; exclusão.
#   pos    : o mesmo roteiro do base, rodado logo depois da publicação (2ª validação do rito).
#   limpar : apaga o que estiver no marcador LIMPEZA-PENDENTE e confere pela auditoria.
# O modo pre saiu com o ramo do link antigo ?t= (CONVITE-LEGADO-REMOVER): o link antigo não existe mais.
#
# --caixa <pasta>: caixa local com public/ (produto), privado/ (contas sintéticas) e app/ (dist).
#                  O cli/ é copiado de servidor/cli. A caixa é servida por php -S em 127.0.0.1:4751.
# --ar           : servidor de produção por ssh (alias hostinger, BatchMode). NÃO rodado nesta fatia.
#
# Senhas: geradas aqui, guardadas em /var/tmp/v17-e2e-ar/segredo/contas.env (modo 600) e entregues
# aos CLIs pelo STDIN. Nunca em argumento, em variável de ambiente exportada ou na saída.
set -euo pipefail
umask 077

MODO=${1:-}
[[ $# -gt 0 ]] && shift
DESTINO=""
CAIXA=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --caixa) DESTINO=caixa; CAIXA=${2:?informe a pasta da caixa}; shift 2 ;;
    --ar) DESTINO=ar; shift ;;
    *) echo "opção desconhecida (valor não mostrado)" >&2; exit 2 ;;
  esac
done
case "$MODO" in
  base|pos|limpar) ;;
  *) echo "uso: e2e-ar.sh <base|pos|limpar> (--caixa <pasta> | --ar)" >&2; exit 2 ;;
esac
[[ -n "$DESTINO" ]] || { echo "recusa: informe --caixa <pasta> ou --ar" >&2; exit 2; }
# Trava por código: nesta fatia (F3) o ar não é tocado. A F8 é rodada pelo main com E2E_AR_LIBERADO=1.
if [[ "$DESTINO" == ar && "${E2E_AR_LIBERADO:-0}" != 1 ]]; then
  echo "recusa: --ar não roda na F3 (ordem do líder, 21/11); a F8 exige E2E_AR_LIBERADO=1" >&2
  exit 2
fi
if [[ "$DESTINO" == ar && -n "${E2E_AR_PARAR_EM:-}" ]]; then
  echo "recusa: E2E_AR_PARAR_EM só existe com --caixa" >&2
  exit 2
fi

RAIZ=$(cd "$(dirname "$0")/.." && pwd)
OS=/var/tmp/v17-e2e-ar
MARCADOR=$OS/LIMPEZA-PENDENTE
SEGREDO=$OS/segredo/contas.env
RETRATO=$OS/segredo/retrato.env
PASSO=$OS/passo
SAIDA=$OS/saida
PORTA_CAIXA=4751
URL_AR=https://direito2026.drpetrus.top
REMOTO_CLI=domains/drpetrus.top/direito2026_app/d26_cli_tmp
REMOTO_PRIV=domains/drpetrus.top/direito2026_privado
REMOTO_NUCLEO=domains/drpetrus.top/public_html/direito2026/api/nucleo
SERVIDOR_PID=""
CONCLUIDO=0

if [[ $DESTINO == caixa ]]; then
  BASE_URL="http://127.0.0.1:$PORTA_CAIXA"
else
  BASE_URL=$URL_AR
fi

mkdir -p -m 700 "$OS" "$OS/segredo" "$SAIDA"

# ---------- transporte único: php local na caixa, ssh no --ar ----------

# O CLI recebe o privado como 1º argumento, como todo CLI de conta. stdin: o do chamador.
cli_base() {
  local nome=$1
  shift
  if [[ $DESTINO == caixa ]]; then
    D26_NUCLEO="$CAIXA/public/api/nucleo" php "$CAIXA/cli/$nome" "$CAIXA/privado" "$@"
  else
    local argv="" a
    for a in "$@"; do argv+=" $(printf '%q' "$a")"; done
    ssh -o BatchMode=yes hostinger "D26_NUCLEO=\$HOME/$REMOTO_NUCLEO php \$HOME/$REMOTO_CLI/cli/$nome \$HOME/$REMOTO_PRIV$argv"
  fi
}

# Sem stdin: o ssh não pode consumir o marcador que o while lê.
cli() { cli_base "$@" </dev/null; }

# Senha pelo STDIN do CLI, nunca em argumento.
criar_admin() {
  local login=$1 senha=$2
  printf '%s\n' "$senha" | cli_base criar-admin.php "$login" --adicionar
}

valor() { sed -n "s/^$1=//p" | tail -n1; }
contas_total() { cli auditar-contas.php | valor contas; }
admins_total() { cli auditar-contas.php | valor admins; }
admins_ativos() { cli auditar-contas.php | valor admins_ativos; }
existe() { cli auditar-contas.php --login="$1" | valor "existe_$1"; }

# ---------- segredo, retrato e marcador (nenhum valor secreto sai daqui) ----------

gerar() { openssl rand -hex 24; }

segredo_get() { sed -n "s/^$1=//p" "$SEGREDO" 2>/dev/null | tail -n1; }

segredo_set() {
  local chave=$1 valor=$2 tmp
  touch "$SEGREDO"
  chmod 600 "$SEGREDO"
  tmp=$(mktemp "$OS/segredo/.seg.XXXXXX")
  { grep -v "^$chave=" "$SEGREDO" || true; printf '%s=%s\n' "$chave" "$valor"; } > "$tmp"
  mv -f "$tmp" "$SEGREDO"
}

# Escrita antecipada: o login entra no marcador ANTES de existir no servidor.
marcar() { printf '%s\n' "$1" >> "$MARCADOR"; }

retrato_gravar() {
  # $1 modo, $2 contas, $3 admins, $4 quantas contas do marcador já existiam no início
  printf 'MODO=%s\nCONTAS_INICIO=%s\nADMINS_INICIO=%s\nEXISTENTES_INICIO=%s\n' "$1" "$2" "$3" "$4" > "$RETRATO"
  chmod 600 "$RETRATO"
}

retrato_get() { sed -n "s/^$1=//p" "$RETRATO" 2>/dev/null | tail -n1; }

# Conferência de vazamento, sobre a saída crua ANTES de apagá-la. Só conta; nunca imprime o achado.
verificar_sem_vazamento() {
  local pats="$OS/segredo/.pats" achados
  grep -E '^(ALUNO_SENHA|ADM_SENHA_|ALUNO_LINK)' "$SEGREDO" \
    | sed 's/^[^=]*=//' | grep -v '^$' > "$pats" || true
  if [[ ! -s $pats ]]; then
    rm -f "$pats"
    echo "conferência de vazamento: sem padrões no segredo (nada conferido)" >&2
    return 4
  fi
  local controle
  controle=$(grep -cF -f "$pats" "$SEGREDO" || true)
  achados=$(grep -rlF -f "$pats" "$SAIDA" "$OS/pw.log" 2>/dev/null | wc -l || true)
  rm -f "$pats"
  echo "conferência de vazamento: controle positivo=$controle, achados na saída=$achados" >&2
  [[ $controle -ge 1 && $achados == 0 ]]
}

# ---------- limpeza: só fecha quando a auditoria prova a ausência ----------

limpar_marcados() {
  [[ -f $MARCADOR ]] || return 0
  local login
  while IFS= read -r login; do
    [[ -n $login ]] || continue
    if [[ $(existe "$login") == 1 ]]; then
      cli remover-conta.php "$login" >/dev/null 2>&1 || true
    fi
    if [[ $(existe "$login") != 0 ]]; then
      echo "limpeza: uma conta do marcador continua no servidor; marcador mantido" >&2
      return 4
    fi
  done < "$MARCADOR"
  if [[ -f $RETRATO ]]; then
    local esperado=$(( $(retrato_get CONTAS_INICIO) - $(retrato_get EXISTENTES_INICIO) ))
    if [[ $(contas_total) != "$esperado" ]]; then
      echo "limpeza: contagem de contas fora do esperado; marcador mantido" >&2
      return 4
    fi
  fi
  rm -f "$MARCADOR"
  return 0
}

# Remoção do CLI temporário no servidor (OS 3.6, item 6). Chamada só com o marcador já limpo.
remover_cli_ar() {
  ssh -o BatchMode=yes hostinger "d=\$HOME/$REMOTO_CLI; if [ -d \"\$d\" ]; then ls -ld \"\$d\" && rm -rf \"\${d:?}\"; else echo 'cli temporário: já ausente'; fi" </dev/null
}

ao_sair() {
  local rc=$?
  if [[ -n $SERVIDOR_PID ]]; then kill "$SERVIDOR_PID" 2>/dev/null || true; fi
  # A conferência de vazamento roda SEMPRE, em sucesso, falha e derrubada, antes de apagar a saída.
  if [[ -f $SEGREDO ]]; then
    verificar_sem_vazamento || rc=4
  fi
  if [[ -f $MARCADOR ]]; then
    if ! limpar_marcados; then
      rc=4
    fi
  fi
  # CLI temporário no servidor: só sai depois de a limpeza dar certo (marcador ausente).
  if [[ $DESTINO == ar ]]; then
    if [[ -f $MARCADOR ]]; then
      echo "CLI temporário no servidor mantido: a limpeza não fechou (o limpar da retomada precisa dele)" >&2
    elif ! remover_cli_ar; then
      echo "CLI temporário no servidor: a remoção falhou" >&2
      rc=4
    fi
  fi
  if [[ $rc == 0 && $CONCLUIDO == 1 ]]; then
    rm -f "$SEGREDO" "$RETRATO"
  fi
  # Resumo diagnóstico de falha: últimas linhas do reporter, depois da conferência de vazamento.
  if [[ $rc != 0 && -f $OS/pw.log ]]; then
    tail -n 120 "$OS/pw.log" > "$OS/erro-resumo.txt" || true
    chmod 600 "$OS/erro-resumo.txt"
  fi
  rm -rf "${SAIDA:?}"
  mkdir -p -m 700 "$SAIDA"
  rm -f "$OS/pw.log"
  exit "$rc"
}

# ---------- caixa e ar ----------

copiar_cli_caixa() {
  [[ -f $CAIXA/privado/usuarios.json ]] || { echo "caixa sem privado com contas" >&2; return 3; }
  rm -rf "${CAIXA:?}/cli"
  mkdir -p "$CAIXA/cli"
  cp -r "$CAIXA/servidor/cli/." "$CAIXA/cli/"
}

subir_caixa() {
  [[ -d $CAIXA/public/api/nucleo && -d $CAIXA/app && -f $CAIXA/servidor/dev/roteador.php ]] || { echo "caixa sem public/api/nucleo ou app" >&2; return 3; }
  D26_PRIVADO="$CAIXA/privado" D26_APP="$CAIXA/app" \
    php -S "127.0.0.1:$PORTA_CAIXA" -t "$CAIXA/public" "$CAIXA/servidor/dev/roteador.php" \
    >"$SAIDA/php.log" 2>&1 &
  SERVIDOR_PID=$!
  sleep 2
}

# Ar: não exercitado nesta fatia. Só o diretório do robô é criado e, depois, removido.
preparar_ar() {
  ssh -o BatchMode=yes hostinger "mkdir -m 700 -p \$HOME/$REMOTO_CLI"
  scp -r -q -o BatchMode=yes "$RAIZ/servidor/cli" "hostinger:$REMOTO_CLI/"
}

# Item 7 da 3.6, cabeçalhos: só no ar. O php -S da caixa não lê o .htaccess (A-15), então na caixa é SKIP explícito.
conferir_cabecalhos() {
  if [[ $DESTINO != ar ]]; then
    echo "SKIP cabecalhos: só no ar (php -S não lê .htaccess, A-15)" >&2
    return 0
  fi
  local a b rp n1 n2 c1 c2 falhas=0
  a=$(curl -sS --max-time 20 -D - -o /dev/null "$BASE_URL/api/convite.php?cb=$(gerar)")
  b=$(curl -sS --max-time 20 -D - -o /dev/null "$BASE_URL/api/convite.php?cb=$(gerar)")
  rp=$(printf '%s' "$a" | grep -ci '^referrer-policy:' || true)
  n1=$(printf '%s' "$a" | grep -io 'nonce-[A-Za-z0-9_+/=-]*' | head -n1 || true)
  n2=$(printf '%s' "$b" | grep -io 'nonce-[A-Za-z0-9_+/=-]*' | head -n1 || true)
  c1=$(printf '%s' "$a" | grep -ci '^x-hcdn-cache-status: hit' || true)
  c2=$(printf '%s' "$b" | grep -ci '^x-hcdn-cache-status: hit' || true)
  if [[ $rp == 1 ]]; then echo "SIM referrer-policy única"; else echo "NÃO referrer-policy única"; falhas=1; fi
  if [[ -n $n1 && $n1 != "$n2" ]]; then echo "SIM nonce diferente em dois GET"; else echo "NÃO nonce diferente em dois GET"; falhas=1; fi
  if [[ $c1 == 0 && $c2 == 0 ]]; then echo "SIM cache do casco fora de HIT"; else echo "NÃO cache do casco fora de HIT"; falhas=1; fi
  return "$falhas"
}

# Item 7 da 3.6: cabeçalhos da casca só no pos, no ar. O base não confere cabeçalhos.
cabecalhos_do_modo() {
  if [[ $MODO != pos ]]; then
    echo "cabeçalhos: não se aplicam ao modo $MODO" >&2
    return 0
  fi
  conferir_cabecalhos
}

# ---------- rodada do robô ----------

rodar_spec() {
  : > "$PASSO"
  E2E_AR_SEGREDO=$SEGREDO E2E_AR_MODO=$MODO E2E_AR_BASE=$BASE_URL E2E_AR_PASSO=$PASSO \
    npx playwright test --config="$RAIZ/playwright.ar.config.ts" >"$OS/pw.log" 2>&1 &
  local pid=$!
  if [[ -n ${E2E_AR_PARAR_EM:-} ]]; then
    while kill -0 "$pid" 2>/dev/null; do
      if grep -qx "$E2E_AR_PARAR_EM" "$PASSO" 2>/dev/null; then
        kill -TERM "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
        echo "parada de propósito em $E2E_AR_PARAR_EM" >&2
        return 75
      fi
      sleep 1
    done
  fi
  local rc=0
  wait "$pid" || rc=$?
  if [[ $rc != 0 ]] && ! grep -qx 'primeiro-get' "$PASSO" 2>/dev/null; then
    return 3
  fi
  return "$rc"
}

# Preparo do robô: as contas que o spec usa nascem aqui, sempre pelo CLI de administração.
preparar_rodada() {
  local ts
  ts=$(date -u +%Y%m%d%H%M%S)
  [[ ! -e $MARCADOR ]] || { echo "marcador presente: rode limpar antes (L-54)" >&2; return 5; }
  [[ $(admins_ativos) -ge 1 ]] || { echo "sem administradora ativa pré-existente" >&2; return 5; }
  segredo_set ADM_LOGIN "e2e-adm-$ts"
  segredo_set ADM_SENHA_INICIAL "$(gerar)"
  segredo_set ADM_SENHA_NOVA "$(gerar)"
  segredo_set ALUNO_LOGIN "e2e-aluno-$ts"
  segredo_set ALUNO_EMAIL "e2e@example.com"
  segredo_set ALUNO_SENHA "$(gerar)"
  retrato_gravar "$MODO" "$(contas_total)" "$(admins_total)" 0
  marcar "$(segredo_get ADM_LOGIN)"
  criar_admin "$(segredo_get ADM_LOGIN)" "$(segredo_get ADM_SENHA_INICIAL)" >/dev/null || return 3
  marcar "$(segredo_get ALUNO_LOGIN)"
  return 0
}

# ---------- execução ----------

# Armadilhas antes do modo limpar: a limpeza e a remoção do CLI temporário rodam na saída (ao_sair), em todo modo.
trap ao_sair EXIT
trap 'exit 130' INT TERM

if [[ $MODO == limpar ]]; then
  if [[ $DESTINO == caixa ]]; then copiar_cli_caixa; fi
  exit 0
fi

if [[ $DESTINO == caixa ]]; then
  copiar_cli_caixa
  subir_caixa
else
  preparar_ar
fi

# Falha de preparo antes do primeiro GET: limpa e repete uma vez (OS 3.6, item 9).
rc=0
preparar_rodada || rc=$?
if [[ $rc == 3 ]]; then
  limpar_marcados || true
  rc=0
  preparar_rodada || rc=$?
fi
[[ $rc == 0 ]] || exit "$rc"

rc=0
rodar_spec || rc=$?
[[ $rc == 0 ]] || exit "$rc"

if ! cabecalhos_do_modo; then
  echo "cabeçalhos fora do esperado (só no ar)" >&2
  exit 4
fi
CONCLUIDO=1
echo "$MODO concluído; a limpeza roda no trap" >&2
exit 0
