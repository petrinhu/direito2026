// Tela do convite (V17-C6). Carregado com defer e nonce; sem fetch, sem estilo inline.
// Ordem fixa: replaceState antes de gravar o token, para que o fragmento saia da barra
// e do histórico antes de qualquer outra coisa. Se o campo t já tem valor na carga, não faz nada.
// Link colado na barra da mesma aba é navegação de fragmento, sem carga nova: o ouvinte de
// hashchange faz a mesma leitura (D13), e o link colado por último vence.
(function () {
  'use strict';

  var campoT = document.querySelector('input[name="t"]');
  if (!campoT || campoT.value !== '') return;

  var formulario = campoT.form;
  var aviso = document.getElementById('convite-aviso');
  var anuncio = document.querySelector('[role="status"]');

  function ler() {
    var casa = /^#t=([0-9a-f]{64})$/.exec(location.hash);

    if (casa && formulario && aviso && anuncio) {
      history.replaceState(null, '', location.pathname + location.search);
      campoT.value = casa[1];
      formulario.hidden = false;
      aviso.hidden = true;
      anuncio.textContent = 'Link lido. Crie a sua senha.';
      return;
    }

    if (aviso && !(formulario && !formulario.hidden)) {
      aviso.textContent =
        'O link chegou incompleto. Abra o e-mail, copie o endereço completo e cole na barra de endereço do navegador.';
    }
  }

  ler();
  window.addEventListener('hashchange', ler);
})();
