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
#   scripts/verificar-proibicoes.sh --amplo [raiz]
#       varredura ampliada (LU-F1.3-N3): README.md e CLAUDE.md da raiz, e os docs/**/*.md
#       que estão em claro (sem a assinatura do git-crypt), mais o NOME de todo arquivo
#       rastreado (git ls-files), cifrado inclusive. Conteúdo cifrado não é lido. O conjunto
#       vem do git, então .worktrees e node_modules ficam de fora. Imprime só caminho e contagem.
#
# Regra de saída de TODOS os modos (PROIBICOES-SAIDA-SEM-TERMO): um achado sai como caminho (ou
# "resposta do servidor") e número da linha. Nunca sai o termo, nem o trecho da linha. O preci
# repassa essa saída ao terminal, por isso ela não pode carregar o termo.
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

if [ "${1:-}" = "--amplo" ]; then
  # Modo próprio: uma única chamada de python lê os termos e os arquivos, e a saída é só caminho e
  # contagem (a mesma regra de saída dos modos antigos, sem o termo). Não reusa as funções de bash.
  python3 -I - "${2:-.}" "$ARQUIVO_TERMOS" <<'PY'
import os
import subprocess
import sys
import unicodedata

raiz, arq_termos = sys.argv[1], sys.argv[2]
MAGICA_GIT_CRYPT = b'\x00GITCRYPT\x00'
CONTEUDO_FIXO = ['README.md', 'CLAUDE.md']


def norm(texto):
    sem_acento = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    return sem_acento.lower()


def falha(mensagem):
    print(f'verificar-proibicoes --amplo: {mensagem}', file=sys.stderr)
    sys.exit(1)


with open(arq_termos, encoding='utf-8') as f:
    termos = [norm(linha.strip()) for linha in f if linha.strip()]
if not termos:
    falha('arquivo de termos vazio')

try:
    bruto = subprocess.run(['git', '-C', raiz, 'ls-files', '-z'], capture_output=True, check=True).stdout
except (subprocess.CalledProcessError, FileNotFoundError):
    falha(f'git ls-files falhou em {raiz}')
rastreados = [p.decode('utf-8', 'replace') for p in bruto.split(b'\0') if p]
if not rastreados:
    falha('zero arquivo rastreado é portão quebrado, não código limpo')
conjunto = set(rastreados)
for obrigatorio in CONTEUDO_FIXO:
    if obrigatorio not in conjunto:
        falha(f'{obrigatorio} não está entre os arquivos rastreados')

achados = 0
for nome in rastreados:
    if any(t in norm(nome) for t in termos):
        print(f'PROIBIÇÃO NO NOME DO ARQUIVO: {nome}', file=sys.stderr)
        achados += 1

candidatos = CONTEUDO_FIXO + sorted(p for p in rastreados if p.startswith('docs/') and p.endswith('.md'))
lidos = cifrados = 0
for caminho in candidatos:
    try:
        with open(os.path.join(raiz, caminho), 'rb') as f:
            conteudo = f.read()
    except OSError:
        print(f'ARQUIVO RASTREADO AUSENTE DA ÁRVORE: {caminho}', file=sys.stderr)
        achados += 1
        continue
    if conteudo.startswith(MAGICA_GIT_CRYPT):
        cifrados += 1
        continue
    lidos += 1
    texto = norm(conteudo.decode('utf-8', 'replace'))
    if any(t in texto for t in termos):
        print(f'PROIBIÇÃO NO CONTEÚDO: {caminho}', file=sys.stderr)
        achados += 1

print(f'amplo: nomes rastreados varridos: {len(rastreados)}')
print(f'amplo: conteúdo em claro varrido: {lidos}; cifrado pulado: {cifrados}')
print(f'amplo: achados: {achados}')
sys.exit(1 if achados else 0)
PY
  exit $?
fi

ALVO="${1:-}"
ARQUIVOS_VARRIDOS=0
ACHADOS=0

# Procura cada termo no texto já normalizado. Guarda em ACHOU_N quantos termos apareceram e em
# ACHOU_LINHA a primeira linha de qualquer um deles (0 se nenhum). Nunca imprime o termo: quem
# chama imprime só o caminho (ou a origem) e o número da linha.
procurar_termos() {
  local texto="$1" termo linha
  ACHOU_N=0
  ACHOU_LINHA=0
  for termo in "${TERMOS[@]}"; do
    linha="$(printf '%s\n' "$texto" | grep -nF -- "$termo" | head -n 1 | cut -d: -f1)"
    if [ -n "$linha" ]; then
      ACHOU_N=$((ACHOU_N + 1))
      if [ "$ACHOU_LINHA" -eq 0 ] || [ "$linha" -lt "$ACHOU_LINHA" ]; then
        ACHOU_LINHA="$linha"
      fi
    fi
  done
}

varrer_conteudo() {
  local caminho="$1"
  local conteudo
  conteudo="$(normalizar < "$caminho" 2>/dev/null || true)"
  procurar_termos "$conteudo"
  if [ "$ACHOU_N" -gt 0 ]; then
    echo "PROIBIÇÃO ENCONTRADA em $caminho, linha $ACHOU_LINHA" >&2
    ACHADOS=$((ACHADOS + ACHOU_N))
  fi
  ARQUIVOS_VARRIDOS=$((ARQUIVOS_VARRIDOS + 1))
}

varrer_nome() {
  local caminho="$1"
  local nome_normalizado
  nome_normalizado="$(printf '%s' "$caminho" | normalizar)"
  procurar_termos "$nome_normalizado"
  if [ "$ACHOU_N" -gt 0 ]; then
    echo "PROIBIÇÃO NO NOME DO ARQUIVO: $caminho" >&2
    ACHADOS=$((ACHADOS + ACHOU_N))
  fi
}

if [ "$ALVO" = "-" ]; then
  # Resposta HTTP vinda da entrada padrão (verificação pós-publicação, V6).
  conteudo="$(normalizar)"
  procurar_termos "$conteudo"
  if [ "$ACHOU_N" -gt 0 ]; then
    echo "PROIBIÇÃO ENCONTRADA (resposta do servidor), linha $ACHOU_LINHA" >&2
    ACHADOS=$((ACHADOS + ACHOU_N))
  fi
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
