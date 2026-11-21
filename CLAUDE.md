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

### Uma parte por publicação, nunca em bloco (LEI do projeto)

Ordem do líder de 21/11/2026, na forma em que ele escreveu: "Eu não quero publicação por blocos! Quero que publique quando estiver pronto cada parte na sua vez! Um erro em um bloco grande leva a muita perda de tempo!", e depois: "Torne lei do projeto as publicações por partes e não por blocos". Ela refunde a regra de 14/11 sobre deploys separados, logo acima.

- Cada parte concluída (uma cadeira, uma aba, um quiz, um conserto) tem a sua própria versão. Não se juntam partes prontas para publicar de uma vez, nem se espera uma parte para sair com outra.
- A parte entra no `main` só na hora da sua publicação: primeiro o merge dela sozinha, depois as verificações rápidas (`verificar-particao`, camadas, tipos, formatação e a suíte de unidade) e, por fim, o `publicar`. A próxima parte só entra depois que a anterior estiver no ar.
- As partes prontas esperam numa fila. A ordem é: cadeira primeiro, depois o resto, na ordem em que ficaram prontas.
- Se uma parte for recusada, só ela volta para conserto, e a fila segue com a próxima.

## Eficácia: máquina, testes e publicação (LEI do projeto)

Ordens do líder de 21/11/2026, na forma em que ele escreveu: "Quero a melhor eficácia. E quero testes mais rápidos sem OE", "Deixe nucleos 0 e 1 livres pro sistema e pro claude code", "Não faz o menor sentido um teste ser mais demorado que codar algo" e, por fim, "Crie a lei da eficácia". A forma do pré-CI seletivo foi escolhida por ele, por AskUserQuestion, com a opção "Rodar só o que a mudança toca".

### A máquina

- Os núcleos 0 e 1 ficam livres para o sistema e para o Claude Code. Todo trabalho pesado roda com `taskset -c 2-15`, dentro de `systemd-run --user --scope -p TasksMax=400 -p MemoryMax=6G`.
- Trabalho pesado é vitest, vue-tsc, build, Playwright e a suíte PHP. Só um roda por vez, dentro de `flock /var/tmp/onda-paralela/pesado.trava`. Motivo, medido em 21/11: sete agentes testando ao mesmo tempo levaram a carga a 117 em 16 núcleos e esgotaram a memória (30 de 31 GB), e o sistema matou um processo de teste da publicação em curso.
- A espera é sempre sem gasto: `flock` bloqueante, ou o aviso de fim da própria ferramenta. Laço de espera é proibido. Um `read -t 5 < /dev/zero` gira a 90% de um núcleo, porque `/dev/zero` responde na hora.

### A publicação

- A publicação vem antes de tudo. Ela roda na hora e não entra na fila da `pesado.trava`, que não respeita a ordem de chegada. Enquanto ela roda, nenhum agente roda trabalho pesado.
- Preparar uma parte para a fila é trazer os commits dela e rodar só os passos leves: eslint e prettier nos arquivos tocados, `verificar-particao` e camadas. Os pesados rodam na vez da parte, porque o pré-CI da publicação já roda a suíte.
- Rodada que cai por causa da máquina (tempo estourado, processo morto, falta de processos ou de memória) não é reprovação do código. Ela se repete uma vez, com a máquina livre, sem afrouxar teste nenhum.

### O pré-CI

- O pré-CI para no primeiro passo reprovado e mostra quantos segundos cada passo levou.
- O pré-CI roda só o que a mudança toca, contra a última versão publicada:
  - Sempre rodam a cifra, a partição, o travessão, o build com o portão de pacote publicável, as varreduras de vazamento do restrito e da Júri e a conferência depois do envio.
  - Dependem do que mudou:
    - os testes ligados aos arquivos mudados;
    - a suíte PHP, só se mudou o servidor;
    - as checagens de conteúdo, só se mudou o conteúdo;
    - lint e formatação, só nos arquivos tocados.
  - A suíte inteira roda quando muda algo em `scripts/`, num arquivo de configuração ou no `package.json`, quando não há versão publicada para comparar, ou com `PRECI_COMPLETO=1`.
- Uma verificação não pode custar mais que a mudança que ela confere. Quando custar, mede-se o tempo de cada passo e corta-se o desperdício. Nenhum portão de segurança ou de privacidade sai por causa do tempo.
