/**
 * Regras RewriteRule do .htaccess do webroot, na ordem em que o Apache as
 * aplica: a primeira regra que casa com o caminho decide o que acontece com ele.
 *
 * A guarda de host (`RewriteCond %{HTTP_HOST}`) não entra: a regra que ela
 * protege só vale para o domínio errado, e o portão confere o domínio certo. Outra
 * RewriteCond (de arquivo ou de pasta) torna a regra seguinte "desconhecida",
 * porque a simulação não a conhece, e isso reprova em quem usa o resultado.
 */

export type Veredito = 'passa' | 'nega' | 'nao_encontrado' | 'portao' | 'desconhecido';

export interface RegraReescrita {
  /** Padrão PCRE, escrito de forma que `new RegExp(padrao)` o aceite. */
  readonly padrao: string;
  readonly veredito: Veredito;
}

const LINHA_REWRITE_RULE = /^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?\s*$/;

/** Traduz uma linha RewriteRule (já sem espaços nas pontas) no veredito dela. */
function vereditoDaRegra(substituicao: string, flags: readonly string[]): Veredito {
  if (substituicao === '-') {
    if (flags.includes('F')) return 'nega';
    if (flags.includes('R=404')) return 'nao_encontrado';
    if (flags.includes('L')) return 'passa';
    return 'desconhecido';
  }
  if (substituicao === 'api/portao.php' && flags.includes('L')) return 'portao';
  return 'desconhecido';
}

export function extrairRegras(htaccess: string): RegraReescrita[] {
  const regras: RegraReescrita[] = [];
  let guardaDeHost = false;
  let condicaoDesconhecida = false;

  for (const bruta of htaccess.split('\n')) {
    const linha = bruta.trim();
    if (linha === '' || linha.startsWith('#')) continue;

    if (linha.startsWith('RewriteCond')) {
      if (/^RewriteCond\s+%\{HTTP_HOST\}/.test(linha)) {
        guardaDeHost = true;
      } else {
        condicaoDesconhecida = true;
      }
      continue;
    }

    const casamento = linha.match(LINHA_REWRITE_RULE);
    if (!casamento) continue;

    const padrao = casamento[1] ?? '';
    const substituicao = casamento[2] ?? '';
    const flags = (casamento[3] ?? '').split(',').map((f) => f.trim());
    const guardada = guardaDeHost;
    guardaDeHost = false;
    const condicao = condicaoDesconhecida;
    condicaoDesconhecida = false;

    if (guardada) continue;
    regras.push({
      padrao,
      veredito: condicao ? 'desconhecido' : vereditoDaRegra(substituicao, flags)
    });
  }
  return regras;
}

/** Veredito da primeira regra que casa com o caminho relativo (sem barra inicial). */
export function veredito(
  caminho: string,
  regras: readonly RegraReescrita[]
): Veredito | 'sem_regra' {
  for (const regra of regras) {
    if (new RegExp(regra.padrao).test(caminho)) return regra.veredito;
  }
  return 'sem_regra';
}
