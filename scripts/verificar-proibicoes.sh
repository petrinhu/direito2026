#!/usr/bin/env bash
# Portão de R3 (docs/arquitetura.md, seção 1): as duas palavras proibidas
# (nome do professor e nome da instituição) nunca aparecem em texto
# visível, metadado, comentário de código, nome de arquivo ou URL.
#
# Os termos moram fora do repositório, em ~/.config/secrets/, um por
# linha, nunca em arquivo versionado. Se o arquivo de termos não existir,
# o portão falha (não deixa passar em silêncio): é a mesma regra do piso
# de varredura, aplicada aos próprios termos.
#
# Uso:
#   scripts/verificar-proibicoes.sh            varre src/, public/ e nomes de arquivo/diretório do repo
#   scripts/verificar-proibicoes.sh dist/      varre a pasta dist/ construída
#   scripts/verificar-proibicoes.sh -          lê da entrada padrão (resposta HTTP do servidor)
set -uo pipefail

ARQUIVO_TERMOS="${VERIFICAR_PROIBICOES_TERMOS:-$HOME/.config/secrets/caderno-direito-termos-proibidos.txt}"

if [ ! -f "$ARQUIVO_TERMOS" ]; then
  echo "verificar-proibicoes: arquivo de termos ausente em $ARQUIVO_TERMOS" >&2
  echo "termos varridos: 0" >&2
  exit 1
fi

# Sem distinguir maiúscula/minúscula nem acento (o nome da instituição
# aparece em caixa alta no piloto; um nome próprio, acentuado e sem
# acento). grep -i cobre caixa; para acento, normalizamos NFD e removemos
# diacríticos dos dois lados antes de comparar.
normalizar() {
  python3 -c "
import sys, unicodedata
texto = sys.stdin.read()
sem_acento = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
sys.stdout.write(sem_acento.lower())
"
}

mapfile -t TERMOS < <(grep -v '^\s*$' "$ARQUIVO_TERMOS" | normalizar)

if [ "${#TERMOS[@]}" -eq 0 ]; then
  echo "verificar-proibicoes: arquivo de termos vazio" >&2
  exit 1
fi

ALVO="${1:-}"
ARQUIVOS_VARRIDOS=0
ACHADOS=0

varrer_conteudo() {
  local caminho="$1"
  local conteudo
  conteudo="$(normalizar < "$caminho" 2>/dev/null || true)"
  for termo in "${TERMOS[@]}"; do
    if printf '%s' "$conteudo" | grep -qF -- "$termo"; then
      echo "PROIBIÇÃO ENCONTRADA: '$termo' em $caminho" >&2
      ACHADOS=$((ACHADOS + 1))
    fi
  done
  ARQUIVOS_VARRIDOS=$((ARQUIVOS_VARRIDOS + 1))
}

varrer_nome() {
  local caminho="$1"
  local nome_normalizado
  nome_normalizado="$(printf '%s' "$caminho" | normalizar)"
  for termo in "${TERMOS[@]}"; do
    if printf '%s' "$nome_normalizado" | grep -qF -- "$termo"; then
      echo "PROIBIÇÃO NO NOME DO ARQUIVO: '$termo' em $caminho" >&2
      ACHADOS=$((ACHADOS + 1))
    fi
  done
}

if [ "$ALVO" = "-" ]; then
  # Resposta HTTP vinda da entrada padrão (verificação pós-publicação, V6).
  conteudo="$(normalizar)"
  for termo in "${TERMOS[@]}"; do
    if printf '%s' "$conteudo" | grep -qF -- "$termo"; then
      echo "PROIBIÇÃO ENCONTRADA (resposta do servidor): '$termo'" >&2
      ACHADOS=$((ACHADOS + 1))
    fi
  done
  ARQUIVOS_VARRIDOS=1
else
  DIRETORIO="${ALVO:-.}"
  if [ ! -e "$DIRETORIO" ]; then
    echo "verificar-proibicoes: alvo inexistente: $DIRETORIO" >&2
    exit 1
  fi
  while IFS= read -r -d '' arquivo; do
    varrer_nome "$arquivo"
    if [ -f "$arquivo" ]; then
      case "$arquivo" in
        *.png|*.jpg|*.jpeg|*.svg|*.woff2|*.ico|*.zip) ;; # binário/vetor: nome já verificado, conteúdo não
        *) varrer_conteudo "$arquivo" ;;
      esac
    fi
  done < <(find "$DIRETORIO" -mindepth 1 \
    \( -path '*/node_modules' -o -path '*/.git' -o -name 'dist' \) -prune -o \
    -type f -print0)
fi

echo "arquivos varridos: $ARQUIVOS_VARRIDOS"

if [ "$ARQUIVOS_VARRIDOS" -eq 0 ]; then
  echo "verificar-proibicoes: zero arquivo varrido é portão quebrado, não código limpo" >&2
  exit 1
fi

if [ "$ACHADOS" -gt 0 ]; then
  exit 1
fi

exit 0
