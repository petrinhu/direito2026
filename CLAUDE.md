# CLAUDE.md

Regras deste projeto para quem trabalha nele, seja pessoa ou agente de IA.

Última revisão: 2026-11-21. Dono: líder do projeto.

## Para que serve este arquivo

Este arquivo guarda as regras próprias do site Caderno de Direito. Elas detalham as leis gerais da máquina de trabalho (arquivo `GODS_LAWS.md`, em `~/.claude/`, fora deste repositório) para este projeto específico.

Onde este arquivo não fala de um assunto, valem as leis gerais. Se uma regra daqui contradizer uma lei geral, a dúvida vai ao líder antes de qualquer ação.

## Fatias: critério de pronto e teste visual

Fatia é um pedaço de trabalho com escopo fechado, que termina num commit. As duas regras abaixo foram confirmadas pelo líder em 20/11/2026, com a resposta "Sim, aplique as 4".

### Critério de pronto antes da fatia (L-43)

O critério de pronto é escrito antes de a fatia começar. O padrão é: funciona, os portões passam e não há risco de segurança ou privacidade. Os portões são as verificações automáticas do projeto, como o portão de testes (`npm run test:e2e:portao`) e o pré-CI (`npm run preci`), que roda na máquina a sequência de verificações de um CI. Este repositório não tem CI: os portões ficam no lugar dele.

A revisão aponta só o que quebra esse critério. O resto nem é listado e não vira item do `TODO.md`, nem da INBOX. A regra geral é a L-43.

### Teste visual em 3 larguras

O teste visual, que confere a tela pixel a pixel, roda em 3 larguras fixas: celular, tablet e desktop. Ele não varre uma faixa de larguras, isto é, não mede largura por largura dentro de um intervalo.

## Deploy irreversível (L-70): adaptação da Fase 2

Uma mudança é irreversível quando não dá para desfazê-la com um clique. Neste site, as 7 fases da L-70 (o rito) valem só para mudança em:

- login;
- permissão (quem pode ver o quê);
- token (o código que dá acesso, como o do link de convite);
- chave ou segredo no servidor;
- apagamento de dado.

Nesses casos, o deploy segue o checklist de deploy irreversível que fica no conjunto de regras pessoal do líder (`~/.claude/docs/deploy-irreversivel.md` e `~/.claude/templates/deploy-checklist.md`). A 1.17 (token do convite) continua no rito.

Todo o resto publica normal, pelo `publicar.sh` (ver a seção "Publicação"), sem as 7 fases. Mexer em `public/api/**`, `public/.htaccess` ou `public/sw.js` só leva ao rito quando a mudança toca um dos cinco pontos da lista acima.

Esta regra foi confirmada pelo líder em 20/11/2026, com a resposta "Sim, aplique as 4".

### Por que a Fase 2 foi adaptada

Em 28/10/2026, o líder escolheu a opção "Documentar e cumprir". O motivo é técnico: o site roda em hospedagem compartilhada (Hostinger), que não permite configurar um balanceador de carga (Nginx, HAProxy ou ALB próprios).

A Fase 2 do checklist é o Shadow Deployment, que faz o espelhamento de tráfego. Espelhar tráfego é copiar as visitas reais para a versão nova, sem o leitor perceber, para comparar as duas. Sem balanceador configurável, esse espelhamento não é possível aqui. Por isso a Fase 2 é substituída pela dupla validação abaixo.

### Dupla validação (no lugar da Fase 2)

- **(a) 1ª validação, antes da publicação:** QA completo numa cópia local isolada, com os dados reais da área. A cópia roda com o servidor PHP embutido e o navegador sem tela (headless), dentro de uma caixa bwrap (ambiente isolado do resto da máquina). Só se publica depois que essa validação passa.
- **(b) 2ª validação, logo após a publicação, em produção, por e2e automático:** um teste automático com uma conta temporária confere no site real o login, o convite e a criação de senha, o link antigo, a troca de senha, as abas, as imagens e a saída. Se algo falhar, faz-se rollback (volta-se à versão anterior). Ordem do líder de 21/11/2026, verbatim: "testes só automatizados! Ande com esse projeto!", confirmada por AskUserQuestion com a opção "Trocar por e2e automático no ar". Fica de fora só o que um robô não vê, como o e-mail chegando à caixa do líder.

Nota: a lei geral L-70 fala em dupla validação "em staging". A forma escolhida pelo líder para este projeto é a cópia local isolada descrita acima.

### O que continua obrigatório

As demais fases do checklist (0, 1, 3, 4, 5 e 6) continuam obrigatórias, sem exceção. A sub-fase 5.3 (espera mínima de 48 horas, assinatura nominal e 30 dias offline antes de apagar algo) vale também para qualquer limpeza destrutiva depois da publicação.

Cada item do checklist é marcado como `[PASSOU]`, `[FALHOU]` ou `[BLOQUEADO]`. Qualquer `[FALHOU]` ou `[BLOQUEADO]` aborta o deploy na hora. O deploy só acontece com todas as fases marcadas `[PASSOU]`.

O checklist preenchido de cada deploy desse tipo fica em `docs/auditoria/deploys/AAAA-MM-DD-<assunto>.md`, onde `AAAA-MM-DD` é a data do deploy e `<assunto>` é uma palavra que diz o que mudou.

## Publicação

O passo a passo para publicar uma versão está em [`docs/publicacao.md`](docs/publicacao.md), na seção "Publicar uma versão". Não copie esse passo a passo para cá: se ele mudar, muda só lá.

A release, isto é, a versão nova com número próprio, só é criada dentro do `publicar.sh` (`npm run publicar`), depois que o pré-CI (`scripts/preci.sh`) fecha verde.

Esta regra foi confirmada pelo líder em 20/11/2026, com a resposta "Sim, aplique as 4".

### Prioridade quando há vários pedidos em paralelo

Regras do líder, dadas em 14/11/2026, na forma em que ele escreveu:

- "LEI para este projeto: no caso de várias solicitacoes minhas em paralelo, a prioridade do projeto é SEMPRE atualizar as cadeiras".
- "projetos paralelos podem ser feitos deploy separados, ao serem concluidos, sempre com warning."
- "priorize deplpy de cadeiras antes do QA visual. Se o QA visual consertar algo, você atualiza e faz novo deploy>tag".
- "nao quero versao de site "mais leve". A única versão alternativa é a de alto contraste".
