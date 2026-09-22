#!/usr/bin/env bash
# Gera os 4 .woff2 de src/ui/estilos/fontes/ a partir das fontes já
# instaladas como devDependency (@fontsource-variable/inter,
# @fontsource/lora), recortadas com pyftsubset/fonttools (já instalados
# nesta máquina - nada novo, L-51).
#
# Por que em src/ e não em public/ (achado do líder, medido no site JÁ
# PUBLICADO, 22/09/2026): arquivo em public/ é copiado CRU pelo Vite, com
# nome fixo; public/.htaccess marca todo .woff2 como cache imutável de um
# ano, e nome fixo + cache imutável é inseguro - quem já visitou o site
# fica até um ano com a versão velha em cache, mesmo depois do conserto.
# Em src/, o CSS referencia por caminho relativo e o Vite processa o
# arquivo como asset: o nome final ganha o hash do conteúdo
# (ex. inter-400-<hash>.woff2), então o cache de um ano fica seguro - o
# nome só se repete se o conteúdo for byte a byte igual.
# scripts/verificar-cache-fingerprint.ts é o portão que prova isso.
#
# Achado do líder, 22/09/2026, verbatim: "O 'A' maiúsculo está muito
# maior no texto que as outras maiúsculas." Medido: o recorte anterior
# (commit a68fc44) tinha 129 glifos por arquivo, dos quais só UMA letra
# maiúscula (A) e ZERO minúsculas, ZERO dígitos - o alvo real do recorte
# não era nem o alfabeto do site, era uma fatia arbitrária e errada de
# Unicode. Toda letra que não fosse "A" caía na fonte de reserva, com
# métrica diferente, e por isso destoava.
#
# Ordem do líder para o conserto, verbatim: "Não monte a lista a partir
# de uma amostra do texto atual: use o intervalo latino básico mais o
# suplemento latino, que é o que garante que conteúdo novo não quebre."
# Por isso o alvo abaixo é um INTERVALO FIXO de blocos Unicode, nunca uma
# lista extraída do texto de hoje:
#   - U+0020-007E  Basic Latin (espaço até til): as 26 maiúsculas, as 26
#     minúsculas, os 10 dígitos, e toda a pontuação ASCII (aspas retas,
#     parênteses, barra, cifrão - "R$" é só "R"+"$", ambos aqui).
#   - U+00A0-00FF  Latin-1 Supplement: toda a acentuação do português nas
#     duas caixas (á é í ó ú â ê ô ã õ à ç e as maiúsculas), o grau (°),
#     os sinais de moeda ¢£¤¥ e a pontuação latina estendida (« » ¡ ¿).
#   - U+2026 reticência tipográfica ("…"), usada de verdade em três telas
#     ("Carregando…") - já vem dentro do arquivo de origem "-latin-" da
#     fontsource (o unicode-range dele cobre até U+206F), então incluir
#     custa zero arquivo a mais, só o glifo.
#
# scripts/verificar-fontes.sh (seção do portão de glifos) confere depois
# que o resultado realmente tem esse conjunto mínimo.
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(dirname "$AQUI")"
DEST="$RAIZ/src/ui/estilos/fontes"
ESCALA="/var/tmp/builds/claude-1000/fontes-scratch"

UNICODES="U+0020-007E,U+00A0-00FF,U+2026"

INTER_SRC="$RAIZ/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"
LORA_SRC="$RAIZ/node_modules/@fontsource/lora/files/lora-latin-700-normal.woff2"

if [ ! -f "$INTER_SRC" ]; then
  echo "gerar-fontes: fonte de origem ausente: $INTER_SRC (npm install?)" >&2
  exit 1
fi
if [ ! -f "$LORA_SRC" ]; then
  echo "gerar-fontes: fonte de origem ausente: $LORA_SRC (npm install?)" >&2
  exit 1
fi

mkdir -p "$DEST" "$ESCALA"

echo "=== antes ==="
for arquivo in "$DEST"/*.woff2; do
  [ -f "$arquivo" ] && echo "$(basename "$arquivo"): $(stat -c%s "$arquivo") bytes"
done

for peso in 400 500 700; do
  INSTANCIA="$ESCALA/inter-$peso-instance.ttf"
  # A fonte de origem é variável (um eixo "wght" contínuo); pyftsubset não
  # fixa eixo sozinho, então instancia primeiro (fonttools varLib.instancer)
  # e só depois recorta pelo alfabeto.
  python3 -m fontTools.varLib.instancer "$INTER_SRC" "wght=$peso" --static -o "$INSTANCIA" >/dev/null
  pyftsubset "$INSTANCIA" \
    --output-file="$DEST/inter-$peso.woff2" \
    --flavor=woff2 \
    --unicodes="$UNICODES" \
    --layout-features='*'
done

pyftsubset "$LORA_SRC" \
  --output-file="$DEST/lora-700.woff2" \
  --flavor=woff2 \
  --unicodes="$UNICODES" \
  --layout-features='*'

echo "=== depois ==="
for arquivo in "$DEST"/*.woff2; do
  echo "$(basename "$arquivo"): $(stat -c%s "$arquivo") bytes"
done
