/**
 * Tipo da imagem do acervo da Júri. As imagens vão em claro (LU-F4.5: o formato
 * cifrado v1 saiu com a cifra). Só o tipo sobrevive: a ferramenta de acervo
 * (scripts/juri) o usa para declarar cada imagem no índice.
 */
export type TipoImagem = 'jpeg' | 'png' | 'webp';
