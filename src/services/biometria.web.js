/**
 * Na web não há biometria: tudo é no-op e a interface fica escondida.
 * Só em desenvolvimento, ?biometria=mock simula um aparelho com biometria
 * (?biometria=falha simula biometria que falha) para pré-visualizar as telas.
 * O bloco some do build de produção porque NODE_ENV é substituído no webpack.
 */
const simulacao = () => {
  if (process.env.NODE_ENV === 'production') return null;
  if (typeof window === 'undefined') return null;
  const valor = new URLSearchParams(window.location.search).get('biometria');
  if (valor === 'mock' || valor === 'falha') return valor;
  return null;
};

const CHAVE = 'biometria_preferencia';

export const biometriaDisponivel = async () => simulacao() !== null;

export const pedirBiometria = async () => simulacao() === 'mock';

export const lerPreferencia = async () => {
  if (simulacao() === null) return null;
  const valor = window.localStorage.getItem(CHAVE);
  return valor === 'sim' || valor === 'nao' ? valor : null;
};

export const gravarPreferencia = async valor => {
  if (simulacao() === null) return;
  window.localStorage.setItem(CHAVE, valor);
};

export const desligarNoLogout = async () => {
  if (simulacao() === null) return;
  if (window.localStorage.getItem(CHAVE) === 'sim') window.localStorage.removeItem(CHAVE);
};
