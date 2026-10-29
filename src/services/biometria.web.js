/**
 * Na web não há biometria: tudo é no-op e a interface fica escondida.
 * Só em desenvolvimento, ?biometria=mock simula um aparelho com biometria
 * (?biometria=falha simula biometria que falha, ?biometria=espera deixa a tela aguardando) para pré-visualizar as telas.
 * O bloco some do build de produção porque NODE_ENV é substituído no webpack.
 */
const simulacao = () => {
  if (process.env.NODE_ENV === 'production') return null;
  if (typeof window === 'undefined') return null;
  const valor = new URLSearchParams(window.location.search).get('biometria');
  if (valor === 'mock' || valor === 'falha' || valor === 'espera') return valor;
  return null;
};

import { iconeBiometria, rotuloBiometria } from '../utils/biometriaFluxo';

const CHAVE = 'biometria_preferencia';

// Só em desenvolvimento, ?tipo=faceid ou ?tipo=touchid simula o tipo do iPhone.
// Lido uma vez no carregamento, porque a navegação do app tira a query da URL.
const tipoSimulado = (() => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null;
  const valor = new URLSearchParams(window.location.search).get('tipo');
  if (valor === 'faceid') return 'FaceID';
  if (valor === 'touchid') return 'TouchID';
  return null;
})();

export const rotuloAtual = () => rotuloBiometria(tipoSimulado);
export const iconeAtual = () => iconeBiometria(tipoSimulado);

export const biometriaDisponivel = async () => simulacao() !== null;

// espera: o prompt nunca responde, para ver a tela enquanto aguarda a biometria.
export const pedirBiometria = () =>
  simulacao() === 'espera' ? new Promise(() => {}) : Promise.resolve(simulacao() === 'mock');

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
