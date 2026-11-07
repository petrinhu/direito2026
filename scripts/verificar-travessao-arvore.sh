#!/usr/bin/env bash
# Portão de travessão no que chega ao leitor (plano do CTO do login único, 6.3, E7 e
# F1.2b; L-32, L-36). Reprova U+2014 (em-dash) e U+2013 (en-dash) em todo arquivo
# CIFRADO que varre, lido da working tree destravada. Os caminhos vêm do
# .gitattributes real (git check-attr), não de uma lista copiada.
#
# Classes (E7). VARRE: conteúdo de estudo e voz pública, src/conteudo/, src/dados/
# e mockups/. INTERNO: docs/, TODO.md, tests/caracterizacao/ e
# src/ui/area-restrita/emblema/, que não chegam ao leitor pelo site e não varrem.
# Caminho cifrado que não cai em nenhuma das duas reprova (falha fechada, L-17): uma
# classe nova exige decisão escrita antes de entrar aqui. docs/ fica fora de propósito:
# os achados de docs/ ficam como estão, sem reescrever nota interna.
#
# Isenção única: o campo "blocos" do texto integral (transcrição fiel de obra de
# terceiro), a faixa entre a linha '"blocos": [' e o fechamento '  ]' de cada
# textoIntegral.ts (base: src/core/conteudo/semTextoFiel.ts:10-13; L-32). Título e
# fonte do mesmo arquivo continuam sob a regra.
#
# Saída: encontrados = linhas com travessão fora da isenção; analisados = arquivos que
# varrem, lidos; falharam = arquivos com ao menos um achado; sem_classe = caminhos
# cifrados fora das duas classes. Piso: zero arquivo que varre é varredura quebrada
# (falha fechada). Os achados saem como arquivo:linha, sem o conteúdo da linha.
#
# Variável: REPO_RAIZ (padrão: a raiz deste repositório), para provar o vermelho
# numa cópia descartável.
set -uo pipefail

RAIZ="${REPO_RAIZ:-$(cd "$(dirname "$0")/.." && pwd)}"
if ! cd "$RAIZ"; then
  echo "verificar-travessao-arvore: raiz ilegível (falha fechada)" >&2
  exit 1
fi

VARRE='^(src/conteudo/|src/dados/|mockups/)'
INTERNO='^(docs/|TODO\.md$|tests/caracterizacao/|src/ui/area-restrita/emblema/)'

# Dois processos no total (ls-files, check-attr), nenhum por arquivo (L-11 item 6).
cifrados=()
while IFS= read -r -d '' caminho && IFS= read -r -d '' _atributo && IFS= read -r -d '' valor; do
  if [ "$valor" = "git-crypt" ]; then
    cifrados+=("$caminho")
  fi
done < <(git ls-files -z | git check-attr -z --stdin filter)

varre=()
sem_classe=()
for caminho in "${cifrados[@]}"; do
  if [[ "$caminho" =~ $VARRE ]]; then
    varre+=("$caminho")
  elif [[ "$caminho" =~ $INTERNO ]]; then
    :
  else
    sem_classe+=("$caminho")
  fi
done

for caminho in "${sem_classe[@]}"; do
  echo "verificar-travessao-arvore: CAMINHO CIFRADO SEM CLASSE (falha fechada): $caminho"
done

if [ "${#varre[@]}" -eq 0 ]; then
  echo "verificar-travessao-arvore: encontrados=0 analisados=0 falharam=0 sem_classe=${#sem_classe[@]}"
  echo "  ZERO arquivo que varre: varredura quebrada (falha fechada)" >&2
  exit 1
fi

# LC_ALL=C: awk compara bytes. U+2014 = E2 80 94; U+2013 = E2 80 93.
LC_ALL=C awk -v analisados="${#varre[@]}" -v sem_classe="${#sem_classe[@]}" '
  BEGIN { EM = "\342\200\224"; EN = "\342\200\223"; encontrados = 0; falharam = 0 }
  FNR == 1 {
    dentro = 0
    falhou_arquivo = 0
    isenta = (FILENAME ~ /(^|\/)textoIntegral\.ts$/)
  }
  {
    if (isenta && !dentro && $0 ~ /"blocos"[ \t]*:/) {
      dentro = 1
    } else if (isenta && dentro && $0 ~ /^  \]/) {
      dentro = 0
    } else if (!(isenta && dentro) && (index($0, EM) > 0 || index($0, EN) > 0)) {
      encontrados++
      if (!falhou_arquivo) { falharam++; falhou_arquivo = 1 }
      print FILENAME ":" FNR
    }
  }
  END {
    printf "verificar-travessao-arvore: encontrados=%d analisados=%d falharam=%d sem_classe=%d\n", encontrados, analisados, falharam, sem_classe
    exit (encontrados > 0 || sem_classe > 0 ? 1 : 0)
  }
' "${varre[@]}"
