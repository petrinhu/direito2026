import { config } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

/**
 * Stub de RouterLink para todo teste de componente: renderiza um <a href> com o
 * mesmo destino e os mesmos atributos, sem precisar de roteador instalado (o
 * vue-router não pode ser instalado duas vezes na mesma aplicação, e alguns specs
 * instalam o próprio). O teste de navegação real desliga o stub na montagem.
 */
const LinkDeTeste = defineComponent({
  name: 'RouterLink',
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        'a',
        { ...attrs, href: typeof props.to === 'string' ? props.to : (props.to.path ?? '') },
        slots.default?.()
      );
  }
});

config.global.stubs = { ...config.global.stubs, RouterLink: LinkDeTeste };
