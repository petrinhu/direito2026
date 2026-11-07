# Caderno de Direito

Site de estudo: resumo teórico, petição comentada e quiz, organizado por período e cadeira. Stack: Vite + Vue 3 + TypeScript. Publicado numa hospedagem compartilhada, com um portão em PHP: o site inteiro exige login.

Este README é o hub: aponta para a documentação, não a repete.

## Documentação

- [`docs/arquitetura.md`](docs/arquitetura.md): a especificação. Estrutura de pastas, modelo de dados, roteamento, componentes, busca, progresso, impressão, acesso com login, acessibilidade, citação legal, testes, publicação e o fatiamento em ondas.
- [`docs/como-adicionar-conteudo.md`](docs/como-adicionar-conteudo.md): roteiro para acrescentar unidade, cadeira, período, pergunta de quiz, calendário e aviso legal, caso por caso.
- [`docs/compatibilidade-navegadores.md`](docs/compatibilidade-navegadores.md): fonte única das regras de navegador (Chrome, Firefox, Safari, Edge).
- [`docs/design-visual.md`](docs/design-visual.md): paleta, tipografia, componentes visuais.
- [`docs/modo-adaptado.md`](docs/modo-adaptado.md): especificação do modo de leitura adaptada para baixa visão (texto maior, contraste máximo).
- [`docs/dispositivos-legais.md`](docs/dispositivos-legais.md): procedência do catálogo de dispositivos legais.
- [`docs/publicacao.md`](docs/publicacao.md): runbook de deploy.

## Como destravar o conteúdo cifrado

Parte do conteúdo de estudo e da documentação (os caminhos listados em `.gitattributes`, como `src/conteudo/`, `src/dados/`, `docs/`, `site/` e `TODO.md`) é guardada cifrada com git-crypt. Sem a chave, esses arquivos aparecem como dado binário ilegível. Os nomes dos arquivos continuam visíveis.

Para destravar uma cópia do repositório, com a chave em mãos, rode dentro da pasta do projeto:

```bash
git-crypt unlock <caminho-da-chave>
```

Substitua `<caminho-da-chave>` pelo caminho do arquivo de chave, guardado fora do repositório. O arquivo de chave nunca entra no repositório.

A cifra vale só para os commits feitos a partir do commit que cifrou o conteúdo. Os commits anteriores continuam legíveis no histórico público do GitHub, com o texto em claro. Ver `docs/arquitetura.md`, seção 15.

## Comandos

```bash
npm install
npm run dev          # servidor de desenvolvimento
npm run build         # gera dist/ (gera indice de busca e subconjunto de dispositivos antes)
npm run preview       # serve dist/ localmente
npm run preci         # roda a mesma sequencia do CI, antes do push
npm run test:unit     # testes unitarios e de componente (Vitest)
npm run test:e2e      # testes ponta a ponta (Playwright, Blink apontado para o Chromium instalado)
```

## Estrutura

Quatro camadas com dependência num sentido só (`docs/arquitetura.md`, seção 2):

- `src/core/`: domínio puro em TypeScript, sem Vue e sem DOM.
- `src/app/`: router, stores, persistência, carregamento sob demanda.
- `src/ui/`: componentes Vue, páginas, estilos.
- `src/conteudo/` e `src/dados/`: dado tipado por `src/core/`, não código.
- `scripts/`, `public/`: fundação, geração de índice e subconjunto, portões de verificação, arquivos servidos crus.

O portão `npm run camadas` (dependency-cruiser) prova essa direção mecanicamente.

## Estado desta onda (onda 1: home e unidade piloto)

Fechado: as quatro camadas com o portão de dependência provado vermelho e depois verde; roteamento com as sete rotas e `.htaccess` para hospedagem compartilhada; componentes da home e da unidade (menu de três níveis, abas, resumo, petição comentada, quiz, balão de citação legal, indicador de progresso, fundo animado); persistência de progresso e tema com fallback em memória quando o `localStorage` falha; busca com índice gerado no build; portões de conteúdo (citação órfã, termos proibidos); build real gerando `dist/` funcional; 75 testes unitários e de componente, mais 5 testes e2e, todos verdes.

Não fechado nesta onda: fontes próprias recortadas (seção 10, o site ainda não serve `.woff2`; `scripts/verificar-fontes.sh` reprova corretamente por isso); publicação real no servidor (`scripts/publicar.sh` e a verificação V1 a V10 da seção 15); conferência manual em Firefox, Safari, iPhone/iPad e na VM do Windows (seção 14); a11y automatizada com `@axe-core/playwright`; foco preso (`inert`) na gaveta de navegação em tela estreita.
