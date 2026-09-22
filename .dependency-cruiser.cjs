/**
 * Portão das quatro camadas (L-33, seção 2 da arquitetura).
 * Sentido permitido: ui -> app -> core. conteudo -> core. Nada mais.
 *
 * Este arquivo nasceu provado vermelho: o commit de estreia trouxe um
 * import proibido em src/core apontando para 'vue', rodou
 * `npm run camadas` mostrando a regra core-sem-vue reprovando, e removeu o
 * import no mesmo commit. Ver mensagem do commit de estreia.
 */
module.exports = {
  forbidden: [
    {
      name: 'core-sem-vue',
      comment:
        'src/core é domínio puro em TypeScript. Não pode importar vue nem vue-router (L-33, camada Back).',
      severity: 'error',
      from: { path: '^src/core' },
      to: { path: '(^|/)node_modules/(vue|vue-router)(/|$)' }
    },
    {
      name: 'core-sem-dom',
      comment:
        'src/core roda em Node sem DOM. Não pode importar de src/app nem de src/ui, que são as camadas que tocam window/document/localStorage.',
      severity: 'error',
      from: { path: '^src/core' },
      to: { path: '^src/(app|ui)' }
    },
    {
      name: 'ui-nao-pula-app',
      comment:
        'src/ui apresenta; quem orquestra é src/app. Um componente de ui não importa src/core diretamente, sempre por trás de src/app (store, composable, adaptador).',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/core' }
    },
    {
      name: 'conteudo-so-tipos',
      comment:
        'src/conteudo é dado, não camada. Só pode importar tipos de src/core; nunca de src/app nem de src/ui.',
      severity: 'error',
      from: { path: '^src/conteudo' },
      to: { path: '^src/(app|ui)' }
    },
    {
      name: 'dados-so-tipos',
      comment: 'src/dados é dado compartilhado entre cadeiras; mesma regra de conteudo-so-tipos.',
      severity: 'error',
      from: { path: '^src/dados' },
      to: { path: '^src/(app|ui)' }
    }
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^dist' }
  }
};
