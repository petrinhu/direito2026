<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ResumoNovidades } from '@/core/versaoNova/novidadesDesde';
import type { ResultadoConsulta } from '@/app/versaoNova/consultarVersaoPublicada';
import {
  aoClicarRecarregar,
  textoDoAviso,
  type DepsClique
} from '@/app/versaoNova/estadoAvisoVersao';

/**
 * Banner de versão nova (plano, seções 3.5 e 3.6, com a mudança do líder de 14/11). A região
 * role="status" existe sempre, vazia sem versão nova, e o texto entra nela (educado, sem
 * roubar o foco). O link "Recarregar a página" faz uma consulta antes de navegar; 401/403
 * troca para "Sua sessão terminou". "Fechar aviso" dispensa e leva o foco a #conteudo-principal.
 * O posicionamento (faixa fixa por cima do conteúdo) fica com quem monta o banner.
 */
const props = defineProps<{
  versaoPublicada: string | null;
  nome: string;
  resumo: ResumoNovidades;
  continuaConectado: boolean;
  avisoQuiz: string | null;
  consultar: () => Promise<ResultadoConsulta>;
  marcarRecarregouPara: DepsClique['marcarRecarregouPara'];
  navegarParaInicio: () => void;
  aoFechar: () => void;
}>();

const sessaoTerminou = ref(false);

// D-F12-2: a variante de sessão terminou fica na tela mesmo quando o controlador já esconde a versão
// (a consulta devolveu 401/403). Sem ela, o aviso sumiria no clique, sem a orientação de entrar de novo.
const texto = computed(() =>
  props.versaoPublicada === null && !sessaoTerminou.value
    ? null
    : textoDoAviso({
        nome: props.nome,
        resumo: props.resumo,
        sessaoTerminou: sessaoTerminou.value,
        continuaConectado: props.continuaConectado,
        avisoQuiz: props.avisoQuiz
      })
);

/** Clique com modificador (nova aba, janela) segue o comportamento normal do navegador. */
function clicoPrimario(evento: MouseEvent): boolean {
  return (
    evento.button === 0 && !evento.ctrlKey && !evento.metaKey && !evento.shiftKey && !evento.altKey
  );
}

async function aoClicarLink(evento: MouseEvent): Promise<void> {
  // Na variante de sessão terminada o link já vai para a Home sem consultar de novo.
  if (!clicoPrimario(evento) || props.versaoPublicada === null || sessaoTerminou.value) return;
  evento.preventDefault();
  const resultado = await aoClicarRecarregar({
    versaoPublicada: props.versaoPublicada,
    consultar: props.consultar,
    marcarRecarregouPara: props.marcarRecarregouPara,
    navegar: props.navegarParaInicio
  });
  if (resultado === 'sessao-terminada') sessaoTerminou.value = true;
}

function fechar(): void {
  props.aoFechar();
  document.getElementById('conteudo-principal')?.focus();
}
</script>

<template>
  <div class="aviso-versao" role="status">
    <div v-if="texto" class="aviso-versao__caixa">
      <p class="aviso-versao__texto">
        {{ texto.frase }}
        <a class="aviso-versao__acao" href="/" @click="aoClicarLink">{{ texto.acao }}</a>
        {{ texto.promessa }}
        <span v-if="texto.avisoQuiz" class="aviso-versao__quiz">{{ texto.avisoQuiz }}</span>
      </p>
      <button type="button" class="aviso-versao__fechar" @click="fechar">Fechar aviso</button>
    </div>
  </div>
</template>

<style scoped>
/* Cores dos tokens (AV-F8). Semitransparente: o alfa vem do token de opacidade. */
/* A região role="status" não tem altura: a caixa só existe com versão nova. */
.aviso-versao__caixa {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: color-mix(
    in srgb,
    var(--cor-aviso-versao-fundo) calc(var(--opacidade-aviso-versao) * 100%),
    transparent
  );
  color: var(--cor-aviso-versao-texto);
  animation: respiracao-aviso 4s ease-in-out infinite;
}

.aviso-versao__texto {
  margin: 0;
  flex: 1;
}

.aviso-versao__acao {
  color: var(--cor-aviso-versao-texto);
  font-weight: 700;
  text-decoration: underline;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.aviso-versao__acao:focus-visible,
.aviso-versao__fechar:focus-visible {
  outline: 3px solid var(--cor-aviso-versao-foco);
  outline-offset: 2px;
}

.aviso-versao__fechar {
  min-height: 44px;
  min-width: 44px;
  padding: 0 0.75rem;
  background: transparent;
  color: var(--cor-aviso-versao-texto);
  border: 2px solid var(--cor-aviso-versao-texto);
  font: inherit;
  cursor: pointer;
}

/* Luz de respiração: ligada sempre (pedido do líder, 14/11, inclusive com reduced motion);
   some só no modo de leitura adaptada, onde fica a cor. */
@keyframes respiracao-aviso {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--cor-aviso-versao-fundo) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 18px 6px color-mix(in srgb, var(--cor-aviso-versao-fundo) 45%, transparent);
  }
}

:root[data-modo-adaptado='on'] .aviso-versao__caixa {
  animation: none;
}
</style>
