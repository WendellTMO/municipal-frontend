// Na web a sessão é um cookie httpOnly, que o JavaScript não lê. O backend só troca o token
// por cookie quando o pedido leva X-Sessao-Cookie, e as escritas precisam repetir o cookie de
// CSRF no cabeçalho X-CSRF-TOKEN. No app nativo nada disso se aplica: o token vai no cabeçalho.

const METODOS_QUE_SO_LEEM = ['GET', 'HEAD', 'OPTIONS'];

export function valorDoCookie(cookies, nome) {
  const pares = String(cookies || '').split(';');
  for (const par of pares) {
    const [chave, ...resto] = par.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return null;
}

export function cabecalhosDaSessao(metodo, cookies, porCookie) {
  if (!porCookie) return {};
  const cabecalhos = { 'X-Sessao-Cookie': '1' };
  if (METODOS_QUE_SO_LEEM.includes(String(metodo).toUpperCase())) return cabecalhos;
  const csrf = valorDoCookie(cookies, 'csrf_access_token');
  if (csrf) cabecalhos['X-CSRF-TOKEN'] = csrf;
  return cabecalhos;
}
