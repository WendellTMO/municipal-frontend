import { agruparConfirmadosPorInstituicao, instituicaoDaParada, montarParadas } from './paradasViagem';

const ufcg = { nome: 'UFCG', tipo: 'Universidade Pública', latitude: -7.21676, longitude: -35.9082 };
const uepb = { nome: 'UEPB', tipo: 'Universidade Pública', latitude: -7.2326, longitude: -35.8943 };

test('parada na coordenada da instituição vira instituição', () => {
  const ponto = { latitude: -7.21676, longitude: -35.9082 };
  expect(instituicaoDaParada(ponto, [uepb, ufcg])).toEqual({ id: null, nome: 'UFCG', tipo: 'Universidade Pública', endereco: null });
});

test('parada longe de qualquer instituição não é instituição', () => {
  expect(instituicaoDaParada({ latitude: -7.2895, longitude: -35.952 }, [ufcg, uepb])).toBeNull();
});

test('campo instituicao do ponto tem prioridade', () => {
  expect(instituicaoDaParada({ latitude: 0, longitude: 0, instituicao: 'Escola X' }, [])).toEqual({
    id: null,
    nome: 'Escola X',
    tipo: null,
    endereco: null,
  });
});

test('campo instituicao do ponto como objeto do backend', () => {
  const ponto = { latitude: 0, longitude: 0, instituicao: { id: 'i', nome: 'UFCG', tipo: 'Universidade Pública' } };
  expect(instituicaoDaParada(ponto, [])).toEqual({ id: 'i', nome: 'UFCG', tipo: 'Universidade Pública', endereco: null });
});

test('estados das paradas seguem os pontos visitados', () => {
  const pontos = [{ id: 'a', latitude: 1, longitude: 1 }, { id: 'b', latitude: 2, longitude: 2 }, { id: 'c', latitude: 3, longitude: 3 }];
  const estados = montarParadas(pontos, ['a'], []).map(p => p.estado);
  expect(estados).toEqual(['feita', 'proxima', 'pendente']);
  expect(montarParadas(pontos, ['a', 'b', 'c'], []).map(p => p.estado)).toEqual(['feita', 'feita', 'feita']);
});

test('ponto visitado fora de ordem fica feito e a próxima continua sendo a primeira não feita', () => {
  const pontos = [{ id: 'a', latitude: 1, longitude: 1 }, { id: 'b', latitude: 2, longitude: 2 }, { id: 'c', latitude: 3, longitude: 3 }];
  expect(montarParadas(pontos, ['c'], []).map(p => p.estado)).toEqual(['proxima', 'pendente', 'feita']);
  expect(montarParadas(pontos, ['b'], []).map(p => p.estado)).toEqual(['proxima', 'feita', 'pendente']);
});

const ufcgAluno = { nome: 'UFCG', tipo: 'Universidade Pública' };

test('agrupa só os confirmados por instituição e ordena por quantidade', () => {
  const alunos = [
    { confirmacao: true, instituicao: { nome: 'UEPB', tipo: 'Universidade Pública' } },
    { confirmacao: true, instituicao: ufcgAluno },
    { confirmacao: true, instituicao: ufcgAluno },
    { confirmacao: false, instituicao: ufcgAluno },
  ];
  const grupos = agruparConfirmadosPorInstituicao(alunos);
  expect(grupos.map(g => [g.nome, g.quantidade])).toEqual([['UFCG', 2], ['UEPB', 1]]);
  expect(grupos[0].tipo).toBe('Universidade Pública');
});

test('sem instituição usa ponto_destino e depois cai em Sem instituição informada', () => {
  const alunos = [
    { confirmacao: true, ponto_destino: 'Escola X' },
    { confirmacao: true },
    { confirmacao: true },
  ];
  const grupos = agruparConfirmadosPorInstituicao(alunos);
  expect(grupos.map(g => [g.nome, g.quantidade])).toEqual([['Escola X', 1], ['Sem instituição informada', 2]]);
});

test('ninguém confirmou devolve lista vazia', () => {
  expect(agruparConfirmadosPorInstituicao([{ confirmacao: false }])).toEqual([]);
  expect(agruparConfirmadosPorInstituicao(undefined)).toEqual([]);
});
