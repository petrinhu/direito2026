<script setup lang="ts">
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { TITULAR } from '@/app/rodape/titular';
import { TEXTOS_SOBRE } from '@/conteudo/sobre/textos';
import { PAPEIS_DAS_DEPENDENCIAS } from '@/conteudo/sobre/papeis';
import AlvoQuadroProva from '../componentes/AlvoQuadroProva.vue';

/**
 * Página Sobre (SB-F8, esqueleto). Ordem da seção 4 do plano: O projeto, Autoria, Tecnologias e
 * Para nerds (h2 próprio, aberto). A lista do que o site oferece sai do mapa de rótulos de aba, para
 * não envelhecer. O nome do titular entra só por TITULAR; os textos vêm de conteudo/sobre/textos.ts.
 */
const rotulosDoSite = Object.values(ROTULOS_ABA);

/**
 * Pilha gerada no build (SB-F10): versões instaladas do lockfile, nunca da faixa do package.json.
 * Nenhum número de PHP nem de servidor entra aqui (decisão do CISO, n1-ciso.md, 3.1 e 3.3).
 */
const PILHA = __STACK_SITE__;
const TECNOLOGIAS_EM_DESTAQUE = ['vue', 'vue-router', 'typescript', 'vite'];
const tecnologiasDestacadas = TECNOLOGIAS_EM_DESTAQUE.flatMap((nome) => {
  const dep = PILHA.dependencias.find((d) => d.nome === nome);
  return dep ? [dep] : [];
});

function linhasDoGrupo(grupo: 'execucao' | 'construcao') {
  return PILHA.dependencias
    .filter((d) => d.grupo === grupo)
    .map((d) => ({ ...d, papel: PAPEIS_DAS_DEPENDENCIAS[d.nome] ?? '' }));
}
const dependenciasDeExecucao = linhasDoGrupo('execucao');
const dependenciasDeConstrucao = linhasDoGrupo('construcao');
</script>

<template>
  <article class="pagina-sobre">
    <h1 class="pagina-sobre__titulo">{{ TEXTOS_SOBRE.titulo }}</h1>
    <AlvoQuadroProva />

    <section class="pagina-sobre__secao" data-secao="projeto" aria-labelledby="sobre-projeto">
      <h2 id="sobre-projeto">{{ TEXTOS_SOBRE.projeto.titulo }}</h2>
      <p>{{ TEXTOS_SOBRE.projeto.texto }}</p>
      <p>{{ TEXTOS_SOBRE.projeto.introLista }}</p>
      <ul>
        <li v-for="rotulo in rotulosDoSite" :key="rotulo">{{ rotulo }}</li>
      </ul>
    </section>

    <section class="pagina-sobre__secao" data-secao="autoria" aria-labelledby="sobre-autoria">
      <h2 id="sobre-autoria">{{ TEXTOS_SOBRE.autoria.titulo }}</h2>
      <p>
        {{ TEXTOS_SOBRE.autoria.fraseAntes }}{{ TITULAR }}{{ TEXTOS_SOBRE.autoria.fraseDepois }}
      </p>
      <p>{{ TEXTOS_SOBRE.autoria.credito }}</p>
    </section>

    <section
      class="pagina-sobre__secao"
      data-secao="tecnologias"
      aria-labelledby="sobre-tecnologias"
    >
      <h2 id="sobre-tecnologias">{{ TEXTOS_SOBRE.tecnologias.titulo }}</h2>
      <p>{{ TEXTOS_SOBRE.tecnologias.texto }}</p>
      <ul class="pagina-sobre__lista">
        <li v-for="dep in tecnologiasDestacadas" :key="dep.nome">
          {{ dep.nome }} {{ dep.versao }}
        </li>
      </ul>
    </section>

    <section class="pagina-sobre__secao" data-secao="para-nerds" aria-labelledby="sobre-para-nerds">
      <h2 id="sobre-para-nerds">{{ TEXTOS_SOBRE.paraNerds.titulo }}</h2>
      <p>{{ TEXTOS_SOBRE.paraNerds.texto }}</p>
      <p>
        {{ TEXTOS_SOBRE.paraNerds.versaoSite }}: {{ PILHA.versaoSite }}.
        {{ TEXTOS_SOBRE.paraNerds.versaoNode }}: {{ PILHA.versaoNode }}.
      </p>

      <div
        class="pagina-sobre__tabela"
        tabindex="0"
        role="region"
        aria-labelledby="sobre-tabela-execucao"
      >
        <table>
          <caption id="sobre-tabela-execucao">
            {{
              TEXTOS_SOBRE.paraNerds.tabelaExecucao
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Versão</th>
              <th scope="col">Licença</th>
              <th scope="col">Papel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dep in dependenciasDeExecucao" :key="dep.nome">
              <td data-label="Nome">{{ dep.nome }}</td>
              <td data-label="Versão">{{ dep.versao }}</td>
              <td data-label="Licença">{{ dep.licenca }}</td>
              <td data-label="Papel">{{ dep.papel }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="pagina-sobre__tabela"
        tabindex="0"
        role="region"
        aria-labelledby="sobre-tabela-construcao"
      >
        <table>
          <caption id="sobre-tabela-construcao">
            {{
              TEXTOS_SOBRE.paraNerds.tabelaConstrucao
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Versão</th>
              <th scope="col">Licença</th>
              <th scope="col">Papel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dep in dependenciasDeConstrucao" :key="dep.nome">
              <td data-label="Nome">{{ dep.nome }}</td>
              <td data-label="Versão">{{ dep.versao }}</td>
              <td data-label="Licença">{{ dep.licenca }}</td>
              <td data-label="Papel">{{ dep.papel }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </article>
</template>

<style scoped>
.pagina-sobre {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem) var(--esp-4, 1rem);
}

.pagina-sobre__secao {
  margin-block: var(--esp-6, 2rem);
}

/*
 * Mobile-first: abaixo de 641px cada linha vira um bloco, e o rótulo da coluna
 * vem de data-label (::before). O cabeçalho some dessa tela, mas o par rótulo/valor
 * continua na árvore de acessibilidade. A partir de 641px volta a ser tabela.
 */
.pagina-sobre__tabela {
  margin-block: var(--esp-4, 1rem);
}

.pagina-sobre__tabela table,
.pagina-sobre__tabela tbody {
  display: block;
  width: 100%;
}

.pagina-sobre__tabela thead {
  display: none;
}

.pagina-sobre__tabela tr {
  display: block;
  border-bottom: 1px solid currentColor;
  padding-block: var(--esp-2, 0.5rem);
}

.pagina-sobre__tabela td {
  display: block;
  text-align: start;
  padding-block: var(--esp-1, 0.25rem);
  /* Nome longo de pacote (ex.: @fullcalendar/interaction) não tem espaço para quebrar a 360 px. */
  overflow-wrap: anywhere;
}

.pagina-sobre__tabela td::before {
  content: attr(data-label);
  display: block;
  font-weight: 700;
}

@media (min-width: 641px) {
  .pagina-sobre__tabela {
    overflow-x: auto;
  }

  .pagina-sobre__tabela table {
    display: table;
    border-collapse: collapse;
  }

  .pagina-sobre__tabela thead {
    display: table-header-group;
  }

  .pagina-sobre__tabela tbody {
    display: table-row-group;
  }

  .pagina-sobre__tabela tr {
    display: table-row;
    padding-block: 0;
  }

  .pagina-sobre__tabela th,
  .pagina-sobre__tabela td {
    display: table-cell;
    padding: var(--esp-2, 0.5rem);
    border-bottom: 1px solid currentColor;
    vertical-align: top;
  }

  .pagina-sobre__tabela td::before {
    content: none;
  }
}
</style>
