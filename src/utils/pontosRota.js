import { coordenadasValidas } from './coordenadas';

export const MAX_RESULTADOS = 8;

// Minúsculas e sem acento, para "Praça" casar com "praca".
export const semAcento = texto =>
  String(texto == null ? '' : texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const nomeDoPonto = ponto => ponto.nome || ponto.apelido || 'Ponto sem nome';

// Linha de baixo da lista: endereço quando existe, senão as coordenadas.
export const detalheDoPonto = ponto => {
  if (ponto.endereco) return ponto.endereco;
  if (ponto.latitude == null || ponto.longitude == null) return '';
  return `${Number(ponto.latitude).toFixed(5)}, ${Number(ponto.longitude).toFixed(5)}`;
};

// Pontos que contêm o termo no nome ou no endereço. Devolve só os `max` primeiros e o total achado.
export const filtrarPontos = (pontos, termo, max = MAX_RESULTADOS) => {
  const busca = semAcento(termo);
  if (busca === '') return { itens: [], total: 0 };
  const achados = [];
  for (const ponto of pontos) {
    const texto = semAcento(`${nomeDoPonto(ponto)} ${ponto.endereco || ''}`);
    if (texto.includes(busca)) achados.push(ponto);
  }
  return { itens: achados.slice(0, max), total: achados.length };
};

export const textoContagem = (total, universo) => {
  const resultados = total === 1 ? '1 resultado' : `${total} resultados`;
  return `${resultados} em ${universo} pontos`;
};

export const textoContinuar = n => `Continuar com ${n} ${n === 1 ? 'ponto' : 'pontos'}`;

// Decide se o texto do campo único é um par "lat, lng" (ponto ou vírgula decimal) ou um endereço.
// Só vira coordenada quando o texto tem apenas números e separadores e os dois valores são válidos.
export const interpretarEntrada = texto => {
  const limpo = String(texto == null ? '' : texto).trim();
  if (limpo === '') return { tipo: 'vazio' };
  if (/^[\s\d+\-.,;]+$/.test(limpo)) {
    const numeros = limpo.match(/[+-]?\d+(?:[.,]\d+)?/g) || [];
    if (numeros.length === 2) {
      const coords = coordenadasValidas(numeros[0], numeros[1]);
      if (coords) return { tipo: 'coordenadas', ...coords };
    }
  }
  return { tipo: 'endereco', texto: limpo };
};

// Nome sugerido para um ponto solto no mapa ou digitado por coordenada.
export const nomeSugeridoCoordenadas = ({ latitude, longitude }) =>
  `Ponto ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

// Renumera o campo `ordem` pela posição (1, 2, 3...) sem mexer nos objetos originais.
export const renumerar = pontos => {
  const resultado = [];
  for (let i = 0; i < pontos.length; i++) {
    resultado.push({ ...pontos[i], ordem: i + 1 });
  }
  return resultado;
};
