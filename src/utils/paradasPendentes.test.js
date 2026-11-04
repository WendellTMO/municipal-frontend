import { mesmaLista, paradasPendentes } from './paradasPendentes';

const pontos = [{ id: 'ufcg' }, { id: 'g1' }, { id: 'g2' }];

test('tira as paradas que o motorista já visitou e mantém a ordem', () => {
  expect(paradasPendentes(pontos, ['ufcg']).map(p => p.id)).toEqual(['g1', 'g2']);
  expect(paradasPendentes(pontos, ['g1']).map(p => p.id)).toEqual(['ufcg', 'g2']);
});

test('sem lista de visitados todas continuam pendentes', () => {
  expect(paradasPendentes(pontos, undefined)).toHaveLength(3);
  expect(paradasPendentes(undefined, ['ufcg'])).toEqual([]);
});

test('todas visitadas não deixa nenhuma pendente', () => {
  expect(paradasPendentes(pontos, ['ufcg', 'g1', 'g2'])).toEqual([]);
});

test('compara listas de ids', () => {
  expect(mesmaLista(['a', 'b'], ['a', 'b'])).toBe(true);
  expect(mesmaLista(['a'], ['a', 'b'])).toBe(false);
  expect(mesmaLista(['a', 'b'], ['b', 'a'])).toBe(false);
});
