import {
  COR_DESEMBARQUE,
  COR_EMBARQUE,
  COR_PINO_NORMAL,
  corDoPino,
  linhaDoTrajeto,
  pinoEscolhaHtml,
  rotuloDoPino,
} from './pinosEscolha';

const pontos = [
  { id: 'a', latitude: 1, longitude: 2 },
  { id: 'b', latitude: 3, longitude: 4 },
  { id: 'c', latitude: 5, longitude: 6 },
];

test('o trajeto liga só embarque e desembarque, sem as paradas do meio', () => {
  expect(linhaDoTrajeto(pontos, 'a', 'c')).toEqual([
    { latitude: 1, longitude: 2 },
    { latitude: 5, longitude: 6 },
  ]);
});

test('sem os dois pontos escolhidos não há trajeto', () => {
  expect(linhaDoTrajeto(pontos, 'a', null)).toEqual([]);
  expect(linhaDoTrajeto(pontos, null, 'c')).toEqual([]);
  expect(linhaDoTrajeto(pontos, 'a', 'zz')).toEqual([]);
});

test('pinos escolhidos levam E e D, os outros o número da ordem', () => {
  expect(rotuloDoPino('a', 0, 'a', 'c')).toBe('E');
  expect(rotuloDoPino('c', 2, 'a', 'c')).toBe('D');
  expect(rotuloDoPino('b', 1, 'a', 'c')).toBe('2');
  expect(corDoPino('a', 'a', 'c')).toBe(COR_EMBARQUE);
  expect(corDoPino('c', 'a', 'c')).toBe(COR_DESEMBARQUE);
  expect(corDoPino('b', 'a', 'c')).toBe(COR_PINO_NORMAL);
});

test('o anel dourado de 40 px fica centrado no pino de 34 px', () => {
  const html = pinoEscolhaHtml({ rotulo: '2', cor: COR_PINO_NORMAL, anelDourado: true, etiqueta: '300 m' });
  expect(html).toContain('left:-3px;top:-3px;width:40px;height:40px');
  expect(html).toContain('300 m');
  expect(pinoEscolhaHtml({ rotulo: '2', cor: COR_PINO_NORMAL, anelDourado: false, etiqueta: null })).not.toContain('F5A623');
});
