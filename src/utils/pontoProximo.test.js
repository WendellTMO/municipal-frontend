import { formatarDistancia, pontoMaisProximo } from './pontoProximo';

const pontos = [
  { id: 'longe', apelido: 'Longe', latitude: -7.25, longitude: -35.9 },
  { id: 'perto', apelido: 'Perto', latitude: -7.2301, longitude: -35.8801 },
  { id: 'sem', apelido: 'Sem coordenadas' },
];

test('devolve o ponto mais perto e a distância em metros', () => {
  const r = pontoMaisProximo(pontos, -7.23, -35.88);
  expect(r.ponto.id).toBe('perto');
  expect(r.metros).toBeGreaterThan(10);
  expect(r.metros).toBeLessThan(30);
});

test('sem pontos com coordenadas não há sugestão', () => {
  expect(pontoMaisProximo([], -7.23, -35.88)).toBeNull();
  expect(pontoMaisProximo([{ id: 'x' }], -7.23, -35.88)).toBeNull();
  expect(pontoMaisProximo(null, -7.23, -35.88)).toBeNull();
});

test('formata a distância para o aluno', () => {
  expect(formatarDistancia(4)).toBe('10 m');
  expect(formatarDistancia(304)).toBe('300 m');
  expect(formatarDistancia(1234)).toBe('1,2 km');
});
