/**
 * Repasse ao SMTP falso do teste do portão (EM-F1). O envio de e-mail do servidor lê o destino de
 * D26_SMTP_TESTE uma vez, quando o php -S sobe; o SMTP falso (servidor/testes/apoio/smtpFalso.php) abre
 * porta aleatória e atende uma conversa só. Este repasse fecha a diferença: porta FIXA de loopback e, para cada
 * conexão do servidor, um falso novo, com o roteiro de ROTEIRO_SMTP lido na hora, cuja conversa fica em
 * PASTA_SMTP. Sem falso vivo a conexão cai na hora: o php -S tem um processo só e não pode esperar à toa.
 * Só 127.0.0.1: nenhum byte sai da máquina.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { connect, createServer, type Server, type Socket } from 'node:net';
import { join } from 'node:path';
import { PORTA_SMTP } from './constantes';
import { PASTA_SMTP, ROTEIRO_SMTP } from './ambiente';

export interface RepasseSmtp {
  fechar(): void;
}

/** Nome da conversa: o instante e um contador, para ordenar por nome e nunca repetir. */
function nomeDaConversa(contador: number): string {
  return `conversa-${String(Date.now())}-${String(contador).padStart(5, '0')}.bin`;
}

function ligarAoFalso(cliente: Socket, porta: number): void {
  const ponte = connect(porta, '127.0.0.1');
  ponte.on('error', () => cliente.destroy());
  cliente.on('error', () => ponte.destroy());
  ponte.on('close', () => cliente.destroy());
  cliente.on('close', () => ponte.destroy());
  cliente.pipe(ponte);
  ponte.pipe(cliente);
}

export function iniciarRepasseSmtp(raiz: string): RepasseSmtp {
  const falso = join(raiz, 'servidor', 'testes', 'apoio', 'smtpFalso.php');
  const filhos = new Set<ChildProcess>();
  let contador = 0;

  const servidor: Server = createServer((cliente) => {
    contador += 1;
    const conversa = join(PASTA_SMTP, nomeDaConversa(contador));
    const filho = spawn('php', [falso, ROTEIRO_SMTP, conversa], {
      stdio: ['ignore', 'pipe', 'inherit']
    });
    filhos.add(filho);
    filho.on('exit', () => {
      filhos.delete(filho);
      cliente.destroy();
    });
    cliente.on('close', () => filho.kill());
    let linha = '';
    let ligado = false;
    filho.stdout.on('data', (pedaco: Buffer) => {
      if (ligado) return;
      linha += pedaco.toString('utf8');
      const fim = linha.indexOf('\n');
      if (fim === -1) return;
      ligado = true;
      const porta = Number(linha.slice(0, fim));
      if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
        cliente.destroy();
        return;
      }
      ligarAoFalso(cliente, porta);
    });
  });
  servidor.listen(PORTA_SMTP, '127.0.0.1');

  return {
    fechar() {
      servidor.close();
      for (const filho of filhos) filho.kill();
    }
  };
}
