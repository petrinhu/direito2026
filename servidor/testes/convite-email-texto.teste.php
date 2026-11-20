<?php
declare(strict_types=1);

require_once __DIR__ . '/apoio/nucleo.php';
require_once __DIR__ . '/cli-apoio.php';

/**
 * Texto dos e-mails com link (V17-C2, resposta L2 do líder de 19/11/2026: "As suas palavras (Recomendado)"). Os três
 * e-mails (E1 convite, E2 esqueci, E3 redefinição) trazem o link numa linha sozinha, a frase de cópia logo abaixo e o
 * mesmo endereço de novo numa linha sozinha, para quem precisa copiá-lo para a barra do navegador. Nome de teste começa
 * com "convite-email:" (filtro do rodar.php).
 */

/** Frase de cópia, verbatim da resposta L2 do líder. */
const CONVITE_EMAIL_FRASE_COPIA = 'Se o link não funcionar, copie este código no campo de URL do seu navegador:';

teste('convite-email: C2 E1, E2 e E3: link numa linha, frase de cópia na seguinte, o mesmo endereço de novo numa linha, zero linhas com ?t=', function (): void {
    correioCarregar();
    $link = 'https://direito2026.drpetrus.top/api/convite.php#t=' . str_repeat('ab', 32);
    $mensagens = [
        'E1 convite' => d26_correio_msg_convite('ana@example.com', 'ana', $link),
        'E2 esqueci' => d26_correio_msg_esqueci('ana@example.com', 'ana', $link),
        'E3 redefinição' => d26_correio_msg_redefinicao('ana@example.com', 'ana', $link),
    ];
    foreach ($mensagens as $nome => $mensagem) {
        $corpo = $mensagem['corpo'];
        $linhas = explode("\n", $corpo);
        $i = array_search($link, $linhas, true);
        verdadeiro($i !== false, "$nome: o link inteiro numa linha sozinha");
        igual(CONVITE_EMAIL_FRASE_COPIA, $linhas[$i + 1] ?? null, "$nome: a frase de cópia na linha seguinte");
        igual($link, $linhas[$i + 2] ?? null, "$nome: o mesmo endereço de novo numa linha sozinha");
        igual(2, substr_count($corpo, $link), "$nome: duas ocorrências do endereço");
        igual(0, substr_count($corpo, '?t='), "$nome: nenhuma linha com ?t=");
    }
});

teste('convite-email: C2 E4 (senha criada) não tem link e não muda', function (): void {
    correioCarregar();
    $m = d26_correio_msg_senha_criada('ana@example.com', 'ana');
    igual(0, substr_count($m['corpo'], 'convite.php'), 'sem link no aviso de senha criada');
    naoContem(CONVITE_EMAIL_FRASE_COPIA, $m['corpo'], 'sem a frase de cópia');
});
