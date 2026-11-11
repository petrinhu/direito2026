/**
 * Leitura dos e-mails que o servidor mandou ao SMTP falso (EM-F1). Cada conexão do servidor vira um arquivo em
 * PASTA_SMTP (smtpRepasse.ts). Aqui o arquivo é lido como o cliente de e-mail da pessoa leria: cabeçalhos
 * desdobrados, assunto em encoded-words RFC 2047 decodificado, corpo em quoted-printable decodificado (TE5: o
 * link só se confere depois de decodificar, porque a quebra "=" de linha longa o parte).
 *
 * Nada aqui imprime endereço, link ou token: quem usa compara por booleano. O texto bruto do arquivo também
 * leva a senha sintética do AUTH, e por isso o retorno só tem o que é da mensagem.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import { ORIGEM_NO_EMAIL } from './constantes';
import { PASTA_SMTP } from './ambiente';

export interface EmailCapturado {
  readonly remetente: string;
  readonly destinatario: string;
  readonly assunto: string;
  /** Corpo decodificado, com LF e sem a quebra final. */
  readonly corpo: string;
  /** Valor do cabeçalho Content-Transfer-Encoding, em minúsculas. */
  readonly codificacao: string;
}

export interface FiltroDeEmail {
  readonly para: string;
  readonly assunto?: string;
}

/** Arquivos que já existiam: o teste só olha o que chegou depois. Não se apaga nada. */
export function marcarCapturas(): ReadonlySet<string> {
  return new Set(readdirSync(PASTA_SMTP));
}

function novasConversas(antes: ReadonlySet<string>): string[] {
  return readdirSync(PASTA_SMTP)
    .filter((nome) => !antes.has(nome))
    .sort()
    .map((nome) => join(PASTA_SMTP, nome));
}

function decodificarQuotedPrintable(texto: string): string {
  const semQuebras = texto.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < semQuebras.length; i += 1) {
    const hex = semQuebras.slice(i + 1, i + 3);
    if (semQuebras[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(semQuebras.charCodeAt(i) & 0xff);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function decodificarAssunto(valor: string): string {
  const palavras = valor
    .replace(/\r\n[ \t]+/g, ' ')
    .trim()
    .split(/\s+/);
  return palavras
    .map((palavra) => {
      const partes = /^=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=$/.exec(palavra);
      return partes ? Buffer.from(partes[1]!, 'base64').toString('utf8') : palavra;
    })
    .join('');
}

function enderecoDe(linha: string | undefined, comando: string): string {
  const achado = new RegExp(`^${comando}:<([^>]*)>`, 'm').exec(linha ?? '');
  return achado?.[1] ?? '';
}

/** A mensagem completa da conversa (do DATA ao ponto final), ou undefined se a conversa não chegou até lá. */
export function lerEmail(arquivo: string): EmailCapturado | undefined {
  const bruto = readFileSync(arquivo, 'latin1');
  const dados = bruto.indexOf('\r\nDATA\r\n');
  if (dados === -1) return undefined;
  const inicio = dados + '\r\nDATA\r\n'.length;
  const fim = bruto.indexOf('\r\n.\r\n', inicio - 2);
  if (fim === -1) return undefined;
  const mensagem = bruto.slice(inicio, fim + 2).replace(/^\.\./gm, '.');
  const corte = mensagem.indexOf('\r\n\r\n');
  if (corte === -1) return undefined;
  const cabecalhos = mensagem.slice(0, corte);
  const cabecalho = (nome: string): string => {
    const achado = new RegExp(`^${nome}:[ \\t]*((?:.*)(?:\\r\\n[ \\t]+.*)*)`, 'im').exec(
      cabecalhos
    );
    return achado?.[1] ?? '';
  };
  const codificacao = cabecalho('Content-Transfer-Encoding').trim().toLowerCase();
  const corpoBruto = mensagem.slice(corte + 4);
  const corpo =
    codificacao === 'quoted-printable' ? decodificarQuotedPrintable(corpoBruto) : corpoBruto;
  return {
    remetente: enderecoDe(bruto, 'MAIL FROM'),
    destinatario: enderecoDe(bruto, 'RCPT TO'),
    assunto: decodificarAssunto(cabecalho('Subject')),
    corpo: corpo.replace(/\r\n/g, '\n').replace(/\n+$/, ''),
    codificacao
  };
}

/** Todos os e-mails completos que chegaram depois da marca, na ordem de chegada. */
export function emailsDesde(antes: ReadonlySet<string>): EmailCapturado[] {
  return novasConversas(antes)
    .map(lerEmail)
    .filter((email): email is EmailCapturado => email !== undefined);
}

/** Quantas conversas (com ou sem mensagem completa) o servidor abriu com o SMTP falso depois da marca. */
export function conversasDesde(antes: ReadonlySet<string>): number {
  return novasConversas(antes).length;
}

function casa(email: EmailCapturado, filtro: FiltroDeEmail): boolean {
  return (
    email.destinatario === filtro.para &&
    (filtro.assunto === undefined || email.assunto === filtro.assunto)
  );
}

/** Espera o e-mail chegar ao SMTP falso (poll: o envio do servidor é síncrono, mas o arquivo é lido de fora). */
export async function esperarEmail(
  antes: ReadonlySet<string>,
  filtro: FiltroDeEmail
): Promise<EmailCapturado> {
  let achado: EmailCapturado | undefined;
  await expect
    .poll(
      () => {
        achado = emailsDesde(antes).find((email) => casa(email, filtro));
        return achado !== undefined;
      },
      { message: 'o e-mail chegou ao SMTP falso', timeout: 15_000 }
    )
    .toBe(true);
  return achado!;
}

/** A linha do corpo que é só o link: sozinho na própria linha (8.1.6), com a origem do site em produção. */
export function caminhoDoLinkNoCorpo(corpo: string): string | undefined {
  const origem = ORIGEM_NO_EMAIL.replace(/[.]/g, '\\.');
  const achado = new RegExp(`^${origem}(/api/convite\\.php\\?t=[0-9a-f]{64})$`, 'm').exec(corpo);
  return achado?.[1];
}

/** O corpo com o link trocado por `<link>`, para comparar com o texto do líder sem deixar o token em mensagem. */
export function corpoSemLink(corpo: string): string {
  const origem = ORIGEM_NO_EMAIL.replace(/[.]/g, '\\.');
  return corpo.replace(new RegExp(`^${origem}/api/convite\\.php\\?t=[0-9a-f]{64}$`, 'm'), '<link>');
}

/** Verdadeiro se, depois da marca, nenhuma mensagem completa (do DATA ao ponto final) chegou ao SMTP falso. */
export function semEmailCompleto(antes: ReadonlySet<string>): boolean {
  return emailsDesde(antes).length === 0;
}
