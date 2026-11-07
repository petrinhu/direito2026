import { describe, expect, it } from 'vitest';
import { extrairRegras, veredito } from '@/core/rotas/regrasHtaccess';

/** Regras do public/.htaccess do plano (1.2), sem os cabeçalhos. */
const HTACCESS_NOVO = [
  'RewriteEngine On',
  'RewriteBase /',
  'RewriteCond %{HTTP_HOST} !^direito2026\\.drpetrus\\.top$ [NC]',
  'RewriteRule ^ - [F,L]',
  'RewriteRule ^api/nucleo(/|$) - [F,L]',
  'RewriteRule ^api/[a-z0-9/-]+\\.php$ - [L]',
  'RewriteRule ^(sw\\.js|robots\\.txt|entrada\\.css|icones/favicon\\.svg)$ - [L]',
  'RewriteRule ^api(/|$) - [R=404,L]',
  'RewriteRule ^ api/portao.php [L]'
].join('\n');

describe('extrairRegras: regras de reescrita do .htaccess, em ordem', () => {
  it('a guarda de host não entra na simulação: o domínio certo não é negado', () => {
    const regras = extrairRegras(HTACCESS_NOVO);
    expect(regras.map((r) => r.veredito)).toEqual([
      'nega',
      'passa',
      'passa',
      'nao_encontrado',
      'portao'
    ]);
  });

  it('a primeira regra que casa decide: api/nucleo é negada antes da passagem de api/*.php', () => {
    const regras = extrairRegras(HTACCESS_NOVO);
    expect(veredito('api/nucleo/portao.php', regras)).toBe('nega');
  });

  it('endpoint de api passa direto, inclusive em subpasta (api/juri)', () => {
    const regras = extrairRegras(HTACCESS_NOVO);
    expect(veredito('api/saude.php', regras)).toBe('passa');
    expect(veredito('api/juri/imagem.php', regras)).toBe('passa');
  });

  it('sw.js, robots.txt, entrada.css e icones/favicon.svg passam; o ponto é literal', () => {
    const regras = extrairRegras(HTACCESS_NOVO);
    expect(veredito('sw.js', regras)).toBe('passa');
    expect(veredito('robots.txt', regras)).toBe('passa');
    expect(veredito('entrada.css', regras)).toBe('passa');
    expect(veredito('icones/favicon.svg', regras)).toBe('passa');
    expect(veredito('icones/faviconXsvg', regras)).toBe('portao');
  });

  it('assets e o resto vão ao portão, nunca direto', () => {
    const regras = extrairRegras(HTACCESS_NOVO);
    expect(veredito('assets/app.js', regras)).toBe('portao');
    expect(veredito('index.html', regras)).toBe('portao');
  });

  it('api que não é .php cai no 404, não no portão', () => {
    const regras = extrairRegras(HTACCESS_NOVO);
    expect(veredito('api/saude.txt', regras)).toBe('nao_encontrado');
  });

  it('substituição desconhecida vira desconhecido (falha fechada)', () => {
    const regras = extrairRegras('RewriteRule ^x$ /outro [L]');
    expect(veredito('x', regras)).toBe('desconhecido');
  });

  it('RewriteCond que não é de host torna a regra seguinte desconhecida', () => {
    const regras = extrairRegras('RewriteCond %{REQUEST_FILENAME} -f\nRewriteRule ^a$ - [L]');
    expect(veredito('a', regras)).toBe('desconhecido');
  });

  it('lista vazia não casa nada', () => {
    expect(veredito('qualquer/coisa', extrairRegras('RewriteEngine On'))).toBe('sem_regra');
  });
});
