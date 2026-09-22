# QA da versão construída (Vue, `dist/`), Caderno de Direito

Rodada 3. Primeira vez que o projeto é auditado como aplicação Vue construída, não mais mockup estático. Servido localmente pelo próprio servidor de pré-visualização do projeto (`vite preview`, porta 4173, `http://127.0.0.1:4173`), sem publicar nada. Capturado em dois motores: Chromium (headless, técnica das rodadas anteriores) e Firefox 156 (headless, protocolo WebDriver BiDi, primeira vez usado neste projeto — Firefox não tem CDP real, só um subconjunto BiDi no mesmo parâmetro `--remote-debugging-port`).

Nenhuma janela aberta na sessão gráfica do líder (L-50). Perfis descartáveis em diretório temporário da sessão, um por navegador, mais um terceiro por navegador só para a captura de primeira visita (para garantir `localStorage` genuinamente vazio nessa captura específica).

## Status

Concluído.

## Resumo

**Sem diferença visual grave entre Chromium e Firefox.** Telas comparadas lado a lado (início, resumo, petição, quiz, lateral com níveis abertos, cabeçalho rolado, aviso de primeira visita) renderizam iguais nos dois motores: mesma tipografia, cores, curva do cabeçalho e fio de progresso dourado. A única diferença encontrada entre as capturas dos dois navegadores foi um artefato do MEU método de captura (explicado abaixo), não do site.

Dois achados CRÍTICOS reais, presentes na aplicação (não são diferença entre navegadores, devem aparecer nos dois motores igualmente):
1. **Tabela do bloco 6 do resumo estoura a tela em 360px** (rolagem horizontal de 184px).
2. **Citação de artigo aparece como código HTML cru, não renderizado, na explicação de pelo menos uma pergunta do quiz.**

## Metodologia: coletor de erros provado por sabotagem antes de confiar (L-36)

Nas duas rodadas anteriores o coletor de erros de console/rede teve o mesmo defeito (lia só mensagens novas do soquete, perdendo as que already tinham sido guardadas em buffer por chamadas anteriores) e dava zero eventos por engano. Desta vez o coletor já nasceu com a correção aplicada nos dois motores, e mesmo assim sabotei de novo antes de confiar:

- **Chromium:** sabotagem já validada nas rodadas anteriores com o mesmo código-base.
- **Firefox/BiDi (protocolo novo neste projeto, teste obrigatório):** forcei um `console.error` e uma chamada de rede para domínio inexistente. Resultado: 8 eventos brutos recebidos, 2 identificados corretamente como erro (`log.entryAdded` nível `error`, tanto o `console.error` quanto o erro de JavaScript da falha de rede). Coletor provado antes da coleta real.

## Capturas

54 capturas em `mockups/capturas/v2/{chromium,firefox}/`: 24 telas base por navegador (início, resumo, petição, quiz respondido, 2 temas × 3 larguras 360/768/1280) + 3 específicas (lateral com níveis abertos, cabeçalho rolado, aviso de primeira visita). Console e rede: **encontrados=0, analisados=54, falharam=0** nos dois motores, coletor provado por sabotagem antes de confiar (seção acima).

O quiz não tem botão "Confirmar": clicar numa alternativa já responde na hora (o placar muda imediatamente). O script de captura tentou achar um botão de confirmação e não achou (aviso "sem-botao-confirmar" no log), mas isso é comportamento correto da aplicação, não falha da captura — o placar de todas as capturas de quiz já mostra 1 pergunta respondida, cumprindo o pedido.

## Achado CRÍTICO 1: rolagem horizontal em 360px, bloco 6 do resumo

Medido via `scrollWidth`/`clientWidth`: página inicial, petição e quiz não têm overflow em 360px (360/360 nos três). A aba **Resumo tem `scrollWidth=544`, `clientWidth=360`, overflow de 184px**, com ou sem os níveis da lateral abertos (mesmo valor nos dois casos, então não é a lateral). Causa raiz identificada por medição direta do elemento mais largo da página: a **tabela comparativa do bloco 6** ("Direito e Moral / Regras de Trato Social", 5 colunas: Critério, Direito, Moral, Regras de Trato Social, Preceitos Religiosos) renderiza na largura intrínseca do conteúdo (544px) sem quebrar nem ganhar rolagem própria, e empurra a página inteira para os lados. Precisa de um contêiner com `overflow-x: auto` ao redor da tabela (mesma classe de problema já visto e corrigido na linha do tempo, na rodada anterior).

## Achado CRÍTICO 2: citação de artigo aparece como código HTML cru no quiz

Na captura `unidade-quiz-claro-1280.png` (idêntico nos dois navegadores, mesma pergunta sorteada em ambos), a explicação da resposta certa mostra literalmente o texto `<button type="button" class="citacao" data-dispositivo="cpc-319-v" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, V, do CPC</button>` em vez de renderizar o botão de citação de verdade (o mesmo mecanismo do balão de artigo usado na aba Petição comentada). O HTML está sendo tratado como texto puro em vez de marcação, em pelo menos uma pergunta com citação de dispositivo na explicação. Como o quiz sorteia a pergunta a cada carregamento, não consegui reproduzir isso de novo numa pergunta nova na mesma sessão, mas a captura já feita é prova direta e reproduzível do defeito (a tela existe em disco). Precisa de correção onde o texto da explicação do quiz é montado: usar renderização de HTML de verdade (ou o mesmo componente de citação usado na petição) em vez de inserir a marcação como texto.

## Verificações re-confirmadas sem achado novo

- **Contraste:** título no modo escuro da versão publicada mede 11,69:1 (branco quase puro sobre azul-marinho), confirma que a correção da rodada anterior chegou à versão construída, sem regressão.
- **Curva do cabeçalho e fio de progresso:** aparecem corretos e idênticos nos dois navegadores, na captura do cabeçalho rolado (`especifica-header-rolado-claro-1280.png`), tanto a borda arredondada da base quanto o fio dourado de progresso.
- **Aviso de primeira visita:** confirmado com `localStorage` genuinamente vazio (perfil descartável dedicado), aparece igual nos dois motores, com os dois botões ("Apagar os dados guardados", "Entendi").
- **Foco de teclado:** os dois "não focou" que apareceram na primeira passada eram estado esperado, não bug — um item da lateral escondido porque o período pai ainda não tinha sido aberto (`display:none`, foco corretamente recusado), e alternativas de uma pergunta seguinte pré-carregada e ainda escondida no quiz. Refeito com elemento realmente visível: os botões de nível da lateral (11 de 11) e as alternativas da pergunta ativa (4 de 4) recebem foco normalmente.

## Nota de metodologia: artefato do meu próprio processo, corrigido no meio da rodada

A primeira leva de capturas de página inteira no Chromium escondia o rodapé atrás do aviso de armazenamento (que é `position: fixed`). Causa: minha técnica de foto de página inteira redimensionava a janela do navegador para a altura total DEPOIS de medir, e isso reposiciona elementos fixos para o novo tamanho — o aviso "descia" e cobria o rodapé por cima. Corrigido trocando para captura além do viewport sem redimensionar (`captureBeyondViewport` com recorte maior, sem mexer no tamanho da janela), e as 24 capturas base do Chromium foram refeitas com a correção antes de fechar este relatório. O Firefox nunca teve esse problema (a captura de página inteira dele já é nativa). Isso explica por que a comparação inicial entre os dois navegadores parecia mostrar uma diferença grande onde não havia nenhuma real.
