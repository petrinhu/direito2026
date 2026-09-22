#!/usr/bin/env python3
"""Portão que faltava (achado do líder, 22/09/2026): o portão antigo só
confere se HÁ um arquivo .woff2, nunca se a fonte SERVE, isto é, se ela
de fato contém os glifos que o site precisa desenhar. Medido: as quatro
fontes recortadas do commit a68fc44 tinham 129 glifos cada, dos quais só
UMA letra maiúscula (A) e ZERO minúsculas, ZERO dígitos - o "A" vinha da
fonte própria e toda outra maiúscula caía na fonte de reserva, com
métrica diferente (o que o líder via como "A muito maior que as outras
maiúsculas").

Conjunto mínimo exigido, o mesmo que scripts/gerar-fontes.sh usa para
recortar (Basic Latin + Latin-1 Supplement + reticência tipográfica):
26 maiúsculas, 26 minúsculas, 10 dígitos, e a acentuação do português
(á é í ó ú â ê ô ã õ à ç, maiúsculas e minúsculas).

Piso de varredura (L-36): imprime sempre "fontes varridas: N / com
conjunto mínimo: M", nunca silencioso, e falha se N for zero.
"""
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
except ImportError:
    print(
        "verificar-fontes-glifos: fontTools não encontrado (pip install fonttools, "
        "já usado por scripts/gerar-fontes.sh)",
        file=sys.stderr,
    )
    sys.exit(1)

MAIUSCULAS = [chr(c) for c in range(ord("A"), ord("Z") + 1)]
MINUSCULAS = [chr(c) for c in range(ord("a"), ord("z") + 1)]
DIGITOS = [chr(c) for c in range(ord("0"), ord("9") + 1)]
ACENTOS_PT_BR = list("áéíóúâêôãõàçÁÉÍÓÚÂÊÔÃÕÀÇ")

CONJUNTO_MINIMO = MAIUSCULAS + MINUSCULAS + DIGITOS + ACENTOS_PT_BR


def conferir_arquivo(caminho: Path) -> tuple[bool, str]:
    try:
        fonte = TTFont(str(caminho), fontNumber=0)
    except Exception as erro:  # noqa: BLE001 - reporta qualquer falha de leitura
        return False, f"não foi possível ler o arquivo ({erro})"

    cmap = fonte.getBestCmap()
    if cmap is None:
        return False, "sem tabela cmap (fonte sem mapa de caracteres utilizável)"

    faltando = [c for c in CONJUNTO_MINIMO if ord(c) not in cmap]
    if faltando:
        faltando_maiusc = [c for c in faltando if c in MAIUSCULAS]
        faltando_minusc = [c for c in faltando if c in MINUSCULAS]
        faltando_digito = [c for c in faltando if c in DIGITOS]
        faltando_acento = [c for c in faltando if c in ACENTOS_PT_BR]
        detalhe = (
            f"faltam {len(faltando)} glifo(s) do conjunto mínimo: "
            f"maiúsculas ausentes={''.join(faltando_maiusc) or '-'}, "
            f"minúsculas ausentes={''.join(faltando_minusc) or '-'}, "
            f"dígitos ausentes={''.join(faltando_digito) or '-'}, "
            f"acentos pt-br ausentes={''.join(faltando_acento) or '-'} "
            f"(total de glifos no arquivo: {len(cmap)})"
        )
        return False, detalhe

    return True, f"conjunto mínimo completo (total de glifos no arquivo: {len(cmap)})"


def principal() -> int:
    if len(sys.argv) < 2:
        print("uso: verificar-fontes-glifos.py <diretório>", file=sys.stderr)
        return 1

    diretorio = Path(sys.argv[1])
    if not diretorio.is_dir():
        print(f"verificar-fontes-glifos: pasta ausente: {diretorio}", file=sys.stderr)
        return 1

    arquivos = sorted(diretorio.rglob("*.woff2"))
    varridas = 0
    com_conjunto_minimo = 0
    falhou = False

    for arquivo in arquivos:
        varridas += 1
        ok, detalhe = conferir_arquivo(arquivo)
        if ok:
            com_conjunto_minimo += 1
            print(f"  OK   {arquivo}: {detalhe}")
        else:
            falhou = True
            print(f"  FALHOU {arquivo}: {detalhe}", file=sys.stderr)

    print(f"fontes varridas: {varridas} / com conjunto mínimo: {com_conjunto_minimo}")

    if varridas == 0:
        print("verificar-fontes-glifos: zero fonte varrida, portão quebrado", file=sys.stderr)
        return 1

    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(principal())
