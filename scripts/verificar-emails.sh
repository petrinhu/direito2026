#!/usr/bin/env bash
# Portão de e-mail (EM-B1, plano-sessao-unica.md 8.1.1; L-36): nenhum endereço de e-mail nos arquivos
# rastreados fora da lista permitida (example.com, example.org e nao-responda@drpetrus.top). Varre
# SOMENTE os arquivos de `git ls-files` da raiz dada, e imprime encontrados/analisados/falharam SEMPRE.
# Uso: verificar-emails.sh [raiz-do-repositorio]   (sem argumento: a raiz deste repositório)
# Sai com 1 se algum arquivo tiver endereço fora da lista, se algum arquivo não puder ser lido, ou se
# não houver nenhum arquivo rastreado (piso de varredura: zero é varredura quebrada, não árvore limpa).
# Nunca imprime o endereço: só o caminho do arquivo.
set -uo pipefail

RAIZ="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
PADRAO='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
PERMITIDOS='@(example\.com|example\.org)$|^nao-responda@drpetrus\.top$'

encontrados=0
analisados=0
falharam=0

while IFS= read -r -d '' arquivo; do
  encontrados=$((encontrados + 1))
  caminho="$RAIZ/$arquivo"
  if [ ! -f "$caminho" ] || [ ! -r "$caminho" ]; then
    echo "verificar-emails: arquivo ilegível: $arquivo" >&2
    continue
  fi
  analisados=$((analisados + 1))
  # grep -c com zero sai 1: por isso o `|| true`, e o VALOR é testado abaixo (L-45).
  # -i na lista: domínio de e-mail não diferencia maiúsculas (Example.com é example.com).
  fora=$(grep -aEo "$PADRAO" "$caminho" | grep -aEvic "$PERMITIDOS" || true)
  if [ "${fora:-0}" -gt 0 ]; then
    falharam=$((falharam + 1))
    echo "endereço fora da lista em: $arquivo"
  fi
done < <(git -C "$RAIZ" ls-files -z)

echo "verificar-emails: encontrados=$encontrados analisados=$analisados falharam=$falharam"

if [ "$encontrados" -eq 0 ]; then
  echo "verificar-emails: zero arquivos rastreados; varredura quebrada, não árvore limpa" >&2
  exit 1
fi
if [ "$analisados" -ne "$encontrados" ]; then
  echo "verificar-emails: nem todo arquivo foi analisado" >&2
  exit 1
fi
if [ "$falharam" -ne 0 ]; then
  exit 1
fi
exit 0
