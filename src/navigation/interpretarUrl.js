// Interpreta o caminho da URL aberta na web. Devolve {route, params} ou null.
export const interpretarUrl = (pathname, search) => {
  const caminho = (pathname || '').replace(/\/+$/, '');

  if (caminho.indexOf('/convite/') === 0) {
    const token = decodeURIComponent(caminho.slice('/convite/'.length));
    if (token && token.indexOf('/') === -1) {
      return {route: 'ConvitePin', params: {token}};
    }
    return null;
  }

  if (caminho === '/guardian-consent') {
    const token = new URLSearchParams(search || '').get('token');
    if (token) {
      return {route: 'ConsentimentoResponsavel', params: {token}};
    }
  }

  return null;
};
