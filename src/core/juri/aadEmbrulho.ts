import { TAMANHO_SALT } from './cifra';
import { ErroCifra } from './erroCifra';

/*
 * AAD do embrulho da CEK: usuario ‖ salt ‖ versão (1 byte). PROVISÓRIO, decisão técnica
 * do orquestrador da fatia C4, pendente de ratificação pelo líder. A pesquisa §5.1 pede
 * uid ‖ kid ‖ versão, mas o contrato da API não entrega uid nem kid ao navegador antes
 * de conteudo.php; usuario e salt são o que o cliente já tem depois de sal.php. O salt
 * tem tamanho fixo, então a fronteira entre usuario e salt é única. Mudar esta função
 * muda todo embrulho: é versão nova.
 */
const VERSAO_EMBRULHO = 1;

export function aadDoEmbrulho(
  usuario: string,
  salt: Uint8Array<ArrayBuffer>
): Uint8Array<ArrayBuffer> {
  if (salt.byteLength !== TAMANHO_SALT) {
    throw new ErroCifra('entrada');
  }
  const bytesUsuario = new globalThis.TextEncoder().encode(usuario);
  const aad = new Uint8Array(bytesUsuario.byteLength + salt.byteLength + 1);
  aad.set(bytesUsuario, 0);
  aad.set(salt, bytesUsuario.byteLength);
  aad[aad.length - 1] = VERSAO_EMBRULHO;
  return aad;
}
