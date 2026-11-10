<?php
// Stub de teste (nunca em produção): imita a função do SAPI LiteSpeed sob php -S e grava que foi chamada.
if (!function_exists('litespeed_finish_request')) {
    function litespeed_finish_request(): bool
    {
        $d = getenv('D26_PRIVADO');
        if (is_string($d) && $d !== '') {
            @file_put_contents($d . '/sinal-sapi-finish', "litespeed\n");
        }
        return true;
    }
}
