// Paradas que o ônibus ainda não visitou, na ordem da rota. `visitados` são os ids que o backend
// devolve junto com a posição. Sem a lista (backend antigo) todas continuam pendentes.
export const paradasPendentes = (pontos, visitados) => {
  const jaFoi = new Set(visitados || []);
  const pendentes = [];
  for (const ponto of pontos || []) {
    if (!jaFoi.has(ponto.id)) pendentes.push(ponto);
  }
  return pendentes;
};

// Evita renderizar de novo a cada leitura quando a lista de visitados não mudou.
export const mesmaLista = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
