// Rota visível agora e a função de navegar, para quem vive fora das telas (a barra inferior).
// Nativo: App.tsx alimenta com o NavigationContainer. Web: o SimpleNavigator mais interno.
let rotaAtual = null;
let navegador = null;
const ouvintes = new Set();

export const definirRotaAtual = nome => {
  if (nome === rotaAtual) return;
  rotaAtual = nome;
  ouvintes.forEach(avisar => avisar());
};

export const lerRotaAtual = () => rotaAtual;

export const assinarRotaAtual = avisar => {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
};

export const registrarNavegador = funcao => {
  navegador = funcao;
};

export const navegarGlobal = (nome, params) => {
  if (navegador) navegador(nome, params);
};
