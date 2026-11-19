/**
 * Pontos de sílaba dos rótulos de aba exibidos na trilha. Revisado à mão pelas
 * regras de separação silábica do português: dígrafos (ch, ss) não se separam,
 * "mn" inicial não se separa, "ção" fica inteiro, nenhum fragmento tem uma letra
 * só. Chave = rótulo inteiro, igual a ROTULOS_ABA. O hífen aqui é só marcação;
 * quem o transforma em U+00AD é hifenizarRotulo.
 */
export const SILABAS_ROTULOS_ABA: ReadonlyMap<string, string> = new Map([
  ['Resumo', 'Re-su-mo'],
  ['Texto integral', 'Tex-to in-te-gral'],
  ['Mapa mental', 'Ma-pa men-tal'],
  ['Fichamento', 'Fi-cha-men-to'],
  ['Mnemônicos', 'Mne-mô-ni-cos'],
  ['Petição comentada', 'Pe-ti-ção co-men-ta-da'],
  ['Quiz', 'Quiz']
]);
