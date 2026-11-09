<?php
declare(strict_types=1);

/*
 * Certificados de TESTE do handshake TLS do cliente SMTP (EM-B2). Gerados em tempo de execução, dentro do
 * diretório temporário do próprio teste: nenhuma chave privada entra no repositório (o portão de segredo
 * do pre-commit recusa chave privada versionada). A CA é só de teste e nunca vira confiança do sistema:
 * quem confia nela é o cliente do teste, por SSL_CERT_FILE, pelo tempo de um teste.
 */

const CERTIFICADOS_TESTE_EXTENSOES = <<<'CNF'
[req]
distinguished_name = dn

[dn]

[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash

[v3_nome_certo]
basicConstraints = critical,CA:FALSE
subjectAltName = DNS:smtp.hostinger.com
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth

[v3_nome_errado]
basicConstraints = critical,CA:FALSE
subjectAltName = DNS:outro.example.com
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
CNF;

/**
 * Gera a CA de teste e três certificados folha: `bom` (assinado pela CA, nome smtp.hostinger.com),
 * `errado` (assinado pela CA, outro nome) e `auto` (autoassinado, nome smtp.hostinger.com).
 *
 * @return array{ca: string, bom: array{cert: string, chave: string}, errado: array{cert: string, chave: string}, auto: array{cert: string, chave: string}}
 */
function certificadosDeTeste(string $dir): array
{
    $cnf = $dir . '/extensoes.cnf';
    file_put_contents($cnf, CERTIFICADOS_TESTE_EXTENSOES);
    $opcoes = ['config' => $cnf, 'digest_alg' => 'sha256'];

    $caChave = certificadoChave($cnf, $dir . '/ca.key');
    $caCsr = openssl_csr_new(['commonName' => 'CA de teste EM-B2'], $caChave, $opcoes) ?: falhar('openssl: CSR da CA de teste');
    $caCert = openssl_csr_sign($caCsr, null, $caChave, 2, $opcoes + ['x509_extensions' => 'v3_ca'], 1)
        ?: falhar('openssl: CA de teste não assinada');
    $ca = $dir . '/ca.pem';
    openssl_x509_export_to_file($caCert, $ca) || falhar('openssl: CA de teste não exportada');

    return [
        'ca' => $ca,
        'bom' => certificadoFolha($dir, 'bom', 'smtp.hostinger.com', 'v3_nome_certo', $caCert, $caChave, 2, $cnf),
        'errado' => certificadoFolha($dir, 'errado', 'outro.example.com', 'v3_nome_errado', $caCert, $caChave, 3, $cnf),
        'auto' => certificadoFolha($dir, 'auto', 'smtp.hostinger.com', 'v3_nome_certo', null, null, 4, $cnf),
    ];
}

/** Par de chaves RSA 2048 de teste; exportado só para o diretório temporário do teste. */
function certificadoChave(string $cnf, string $arquivoDaChave): OpenSSLAsymmetricKey
{
    $chave = openssl_pkey_new(['config' => $cnf, 'private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => 2048])
        ?: falhar('openssl: chave de teste não gerada');
    openssl_pkey_export_to_file($chave, $arquivoDaChave, null, ['config' => $cnf])
        || falhar('openssl: chave de teste não exportada');
    return $chave;
}

/**
 * Folha de teste. Sem `$caCert`, é autoassinada (assinada pela própria chave).
 *
 * @return array{cert: string, chave: string}
 */
function certificadoFolha(
    string $dir,
    string $nome,
    string $dns,
    string $secao,
    ?OpenSSLCertificate $caCert,
    ?OpenSSLAsymmetricKey $caChave,
    int $serie,
    string $cnf,
): array {
    $opcoes = ['config' => $cnf, 'digest_alg' => 'sha256'];
    $chave = certificadoChave($cnf, $dir . '/' . $nome . '.key');
    $csr = openssl_csr_new(['commonName' => $dns], $chave, $opcoes) ?: falhar('openssl: CSR de teste ' . $nome);
    $assinante = $caChave ?? $chave;
    $cert = openssl_csr_sign($csr, $caCert, $assinante, 2, $opcoes + ['x509_extensions' => $secao], $serie)
        ?: falhar('openssl: certificado de teste ' . $nome . ' não assinado');
    $arquivoCert = $dir . '/' . $nome . '.pem';
    openssl_x509_export_to_file($cert, $arquivoCert) || falhar('openssl: certificado de teste ' . $nome . ' não exportado');
    return ['cert' => $arquivoCert, 'chave' => $dir . '/' . $nome . '.key'];
}

/**
 * Confia só na CA de teste, pelo ambiente do OpenSSL, pelo tempo do teste. Devolve a função que desfaz.
 *
 * @return Closure(): void
 */
function certificadosConfiarCa(string $ca): Closure
{
    $antes = getenv('SSL_CERT_FILE');
    putenv('SSL_CERT_FILE=' . $ca);
    return static function () use ($antes): void {
        if ($antes === false) {
            putenv('SSL_CERT_FILE');
            return;
        }
        putenv('SSL_CERT_FILE=' . $antes);
    };
}
