<?php
// Stub de teste (nunca em produção): imita a função do SAPI FPM sob php -S e grava que foi chamada.
if (!function_exists('fastcgi_finish_request')) {
    function fastcgi_finish_request(): bool
    {
        $d = getenv('D26_PRIVADO');
        if (is_string($d) && $d !== '') {
            @file_put_contents($d . '/sinal-sapi-finish', "fastcgi\n");
        }
        return true;
    }
}
