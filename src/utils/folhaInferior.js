export const ALCA_ALTURA = 32;

// Altura visível da folha em cada posição. recolhida: só a alça e o rodapé fixo.
export const alturaVisivel = (snap, alturaTela, reservaTopo, alturaRodape) => {
  const expandida = Math.max(alturaTela - reservaTopo, ALCA_ALTURA + alturaRodape);
  if (snap === 'recolhida') return ALCA_ALTURA + alturaRodape;
  if (snap === 'meia') return Math.min(Math.round(alturaTela * 0.5), expandida);
  return expandida;
};

// Posição mais próxima do ponto onde o dedo soltou (visivel em px), somando um empurrão pela velocidade.
export const snapMaisProximo = (visivel, alturas) => {
  let melhor = 'recolhida';
  let menorDistancia = Infinity;
  const nomes = ['recolhida', 'meia', 'expandida'];
  for (const nome of nomes) {
    const distancia = Math.abs(alturas[nome] - visivel);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      melhor = nome;
    }
  }
  return melhor;
};

// Toque simples na alça: recolhida abre em meia, meia abre em expandida, expandida volta para meia.
export const proximoSnapNoToque = snap => {
  if (snap === 'recolhida') return 'meia';
  if (snap === 'meia') return 'expandida';
  return 'meia';
};
