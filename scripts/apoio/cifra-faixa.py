#!/usr/bin/env python3
"""Prova de cifra da faixa de commits que vai ao remoto (LU-F4.3, revisão de segurança).

Uso: cifra-faixa.py <repositorio> <base|-> <ponta>

Percorre cada commit de base..ponta (ou todo o histórico de ponta, se base for "-", primeira publicação).
Para cada arquivo que esse commit altera, confere o .gitattributes DAQUELE commit: se o caminho tem
filter=git-crypt, o blob do commit tem de começar com a magia do git-crypt (\\0GITCRYPT\\0). Assim, um commit
do meio em claro não passa só porque a ponta está cifrada.

Piso: a ponta tem de ter ao menos um caminho cifrado (zero é varredura quebrada, L-36).

Processos git: rev-list, ls-tree (ponta), log --raw (mudanças) e cat-file --batch (atributos e blobs),
um de cada, nunca um por item. Saída: encontrados, analisados, falharam, e uma linha EM CLARO por falha.
Sai 0 se tudo confere; 1 se algum blob falha ou se o piso falha; 2 se o uso estiver errado.
"""

import re
import subprocess
import sys

MAGIA = b"\x00GITCRYPT\x00"
ZERO = "0" * 40


def git(repo, args, entrada=None):
    return subprocess.run(
        ["git", "-C", repo, *args], input=entrada, capture_output=True, check=True
    ).stdout


def compilar(padrao):
    """Padrão de .gitattributes (regra de gitignore): com barra é ancorado; sem barra casa o nome em qualquer pasta."""
    ancorado = "/" in padrao.rstrip("/")
    p = padrao[1:] if padrao.startswith("/") else padrao
    regex = ""
    i = 0
    while i < len(p):
        if p.startswith("**", i):
            regex += ".*"
            i += 2
            if p[i : i + 1] == "/":
                i += 1
            continue
        c = p[i]
        if c == "*":
            regex += "[^/]*"
        elif c == "?":
            regex += "[^/]"
        else:
            regex += re.escape(c)
        i += 1
    prefixo = "^" if ancorado else "^(?:.*/)?"
    return re.compile(prefixo + regex + "$")


def regras(texto):
    """Lista de (regex, atributos) na ordem do arquivo. Valor None = desligado (! ou -)."""
    saida = []
    for linha in texto.decode("utf-8", "replace").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#"):
            continue
        partes = linha.split()
        atributos = {}
        for tok in partes[1:]:
            if tok.startswith("!") or tok.startswith("-"):
                atributos[tok[1:]] = None
            elif "=" in tok:
                nome, valor = tok.split("=", 1)
                atributos[nome] = valor
            else:
                atributos[tok] = True
        saida.append((compilar(partes[0]), atributos))
    return saida


def filtro_do_caminho(lista_regras, caminho):
    """Valor de filter para o caminho, com a última regra que casa (regra posterior vence)."""
    valor = None
    for regex, atributos in lista_regras:
        if regex.match(caminho) and "filter" in atributos:
            valor = atributos["filter"]
    return valor


def ler_lote(repo, pedidos):
    """Um cat-file --batch para todos os pedidos. Devolve bytes do objeto, ou None se ausente."""
    entrada = "".join(p + "\n" for p in pedidos).encode()
    bruto = git(repo, ["cat-file", "--batch"], entrada)
    resposta = []
    pos = 0
    for _ in pedidos:
        fim = bruto.index(b"\n", pos)
        cabecalho = bruto[pos:fim].split()
        pos = fim + 1
        if len(cabecalho) < 3:
            resposta.append(None)
            continue
        tamanho = int(cabecalho[2])
        resposta.append(bruto[pos : pos + tamanho])
        pos += tamanho + 1
    return resposta


def main(argv):
    if len(argv) != 4:
        print("uso: cifra-faixa.py <repositorio> <base|-> <ponta>", file=sys.stderr)
        return 2
    repo, base, ponta = argv[1], argv[2], argv[3]

    # Piso: a ponta tem caminho cifrado (com as regras da própria ponta).
    regras_ponta = regras(ler_lote(repo, [f"{ponta}:.gitattributes"])[0] or b"")
    caminhos_ponta = git(repo, ["ls-tree", "-r", "-z", "--name-only", ponta]).decode("utf-8", "replace")
    cifrados_ponta = [c for c in caminhos_ponta.split("\0") if c and filtro_do_caminho(regras_ponta, c) == "git-crypt"]
    if not cifrados_ponta:
        print("cifra da faixa: a ponta não tem nenhum caminho cifrado: varredura quebrada (zero é falha)", file=sys.stderr)
        return 1

    # Commits da faixa.
    if base == "-":
        commits = git(repo, ["rev-list", ponta]).decode().split()
    else:
        commits = git(repo, ["rev-list", f"{base}..{ponta}"]).decode().split()

    # Mudanças por commit (um log para todos).
    mudancas = {c: [] for c in commits}
    if commits:
        bruto = git(
            repo,
            ["-c", "core.quotepath=off", "log", "--no-walk=unsorted", "--stdin", "--raw",
             "--no-abbrev", "--no-renames", "--root", "--format=@@%H"],
            ("\n".join(commits) + "\n").encode(),
        ).decode("utf-8", "replace")
        atual = None
        for linha in bruto.splitlines():
            if linha.startswith("@@"):
                atual = linha[2:].strip()
            elif linha.startswith(":") and atual is not None and "\t" in linha:
                meta, caminho = linha.split("\t", 1)
                campos = meta.split()
                novo, status = campos[3], campos[4]
                if novo != ZERO and not status.startswith("D"):
                    mudancas.setdefault(atual, []).append((caminho, novo))

    # Um só cat-file: atributos de cada commit e blobs alterados.
    pedidos_attr = [f"{c}:.gitattributes" for c in commits]
    blobs = sorted({sha for lista in mudancas.values() for _, sha in lista})
    objetos = ler_lote(repo, pedidos_attr + blobs) if (pedidos_attr or blobs) else []
    attr_por_commit = dict(zip(commits, objetos[: len(commits)]))
    conteudo = dict(zip(blobs, objetos[len(commits) :]))

    encontrados = 0
    analisados = 0
    falharam = []
    for c in commits:
        regras_c = regras(attr_por_commit.get(c) or b"")
        for caminho, sha in mudancas.get(c, []):
            if filtro_do_caminho(regras_c, caminho) != "git-crypt":
                continue
            encontrados += 1
            analisados += 1
            corpo = conteudo.get(sha)
            if corpo is None or corpo[: len(MAGIA)] != MAGIA:
                falharam.append((c[:12], caminho))

    for commit12, caminho in falharam:
        print(f"EM CLARO: {commit12} {caminho}", file=sys.stderr)
    print(
        f"cifra da faixa: commits={len(commits)} encontrados={encontrados} "
        f"analisados={analisados} falharam={len(falharam)}"
    )
    if analisados != encontrados:
        print("cifra da faixa: varredura incompleta", file=sys.stderr)
        return 1
    return 1 if falharam else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
