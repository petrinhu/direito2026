# CLAUDE.md

Regras deste projeto para quem trabalha nele, seja pessoa ou agente de IA.

Última revisão: 2026-10-28. Dono: líder do projeto.

## Para que serve este arquivo

Este arquivo guarda as regras próprias do site Caderno de Direito. Elas detalham as leis gerais da máquina de trabalho (arquivo `GODS_LAWS.md`, em `~/.claude/`, fora deste repositório) para este projeto específico.

Onde este arquivo não fala de um assunto, valem as leis gerais. Se uma regra daqui contradizer uma lei geral, a dúvida vai ao líder antes de qualquer ação.

## Deploy irreversível (L-70): adaptação da Fase 2

Uma mudança é irreversível quando não dá para desfazê-la com um clique. Neste site, ela se aplica a:

- área com login (Interdisciplinar e Júri Simulado);
- geração de chave ou segredo no servidor;
- mudança de autorização (quem pode ver o quê).

Nesses casos, o deploy segue o checklist de deploy irreversível que fica no conjunto de regras pessoal do líder (`~/.claude/docs/deploy-irreversivel.md` e `~/.claude/templates/deploy-checklist.md`).

### Por que a Fase 2 foi adaptada

Em 28/10/2026, o líder escolheu a opção "Documentar e cumprir". O motivo é técnico: o site roda em hospedagem compartilhada (Hostinger), que não permite configurar um balanceador de carga (Nginx, HAProxy ou ALB próprios).

A Fase 2 do checklist é o Shadow Deployment, que faz o espelhamento de tráfego. Espelhar tráfego é copiar as visitas reais para a versão nova, sem o leitor perceber, para comparar as duas. Sem balanceador configurável, esse espelhamento não é possível aqui. Por isso a Fase 2 é substituída pela dupla validação manual abaixo.

### Dupla validação manual (no lugar da Fase 2)

- **(a) 1ª validação, antes da publicação:** QA completo numa cópia local isolada, com os dados reais da área. A cópia roda com o servidor PHP embutido e o navegador sem tela (headless), dentro de uma caixa bwrap (ambiente isolado do resto da máquina). Só se publica depois que essa validação passa.
- **(b) 2ª validação, logo após a publicação, em produção:** conferir login, troca de senha, abas, imagens e sair. Se algo falhar, faz-se rollback (volta-se à versão anterior).

Nota: a lei geral L-70 fala em dupla validação "em staging". A forma escolhida pelo líder para este projeto é a cópia local isolada descrita acima.

### O que continua obrigatório

As demais fases do checklist (0, 1, 3, 4, 5 e 6) continuam obrigatórias, sem exceção. A sub-fase 5.3 (espera mínima de 48 horas, assinatura nominal e 30 dias offline antes de apagar algo) vale também para qualquer limpeza destrutiva depois da publicação.

Cada item do checklist é marcado como `[PASSOU]`, `[FALHOU]` ou `[BLOQUEADO]`. Qualquer `[FALHOU]` ou `[BLOQUEADO]` aborta o deploy na hora. O deploy só acontece com todas as fases marcadas `[PASSOU]`.

O checklist preenchido de cada deploy desse tipo fica em `docs/auditoria/deploys/AAAA-MM-DD-<assunto>.md`, onde `AAAA-MM-DD` é a data do deploy e `<assunto>` é uma palavra que diz o que mudou.

## Publicação

O passo a passo para publicar uma versão está em [`docs/publicacao.md`](docs/publicacao.md), na seção "Publicar uma versão". Não copie esse passo a passo para cá: se ele mudar, muda só lá.
