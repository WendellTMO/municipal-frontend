import { aceitaPresenca, escolherPontoEmbarque } from './presenca';

test('usa o ponto de embarque do aluno e, sem ele, o primeiro ponto da rota', () => {
  expect(escolherPontoEmbarque({ ponto_embarque_id: 'p9' }, [{ id: 'p1' }])).toBe('p9');
  expect(escolherPontoEmbarque({}, [{ id: 'p1' }, { id: 'p2' }])).toBe('p1');
  expect(escolherPontoEmbarque({}, [])).toBeNull();
  expect(escolherPontoEmbarque({}, undefined)).toBeNull();
});

test('só viagem agendada ou em andamento aceita presença', () => {
  expect(aceitaPresenca('AGENDADA')).toBe(true);
  expect(aceitaPresenca('EM_ANDAMENTO')).toBe(true);
  expect(aceitaPresenca('FINALIZADA')).toBe(false);
  expect(aceitaPresenca('CANCELADA')).toBe(false);
});
