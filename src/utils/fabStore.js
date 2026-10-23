// Posição escolhida pelo usuário para o botão de feedback: uma só para todas as
// instâncias (camada da raiz e cada Modal) e persistente. As instâncias leem e escrevem
// aqui; antes cada uma guardava a sua, e arrastar dentro de um Modal não mudava o da raiz.
import { Storage } from './storage';
import { posicaoGuardada } from './fabPosicao';

export const CHAVE_POSICAO = 'feedback_fab_posicao';

let posicao = null;
let carregou = false;
const ouvintes = new Set();

const avisar = () => {
  ouvintes.forEach(fn => fn());
};

const carregar = async () => {
  if (carregou) return;
  carregou = true;
  try {
    const salva = posicaoGuardada(await Storage.getItem(CHAVE_POSICAO));
    // Se o usuário já arrastou antes de a leitura terminar, a escolha dele vale.
    if (salva && !posicao) {
      posicao = salva;
      avisar();
    }
  } catch (e) {
    // sem storage fica na posição padrão
  }
};

export const lerPosicao = () => posicao;

export const definirPosicao = nova => {
  posicao = nova;
  avisar();
  Storage.setItem(CHAVE_POSICAO, nova);
};

export const assinarPosicao = fn => {
  carregar();
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
};

// Só para testes.
export const reiniciarFabStore = () => {
  posicao = null;
  carregou = false;
  ouvintes.clear();
};
