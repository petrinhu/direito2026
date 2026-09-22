/**
 * Portão de construção novo (prioridade zero, achado do líder, medido em
 * produção): o balão de citação legal e o apêndice de impressão dependiam
 * de um import() dinâmico com caminho montado em tempo de execução, que o
 * empacotador nunca conseguia enxergar - "dist/assets" nunca tinha os
 * dados de dispositivos de unidade nenhuma, e nada acusava isso, porque
 * scripts/verificar-dispositivos.ts só confere o CONTEÚDO-FONTE (que
 * citação existe no catálogo), nunca o PACOTE CONSTRUÍDO de verdade.
 *
 * Este script roda DEPOIS de `vite build` e prova, lendo o JavaScript
 * real que vai para o servidor (não o código-fonte, não o import() em
 * Node via tsx), que os dados de dispositivos de CADA unidade publicada
 * de fato chegaram a algum arquivo de dist/assets: para cada unidade,
 * carrega o índice de dispositivos pelo mesmo registro estático que a
 * aplicação usa (CARREGADORES_DISPOSITIVOS) e confere que o id de cada
 * dispositivo aparece em pelo menos um arquivo .js do pacote.
 *
 * Piso de varredura (L-36): imprime sempre "unidades varridas: N /
 * dispositivos conferidos: M", e sai 1 se N ou M forem zero, ou se
 * qualquer dispositivo esperado não for encontrado em dist/assets.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { curriculo } from '../src/conteudo/curriculo';
import { CARREGADORES_DISPOSITIVOS } from '../src/app/carregamento/carregadoresDispositivos';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST_ASSETS = process.env.VERIFICAR_DISPOSITIVOS_PACOTE_DIST
  ? resolve(process.env.VERIFICAR_DISPOSITIVOS_PACOTE_DIST)
  : resolve(AQUI, '../dist/assets');

function carregarTextoDeTodosOsArquivosJs(diretorio: string): string {
  const arquivos = readdirSync(diretorio).filter((nome) => nome.endsWith('.js'));
  return arquivos.map((nome) => readFileSync(resolve(diretorio, nome), 'utf-8')).join('\n');
}

async function principal(): Promise<void> {
  let falhou = false;
  let unidadesVarridas = 0;
  let dispositivosConferidos = 0;

  const textoDoPacote = carregarTextoDeTodosOsArquivosJs(DIST_ASSETS);

  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        const caminho = `${periodo.id}/${cadeira.id}/${unidade.id}`;
        const carregar = CARREGADORES_DISPOSITIVOS[caminho];
        if (!carregar) {
          // Unidade publicada sem carregador de dispositivos nenhum: só é
          // aceitável se ela genuinamente não cita nenhum dispositivo, o
          // que scripts/verificar-dispositivos.ts já teria acusado (zero
          // citação é falha lá). Aqui, sem carregador, não há o que
          // conferir no pacote - conta como unidade varrida, zero
          // dispositivo, sem reprovar por si só.
          unidadesVarridas += 1;
          continue;
        }
        unidadesVarridas += 1;
        const indice = await carregar();
        for (const dispositivo of Object.values(indice)) {
          dispositivosConferidos += 1;
          // Achado ao escrever este portão (prova vermelha genuína, não
          // suposição): checar só o ID ('cpc-319') é falso-positivo, porque
          // o próprio HTML de conteúdo (resumo/petição/quiz) já embute o ID
          // em `data-dispositivo="cpc-319"` no botão de citação - isso está
          // no pacote de qualquer jeito, com ou sem o carregamento dos
          // DADOS funcionando. A prova real é o TEXTO DA REDAÇÃO do
          // dispositivo (dispositivo.texto), que só existe no pacote se o
          // módulo de dados de verdade foi bundlado.
          const trechoDistintivo = dispositivo.texto.slice(0, 40);
          if (!textoDoPacote.includes(trechoDistintivo)) {
            console.error(
              `verificar-dispositivos-no-pacote: texto do dispositivo '${dispositivo.id}' (unidade ${caminho}) não aparece em nenhum arquivo de ${DIST_ASSETS} (procurado: "${trechoDistintivo}")`
            );
            falhou = true;
          }
        }
      }
    }
  }

  console.log(
    `unidades varridas: ${unidadesVarridas} / dispositivos conferidos: ${dispositivosConferidos}`
  );

  if (unidadesVarridas === 0) {
    console.error('verificar-dispositivos-no-pacote: zero unidade varrida é varredura quebrada');
    falhou = true;
  }
  if (dispositivosConferidos === 0) {
    console.error(
      'verificar-dispositivos-no-pacote: zero dispositivo conferido é varredura quebrada'
    );
    falhou = true;
  }

  if (falhou) process.exitCode = 1;
}

principal();
