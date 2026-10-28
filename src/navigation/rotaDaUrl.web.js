import {interpretarUrl} from './interpretarUrl';

export const lerRotaDaUrl = () => {
  if (typeof window === 'undefined') return null;
  return interpretarUrl(window.location.pathname, window.location.search);
};

// Sem isso o refresh repetiria o link já usado.
export const limparUrl = () => {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', '/');
};
