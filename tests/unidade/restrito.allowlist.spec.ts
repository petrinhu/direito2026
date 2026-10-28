import { describe, expect, it } from 'vitest';
import { htmlRejeitado } from '@/core/restrito/allowlist';

const TAGS_PERMITIDAS = [
  'p',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'h3',
  'h4'
];

const ENTIDADES_PERMITIDAS = ['&amp;', '&lt;', '&gt;', '&quot;', '&#39;', '&nbsp;'];

describe('allowlist de HTML: cada item permitido passa sozinho', () => {
  for (const tag of TAGS_PERMITIDAS) {
    it(`aceita <${tag}>`, () => {
      expect(htmlRejeitado(`<${tag}>x</${tag}>`)).toBeUndefined();
    });
  }

  it('aceita <br> e <br/>', () => {
    expect(htmlRejeitado('a<br>b<br/>c')).toBeUndefined();
  });

  for (const entidade of ENTIDADES_PERMITIDAS) {
    it(`aceita a entidade ${entidade}`, () => {
      expect(htmlRejeitado(`a ${entidade} b`)).toBeUndefined();
    });
  }

  it('texto sem marcação passa', () => {
    expect(htmlRejeitado('Texto puro, com acento e pontuação.')).toBeUndefined();
  });
});

describe('allowlist de HTML: o que fica de fora reprova com o código certo', () => {
  it('tag fora da lista vira html-proibido', () => {
    expect(htmlRejeitado('<b>x</b>')).toBe('html-proibido');
  });

  it('entidade fora da lista vira entidade-proibida', () => {
    expect(htmlRejeitado('&copy;')).toBe('entidade-proibida');
  });

  it('menor solto vira html-proibido', () => {
    expect(htmlRejeitado('a < b')).toBe('html-proibido');
  });
});
