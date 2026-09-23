import { createElement } from 'react';

/** Prévia do relatório dentro da página (na web, abrir janelas ou imprimir pode ser bloqueado). */
export function HtmlPreview({ html }: { html: string }) {
  return createElement('iframe', {
    srcDoc: html,
    title: 'Prévia do relatório',
    style: { width: '100%', height: 720, border: '1px solid #DCD4C4', borderRadius: 16, background: '#FFFDF9' },
  });
}
