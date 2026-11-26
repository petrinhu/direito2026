# CLAUDE.md

Regras deste projeto para quem trabalha nele, seja pessoa ou agente de IA.

Última revisão: 2026-11-23. Dono: líder do projeto.

## Para que serve este arquivo

Este arquivo guarda as regras próprias do site Caderno de Direito. Elas detalham as leis gerais da máquina de trabalho (arquivo `GODS_LAWS.md`, em `~/.claude/`, fora deste repositório) para este projeto específico.

Onde este arquivo não falar de um assunto, siga as leis gerais. Se uma regra daqui contradizer uma lei geral, leve a dúvida ao líder antes de qualquer ação.

**Data:** do estilo das regras, 23/11/2026. Verbatim do líder: "Quero lei no estilo: Faça x".

Escreva cada regra deste arquivo como uma ordem, no estilo "Faça x.", com um porquê de uma frase quando ajudar. Não use "antes era", "agora", "passa a", "deixou de" nem "substitui", e ponha a data e o verbatim do líder só na linha "Data:" da regra.

## Fatias: critério de pronto e teste visual

**Data:** 20/11/2026, as duas regras abaixo confirmadas pelo líder com a resposta "Sim, aplique as 4".

Fatia é um pedaço de trabalho com escopo fechado, que termina num commit.

### Critério de pronto antes da fatia (L-43)

Escreva o critério de pronto antes de a fatia começar. Use como padrão: funciona, os portões passam e não há risco de segurança ou privacidade. Os portões são as verificações automáticas do projeto, como o portão de testes (`npm run test:e2e:portao`) e o pré-CI (`npm run preci`), que roda na máquina a sequência de verificações de um CI. Este repositório não tem CI: os portões ficam no lugar dele.

Na revisão, aponte só o que quebra esse critério. Não liste o resto nem o transforme em item do `TODO.md` ou da INBOX. A regra geral é a L-43.

### Teste visual em 3 larguras

Rode o teste visual, que confere a tela pixel a pixel, em 3 larguras fixas: celular, tablet e desktop. Não varra uma faixa de larguras, isto é, não meça largura por largura dentro de um intervalo.

## Deploy irreversível (L-70): adaptação da Fase 2

**Data:** 20/11/2026, confirmada pelo líder com a resposta "Sim, aplique as 4".

Uma mudança é irreversível quando não dá para desfazê-la com um clique. Neste site, aplique as 7 fases da L-70 (o rito) só à mudança em:

- login;
- permissão (quem pode ver o quê);
- token (o código que dá acesso, como o do link de convite);
- chave ou segredo no servidor;
- apagamento de dado.

Nesses casos, siga no deploy o checklist de deploy irreversível que fica no conjunto de regras pessoal do líder (`~/.claude/docs/deploy-irreversivel.md` e `~/.claude/templates/deploy-checklist.md`). Mantenha a 1.17 (token do convite) no rito.

Publique todo o resto normal, pelo `publicar.sh` (ver a seção "Publicação"), sem as 7 fases. Leve ao rito a mudança em `public/api/**`, `public/.htaccess` ou `public/sw.js` só quando ela tocar um dos cinco pontos da lista acima.

### Por que a Fase 2 foi adaptada

**Data:** 28/10/2026, escolha do líder pela opção "Documentar e cumprir".

O motivo é técnico: o site roda em hospedagem compartilhada (Hostinger), que não permite configurar um balanceador de carga (Nginx, HAProxy ou ALB próprios).

A Fase 2 do checklist é o Shadow Deployment, que faz o espelhamento de tráfego. Espelhar tráfego é copiar as visitas reais para a versão nova, sem o leitor perceber, para comparar as duas. Sem balanceador configurável, esse espelhamento não é possível aqui. Por isso, no lugar da Fase 2, faça a dupla validação abaixo.

### Dupla validação (no lugar da Fase 2)

**Data:** da 2ª validação por e2e automático, 21/11/2026. Verbatim do líder: "testes só automatizados! Ande com esse projeto!", ordem confirmada por AskUserQuestion com a opção "Trocar por e2e automático no ar".

- **(a) 1ª validação, antes da publicação:** faça o QA completo numa cópia local isolada, com os dados reais da área. Rode a cópia com o servidor PHP embutido e o navegador sem tela (headless), dentro de uma caixa bwrap (ambiente isolado do resto da máquina). Publique só depois que essa validação passar.
- **(b) 2ª validação, logo após a publicação, em produção, por e2e automático:** confira no site real, com um teste automático e uma conta temporária, o login, o convite e a criação de senha, o link antigo, a troca de senha, as abas, as imagens e a saída. Se algo falhar, faça rollback (volte à versão anterior). Exclua do teste só o que um robô não vê, como o e-mail chegando à caixa do líder.

Nota: a lei geral L-70 fala em dupla validação "em staging". Neste projeto, use no lugar do staging a cópia local isolada descrita acima, que é a forma escolhida pelo líder.

### O que continua obrigatório

Cumpra as demais fases do checklist (0, 1, 3, 4, 5 e 6), sem exceção. Aplique a sub-fase 5.3 (espera mínima de 48 horas, assinatura nominal e 30 dias offline antes de apagar algo) também a qualquer limpeza destrutiva depois da publicação.

Marque cada item do checklist como `[PASSOU]`, `[FALHOU]` ou `[BLOQUEADO]`. Aborte o deploy na hora diante de qualquer `[FALHOU]` ou `[BLOQUEADO]`, e faça o deploy só com todas as fases marcadas `[PASSOU]`.

Guarde o checklist preenchido de cada deploy desse tipo em `docs/auditoria/deploys/AAAA-MM-DD-<assunto>.md`, onde `AAAA-MM-DD` é a data do deploy e `<assunto>` é uma palavra que diz o que mudou.

## Publicação

**Data:** da regra da release, 20/11/2026, confirmada pelo líder com a resposta "Sim, aplique as 4".

Para publicar uma versão, siga o passo a passo de [`docs/publicacao.md`](docs/publicacao.md), na seção "Publicar uma versão". Não copie esse passo a passo para cá: se ele mudar, muda só lá.

Crie a release, isto é, a versão nova com número próprio, só dentro do `publicar.sh` (`npm run publicar`), depois que o pré-CI (`scripts/preci.sh`) fechar verde.

### Prioridade quando há vários pedidos em paralelo

**Data:** 14/11/2026. Verbatim do líder: "LEI para este projeto: no caso de várias solicitacoes minhas em paralelo, a prioridade do projeto é SEMPRE atualizar as cadeiras"; "projetos paralelos podem ser feitos deploy separados, ao serem concluidos, sempre com warning."; "priorize deplpy de cadeiras antes do QA visual. Se o QA visual consertar algo, você atualiza e faz novo deploy>tag"; "nao quero versao de site "mais leve". A única versão alternativa é a de alto contraste".

- Diante de vários pedidos do líder em paralelo, dê sempre a prioridade a atualizar as cadeiras (LEI do projeto).
- Você pode fazer deploy separado de cada projeto paralelo, ao concluí-lo; faça-o sempre com warning.
- Priorize o deploy das cadeiras antes do QA visual. Se o QA visual consertar algo, atualize e faça novo deploy, com tag.
- Não faça versão "mais leve" do site: a única versão alternativa é a de alto contraste.

### Uma parte por publicação, nunca em bloco (LEI do projeto)

**Data:** 21/11/2026; refunde a regra de 14/11 sobre deploys separados, logo acima. Papéis do histórico e do merge em 23/11/2026. Verbatim do líder: "Eu não quero publicação por blocos! Quero que publique quando estiver pronto cada parte na sua vez! Um erro em um bloco grande leva a muita perda de tempo!" e, depois, "Torne lei do projeto as publicações por partes e não por blocos"; dos papéis, por AskUserQuestion: "Agentes fazem os dois (Recomendado)".

- Dê a cada parte concluída (uma cadeira, uma aba, um quiz, um conserto) a sua própria versão. Não junte partes prontas para publicar de uma vez nem espere uma parte para sair com outra.
- Mande o agente da parte gravar o histórico da versão no próprio ramo, conferindo cada texto com `wc -m`, e um agente operacional fazer o merge curto. Na sessão principal, não faça merge nem grave histórico (LEI ZERO e L-10). Faça a parte entrar no `main` só na hora da sua publicação: primeiro o merge dela sozinha, depois as verificações rápidas (`verificar-particao`, camadas, tipos, formatação e a suíte de unidade) e, por fim, o `publicar`. Deixe a próxima parte entrar só depois que a anterior estiver no ar.
- Ponha as partes prontas numa fila, nesta ordem: cadeira primeiro, depois o resto, na ordem em que ficaram prontas.
- Se uma parte for recusada, mande só ela para conserto e siga a fila com a próxima.

## Eficácia: máquina, testes e publicação (LEI do projeto)

**Data:** 21/11/2026. Verbatim do líder: "Quero a melhor eficácia. E quero testes mais rápidos sem OE", "Deixe nucleos 0 e 1 livres pro sistema e pro claude code", "Não faz o menor sentido um teste ser mais demorado que codar algo" e, por fim, "Crie a lei da eficácia". A forma do pré-CI seletivo foi escolhida por ele, por AskUserQuestion, com a opção "Rodar só o que a mudança toca".

### A máquina

**Data:** carga medida em 21/11; trava única da máquina em 23/11/2026, com a L-11 reformada.

- Deixe os núcleos 0 e 1 livres para o sistema e para o Claude Code: rode todo trabalho pesado com `taskset -c 2-15`, dentro de `systemd-run --user --scope -p TasksMax=400 -p MemoryMax=6G`.
- Trabalho pesado é vitest, vue-tsc, build, Playwright e a suíte PHP. Rode um por vez, dentro de `flock /var/tmp/pesado.trava`, a trava única da máquina (L-11; a publicação fura a fila e roda fora dela). Porque sete agentes testando ao mesmo tempo levaram a carga a 117 em 16 núcleos e esgotaram a memória (30 de 31 GB), e o sistema matou um processo de teste da publicação em curso.
- Espere sempre sem gasto, com o `flock` bloqueante ou o aviso de fim da própria ferramenta, e nunca com laço de espera, porque um `read -t 5 < /dev/zero` gira a 90% de um núcleo, já que `/dev/zero` responde na hora.

### A publicação

**Data:** ajuste do líder de 21/11/2026, por AskUserQuestion: "Ajustar: um pesado por vez, nice 19".

- Rode a publicação antes de tudo: na hora, fora da fila da `pesado.trava`, que não respeita a ordem de chegada. Enquanto ela roda, deixe com ela a prioridade da máquina e rode nos agentes só um trabalho pesado por vez, dentro da `pesado.trava`, com `nice -n 19` e memória limitada a 6 GB.
- Para preparar uma parte para a fila, traga os commits dela e rode só os passos leves: eslint e prettier nos arquivos tocados, `verificar-particao` e camadas. Rode os testes de navegador e do servidor da parte na fila da `pesado.trava`, um por vez, e deixe a suíte de unidade para o pré-CI da publicação.
- Repita uma vez, com a máquina livre e sem afrouxar teste nenhum, a rodada que cair por causa da máquina (tempo estourado, processo morto, falta de processos ou de memória), porque essa queda não é reprovação do código.

### O pré-CI

- Faça o pré-CI parar no primeiro passo reprovado e mostrar quantos segundos cada passo levou.
- Rode no pré-CI só o que a mudança toca, contra o último pré-CI verde (SHA anotado fora do git; sem ele, a rodada sai completa):
  - Rode sempre a cifra, a partição, o travessão, o build com o portão de pacote publicável, as varreduras de vazamento do restrito e da Júri e a conferência depois do envio.
  - Rode conforme o que mudou:
    - os testes ligados aos arquivos mudados;
    - a suíte PHP, só se mudou o servidor;
    - as checagens de conteúdo, só se mudou o conteúdo;
    - lint e formatação, só nos arquivos tocados.
  - Rode a suíte inteira quando mudar algo em `scripts/`, num arquivo de configuração ou no `package.json`, quando não houver último verde válido para comparar, ou com `PRECI_COMPLETO=1`.
- Registro de decisão (L-68): em 26/11 o líder decidiu, por AskUserQuestion, trocar a base do pré-CI seletivo da última tag `v*` pelo último pré-CI verde, anotado fora do git (`scripts/apoio/preciBaseVerde.sh`). Sem o arquivo, ou com SHA que não existe ou não é ancestral do HEAD, a rodada sai completa. O pré-CI para no primeiro passo reprovado (`passo()` em `scripts/preci.sh`), e não grava verde quando a árvore estava suja.
- Não deixe uma verificação custar mais que a mudança que ela confere. Quando custar, meça o tempo de cada passo e corte o desperdício, sem tirar nenhum portão de segurança ou de privacidade por causa do tempo.

### O recibo do navegador

**Data:** registro de decisão (L-68) da decisão do líder de 25/11/2026, por AskUserQuestion, opção "Recibo do teste (Recomendado)". Verbatim: "O teste roda na fila normal e grava um recibo. A publicação recusa se essas partes mudaram e o recibo não confere. Custa quase nada na hora de publicar."

- As partes são `public/api` (inclui as telas do servidor, `public/api/nucleo/telas.php`) e `tests/e2e-portao`. A rodada é `npm run test:e2e:portao`, inteira, sem filtro, pela fila do pesado: `scripts/apoio/recibo-navegador.sh gravar`.
- O recibo fica fora do git, com o SHA testado, o hash das partes e o resultado verde.
- O `publicar` recusa, antes de qualquer escrita, quando as partes mudaram desde a última tag `v*` e o recibo não confere (sem recibo, com hash de outro conteúdo ou sem resultado verde). Partes intactas seguem sem recibo. Nenhum portão foi afrouxado.
