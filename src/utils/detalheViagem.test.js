import { resumoDaViagem, textoDuracao } from './detalheViagem';

const feita = {
  inicio_real: '2026-11-02T10:00:00+00:00',
  horario_fim: '2026-11-02T10:45:00+00:00',
  km_real: 12.5,
  total_alunos: 10,
  alunos_confirmados_count: 7,
  pontos: [
    { ordem: 2, apelido: 'B', visitado: false },
    { ordem: 1, apelido: 'A', visitado: true, chegada_real: '2026-11-02T10:05:00+00:00' },
  ],
};

test('duração em minutos e em horas', () => {
  expect(textoDuracao(45)).toBe('45 min');
  expect(textoDuracao(60)).toBe('1 h');
  expect(textoDuracao(95)).toBe('1 h 35 min');
  expect(textoDuracao(null)).toBeNull();
});

test('viagem feita pelo app mostra duração, km e paradas em ordem, com a chegada só nas visitadas', () => {
  const r = resumoDaViagem(feita, 'feita');
  expect(r.duracao).toBe('45 min');
  expect(r.km).toBe(12.5);
  expect(r.paradas.map(p => [p.ordem, p.apelido, p.visitada])).toEqual([[1, 'A', true], [2, 'B', false]]);
  expect(r.paradas[0].chegada).toMatch(/^\d{2}:\d{2}$/);
  expect(r.paradas[1].chegada).toBeNull();
  expect(r.confirmados).toBe(7);
  expect(r.inscritos).toBe(10);
});

test('feita sem app, cancelada e não realizada não inventam horários, distância nem paradas', () => {
  for (const situacao of ['feita_sem_app', 'cancelada', 'nao_realizada']) {
    const r = resumoDaViagem(feita, situacao);
    expect(r.saida).toBeNull();
    expect(r.duracao).toBeNull();
    expect(r.km).toBeNull();
    expect(r.paradas).toEqual([]);
  }
});

test('sem dados de horário nem de alunos usa vazio e zero', () => {
  const r = resumoDaViagem({}, 'feita');
  expect(r.saida).toBeNull();
  expect(r.confirmados).toBe(0);
  expect(r.paradas).toEqual([]);
});
