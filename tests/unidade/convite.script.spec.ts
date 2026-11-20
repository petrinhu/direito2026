// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Script public/convite.js (V17-C6). Roda na tela-casca do convite, que o backend
 * entrega sem token (V17-C3). O fragmento #t= nunca sai do navegador: o script lê,
 * tira da barra com window.history.replaceState e só então grava o valor no campo oculto t.
 * Contrato da casca (fixado aqui, o backend monta o HTML igual):
 *   - #convite-aviso: aviso visível por padrão (sem JavaScript); o script troca o texto ou o esconde;
 *   - #convite-form: formulário com o atributo hidden; o script tira o hidden quando o link lê;
 *   - input[name="t"] dentro do formulário: campo oculto, vazio na carga;
 *   - [role="status"] fora do formulário: anuncia "Link lido. Crie a sua senha.".
 */

const SCRIPT = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../public/convite.js'),
  'utf8'
);

const TOKEN = '0123456789abcdef'.repeat(4);
const CAMINHO = '/api/convite.php';
const AVISO_SEM_JS =
  'Para criar a sua senha, esta página precisa do JavaScript ligado no navegador. Ligue o JavaScript e abra de novo o link do e-mail.';
const AVISO_INCOMPLETO =
  'O link chegou incompleto. Abra o e-mail, copie o endereço completo e cole na barra de endereço do navegador.';
const ANUNCIO_LIDO = 'Link lido. Crie a sua senha.';

const CASCA = `
  <p id="convite-aviso">${AVISO_SEM_JS}</p>
  <form id="convite-form" method="post" action="${CAMINHO}?envio" hidden>
    <input type="hidden" name="t" value="">
    <button type="submit">Criar a senha</button>
  </form>
  <div role="status"></div>
`;

function elemento<T extends HTMLElement>(seletor: string): T {
  const achado = document.querySelector<T>(seletor);
  if (achado === null) throw new Error(`elemento ausente na casca: ${seletor}`);
  return achado;
}

const campoT = (): HTMLInputElement => elemento<HTMLInputElement>('input[name="t"]');
const formulario = (): HTMLElement => elemento<HTMLElement>('#convite-form');
const aviso = (): HTMLElement => elemento<HTMLElement>('#convite-aviso');
const anuncio = (): HTMLElement => elemento<HTMLElement>('[role="status"]');

/** Roda o script real (texto de public/convite.js) no documento atual, como o navegador faria no defer. */
function rodarScript(): void {
  new Function(SCRIPT)();
}

function abrirEm(caminhoComFragmento: string): void {
  window.history.replaceState(null, '', caminhoComFragmento);
}

/** Ouvintes que o script põe na janela: saem ao fim de cada caso, porque o jsdom é um só para o arquivo inteiro. */
const ouvintesDaJanela: Array<Parameters<typeof window.removeEventListener>> = [];
const adicionarNaJanela = window.addEventListener.bind(window);

beforeEach(() => {
  document.body.innerHTML = CASCA;
  abrirEm(CAMINHO);
  vi.spyOn(window, 'addEventListener').mockImplementation(
    (...argumentos: Parameters<typeof window.addEventListener>) => {
      ouvintesDaJanela.push([argumentos[0], argumentos[1]]);
      adicionarNaJanela(...argumentos);
    }
  );
});

afterEach(() => {
  for (const argumentos of ouvintesDaJanela.splice(0)) window.removeEventListener(...argumentos);
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('convite.js, link com fragmento válido', () => {
  it('lê o #t=, libera o formulário, esconde o aviso e anuncia, sem mover o foco', () => {
    abrirEm(`${CAMINHO}#t=${TOKEN}`);
    const focoAntes = document.activeElement;

    rodarScript();

    expect(campoT().value).toBe(TOKEN);
    expect(formulario().hidden).toBe(false);
    expect(aviso().hidden).toBe(true);
    expect(anuncio().textContent).toBe(ANUNCIO_LIDO);
    expect(document.activeElement).toBe(focoAntes);
  });

  it('tira o fragmento da barra de endereço, mantendo o caminho', () => {
    abrirEm(`${CAMINHO}#t=${TOKEN}`);

    rodarScript();

    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe(CAMINHO);
  });

  it('chama replaceState ANTES de gravar o token no campo (teste de ordem)', () => {
    abrirEm(`${CAMINHO}#t=${TOKEN}`);
    const original = window.history.replaceState.bind(window.history);
    const valorNoMomento: string[] = [];
    const urlPassada: string[] = [];
    vi.spyOn(window.history, 'replaceState').mockImplementation((estado, titulo, url) => {
      valorNoMomento.push(campoT().value);
      urlPassada.push(String(url ?? ''));
      original(estado, titulo, url);
    });

    rodarScript();

    expect(valorNoMomento).toEqual(['']);
    expect(urlPassada).toEqual([CAMINHO]);
    expect(urlPassada[0]).not.toContain('#');
    expect(campoT().value).toBe(TOKEN);
  });
});

describe('convite.js, campo t já preenchido', () => {
  it('não faz nada: não mexe no campo, no fragmento, no formulário nem no aviso', () => {
    const outro = 'f'.repeat(64);
    campoT().value = outro;
    abrirEm(`${CAMINHO}#t=${TOKEN}`);
    const replace = vi.spyOn(window.history, 'replaceState');

    rodarScript();

    expect(replace).not.toHaveBeenCalled();
    expect(campoT().value).toBe(outro);
    expect(window.location.hash).toBe(`#t=${TOKEN}`);
    expect(formulario().hidden).toBe(true);
    expect(aviso().hidden).toBe(false);
    expect(aviso().textContent).toBe(AVISO_SEM_JS);
    expect(anuncio().textContent).toBe('');
  });
});

describe('convite.js, link incompleto ou sem fragmento', () => {
  it('sem fragmento: troca o aviso pelo de link incompleto e mantém o formulário escondido', () => {
    const replace = vi.spyOn(window.history, 'replaceState');

    rodarScript();

    expect(aviso().textContent).toBe(AVISO_INCOMPLETO);
    expect(aviso().hidden).toBe(false);
    expect(formulario().hidden).toBe(true);
    expect(campoT().value).toBe('');
    expect(anuncio().textContent).toBe('');
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    ['token de 63 hex', `#t=${'0123456789abcdef'.repeat(4).slice(1)}`],
    ['token de 65 hex', `#t=${TOKEN}0`],
    ['token em maiúsculas', `#t=${TOKEN.toUpperCase()}`],
    ['sufixo depois do token', `#t=${TOKEN}&x=1`],
    ['prefixo errado', `#u=${TOKEN}`],
    ['token na consulta, não no fragmento', `?t=${TOKEN}`]
  ])('%s: aviso de link incompleto, formulário escondido, campo vazio', (_nome, fim) => {
    abrirEm(`${CAMINHO}${fim}`);

    rodarScript();

    expect(aviso().textContent).toBe(AVISO_INCOMPLETO);
    expect(formulario().hidden).toBe(true);
    expect(campoT().value).toBe('');
    expect(anuncio().textContent).toBe('');
  });
});

describe('convite.js, link colado na mesma aba (hashchange, D13)', () => {
  function colarNaMesmaAba(fim: string): void {
    window.history.replaceState(null, '', `${CAMINHO}${fim}`);
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  }

  it('depois do aviso de link incompleto, o link colado libera o formulário e sai da barra', () => {
    rodarScript();
    expect(aviso().textContent).toBe(AVISO_INCOMPLETO);

    colarNaMesmaAba(`#t=${TOKEN}`);

    expect(campoT().value).toBe(TOKEN);
    expect(formulario().hidden).toBe(false);
    expect(aviso().hidden).toBe(true);
    expect(anuncio().textContent).toBe(ANUNCIO_LIDO);
    expect(window.location.hash).toBe('');
  });

  it('chama replaceState ANTES de gravar o token também no caminho do hashchange', () => {
    rodarScript();
    window.history.replaceState(null, '', `${CAMINHO}#t=${TOKEN}`);
    const original = window.history.replaceState.bind(window.history);
    const valorNoMomento: string[] = [];
    vi.spyOn(window.history, 'replaceState').mockImplementation((estado, titulo, url) => {
      valorNoMomento.push(campoT().value);
      original(estado, titulo, url);
    });

    window.dispatchEvent(new window.HashChangeEvent('hashchange'));

    expect(valorNoMomento).toEqual(['']);
    expect(campoT().value).toBe(TOKEN);
  });

  it('com um link já lido, o link colado depois vence e também sai da barra', () => {
    const OUTRO = 'fedcba9876543210'.repeat(4);
    abrirEm(`${CAMINHO}#t=${TOKEN}`);
    rodarScript();

    colarNaMesmaAba(`#t=${OUTRO}`);

    expect(campoT().value).toBe(OUTRO);
    expect(window.location.hash).toBe('');
    expect(formulario().hidden).toBe(false);
  });

  it('fragmento que não é token, com o formulário já aberto, não muda nada', () => {
    abrirEm(`${CAMINHO}#t=${TOKEN}`);
    rodarScript();

    colarNaMesmaAba('#t=curto');

    expect(campoT().value).toBe(TOKEN);
    expect(formulario().hidden).toBe(false);
    expect(aviso().hidden).toBe(true);
    expect(aviso().textContent).toBe(AVISO_SEM_JS);
  });
});
