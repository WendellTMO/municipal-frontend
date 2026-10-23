import {
  agruparAlunos,
  filtrarPorInstituicao,
  instituicaoDoAlunoGestor,
  instituicaoDoAlunoMotorista,
} from './alunosInstituicao';

const alunos = [
  { id: 1, escola: 'UFCG', instituicao_id: 'u' },
  { id: 2, escola: 'UEPB', instituicao_id: 'e' },
  { id: 3, escola: 'UFCG', instituicao_id: 'u' },
  { id: 4, escola: null },
];

test('agrupa por instituição, ordena por nome e deixa Sem instituição por último', () => {
  const secoes = agruparAlunos(alunos, instituicaoDoAlunoGestor);
  expect(secoes.map(s => [s.nome, s.alunos.length])).toEqual([
    ['UEPB', 1],
    ['UFCG', 2],
    ['Sem instituição', 1],
  ]);
});

test('filtra por chave e por sem instituição', () => {
  expect(filtrarPorInstituicao(alunos, 'u', instituicaoDoAlunoGestor).map(a => a.id)).toEqual([1, 3]);
  expect(filtrarPorInstituicao(alunos, '__sem__', instituicaoDoAlunoGestor).map(a => a.id)).toEqual([4]);
  expect(filtrarPorInstituicao(alunos, null, instituicaoDoAlunoGestor)).toHaveLength(4);
});

test('adaptador do motorista lê aluno.instituicao', () => {
  const inst = instituicaoDoAlunoMotorista({ instituicao: { id: 'i', nome: 'UFCG', tipo: 'Universidade Pública' } });
  expect(inst).toEqual({ chave: 'i', nome: 'UFCG', tipo: 'Universidade Pública' });
  expect(instituicaoDoAlunoMotorista({ nome: 'x' })).toBeNull();
});
