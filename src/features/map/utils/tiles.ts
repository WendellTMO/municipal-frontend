// Servidor padrão do OpenStreetMap: bem mais rápido que o tile.openstreetmap.fr/hot.
// Política de uso: https://operations.osmfoundation.org/policies/tiles/ (atribuição
// obrigatória e User-Agent identificável, que o WebView nativo já envia).
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const TILE_MAX_ZOOM = 19;

// Poucos pedidos durante o gesto e margem maior de blocos já carregados.
export const TILE_OPCOES_CELULAR = {
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 4,
  detectRetina: false,
};
