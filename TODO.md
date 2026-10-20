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

- Vazia no momento da criação.

## TABELA UNIFICADA

| WSJF | ID | Onda | Grupo | Descrição Técnica | Prioridade | Pré-requisito | Dificuldade | Status | Estado Auditado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| - | PD-05 | W1 | Interface | Filosofia u1, mapa: a lista do mapa recolhe demais em larguras médias, e o texto de explicação do quiz encosta no contorno de foco. Regras de acessibilidade em `docs/arquitetura.md`, seção 11 (Acessibilidade). Referência de QA: `docs/qa-filosofia-u1.md`. | Média | - | Baixa | ⏳ Pendente | - |
| - | PD-04 | W1 | Interface | Slides da área restrita (cosmético): slides 6 e 10 com espaço vazio embaixo; cards do slide 9 apertados; slide 12 com uma palavra sozinha na segunda linha do subtítulo. Componente em `src/ui/area-restrita/`; regras em `docs/arquitetura.md`, seção "Área restrita", subseção "Identidade, slides e modo adaptado". | Baixa | - | Baixa | ⏳ Pendente | - |
| - | PD-01 | W2 | Conteúdo | Levar a estrutura de abas de Filosofia u1 (Resumo, Mapa mental com markmap e lista acessível, Fichamento, Mnemônicos e Quiz) para Introdução ao Direito u1, Português e Redação Jurídica 1 u1 (mantém a Petição comentada) e Sociologia Jurídica u1. Só executar quando o líder pedir. Modelo em `docs/arquitetura.md`, seção sobre a estrutura de abas de Filosofia u1. | Média | aguardando aulas ou material dos professores | Alta | ⛔ Bloqueado | - |
| - | PD-02 | W2 | Conteúdo | Filosofia Jurídica, 3a unidade, Bloco 3 (teorias contemporâneas da justiça): hoje é placeholder "Aguardando material do professor" em `src/conteudo/p1/filosofia-juridica/u3/resumo.ts`, com a fase correspondente em `mapaFichamento.ts`. Preencher quando o material chegar. | Média | aguardando aulas ou material dos professores | Média | ⛔ Bloqueado | - |
| - | PD-03 | W2 | Conteúdo | Quiz de Filosofia Jurídica, 3a unidade: 20 perguntas hoje, em `src/conteudo/p1/filosofia-juridica/u3/quiz/`. Ampliar só se o líder pedir mais perguntas. | Baixa | Pedido do líder (ainda não feito) | Média | ⏳ Pendente | - |
| - | PD-06 | W3 | Documentação | Criar a Wiki nativa do GitHub do repositório e uma documentação em `.md` para iniciante em computação, que explica o jargão sem assumir conhecimento prévio. Conteúdo derivado de `docs/`: linka, não duplica. Execução delegada aos agentes `technical-writer` e `ux-writer`, nunca inline. | Média | - | Média | ⏳ Pendente | - |
