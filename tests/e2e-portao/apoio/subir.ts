/**
 * Servidor do teste do portão: monta o ambiente sintético e sobe o php -S com o roteador de
 * desenvolvimento (servidor/dev/roteador.php), que espelha o .htaccess de produção. Chamado pelo
 * webServer de playwright.portao.config.ts. Dois parâmetros de ambiente:
 *  - E2E_PORTAO_RAIZ: onde estão public/ e servidor/ (padrão: a árvore de trabalho). A sabotagem
 *    aponta para uma cópia extraída do commit, sem tocar na árvore;
 *  - E2E_PORTAO_DIST: dist do build que vira o app (padrão: ./dist).
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { AMBIENTE, APP, PRIVADO, prepararAmbiente } from './ambiente';
import { PORTA, PORTA_SMTP } from './constantes';
import { iniciarRepasseSmtp } from './smtpRepasse';

const raiz = process.env.E2E_PORTAO_RAIZ ?? process.cwd();
const dist = process.env.E2E_PORTAO_DIST ?? join(process.cwd(), 'dist');

prepararAmbiente(dist);
console.log(`ambiente sintético em ${AMBIENTE}`);
// O repasse sobe antes do php -S: o envio de e-mail do servidor só conversa com ele, em loopback (EM-F1).
const repasseSmtp = iniciarRepasseSmtp(raiz);

const php = spawn(
  'php',
  [
    '-S',
    `localhost:${PORTA}`,
    '-t',
    join(raiz, 'public'),
    join(raiz, 'servidor', 'dev', 'roteador.php')
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      D26_PRIVADO: PRIVADO,
      D26_APP: APP,
      D26_SMTP_TESTE: `tcp://127.0.0.1:${PORTA_SMTP}`
    }
  }
);

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, () => {
    repasseSmtp.fechar();
    php.kill(sinal);
  });
}
php.on('exit', (codigo) => {
  repasseSmtp.fechar();
  process.exit(codigo ?? 0);
});
