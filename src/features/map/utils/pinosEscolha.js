// Pinos do mapa de escolha de pontos: o mesmo desenho no navegador (Leaflet) e no celular (WebView).

export const COR_PINO_NORMAL = '#FFFFFF';
export const COR_EMBARQUE = '#16A34A';
export const COR_DESEMBARQUE = '#DC2626';
export const COR_DESTAQUE = '#F5A623';

export const corDoPino = (id, embarqueId, desembarqueId) => {
  if (id === embarqueId) return COR_EMBARQUE;
  if (id === desembarqueId) return COR_DESEMBARQUE;
  return COR_PINO_NORMAL;
};

// E e D nos pontos escolhidos; os outros levam o número da ordem na rota.
export const rotuloDoPino = (id, indice, embarqueId, desembarqueId) => {
  if (id === embarqueId) return 'E';
  if (id === desembarqueId) return 'D';
  return String(indice + 1);
};

// O trajeto pelas ruas liga só embarque e desembarque; as paradas do meio ficam de fora.
export const linhaDoTrajeto = (pontos, embarqueId, desembarqueId) => {
  if (!embarqueId || !desembarqueId) return [];
  let embarque = null;
  let desembarque = null;
  for (const ponto of pontos) {
    if (ponto.id === embarqueId) embarque = ponto;
    if (ponto.id === desembarqueId) desembarque = ponto;
  }
  if (!embarque || !desembarque) return [];
  return [
    {latitude: embarque.latitude, longitude: embarque.longitude},
    {latitude: desembarque.latitude, longitude: desembarque.longitude},
  ];
};

export const pinoEscolhaHtml = ({rotulo, cor, anelDourado, etiqueta}) => {
  const escolhido = cor !== COR_PINO_NORMAL;
  const texto = escolhido ? '#FFFFFF' : '#156EF2';
  const borda = escolhido ? '#FFFFFF' : '#156EF2';
  const anel = anelDourado
    ? `<div style="position:absolute;left:-3px;top:-3px;width:40px;height:40px;border-radius:50%;border:4px solid ${COR_DESTAQUE};box-sizing:border-box"></div>`
    : '';
  const chip = etiqueta
    ? `<div style="position:absolute;top:40px;left:50%;transform:translateX(-50%);background:${COR_DESTAQUE};color:#1E293B;font:800 12px sans-serif;padding:2px 8px;border-radius:10px;white-space:nowrap">${etiqueta}</div>`
    : '';
  return `<div style="position:relative;width:34px;height:34px">${anel}<div style="position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50%;background:${cor};border:3px solid ${borda};box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box;color:${texto};font:800 14px sans-serif;display:flex;align-items:center;justify-content:center">${rotulo}</div>${chip}</div>`;
};
