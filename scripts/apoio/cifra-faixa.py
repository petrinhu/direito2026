#!/usr/bin/env python3
"""Prova de cifra da faixa de commits que vai ao remoto (LU-F4.3, plano 6.2, revisão de segurança).

Uso: cifra-faixa.py <repositorio> <base|-> <ponta>

Regras: quem decide se um caminho é cifrado é o próprio git (git check-attr --source), nunca um parser
próprio de .gitattributes. Um caminho é "protegido" se o git diz filter=git-crypt em QUALQUER fonte da
faixa: o commit-base do remoto, cada commit da faixa e a ponta. Assim, uma regra removida no meio e
restaurada na ponta, ou um .gitattributes aninhado que enfraqueça a cifra, continuam protegendo o caminho.

Conteúdo: para cada commit da faixa, git ls-tree -r -z da árvore inteira (cobre merge por construção).
Cada par (caminho, blob) de um caminho protegido tem de começar com a magia do git-crypt. Tudo é lido em
bytes e separado por NUL: espaço, acento e aspas no nome não quebram nada.

Reprova: faixa sem commit; commit da faixa sem .gitattributes; zero caminho protegido; blob sem magia;
blob com magia mas sem o nonce inteiro (menos de 22 bytes); carga depois do cabeçalho com cara de texto em claro
(I-5, LU-F5.2). Carga com menos de 32 bytes não se mede: é contada em curtos e não reprova (limite declarado).
Processos git: rev-list (1), ls-tree (um por commit), check-attr (um por fonte), cat-file --batch (1).
Saída: commits, caminhos protegidos, encontrados (pares a conferir), analisados (lidos de fato) e falharam.
Sai 0 se tudo confere; 1 se algo falha; 2 se o uso estiver errado.
"""

import math
import subprocess
import sys

MAGIA = b"\x00GITCRYPT\x00"
NONCE = 12
CABECALHO = len(MAGIA) + NONCE  # 22 bytes: magia e nonce (medido, plano 6.2)
CARGA_MINIMA = 32  # abaixo disso a fração imprimível não se mede: conta em curtos
P_ACASO = 98 / 256  # fração imprimível de bytes uniformes: 0x20 a 0x7E, \t, \n, \r
DESVIOS = 5  # cota binomial: acima disso o corpo não parece aleatório
ZERO = b"0" * 40
# Bytes que NÃO são imprimíveis (0x20-0x7E, \t, \n, \r): o translate apaga os imprimíveis, sobra a contagem.
NAO_IMPRIMIVEIS = bytes(b for b in range(256) if not (0x20 <= b <= 0x7E or b in (0x09, 0x0A, 0x0D)))


def limite_imprimiveis(n):
    """Contagem de imprimíveis acima da qual n bytes não parecem cifra: média + DESVIOS desvios binomiais."""
    return n * P_ACASO + DESVIOS * math.sqrt(n * P_ACASO * (1 - P_ACASO))


def motivo_corpo(corpo):
    """(motivo, curta). motivo é None se o blob passa; curta marca carga pequena demais para medir."""
    if corpo[: len(MAGIA)] != MAGIA:
        return "sem magia do git-crypt", False
    if len(corpo) < CABECALHO:
        return "cabeçalho incompleto (menos de 22 bytes: magia e nonce)", False
    carga = corpo[CABECALHO:]
    if len(carga) < CARGA_MINIMA:
        return None, True
    imprimiveis = len(carga.translate(None, NAO_IMPRIMIVEIS))
    if imprimiveis > limite_imprimiveis(len(carga)):
        return "carga em claro depois da magia (imprimíveis acima do acaso)", False
    return None, False


def git(repo, args, entrada=None):
    return subprocess.run(
        ["git", "-C", repo, *args], input=entrada, capture_output=True, check=True
    ).stdout


def arvore(repo, commit):
    """(caminho, blob) de todos os arquivos da árvore inteira do commit, em bytes."""
    bruto = git(repo, ["ls-tree", "-r", "-z", "--full-tree", commit])
    pares = []
    for registro in bruto.split(b"\0"):
        if not registro:
            continue
        meta, caminho = registro.split(b"\t", 1)
        _modo, tipo, sha = meta.split(b" ")
        if tipo == b"blob":
            pares.append((caminho, sha))
    return pares


def protegidos_na_fonte(repo, fonte, caminhos):
    """Caminhos (bytes) que o git marca com filter=git-crypt na fonte (commit)."""
    if not caminhos:
        return set()
    entrada = b"\0".join(caminhos) + b"\0"
    bruto = git(repo, ["check-attr", f"--source={fonte}", "-z", "--stdin", "filter"], entrada)
    marcados = set()
    partes = bruto.split(b"\0")
    for i in range(0, len(partes) - 2, 3):
        caminho, atributo, valor = partes[i], partes[i + 1], partes[i + 2]
        if atributo == b"filter" and valor == b"git-crypt":
            marcados.add(caminho)
    return marcados


def ler_blobs(repo, shas):
    """Um cat-file --batch para todos os blobs. Devolve {sha: bytes} (sha ausente vira None)."""
    if not shas:
        return {}
    entrada = b"".join(s + b"\n" for s in shas)
    bruto = git(repo, ["cat-file", "--batch"], entrada)
    saida = {}
    pos = 0
    for sha in shas:
        fim = bruto.index(b"\n", pos)
        cabecalho = bruto[pos:fim].split()
        pos = fim + 1
        if len(cabecalho) < 3:
            saida[sha] = None
            continue
        tamanho = int(cabecalho[2])
        saida[sha] = bruto[pos : pos + tamanho]
        pos += tamanho + 1
    return saida


def main(argv):
    if len(argv) != 4:
        print("uso: cifra-faixa.py <repositorio> <base|-> <ponta>", file=sys.stderr)
        return 2
    repo, base, ponta = argv[1], argv[2], argv[3]

    if base == "-":
        commits = git(repo, ["rev-list", ponta]).decode().split()
    else:
        commits = git(repo, ["rev-list", f"{base}..{ponta}"]).decode().split()
    if not commits:
        print("cifra da faixa: faixa vazia (zero commits a enviar): nada a conferir, recusado", file=sys.stderr)
        return 1

    # Árvore inteira de cada commit da faixa; .gitattributes obrigatório em cada um.
    pares_por_commit = {}
    for commit in commits:
        pares = arvore(repo, commit)
        if not any(caminho == b".gitattributes" for caminho, _ in pares):
            print(f"cifra da faixa: commit {commit[:12]} sem .gitattributes: recusado", file=sys.stderr)
            return 1
        pares_por_commit[commit] = pares

    # Fontes de regra: base do remoto (se houver), cada commit da faixa e a ponta.
    todos_caminhos = sorted({c for pares in pares_por_commit.values() for c, _ in pares})
    fontes = list(commits) + [ponta]
    if base != "-":
        fontes.append(base)
    protegidos = set()
    for fonte in dict.fromkeys(fontes):
        protegidos |= protegidos_na_fonte(repo, fonte, todos_caminhos)

    if not protegidos:
        print(
            "cifra da faixa: varredura quebrada: zero caminho protegido (filter=git-crypt) na faixa (zero é falha)",
            file=sys.stderr,
        )
        return 1

    # Pares (caminho, blob) de caminho protegido, sem repetir o mesmo par; guarda o commit de origem.
    alvo = {}
    for commit in commits:
        for caminho, sha in pares_por_commit[commit]:
            if caminho in protegidos and (caminho, sha) not in alvo:
                alvo[(caminho, sha)] = commit

    conteudo = ler_blobs(repo, sorted({sha for _, sha in alvo}))
    encontrados = len(alvo)
    analisados = 0
    curtos = 0
    falharam = []
    for (caminho, sha), commit in alvo.items():
        corpo = conteudo.get(sha)
        if corpo is None:
            falharam.append((commit[:12], caminho, "blob ilegível"))
            continue
        analisados += 1
        motivo, curta = motivo_corpo(corpo)
        curtos += 1 if curta else 0
        if motivo is not None:
            falharam.append((commit[:12], caminho, motivo))

    for commit12, caminho, motivo in falharam:
        print(
            f"EM CLARO: {commit12} {caminho.decode('utf-8', 'surrogateescape')} ({motivo})",
            file=sys.stderr,
        )
    print(
        f"cifra da faixa: commits={len(commits)} caminhos_protegidos={len(protegidos)} "
        f"encontrados={encontrados} analisados={analisados} falharam={len(falharam)} curtos={curtos}"
    )
    if analisados != encontrados:
        print("cifra da faixa: varredura incompleta (analisados diferente de encontrados)", file=sys.stderr)
        return 1
    return 1 if falharam else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
