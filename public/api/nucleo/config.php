<?php
declare(strict_types=1);

if (!defined('D26_API')) {
    http_response_code(404);
    exit;
}

/** Parâmetros do Argon2id (OWASP pede no mínimo m=19 MiB, t=2, p=1; aqui acima disso). */
const D26_ARGON = ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1];

/**
 * Uma conta, uma sessão, um privado (plano do CTO do login único, seção 3). Não há
 * perfil por área: todas as rotas usam os mesmos cookies e o mesmo privado.
 */
const D26_SESSAO_NOME = '__Host-d26';
const D26_PRE_NOME = '__Host-d26pre';
const D26_DISP_NOME = '__Host-d26disp';
const D26_PRIVADO_NOME = 'direito2026_privado';
/** Subpastas do privado único: imagens/ é da Júri, mas o privado é um só. */
const D26_SUBPASTAS = ['sessoes', 'conteudo', 'imagens'];
const D26_SESSAO_OCIOSIDADE = 7200;
const D26_SESSAO_VALIDADE = 43200;
const D26_CORPO_MAX = 8192;

/**
 * Aviso de sessão substituída (SU-B2): quando a conta entra em outro aparelho, a sessão antiga cai
 * e um cookie de vida curta leva o motivo até a tela de entrada. Valor de lista fechada.
 */
const D26_AVISO_NOME = '__Host-d26aviso';
const D26_AVISO_VALIDADE = 600;
const D26_AVISO_OUTRO_APARELHO = 'outro-aparelho';
const D26_AVISO_BLOQUEADA = 'bloqueada';
const D26_AVISOS = [D26_AVISO_OUTRO_APARELHO, D26_AVISO_BLOQUEADA];

/**
 * Uso simultâneo (BL-B1, plano-sessao-unica.md 9.1.1 e 9.1.3, decisões do líder de 08/11/2026): N = 5 minutos
 * (janela de (a) e (b)); reserva de 30 s para o caso sem cookie de aparelho nos dois lados; a ocorrência que
 * leva o contador a este número bloqueia a conta comum (a admin nunca é bloqueada).
 */
const D26_USO_JANELA = 300;
const D26_USO_RESERVA = 30;
const D26_USO_BLOQUEIO_EM = 2;

/**
 * Aviso por e-mail ao líder (BL-B2, plano-sessao-unica.md 9.1.5): teto de 20 avisos de primeira ocorrência (A1) em 24 h,
 * com chave própria no tentativas.json. O A2 de bloqueio não conta no teto e sai sempre (decisão do líder, 10/11/2026).
 * O destino fica num arquivo do privado com este nome, nunca no repositório nem em d26_conta_publica.
 */
const D26_AVISO_TETO_DIA = 20;
const D26_AVISO_JANELA = 86400;
const D26_AVISO_DESTINO_ARQUIVO = 'aviso.destino';

/**
 * Validade do convite por link de criar e de redefinir (CV-B1, decisão do líder de 08/11/2026):
 * 48 horas, uso único. Gerar outro link (ou redefinir de novo) revoga o anterior.
 */
const D26_CONVITE_VALIDADE = 172800;

/**
 * Envio de e-mail (EM-B2, plano-sessao-unica.md 8.1.5, 8.1.6 e 8.1.8). A origem é fixa no código: o
 * servidor nunca lê o cabeçalho Host (OWASP). O .htaccess tem o mesmo host; o teste E18t lê os dois.
 * O login e a senha da caixa não moram aqui: ficam em direito2026_privado/smtp.usuario e smtp.senha (correio.php).
 * O remetente é o endereço que aparece no envelope e no cabeçalho From; o login de autenticação é outro dado.
 */
const D26_ORIGEM = 'https://direito2026.drpetrus.top';
const D26_SMTP_HOST = 'smtp.hostinger.com';
const D26_SMTP_PORTA = 465;
const D26_REMETENTE = 'nao-responda@drpetrus.top';
/** Prazo de cada leitura do SMTP e prazo total de um envio (segundos). Nunca infinito. */
const D26_SMTP_PRAZO_LEITURA_S = 10;
const D26_SMTP_PRAZO_TOTAL_S = 20;

/**
 * Teto de espera por uma trava de arquivo (armazenamento.php). Nunca infinito:
 * lock preso viraria 503 `indisponivel`, não worker pendurado. Os testes de
 * unidade podem definir antes um valor menor.
 */
if (!defined('D26_LOCK_TETO_MS')) {
    define('D26_LOCK_TETO_MS', 2000);
}

/**
 * Diretório privado único (fora do webroot, irmão de public_html). A partir de
 * .../public_html/<site>/api/nucleo sobe 4 níveis até a raiz do domínio. O nome é
 * D26_PRIVADO_NOME. Sem caminho absoluto no código. D26_PRIVADO só vale sob php -S (testes).
 */
function d26_dir_privado(string $dirNucleo, string $sapi, ?string $sobrescrita): string
{
    if ($sapi === 'cli-server' && $sobrescrita !== null && $sobrescrita !== '') {
        return $sobrescrita;
    }
    return dirname($dirNucleo, 4) . '/' . D26_PRIVADO_NOME;
}

function d26_priv(): string
{
    $env = getenv('D26_PRIVADO');
    return d26_dir_privado(__DIR__, PHP_SAPI, $env === false ? null : $env);
}
