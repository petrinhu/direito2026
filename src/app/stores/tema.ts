import { ref, watch, type Ref } from 'vue';
import { proximoTema } from '@/core/progresso/proximoTema';
import type { RepositorioProgresso, TemaEscolhido } from '@/core/progresso/tipos';

export interface StoreTema {
  readonly tema: Ref<TemaEscolhido>;
  alternar(): void;
}

/**
 * Reflete a escolha no atributo `data-theme` que docs/design-visual.md e
 * mockups/tokens.css já definem: "sistema" não escreve o atributo (deixa a
 * media query prefers-color-scheme decidir), "claro" e "escuro" escrevem
 * "light" e "dark" e valem mesmo contra a preferência do sistema.
 */
function aplicarAtributoTema(valor: TemaEscolhido): void {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  if (valor === 'sistema') {
    raiz.removeAttribute('data-theme');
  } else {
    raiz.setAttribute('data-theme', valor === 'escuro' ? 'dark' : 'light');
  }
}

/**
 * Composable de tema (seção 6 da arquitetura). Não é Pinia: o projeto não
 * lista biblioteca de estado global (seção 16), e um `ref` reativo mais
 * `provide/inject` já resolve o que é pedido aqui.
 */
export function criarStoreTema(repositorio: RepositorioProgresso): StoreTema {
  const tema = ref<TemaEscolhido>(repositorio.lerTema() ?? 'sistema');

  watch(
    tema,
    (valor) => {
      repositorio.salvarTema(valor);
      aplicarAtributoTema(valor);
    },
    // síncrono de propósito: a troca de tema é uma ação direta do leitor
    // (clique no AlternadorTema) e o atributo no <html> tem de refletir na
    // hora, sem esperar o próximo tick do agendador do Vue.
    { immediate: true, flush: 'sync' }
  );

  function alternar(): void {
    tema.value = proximoTema(tema.value);
  }

  return { tema, alternar };
}
