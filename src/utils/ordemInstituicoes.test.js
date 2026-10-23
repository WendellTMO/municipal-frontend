import {
  mesclarOrdem,
  montarListaPut,
  moverItem,
  ordemMudou,
  reordenarPontosPorInstituicao,
} from './ordemInstituicoes';

const ufcg = { id: 'u1', nome: 'UFCG' };
const uepb = { id: 'u2', nome: 'UEPB' };
const cesg = { id: 'u3', nome: 'CESG' };
const salva = [
  { instituicao_id: 'u2', nome: 'UEPB', ordem: 0 },
  { instituicao_id: 'u9', nome: 'IFPB', ordem: 1 },
  { instituicao_id: 'u1', nome: 'UFCG', ordem: 2 },
];

test('mesclarOrdem segue a ordem salva e deixa as novas por ultimo, em ordem estavel', () => {
  const dia = [cesg, ufcg, uepb, { id: null, nome: 'Outra' }];
  const nomes = mesclarOrdem(dia, salva).map(i => i.nome);
  expect(nomes).toEqual(['UEPB', 'UFCG', 'CESG', 'Outra']);
});

test('mesclarOrdem sem ordem salva mantem a ordem do dia', () => {
  expect(mesclarOrdem([ufcg, uepb], [])).toEqual([ufcg, uepb]);
});

test('mesclarOrdem casa por nome quando a instituicao do dia nao tem id', () => {
  const nomes = mesclarOrdem([{ id: null, nome: ' ufcg ' }, uepb], salva).map(i => i.nome);
  expect(nomes).toEqual(['UEPB', ' ufcg ']);
});

test('moverItem move para cima e para baixo sem alterar a lista original', () => {
  const lista = ['a', 'b', 'c', 'd'];
  expect(moverItem(lista, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  expect(moverItem(lista, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  expect(moverItem(lista, 1, 1)).toEqual(lista);
  expect(moverItem(lista, 9, 0)).toEqual(lista);
  expect(lista).toEqual(['a', 'b', 'c', 'd']);
});

test('ordemMudou compara a sequencia de nomes', () => {
  expect(ordemMudou([ufcg, uepb], [ufcg, uepb])).toBe(false);
  expect(ordemMudou([ufcg, uepb], [uepb, ufcg])).toBe(true);
});

test('montarListaPut poe as mostradas primeiro e as salvas ausentes depois na ordem relativa', () => {
  expect(montarListaPut([cesg, ufcg], salva)).toEqual(['u3', 'u1', 'u2', 'u9']);
});

test('montarListaPut ignora mostradas sem id e nao repete ids', () => {
  expect(montarListaPut([{ id: null, nome: 'X' }, ufcg, ufcg], [])).toEqual(['u1']);
});

test('reordenarPontosPorInstituicao troca so as paradas de instituicao, nas mesmas posicoes', () => {
  const pontos = [
    { id: 'p1', apelido: 'Praca', latitude: 0, longitude: 0, instituicao: null },
    { id: 'p2', apelido: 'UFCG', latitude: 0, longitude: 0, instituicao: ufcg },
    { id: 'p3', apelido: 'Terminal', latitude: 0, longitude: 0, instituicao: null },
    { id: 'p4', apelido: 'UEPB', latitude: 0, longitude: 0, instituicao: uepb },
  ];
  const ids = reordenarPontosPorInstituicao(pontos, [], salva).map(p => p.id);
  expect(ids).toEqual(['p1', 'p4', 'p3', 'p2']);
  const ordens = reordenarPontosPorInstituicao(pontos, [], salva).map(p => p.ordem);
  expect(ordens).toEqual([1, 2, 3, 4]);
});

test('reordenarPontosPorInstituicao sem ordem salva devolve os pontos como vieram', () => {
  const pontos = [{ id: 'p1', instituicao: ufcg }];
  expect(reordenarPontosPorInstituicao(pontos, [], [])).toBe(pontos);
});
