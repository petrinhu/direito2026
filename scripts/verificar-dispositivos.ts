/**
 * Portão de construção da seção 14 da arquitetura (subseção "Citação
 * legal"). Roda no pré-CI, no CI e antes do empacotamento:
 *
 * 1. Varre todo corpoHtml, exemploHtml, comentarioHtml e explicacao de
 *    TODAS as unidades e extrai cada data-dispositivo.
 * 2. Reprova (exit 1), nomeando unidade e id, se alguma citação apontar
 *    para um id que não existe no catálogo.
 * 3. Reprova se algum dispositivo do catálogo estiver sem um dos sete
 *    campos obrigatórios (seção 4.3).
 * 4. Avisa, sem reprovar, quando um dispositivo do catálogo não é citado
 *    por ninguém.
 * 5. Piso de varredura: imprime sempre "citações encontradas: N /
 *    resolvidas: M", e sai 1 se N for zero ou se N e M divergirem.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairCitacoes } from '../src/core/dispositivos/extrairCitacoes';
import { validarDispositivo } from '../src/core/dispositivos/validar';
import type { CatalogoDispositivos } from '../src/core/dispositivos/tipos';
import { curriculo } from '../src/conteudo/curriculo';
import { CARREGADORES } from '../src/app/carregamento/carregadores';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CATALOGO_PATH = process.env.VERIFICAR_DISPOSITIVOS_CATALOGO
  ? resolve(process.env.VERIFICAR_DISPOSITIVOS_CATALOGO)
  : resolve(AQUI, '../src/dados/dispositivos-legais.json');

async function principal(): Promise<void> {
  let falhou = false;

  const catalogo = JSON.parse(readFileSync(CATALOGO_PATH, 'utf-8')) as CatalogoDispositivos;
  const idsCatalogo = new Set(catalogo.map((d) => d.id));

  for (const dispositivo of catalogo) {
    const faltando = validarDispositivo(dispositivo);
    if (faltando.length > 0) {
      console.error(
        `dispositivo '${dispositivo.id}' sem campo(s) obrigatório(s): ${faltando.join(', ')}`
      );
      falhou = true;
    }
  }

  const idsCitados = new Set<string>();
  let citacoesEncontradas = 0;
  let citacoesResolvidas = 0;

  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        const caminho = `${periodo.id}/${cadeira.id}/${unidade.id}`;
        const carregar = CARREGADORES[caminho];
        if (!carregar) continue;

        const conteudo = await carregar();
        const pedacos: string[] = [];
        for (const bloco of conteudo.resumo) pedacos.push(bloco.corpoHtml, bloco.exemploHtml);
        if (conteudo.peticao) {
          for (const secao of conteudo.peticao.secoes)
            // Mesmo gêmeo de scripts/gerar-dispositivos-por-unidade.ts:
            // corpoHtml é opcional (seção-título "guarda-chuva").
            pedacos.push(secao.corpoHtml ?? '', secao.comentarioHtml);
        }
        if (conteudo.quiz) {
          // Mesmo gêmeo de scripts/gerar-dispositivos-por-unidade.ts: os
          // três campos carregam citação, não só explicacaoHtml.
          for (const pergunta of conteudo.quiz) {
            pedacos.push(
              pergunta.enunciadoHtml,
              pergunta.explicacaoHtml,
              ...pergunta.alternativasHtml
            );
          }
        }

        const ids = extrairCitacoes(pedacos.join(' '));
        citacoesEncontradas += ids.length;
        for (const id of ids) {
          idsCitados.add(id);
          if (idsCatalogo.has(id)) {
            citacoesResolvidas += 1;
          } else {
            console.error(`citação órfã: '${id}' em ${caminho} não existe no catálogo`);
            falhou = true;
          }
        }
      }
    }
  }

  for (const dispositivo of catalogo) {
    if (!idsCitados.has(dispositivo.id)) {
      console.warn(
        `aviso: dispositivo '${dispositivo.id}' do catálogo não é citado por nenhuma unidade`
      );
    }
  }

  console.log(`citações encontradas: ${citacoesEncontradas} / resolvidas: ${citacoesResolvidas}`);

  if (citacoesEncontradas === 0) {
    console.error('verificar-dispositivos: zero citação no site inteiro é varredura quebrada');
    falhou = true;
  }
  if (citacoesEncontradas !== citacoesResolvidas) {
    falhou = true;
  }

  if (falhou) process.exitCode = 1;
}

principal();
