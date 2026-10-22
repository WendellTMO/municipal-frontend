import { distanceInMeters } from '../features/map/utils/geo';

// A rota do motorista não informa quais paradas são escolas: GET /rotas/{id}/pontos não
// traz o campo instituicao. Quando o ponto não traz, compara com as coordenadas das
// instituições cadastradas (GET /instituicoes/).
const RAIO_INSTITUICAO_M = 150;

export const instituicaoDaParada = (ponto, instituicoes) => {
  if (ponto.instituicao) return { nome: ponto.instituicao, tipo: null };
  let melhor = null;
  let menor = RAIO_INSTITUICAO_M;
  for (const inst of instituicoes) {
    if (typeof inst.latitude !== 'number' || typeof inst.longitude !== 'number') continue;
    const metros = distanceInMeters(
      { latitude: ponto.latitude, longitude: ponto.longitude },
      { latitude: inst.latitude, longitude: inst.longitude },
    );
    if (metros <= menor) {
      menor = metros;
      melhor = { nome: inst.nome, tipo: inst.tipo || null };
    }
  }
  return melhor;
};

// Cada parada com seu estado: feita (antes da próxima), proxima ou pendente.
export const montarParadas = (pontos, concluidas, instituicoes) => {
  const resultado = [];
  for (let i = 0; i < pontos.length; i++) {
    let estado = 'pendente';
    if (i < concluidas) estado = 'feita';
    else if (i === concluidas) estado = 'proxima';
    resultado.push({
      ponto: pontos[i],
      numero: i + 1,
      estado,
      instituicao: instituicaoDaParada(pontos[i], instituicoes),
    });
  }
  return resultado;
};
