import { distanciaMetros } from './coordenadas';

// Ponto da lista mais perto da posição, em linha reta. Ignora pontos sem coordenadas.
export const pontoMaisProximo = (pontos, latitude, longitude) => {
  let melhor = null;
  for (const ponto of pontos || []) {
    if (typeof ponto.latitude !== 'number' || typeof ponto.longitude !== 'number') continue;
    const metros = distanciaMetros(latitude, longitude, ponto.latitude, ponto.longitude);
    if (melhor === null || metros < melhor.metros) melhor = { ponto, metros };
  }
  return melhor;
};

// 80 m, 950 m, 1,2 km. Abaixo de 1 km arredonda de 10 em 10 metros.
export const formatarDistancia = metros => {
  if (metros >= 1000) return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
  return `${Math.max(10, Math.round(metros / 10) * 10)} m`;
};
