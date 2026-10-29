import {
  alunoAindaABordo,
  devePerguntar,
  estaABordo,
  GPS_VALIDO_MS,
  presencaTravada,
  proximoContador,
} from './aBordo';

const aluno = {latitude: -7.23, longitude: -35.88};
const base = {
  confirmada: true,
  statusViagem: 'EM_ANDAMENTO',
  posicaoAluno: aluno,
  leituraEm: 1000,
  agora: 1000 + 10_000,
};

test('a bordo: confirmada, em andamento e GPS recente', () => {
  expect(estaABordo(base)).toBe(true);
});

test('não está a bordo sem confirmação, fora de andamento ou sem GPS', () => {
  expect(estaABordo({...base, confirmada: false})).toBe(false);
  expect(estaABordo({...base, statusViagem: 'AGENDADA'})).toBe(false);
  expect(estaABordo({...base, posicaoAluno: null})).toBe(false);
  expect(estaABordo({...base, leituraEm: null})).toBe(false);
});

test('leitura velha demais tira do estado a bordo', () => {
  expect(estaABordo({...base, agora: 1000 + GPS_VALIDO_MS})).toBe(true);
  expect(estaABordo({...base, agora: 1000 + GPS_VALIDO_MS + 1})).toBe(false);
});

test('presença travada só com confirmada e viagem em andamento', () => {
  expect(presencaTravada(true, 'EM_ANDAMENTO')).toBe(true);
  expect(presencaTravada(true, 'AGENDADA')).toBe(false);
  expect(presencaTravada(false, 'EM_ANDAMENTO')).toBe(false);
});

test('alunoAindaABordo respeita o limite', () => {
  const perto = {latitude: -7.2305, longitude: -35.88}; // ~55 m
  const longe = {latitude: -7.2330, longitude: -35.88}; // ~330 m
  expect(alunoAindaABordo(aluno, perto, 150)).toBe(true);
  expect(alunoAindaABordo(aluno, longe, 150)).toBe(false);
});

test('posição faltando não conta como fora', () => {
  expect(alunoAindaABordo(null, aluno, 150)).toBe(true);
  expect(alunoAindaABordo(aluno, null, 150)).toBe(true);
});

test('pergunta só depois de 2 checagens fora seguidas', () => {
  let c = proximoContador(0, false);
  expect(devePerguntar(c)).toBe(false);
  c = proximoContador(c, false);
  expect(devePerguntar(c)).toBe(true);
});

test('uma checagem a bordo zera o contador', () => {
  let c = proximoContador(0, false);
  c = proximoContador(c, true);
  expect(c).toBe(0);
  c = proximoContador(c, false);
  expect(devePerguntar(c)).toBe(false);
});
