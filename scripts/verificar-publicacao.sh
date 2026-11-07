#!/usr/bin/env bash
# Conferência anônima do ar (plano do CTO do login único, 7.2; LU-F4.3). Prova, sem conta e sem
# sessão, o que a publicação deve garantir na borda: nada do app sai para quem não entrou.
#
# Uso: scripts/verificar-publicacao.sh <URL_ENDERECO> <URL_DOMINIO_PAI> <lista_caminhos> <pasta_webroot>
#   URL_ENDERECO      endereço do site (ex.: https://direito2026.drpetrus.top)
#   URL_DOMINIO_PAI   domínio-pai (ex.: https://drpetrus.top); /direito2026/<caminho> tem de dar 403
#   lista_caminhos    um caminho do app por linha (manifesto atual e anterior); zero é falha
#   pasta_webroot     webroot local do pacote (sw.js e .htaccess conferidos contra ele)
#
# Variáveis: VERIFICAR_HOST_PUBLICO (padrão: o host de URL_ENDERECO), VERIFICAR_BORDA (padrão 1).
# Com 1, mede no ar os cabeçalhos que vêm da borda (X-Robots-Tag e compressão). Com 0, só no ensaio
# local (php -S não lê .htaccess nem tem LiteSpeed): esses cabeçalhos saem como "não medidos", e o
# arquivo do pacote continua conferido (conferir_htaccess).
#
# Cada checagem imprime [PASSOU] ou [FALHOU]. Zero conferência executada é falha (L-36).
# Não prova entrega com login: esse caminho sai da publicação (7.1.1) e aparece na última linha.
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd -P)"
URL_BASE="${1:-}"
URL_PAI="${2:-}"
LISTA="${3:-}"
WEBROOT="${4:-}"
if [ -z "$URL_BASE" ] || [ -z "$URL_PAI" ] || [ -z "$LISTA" ] || [ -z "$WEBROOT" ]; then
  echo "verificar-publicacao: uso: <URL_ENDERECO> <URL_DOMINIO_PAI> <lista_caminhos> <pasta_webroot>" >&2
  exit 1
fi
URL_BASE="${URL_BASE%/}"
URL_PAI="${URL_PAI%/}"
HOST_PUBLICO="${VERIFICAR_HOST_PUBLICO:-$(printf '%s' "$URL_BASE" | sed -E 's#^https?://##; s#/.*$##')}"
BORDA="${VERIFICAR_BORDA:-1}"
TMP="$(mktemp -d "${TMPDIR:-/var/tmp}/verificar-publicacao.XXXXXX")"
trap 'rm -rf -- "$TMP"' EXIT

ENCONTRADOS=0
FALHARAM=0
ANALISADOS=0

passou() {
  ENCONTRADOS=$((ENCONTRADOS + 1))
  echo "[PASSOU] $1"
}

falhou() {
  ENCONTRADOS=$((ENCONTRADOS + 1))
  FALHARAM=$((FALHARAM + 1))
  echo "[FALHOU] $1" >&2
}

# Pede uma URL sem sessão. Saída: código HTTP na stdout; cabeçalhos em $TMP/$1.h, corpo em $TMP/$1.b.
# Os argumentos depois da URL são cabeçalhos extras (ex.: navegação).
pedir() {
  local nome="$1" url="$2"
  shift 2
  curl -s --max-time 30 -D "$TMP/$nome.h" -o "$TMP/$nome.b" -w '%{http_code}' "$@" "$url" 2>/dev/null || true
}

NAVEGACAO=(-H 'Sec-Fetch-Mode: navigate' -H 'Accept: text/html')

# 1. Tela de entrada na raiz: 200, sem índice, sem script, sem termo proibido, sem cache.
conferir_tela_de_entrada() {
  local codigo
  codigo="$(pedir raiz "$URL_BASE/" "${NAVEGACAO[@]}")"
  if [ "$codigo" = 200 ]; then passou "GET / anônimo de navegação dá a tela de entrada (200)"
  else falhou "GET / anônimo respondeu '$codigo', esperado 200 (tela de entrada)"; fi

  if [ "$BORDA" = 0 ]; then
    echo "X-Robots-Tag no ar: não medido (VERIFICAR_BORDA=0, ensaio local sem .htaccess); conferido no arquivo do pacote"
  elif grep -qi '^x-robots-tag:.*noindex.*nofollow' "$TMP/raiz.h"; then
    passou "X-Robots-Tag: noindex, nofollow em GET /"
  else falhou "X-Robots-Tag: noindex, nofollow AUSENTE em GET /"; fi

  if grep -q 'name="robots"' "$TMP/raiz.b"; then passou "meta name=\"robots\" na tela de entrada"
  else falhou "meta name=\"robots\" AUSENTE na tela de entrada"; fi

  if grep -qi '^cache-control:.*no-store' "$TMP/raiz.h"; then passou "Cache-Control contém no-store na tela de entrada"
  else falhou "Cache-Control sem no-store na tela de entrada (a borda pode guardar resposta anônima)"; fi

  if grep -q '<script' "$TMP/raiz.b"; then falhou "tela de entrada anônima traz <script"
  else passou "tela de entrada anônima sem <script"; fi

  if bash "$RAIZ/scripts/verificar-proibicoes.sh" - < "$TMP/raiz.b" >/dev/null 2>&1; then
    passou "tela de entrada anônima sem termo proibido"
  else
    falhou "tela de entrada anônima com termo proibido, ou termos não lidos (verificar-proibicoes)"
  fi
}

# 2. Rota inexistente: mesma tela da raiz. Token e destino variam por requisição: saem antes de comparar.
conferir_rota_inexistente() {
  local codigo sem_var_raiz sem_var_rota
  codigo="$(pedir rota "$URL_BASE/rota-que-nao-existe-$$-$RANDOM" "${NAVEGACAO[@]}")"
  sem_var_raiz="$(sed -E 's/value="[^"]*"//g' "$TMP/raiz.b")"
  sem_var_rota="$(sed -E 's/value="[^"]*"//g' "$TMP/rota.b")"
  if [ "$codigo" = 200 ] && [ "$sem_var_raiz" = "$sem_var_rota" ]; then
    passou "rota inexistente dá a mesma tela de entrada da raiz (sem token e destino)"
  else
    falhou "rota inexistente respondeu '$codigo', ou corpo diferente da tela da raiz"
  fi
}

# 3. Caminhos do app: sem sessão, todo caminho dá 401 sem corpo; a borda não guarda resposta de
#    logado (HIT); no domínio-pai, o mesmo caminho dá 403. Zero caminho é falha (piso).
conferir_caminhos_protegidos() {
  local caminho codigo tamanho cache pai codigo_pai n=0 falhas=0
  local -a caminhos=()
  if [ -s "$LISTA" ]; then mapfile -t caminhos < "$LISTA"; fi
  if [ "${#caminhos[@]}" -eq 0 ]; then
    falhou "lista de caminhos protegidos vazia: varredura quebrada, não publicação limpa"
    return 0
  fi
  for caminho in "${caminhos[@]}"; do
    [[ "$caminho" =~ ^[A-Za-z0-9._/-]+$ ]] || { falhou "caminho fora do padrão seguro na lista: (nome omitido)"; continue; }
    n=$((n + 1))
    codigo="$(pedir protegido "$URL_BASE/$caminho")"
    tamanho="$(wc -c < "$TMP/protegido.b" | tr -d ' ')"
    cache="$(grep -i '^x-hcdn-cache-status:' "$TMP/protegido.h" | tr -d '\r' || true)"
    if [ "$codigo" != 401 ] || [ "$tamanho" != 0 ]; then
      falhas=$((falhas + 1)); falhou "$caminho: anônimo recebeu '$codigo' com $tamanho byte(s), esperado 401 sem corpo"
    elif printf '%s' "$cache" | grep -qi 'HIT'; then
      falhas=$((falhas + 1)); falhou "$caminho: borda respondeu HIT ($cache)"
    fi
    codigo_pai="$(pedir pai "$URL_PAI/direito2026/$caminho")"
    if [ "$codigo_pai" != 403 ]; then
      falhas=$((falhas + 1)); falhou "$caminho: domínio-pai respondeu '$codigo_pai', esperado 403"
    fi
  done
  ANALISADOS="$n"
  if [ "$falhas" -eq 0 ] && [ "$n" -gt 0 ]; then
    passou "$n caminho(s) do app: anônimo 401 sem corpo, sem HIT, domínio-pai 403"
  fi
}

# 4. Telas de navegação anônimas: a mesma tela de entrada, sem script.
conferir_telas_anonimas() {
  local rota codigo nome=0
  for rota in /busca /p/p1/juri-simulado /p/p1/interdisciplinar; do
    codigo="$(pedir tela "$URL_BASE$rota" "${NAVEGACAO[@]}")"
    if [ "$codigo" = 200 ] && ! grep -q '<script' "$TMP/tela.b"; then
      nome=$((nome + 1))
    else
      falhou "$rota anônimo: '$codigo', ou com <script>"
    fi
  done
  [ "$nome" -eq 3 ] && passou "/busca, /p/p1/juri-simulado e /p/p1/interdisciplinar dão a tela de entrada, sem script"
}

# 5. O matador do service worker: o sw.js publicado é o do pacote local (md5).
conferir_sw_matador() {
  local codigo md5_ar md5_local
  codigo="$(pedir sw "$URL_BASE/sw.js")"
  md5_ar="$(md5sum < "$TMP/sw.b" | cut -c1-32)"
  md5_local="$(md5sum < "$WEBROOT/sw.js" 2>/dev/null | cut -c1-32)"
  if [ "$codigo" = 200 ] && [ -n "$md5_local" ] && [ "$md5_ar" = "$md5_local" ]; then
    passou "/sw.js é o matador do pacote (md5 $md5_local)"
  else
    falhou "/sw.js respondeu '$codigo', md5 do ar '$md5_ar' difere do pacote '$md5_local'"
  fi
}

# 6. .htaccess do pacote: recusa outro host (o domínio-pai) e manda X-Robots-Tag. É conferido no
#    arquivo sempre, porque php -S não lê .htaccess (T12); o md5 do ar contra o pacote (publicar.sh)
#    prova que o servidor tem este arquivo.
conferir_htaccess_host() {
  local host_re
  host_re="$(printf '%s' "$HOST_PUBLICO" | sed 's/\./\\./g')"
  if [ -f "$WEBROOT/.htaccess" ] && grep -qF "RewriteCond %{HTTP_HOST} !^$host_re\$ [NC]" "$WEBROOT/.htaccess"; then
    passou ".htaccess do pacote recusa outro host (direito2026.drpetrus.top)"
  else
    falhou ".htaccess do pacote sem a regra de host: o domínio-pai não fica recusado"
  fi
  if [ -f "$WEBROOT/.htaccess" ] && grep -qF 'Header always set X-Robots-Tag "noindex, nofollow"' "$WEBROOT/.htaccess"; then
    passou ".htaccess do pacote manda X-Robots-Tag: noindex, nofollow"
  else
    falhou ".htaccess do pacote sem X-Robots-Tag: noindex, nofollow"
  fi
}

# 7. Compressão em / (LiteSpeed). Só no ar; no ensaio local (VERIFICAR_BORDA=0) não é medida.
conferir_compressao() {
  local cabecalhos
  if [ "$BORDA" = 0 ]; then
    echo "compressão: não medida (VERIFICAR_BORDA=0, ensaio local sem LiteSpeed)"
    return 0
  fi
  cabecalhos="$(curl -sI --max-time 30 -H 'Accept-Encoding: gzip, br' "${NAVEGACAO[@]}" "$URL_BASE/" || true)"
  if printf '%s\n' "$cabecalhos" | grep -qi 'content-encoding:.*\(gzip\|br\)'; then
    passou "Content-Encoding (gzip/br) ativo em GET / de navegação"
  else
    falhou "Content-Encoding AUSENTE em GET / (compressão desligada no servidor?)"
  fi
}

conferir_tela_de_entrada
conferir_rota_inexistente
conferir_caminhos_protegidos
conferir_telas_anonimas
conferir_sw_matador
conferir_htaccess_host
conferir_compressao

echo "conferências executadas: $ENCONTRADOS / falharam: $FALHARAM / caminhos protegidos analisados: $ANALISADOS"

if [ "$ENCONTRADOS" -eq 0 ]; then
  echo "verificar-publicacao: zero conferência executada é varredura quebrada, não publicação limpa" >&2
  exit 1
fi
if [ "$FALHARAM" -gt 0 ]; then
  exit 1
fi
echo "entrega com login: não coberta por esta publicação; confira ao entrar"
exit 0
