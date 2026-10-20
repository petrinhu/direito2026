/**
 * jsdom 25 tem HTMLDialogElement, mas não implementa showModal() nem close().
 * Este polyfill é o mínimo que o componente observa: o atributo `open` e o
 * evento `close`. Não reproduz foco preso nem ::backdrop; isso é do navegador
 * e fica para o QA visual. Só instala o que faltar (guarda por typeof).
 */
export function instalarPolyfillDialog(): void {
  const proto = window.HTMLDialogElement.prototype;
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLElement): void {
      this.setAttribute('open', '');
    };
  }
  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLElement): void {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
