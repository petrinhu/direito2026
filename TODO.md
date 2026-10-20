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
- 2026-10-20: lacuna medida (F8): criar unidade ou cadeira nova reprova o preci em tests/unidade (carregamento.registrosCompletos.spec.ts; curriculo.atalhoInterdisciplinar.spec.ts, com a Unidade 1 escrita à mão) e em tests/caracterizacao (carregadores e curriculo; as *.esperado.json não têm comando de atualização). Decisão do líder: script de regeneração e testes que leem a estrutura, ou manter manual.
- 2026-10-20: lacuna medida (F8): a unidade em-breve entra no registro de carregadores, e o gerador manda rodar o preci logo depois, então o preci reprova na primeira execução.
- 2026-10-20: travessão em conteúdo público não tem trava: o spec de design cobre só .vue, o dos modelos cobre só o gerador, e a área restrita tem a sua. Decidir se entra regra em src/core/conteudo/regrasDeTexto.ts.
- 2026-10-20: placeholder "A escrever antes da publicação." em meta.ts (modelo do gerador) passa na validação; decidir se vira regra em validarMeta.
- 2026-10-20: aviso legal (src/conteudo/avisoLegal.ts) tem "o material", que as regras de texto proíbem nas unidades; o validador não lê esse arquivo. Pergunta ao líder: exceção aprovada ou nova redação (que exige aprovação e atualização de tests/unidade/conteudo.avisoLegal.spec.ts).
- 2026-10-20: validar-conteudo.ts com argumento de raiz só funciona para raiz vazia: importarDoDisco sempre lê o src/conteudo do repositório, então uma raiz com unidades reprova com "Cannot find module".
- 2026-10-20: docs/arquitetura.md, seção 4.2: o bloco de PerguntaQuiz segue defasado (campos enunciado e alternativas); só foi posta a nota de atualização. Atualizar o bloco é fatia própria.
- 2026-10-20: comentário da regra conteudo-so-tipos em .dependency-cruiser.cjs foi corrigido para dizer que src/conteudo pode importar a função pura de montagem. A regra em si só proíbe app e ui: decidir se a regra passa a impor "só tipos" (mudança de regra, não de comentário).

## TABELA UNIFICADA

| WSJF | ID | Onda | Grupo | Descrição Técnica | Prioridade | Pré-requisito | Dificuldade | Status | Estado Auditado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| - | PD-05 | W1 | Interface | Filosofia u1, mapa: a lista do mapa recolhe demais em larguras médias, e o texto de explicação do quiz encosta no contorno de foco. Regras de acessibilidade em `docs/arquitetura.md`, seção 11 (Acessibilidade). Referência de QA: `docs/qa-filosofia-u1.md`. | Média | - | Baixa | ⏳ Pendente | - |
| - | PD-04 | W1 | Interface | Slides da área restrita (cosmético): slides 6 e 10 com espaço vazio embaixo; cards do slide 9 apertados; slide 12 com uma palavra sozinha na segunda linha do subtítulo. Componente em `src/ui/area-restrita/`; regras em `docs/arquitetura.md`, seção "Área restrita", subseção "Identidade, slides e modo adaptado". | Baixa | - | Baixa | ⏳ Pendente | - |
| - | PD-01 | W2 | Conteúdo | Levar a estrutura de abas de Filosofia u1 (Resumo, Mapa mental com markmap e lista acessível, Fichamento, Mnemônicos e Quiz) para Introdução ao Direito u1, Português e Redação Jurídica 1 u1 (mantém a Petição comentada) e Sociologia Jurídica u1. Só executar quando o líder pedir. Modelo em `docs/arquitetura.md`, seção sobre a estrutura de abas de Filosofia u1. | Média | aguardando aulas ou material dos professores | Alta | ⛔ Bloqueado | - |
| - | PD-02 | W2 | Conteúdo | Filosofia Jurídica, 3a unidade, Bloco 3 (teorias contemporâneas da justiça): hoje é placeholder "Aguardando material do professor" em `src/conteudo/p1/filosofia-juridica/u3/resumo.ts`, com a fase correspondente em `mapaFichamento.ts`. Preencher quando o material chegar. | Média | aguardando aulas ou material dos professores | Média | ⛔ Bloqueado | - |
| - | PD-03 | W2 | Conteúdo | Quiz de Filosofia Jurídica, 3a unidade: 20 perguntas hoje, em `src/conteudo/p1/filosofia-juridica/u3/quiz/`. Ampliar só se o líder pedir mais perguntas. | Baixa | Pedido do líder (ainda não feito) | Média | ⏳ Pendente | - |
| - | PD-06 | W3 | Documentação | Criar a Wiki nativa do GitHub do repositório e uma documentação em `.md` para iniciante em computação, que explica o jargão sem assumir conhecimento prévio. Conteúdo derivado de `docs/`: linka, não duplica. Execução delegada aos agentes `technical-writer` e `ux-writer`, nunca inline. | Média | - | Média | ⏳ Pendente | - |
