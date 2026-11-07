#!/usr/bin/env bash
# Portão de travessão na árvore (plano do CTO do login único, 6.3 e F1.2; L-36).
#
# Reprova U+2014 (em-dash) e U+2013 (en-dash) em todo arquivo CIFRADO, lido da
# working tree destravada. Os caminhos vêm do .gitattributes real (git check-attr),
# não de uma lista copiada. Escopo: TODO cifrado. O hook global
# (~/.claude/hooks/no_mdash.py, is_user_facing) marca só uma parte deles como voz
# pública; o plano 6.3 pede "nos caminhos cifrados", e essa diferença de escopo é
# decisão do líder, registrada no relatório da F1.2.
#
# Isenção única: o campo "blocos" do texto integral (transcrição fiel de obra de
# terceiro), que é a faixa entre a linha '"blocos": [' e o fechamento '  ]' de
# cada textoIntegral.ts. Base: src/core/conteudo/semTextoFiel.ts:10-13, ordem do
# líder de 21/10/2026 (GODS_LAWS.md, L-32). Título e fonte do mesmo arquivo
# continuam sob a regra. A exceção do rodapé foi REVOGADA em 20/10/2026
# (tests/unidade/design.semTravessao.spec.ts:13-17) e não existe mais.
#
# Saída: encontrados = linhas com travessão fora da isenção; analisados = arquivos
# cifrados lidos; falharam = arquivos com ao menos um achado. Piso: zero arquivo
# cifrado é varredura quebrada (falha fechada). Os achados saem como arquivo:linha,
# sem o conteúdo da linha.
#
# Variável: REPO_RAIZ (padrão: a raiz deste repositório), para provar o vermelho
# numa cópia descartável.
set -uo pipefail

RAIZ="${REPO_RAIZ:-$(cd "$(dirname "$0")/.." && pwd)}"
if ! cd "$RAIZ"; then
  echo "verificar-travessao-arvore: raiz ilegível (falha fechada)" >&2
  exit 1
fi

# Dois processos no total (ls-files, check-attr), nenhum por arquivo (L-11 item 6).
arquivos=()
while IFS= read -r -d '' caminho && IFS= read -r -d '' _atributo && IFS= read -r -d '' valor; do
  if [ "$valor" = "git-crypt" ]; then
    arquivos+=("$caminho")
  fi
done < <(git ls-files -z | git check-attr -z --stdin filter)

if [ "${#arquivos[@]}" -eq 0 ]; then
  echo "verificar-travessao-arvore: encontrados=0 analisados=0 falharam=0"
  echo "  ZERO arquivo cifrado analisado: varredura quebrada (falha fechada)" >&2
  exit 1
fi

# LC_ALL=C: awk compara bytes. U+2014 = E2 80 94; U+2013 = E2 80 93.
LC_ALL=C awk -v analisados="${#arquivos[@]}" '
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
    printf "verificar-travessao-arvore: encontrados=%d analisados=%d falharam=%d\n", encontrados, analisados, falharam
    exit (encontrados > 0 ? 1 : 0)
  }
' "${arquivos[@]}"
