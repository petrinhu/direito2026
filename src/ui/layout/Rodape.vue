<script setup lang="ts">
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import { apagarTudoComConfirmacao } from '@/app/persistencia/apagarTudoComConfirmacao';

/**
 * ANO_INICIAL é o ano do lançamento (2026), fixo por decisão do líder,
 * 22/09/2026. O segundo ano da linha de direitos vem de Date, nunca
 * escrito à mão (tests/componente/Rodape.spec.ts prova isso congelando o
 * relógio em anos diferentes): hoje os dois números empatam em 2026, e a
 * cada virada de ano o segundo avança sozinho.
 */
const ANO_INICIAL = 2026;
const anoAtual = new Date().getFullYear();

const props = defineProps<{ repositorio: RepositorioProgresso }>();

function apagar(): void {
  apagarTudoComConfirmacao(props.repositorio);
}
</script>

<template>
  <!--
    Três coisas decididas pelo líder em 21/09/2026 (seção 6 da
    arquitetura): aviso de material de estudo sem valor oficial, aviso de
    progresso salvo no navegador, e nome/ano (este último agora expresso
    na linha de direitos, ver comentário abaixo). Sem autoria, sem
    instituição, sem contato: ponto mais sensível de R3, coberto por
    scripts/verificar-proibicoes.sh.

    As duas linhas seguintes (oferecimento e direitos) são ordem do
    líder, 22/09/2026, verbatim: "ponha discretamente no rodapé que o
    caderno de direito é oferecimento de [logo]-[link drpetrus.top].
    Ponha ainda no rodapé copyright [símbolo copyright] [travessão]
    [2026 [travessão] ano_atual_dinamico]".

    Nome próprio na imagem: EXCEÇÃO declarada e única, autorizada pelo
    líder por pergunta direta, 22/09/2026 ("Nome do líder: liberado
    APENAS no rodapé, como marca"). Em qualquer outro lugar do produto a
    proibição de R3 continua valendo integralmente; esta exceção não
    altera scripts/verificar-proibicoes.sh, que nunca listou este nome
    como termo proibido (R3 proíbe só o nome do professor e o nome da
    instituição do piloto).
  -->
  <footer class="rodape">
    <p class="rodape__oferecimento">
      <a
        href="https://drpetrus.top"
        target="_blank"
        rel="noopener"
        class="rodape__link-oferecimento"
      >
        <img
          src="/assets/oferecimento-logo.png"
          width="95"
          height="53"
          alt="Dr. Petrus Silva Costa"
          class="rodape__logo"
        />
        <span>Caderno de Direito é um oferecimento de drpetrus.top</span>
      </a>
    </p>
    <!--
      Travessão longo AUTORIZADO nesta linha, e só nela, por ordem
      expressa do líder citada acima. Em qualquer outro texto renderizado
      do produto o travessão continua proibido: ver
      tests/unidade/design.semTravessao.spec.ts, que varre todo
      src/ui/**/*.vue e reprova qualquer ocorrência fora desta linha.
    -->
    <p class="rodape__direitos">Copyright © — {{ ANO_INICIAL }}—{{ anoAtual }}</p>
    <p>Material de estudo sem valor oficial.</p>
    <p>
      O progresso fica salvo neste navegador.
      <button type="button" class="rodape__apagar" @click="apagar">
        Apagar os dados guardados
      </button>
    </p>
  </footer>
</template>

<style scoped>
.rodape {
  padding: var(--esp-6, 2rem) var(--esp-5, 1.5rem);
  text-align: center;
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
  border-top: 1px solid var(--cor-borda, #dcd7c8);
}

.rodape p {
  margin: var(--esp-1, 0.25rem) 0;
}

.rodape__oferecimento {
  margin-bottom: var(--esp-3, 0.75rem);
}

/*
  O logo (baixado de drpetrus.top/assets/img/Logo.png, servido local em
  public/assets/) é branco/claro sobre fundo transparente, desenhado para
  ficar sobre superfície escura (medido por amostragem de pixel: cantos
  transparentes, miolo em branco/azul-acinzentado claro). Sobre
  --cor-fundo, que no tema claro é claro, o logo ficaria invisível. Em
  vez de inverter a arte (distorceria a marca) ou de um token que muda
  com o tema (proibido pela regra já reincidente 3x neste projeto: par
  dedicado para fundo sempre escuro), a linha inteira ganha o MESMO par
  fixo já usado na lateral (--cor-sidebar-fundo/--cor-sidebar-texto*),
  já aprovado no portão de contraste — o logo sempre repousa sobre esse
  fundo escuro, nos dois temas, sem exceção nova nele.
*/
.rodape__link-oferecimento {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  padding: var(--esp-1, 0.25rem) var(--esp-3, 0.75rem);
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
  text-decoration: none;
  font-size: var(--escala-xs, 0.8125rem);
}

.rodape__link-oferecimento:hover,
.rodape__link-oferecimento:focus-visible {
  color: var(--cor-sidebar-texto, #faf9f5);
}

.rodape__link-oferecimento:focus-visible {
  outline: 2px solid var(--cor-sidebar-texto, #faf9f5);
  outline-offset: 2px;
}

.rodape__logo {
  display: block;
  width: 47.5px;
  height: 26.5px;
}

.rodape__apagar {
  /* Herda a cor do <p> pai (--cor-texto-suave sobre --cor-fundo, já
     medido no portão de contraste), não introduz par novo. */
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  /* Achado 3 da revisão (docs/revisao-modo-adaptado.md): min-width nunca
     tinha sido conferido; o texto do rótulo já é largo o bastante, mas o
     piso agora é garantido por CSS, não por coincidência de conteúdo. */
  min-width: 44px;
  min-height: 44px;
}

.rodape__apagar:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}

@media print {
  .rodape {
    display: none;
  }
}
</style>
