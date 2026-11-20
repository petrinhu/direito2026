// Tela do convite (V17-C6). Carregado com defer e nonce; sem fetch, sem estilo inline.
// Ordem fixa: replaceState antes de gravar o token, para que o fragmento saia da barra
// e do histórico antes de qualquer outra coisa. Se o campo t já tem valor, não faz nada.
(function () {
  'use strict';

  var campoT = document.querySelector('input[name="t"]');
  if (!campoT || campoT.value !== '') return;

  var formulario = campoT.form;
  var aviso = document.getElementById('convite-aviso');
  var anuncio = document.querySelector('[role="status"]');
  var casa = /^#t=([0-9a-f]{64})$/.exec(location.hash);

  if (casa && formulario && aviso && anuncio) {
    history.replaceState(null, '', location.pathname + location.search);
    campoT.value = casa[1];
    formulario.hidden = false;
    aviso.hidden = true;
    anuncio.textContent = 'Link lido. Crie a sua senha.';
    return;
  }

  if (aviso) {
    aviso.textContent =
      'O link chegou incompleto. Abra o e-mail, copie o endereço completo e cole na barra de endereço do navegador.';
  }
})();
