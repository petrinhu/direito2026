#!/usr/bin/env bash
# Item 8 da onda: roteiro de conferência pós-publicação (docs/publicacao.md,
# "O que precisa ser conferido depois do envio ao servidor"), hoje feito à
# mão pelo líder a cada publicação. Este script executa contra um ENDEREÇO
# INFORMADO (variável de ambiente ou primeiro argumento) as conferências que
# dão para provar sem abrir navegador (itens 1, 2, 5 da lista, e uma versão
# adaptada do item 3 - ver nota abaixo). Reprova com erro se qualquer uma
# falhar, e o PISO é que zero conferência executada também é falha (L-36):
# um script que roda e não checa nada não prova publicação nenhuma.
#
# Fora do escopo deste script, de propósito, porque exigem navegador real
# (L-13, observação visual é do qa-engineer): item 4 (abrir nos dois temas
# e conferir visualmente favicon/quiz/balão) e item 6 (captura de tela em
# Chrome/Firefox/Safari/Edge) da mesma lista. O item 7 (varredura de nomes
# proibidos) roda ANTES do envio, contra arquivo local, não depois contra
# URL publicada - não é uma conferência "pós-publicação" no mesmo sentido.
#
# Uso: scripts/verificar-publicacao.sh https://direito2026.drpetrus.top
set -uo pipefail

URL_BASE="${1:-${URL_PUBLICACAO:-}}"
if [ -z "$URL_BASE" ]; then
  echo "verificar-publicacao: informe o endereço (argumento ou \$URL_PUBLICACAO)" >&2
  exit 1
fi
URL_BASE="${URL_BASE%/}"

ENCONTRADOS=0
FALHARAM=0

passou() {
  ENCONTRADOS=$((ENCONTRADOS + 1))
  echo "[PASSOU] $1"
}

falhou() {
  ENCONTRADOS=$((ENCONTRADOS + 1))
  FALHARAM=$((FALHARAM + 1))
  echo "[FALHOU] $1" >&2
}

# --- 1. GET / responde 200 e traz X-Robots-Tag: noindex, nofollow --------
CABECALHOS_RAIZ=$(curl -sI "$URL_BASE/" || true)
STATUS_RAIZ=$(printf '%s\n' "$CABECALHOS_RAIZ" | head -n1 | grep -o '[0-9][0-9][0-9]' | head -n1)
if [ "$STATUS_RAIZ" = "200" ]; then
  passou "GET / responde 200"
else
  falhou "GET / respondeu '${STATUS_RAIZ:-sem resposta}', esperado 200"
fi

if printf '%s\n' "$CABECALHOS_RAIZ" | grep -qi 'x-robots-tag:.*noindex.*nofollow'; then
  passou "cabeçalho X-Robots-Tag: noindex, nofollow presente"
else
  falhou "cabeçalho X-Robots-Tag: noindex, nofollow AUSENTE em GET /"
fi

# --- 2. a marcação <meta name="robots"> está no HTML servido -------------
CORPO_RAIZ=$(curl -s "$URL_BASE/" || true)
OCORRENCIAS_META=$(printf '%s' "$CORPO_RAIZ" | grep -c 'name="robots"' || true)
if [ "${OCORRENCIAS_META:-0}" -gt 0 ]; then
  passou "meta name=\"robots\" presente no HTML servido ($OCORRENCIAS_META ocorrência(s))"
else
  falhou "meta name=\"robots\" AUSENTE no HTML servido"
fi

# --- 3. rota inexistente: fallback da SPA, não erro nu do servidor -------
# Nota honesta sobre o limite deste teste (docs/publicacao.md, seção do
# pacote dist/): a aplicação é uma SPA - toda rota devolve 200 com
# index.html, e é o Vue Router (JavaScript, depois de carregado) quem
# decide se desenha a página real ou NaoEncontrado.vue. Um script sem
# motor JS (este aqui) NÃO PROVA que o texto "não encontrada" aparece na
# tela - isso é prova visual, já coberta por teste e2e com navegador real
# (tests/e2e/navegacao.spec.ts, tests/e2e/enderecos-diretos.spec.ts, que
# rodam contra localhost, não contra o domínio publicado). O que ESTE
# script prova, de fato: a rota inexistente não cai num 404/403 NU do
# Apache/Hostinger (o que aconteceria se .htaccess/history mode
# quebrassem), porque devolve o MESMO corpo do app shell que a raiz.
ROTA_INEXISTENTE="$URL_BASE/rota-que-nao-existe-$(date +%s)"
STATUS_INEXISTENTE=$(curl -s -o /dev/null -w '%{http_code}' "$ROTA_INEXISTENTE" || true)
CORPO_INEXISTENTE=$(curl -s "$ROTA_INEXISTENTE" || true)
if [ "$STATUS_INEXISTENTE" = "200" ] && [ "$CORPO_INEXISTENTE" = "$CORPO_RAIZ" ]; then
  passou "rota inexistente devolve 200 com o mesmo app shell da SPA (fallback correto, não 404/403 nu do servidor)"
else
  falhou "rota inexistente respondeu de forma inesperada (status '$STATUS_INEXISTENTE', corpo ${#CORPO_INEXISTENTE} bytes vs ${#CORPO_RAIZ} da raiz)"
fi

# --- 5. compressão ativa em pelo menos um arquivo de texto ----------------
CABECALHOS_COMPRESSAO=$(curl -sI -H 'Accept-Encoding: gzip, br' "$URL_BASE/" || true)
if printf '%s\n' "$CABECALHOS_COMPRESSAO" | grep -qi 'content-encoding:.*\(gzip\|br\)'; then
  passou "Content-Encoding (gzip/br) ativo em GET /"
else
  falhou "Content-Encoding AUSENTE em GET / (compressão pode estar desligada no servidor)"
fi

echo "conferências executadas: $ENCONTRADOS / falharam: $FALHARAM"

if [ "$ENCONTRADOS" -eq 0 ]; then
  echo "verificar-publicacao: zero conferência executada é varredura quebrada, não publicação limpa" >&2
  exit 1
fi

if [ "$FALHARAM" -gt 0 ]; then
  exit 1
fi

exit 0
