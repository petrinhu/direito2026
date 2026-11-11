/**
 * Constantes do teste de ponta a ponta do portão (plano do CTO do login único, seção 7.4).
 * Tudo aqui é SINTÉTICO (L-28): logins, senhas, id de imagem e conteúdo são inventados.
 */

/** Porta fixa do php -S de teste. Fora da 4173 (preview do estudo) e da 8731 (matador). */
export const PORTA = 4741;

/**
 * Porta fixa, só de loopback, do repasse ao SMTP falso (EM-F1). O php -S sobe uma vez e lê D26_SMTP_TESTE do
 * ambiente, e o SMTP falso (servidor/testes/apoio/smtpFalso.php) abre porta aleatória e atende uma conversa:
 * o repasse (smtpRepasse.ts) tem a porta fixa e sobe um falso novo por conexão. Fora de 4741, 4173 e 8731.
 */
export const PORTA_SMTP = 4742;

/** Origem do app: o domínio que o teste usa como "o site" (T8: cookie __Host- só em origem segura). */
export const ORIGEM = `http://localhost:${PORTA}`;

/**
 * Origem de outro site (127.0.0.1 não é o mesmo site que localhost): é dela que sai o clique
 * do link externo. Com cookie SameSite=Strict, a navegação vinda daqui não leva a sessão.
 */
export const ORIGEM_EXTERNA = `http://127.0.0.1:${PORTA}`;

/** Remetente e origem que o servidor usa nos e-mails (D26_ORIGEM, nucleo/config.php): o e-mail carrega o domínio de produção. */
export const REMETENTE_DO_SITE = 'nao-responda@drpetrus.top';
export const ORIGEM_NO_EMAIL = 'https://direito2026.drpetrus.top';

/** Frase do líder: verbatim em toda falha de entrada. Não alterar (login.php, D26_FRASE_RECUSA). */
export const FRASE_RECUSA = 'Site exclusivo para público seleto!';

/** Contas sintéticas. Espelho de tests/e2e-portao/apoio/semear.php: mudar um sem o outro reprova. */
export const CONTA_ADMIN = { usuario: 'admin-sintetico', senha: 'senha-sintetica-admin-1' };
export const CONTA_COMUM = { usuario: 'comum-sintetico', senha: 'senha-sintetica-comum-1' };
export const CONTA_TROCA = { usuario: 'troca-sintetica', senha: 'senha-provisoria-1234' };
/** Senha nova usada só na troca de senha de CONTA_TROCA (15 caracteres ou mais, D3). */
export const SENHA_NOVA_TROCA = 'senha-nova-sintetica-99';

/** Destinos do app usados nos casos. Interdisciplinar e Júri são as duas cadeiras restritas. */
export const DESTINO_INTERDISCIPLINAR = '/p/p1/interdisciplinar';
export const DESTINO_JURI = '/p/p1/juri-simulado';

/** Id de imagem sintética da Júri: 32 hex, como o formato do índice (imagem.php). */
export const ID_IMAGEM_SINTETICA = '0123456789abcdef0123456789abcdef';

/** Trecho do conteúdo sintético do Interdisciplinar (conteudoRestritoFalso), para provar que chegou. */
export const TRECHO_CONTEUDO_INTERDISCIPLINAR = 'Bloco fictício 1';

/** Pasta das capturas de tela (L-13): a observação visual é lida por quem fechou a fatia. */
export const PASTA_CAPTURAS = process.env.E2E_PORTAO_CAPTURAS ?? '/var/tmp/site-login-unico/f44';
