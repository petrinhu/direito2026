> **ESTRUTURA CANÔNICA DO ARQUIVO: NÃO QUEBRAR A TABELA:** (1) Comentários e instruções só no cabeçalho, acima da tabela. (2) TABELA UNIFICADA: exatamente uma tabela de trabalho, `| WSJF | ID | Onda | ... | Status | Estado Auditado |`. **EOF** logo após a última linha da tabela. **Proibido:** segunda tabela; linha em branco dentro da tabela; seção de checklist, INBOX ou WSJF depois da tabela.

# TODO: Caderno de Direito

Atualizado em 2026-10-20. Repositório público: nenhum nome de pessoa, de instituição de ensino ou de caminho pessoal entra neste arquivo (portão `scripts/verificar-proibicoes.sh`).

- Escopo: pendências de conteúdo e de acabamento do site depois da entrega da onda atual. Arquitetura e regras de cada item: `docs/arquitetura.md`.
- Status usados nesta tabela: ⏳ Pendente e ⛔ Bloqueado. Vocabulário completo: skill `tab_pendencias`.
- Célula vazia: `-`.
- Onda: W1 pode começar já; W2 depende de decisão do líder ou de material; W3 é o fechamento.
- WSJF não calculado: projeto pequeno, ordem por dependência, prioridade e onda (qualitativo, permitido pela skill).
- Testes e auditorias (TST-* e AUD-*) não foram injetados: execução não interativa. Recomendado: `/tab_pendencias --add_tests_audit`.

### Scoring WSJF (referência, não é tabela de trabalho)

Escala 1-10 · CoD = Valor + Criticidade + Redução de Risco/OE · WSJF = CoD ÷ Esforço.
Sem valor calculado nesta versão. O status de trabalho vive só na tabela única.

## INBOX (descobertas não priorizadas)

- 2026-10-20: aviso de armazenamento cobre o botão Anterior do quiz em 1280px até clicar em Entendi (QA em produção).
- 2026-10-20: no menu a 1280px, o nome de Português e Redação Jurídica 1 quebra e deixa o 1 sozinho na linha de baixo (QA em produção).
- 2026-10-20: calendário (rota /calendario): conferir em fonte oficial as datas nacionais (Planalto estava inacessível na sessão) e os feriados municipais do Recife de 16/07 e 08/12 (lei e decreto não localizados; fonte atual é o TRT6 e a imprensa).
- 2026-10-20: calendário: QA visual pendente (screenshot headless da grade, do quadro nas quatro faixas, do modo adaptado e do tema escuro), a cargo do qa-engineer.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F0 caracterização: testes congelados em tests/caracterizacao/ (currículo montado, rotas do e2e, carregadores, índice de busca); a referência de cada um é dado versionado; especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F1 descoberta automática: unidades e abas lidas das pastas de src/conteudo/ (glob e fs, função pura em core); especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F2 currículo montado a partir de uma descrição por cadeira (cadeira.ts) e por unidade (meta.ts), mesmo tipo Curriculo; especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F3 categorias de quiz como dado em src/conteudo/quiz/categorias.ts, sem união fechada no core; especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F4 validação genérica de todas as unidades (spec e scripts/validar-conteudo.ts antes do vite build, saindo 1 se zero varridas); especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F5 calendário com nomes estáveis (PROVAS, PERIODOS_ONLINE, PRAZOS em provas.ts; FERIADOS; EVENTOS_ACADEMICOS e OBSERVACOES_ACADEMICAS) e campo semestre, nome da cadeira vindo do currículo; especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F6 gerador npm run nova-unidade (cria a pasta com arquivos-modelo comentados e descrição em-breve, recusa sobrescrever); especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F7 service worker: regra de cache dos pedaços de conteúdo (conteudo-*.js) volta a valer com chunkFileNames e portão no build; especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, estrutura pronta para só acrescentar texto, F8 documentação: docs/como-adicionar-conteudo.md (roteiro por caso), ligado no README e na seção 4.1.1 de docs/arquitetura.md; especificação em docs/como-adicionar-conteudo.md (este próprio arquivo).
- 2026-10-20: 🔍 Pendente verificação, F9.1 e F9.2 (resolve a lacuna medida na F8): os testes do currículo real leem as cadeiras e as unidades do currículo, sem lista à mão, e `npm run atualizar-referencias` regrava a caracterização mostrando o que entrou, saiu ou mudou. Medido numa cópia do HEAD adc1c7c: unidade, cadeira e período novos passam com o comando. Especificação em docs/como-adicionar-conteudo.md.
- 2026-10-20: 🔍 Pendente verificação, F9.2: o passo 4 do `nova-unidade` manda rodar `npm run atualizar-referencias` antes do `npm run preci`, e o passo 5 lembra o atalho Interdisciplinar ao publicar uma cadeira. A unidade em-breve no registro de carregadores fica coberta pelo regen.
- 2026-10-20: 🔍 Pendente verificação, F9.4a: regra `travessao` em validarUnidade (U+2014 e U+2013, em todo campo da unidade, sem isenção, inclusive pergunta do professor). Vermelho antes; sabotagem de título com travessão reprovou o validador na cópia.
- 2026-10-20: 🔍 Pendente verificação, F9.4b: regra `placeholder` reprova o texto de espera ("A escrever antes da publicação." e "A escrever.") só em unidade publicada; em em-breve passa. Os dois textos moram em src/core/conteudo/regrasDeTexto.ts e o gerador os importa dali.
- 2026-10-20: 🔍 Pendente verificação, F9.5: a exceção do aviso legal ("o material") está registrada no guia, seção 6, conforme a ordem de fechamento da F9. Confirmação formal do líder pendente. Nova redação continua exigindo aprovação do líder e atualização de tests/unidade/conteudo.avisoLegal.spec.ts.
- 2026-10-20: 🔍 Pendente verificação, F9.4c: `importarDoDisco` recebe a raiz; `validar-conteudo <raiz>` com unidade sai 0 (fixture tests/unidade/apoio/raizMinima, prova na cópia). Raiz vazia continua saindo 1.
- 2026-10-20: docs/arquitetura.md, seção 4.2: o bloco de PerguntaQuiz segue defasado (campos enunciado e alternativas); só foi posta a nota de atualização. Atualizar o bloco é fatia própria.
- 2026-10-20: comentário da regra conteudo-so-tipos em .dependency-cruiser.cjs foi corrigido para dizer que src/conteudo pode importar a função pura de montagem. A regra em si só proíbe app e ui: decidir se a regra passa a impor "só tipos" (mudança de regra, não de comentário).
- 2026-10-20: 🔍 Pendente verificação, F10.1 (fecha a lacuna de perguntas da F9): os testes de quiz deixaram de contar perguntas. Tipos, perguntas do professor, ids com marca do caderno e faixas por categoria estão congelados em tests/caracterizacao/ (projecoes.ts; regravados com `npm run atualizar-referencias`). A varredura de marcação da Introdução ao Direito u1 não tem mais contagem fixa. Garantia "unidade só de múltipla escolha" continua valendo: pergunta de verdadeiro ou falso em Introdução ao Direito u1 reprova, de propósito.
- 2026-10-20: 🔍 Pendente verificação, F10.2 (fecha a lacuna de calendário da F9): feriados, prazos e períodos online do semestre 2026.2 são conferidos por presença (os conhecidos continuam obrigatórios; item novo não quebra), e feriado municipal novo precisa da fonte oficial logo acima dele (tests/unidade/calendario.feriadosRecifeFonte.spec.ts). Nenhum item do calendário pode aparecer duplicado. Provas por cadeira continuam conferidas como estavam.
- 2026-10-20: lacuna residual (F9): o atalho Interdisciplinar só é conferido no 1º período (tests/unidade/curriculo.atalhoInterdisciplinar.spec.ts). Cadeira publicada em outro período não é conferida. Decisão do líder: o atalho vale para outros períodos?
- 2026-10-20: 🔍 Pendente verificação, F10.3: docs/como-adicionar-conteudo.md sem lacuna de pergunta nem de calendário (estado atual, seções 4, 5, 8 e 9). Medido numa cópia do HEAD ea37a6f: pergunta nova de múltipla escolha e de verdadeiro ou falso, feriado e prazo, `atualizar-referencias`, vitest 1674 verdes, vue-tsc 0, validar-conteudo 0. Oito sabotagens e um controle provaram os invariantes novos.
- 2026-10-20: decisão pendente do líder (F10): cadeira com prova no semestre precisa das cinco (AV1, AV2, AV3, chamada, final). Manter, ou aceitar prova parcial?
- 2026-10-20: decisão pendente do líder (F10): pergunta de verdadeiro ou falso numa unidade só de múltipla escolha reprova (Introdução ao Direito u1, Redação Jurídica 1, Sociologia Jurídica, Filosofia Jurídica u3). Manter o formato da unidade, ou liberar verdadeiro ou falso em todas?

## TABELA UNIFICADA

| WSJF | ID | Onda | Grupo | Descrição Técnica | Prioridade | Pré-requisito | Dificuldade | Status | Estado Auditado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| - | PD-05 | W1 | Interface | Filosofia u1, mapa: a lista do mapa recolhe demais em larguras médias, e o texto de explicação do quiz encosta no contorno de foco. Regras de acessibilidade em `docs/arquitetura.md`, seção 11 (Acessibilidade). Referência de QA: `docs/qa-filosofia-u1.md`. | Média | - | Baixa | ⏳ Pendente | - |
| - | PD-04 | W1 | Interface | Slides da área restrita (cosmético): slides 6 e 10 com espaço vazio embaixo; cards do slide 9 apertados; slide 12 com uma palavra sozinha na segunda linha do subtítulo. Componente em `src/ui/area-restrita/`; regras em `docs/arquitetura.md`, seção "Área restrita", subseção "Identidade, slides e modo adaptado". | Baixa | - | Baixa | ⏳ Pendente | - |
| - | PD-01 | W2 | Conteúdo | Levar a estrutura de abas de Filosofia u1 (Resumo, Mapa mental com markmap e lista acessível, Fichamento, Mnemônicos e Quiz) para Introdução ao Direito u1, Português e Redação Jurídica 1 u1 (mantém a Petição comentada) e Sociologia Jurídica u1. Só executar quando o líder pedir. Modelo em `docs/arquitetura.md`, seção sobre a estrutura de abas de Filosofia u1. | Média | aguardando aulas ou material dos professores | Alta | ⛔ Bloqueado | - |
| - | PD-02 | W2 | Conteúdo | Filosofia Jurídica, 3a unidade, Bloco 3 (teorias contemporâneas da justiça): hoje é placeholder "Aguardando material do professor" em `src/conteudo/p1/filosofia-juridica/u3/resumo.ts`, com a fase correspondente em `mapaFichamento.ts`. Preencher quando o material chegar. | Média | aguardando aulas ou material dos professores | Média | ⛔ Bloqueado | - |
| - | PD-03 | W2 | Conteúdo | Quiz de Filosofia Jurídica, 3a unidade: 20 perguntas hoje, em `src/conteudo/p1/filosofia-juridica/u3/quiz/`. Ampliar só se o líder pedir mais perguntas. | Baixa | Pedido do líder (ainda não feito) | Média | ⏳ Pendente | - |
| - | PD-06 | W3 | Documentação | Criar a Wiki nativa do GitHub do repositório e uma documentação em `.md` para iniciante em computação, que explica o jargão sem assumir conhecimento prévio. Conteúdo derivado de `docs/`: linka, não duplica. Execução delegada aos agentes `technical-writer` e `ux-writer`, nunca inline. | Média | - | Média | ⏳ Pendente | - |
