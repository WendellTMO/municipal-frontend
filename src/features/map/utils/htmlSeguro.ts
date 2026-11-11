// Texto vindo da API (apelido e nome de ponto) entra em HTML de mapa. Sem escapar, um apelido
// como <img onerror=...> executaria código na WebView de quem abre a rota.

const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escaparHtml(texto: unknown): string {
  return String(texto).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

// JSON.stringify não escapa "</script>", que fecharia a tag e deixaria o resto virar HTML.
// Trocar "<" pelo escape unicode mantém o mesmo texto para o JavaScript. Os separadores de linha
// e de parágrafo do Unicode quebram string literal em JavaScript antigo, então também são escapados.
const SEPARADORES_UNICODE = new RegExp('[' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');

function escapeUnicode(c: string): string {
  return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');
}

export function jsonParaScript(valor: unknown): string {
  return JSON.stringify(valor).replace(/</g, escapeUnicode).replace(SEPARADORES_UNICODE, escapeUnicode);
}
