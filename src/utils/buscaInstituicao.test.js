import { filtrarInstituicoes } from './buscaInstituicao';

const lista = [
  { id: '1', nome: 'Universidade Federal de Campina Grande', sigla: 'UFCG' },
  { id: '2', nome: 'Universidade Estadual da Paraíba', sigla: 'UEPB' },
  { id: '3', nome: 'Escola Municipal São José' },
];

test('sem texto devolve tudo', () => {
  expect(filtrarInstituicoes(lista, '')).toEqual(lista);
  expect(filtrarInstituicoes(lista, '   ')).toEqual(lista);
});

test('acha por pedaço do nome, sem diferenciar maiúscula nem acento', () => {
  expect(filtrarInstituicoes(lista, 'paraiba').map(i => i.id)).toEqual(['2']);
  expect(filtrarInstituicoes(lista, 'SAO jose').map(i => i.id)).toEqual(['3']);
});

test('acha pela sigla', () => {
  expect(filtrarInstituicoes(lista, 'ufcg').map(i => i.id)).toEqual(['1']);
});

test('várias palavras valem em qualquer ordem e todas precisam bater', () => {
  expect(filtrarInstituicoes(lista, 'grande campina').map(i => i.id)).toEqual(['1']);
  expect(filtrarInstituicoes(lista, 'universidade xyz')).toEqual([]);
});
