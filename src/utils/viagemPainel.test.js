import { situacaoViagem, ehDeHoje, horaCurta, ordenarPorHorario } from './viagemPainel';

const base = { motorista_nome: 'Carlos', veiculo_placa: 'ABC1D23' };

test('selo por status', () => {
  expect(situacaoViagem({ ...base, status: 'EM_ANDAMENTO' })).toEqual({ selo: 'Em andamento', tom: 'verde', aviso: null });
  expect(situacaoViagem({ ...base, status: 'AGENDADA' }).selo).toBe('Agendada');
  expect(situacaoViagem({ ...base, status: 'FINALIZADA' }).selo).toBe('Concluída');
  expect(situacaoViagem({ ...base, status: 'CANCELADA' }).selo).toBe('Cancelada');
});

test('sem motorista ou sem veículo vira Atenção em vermelho', () => {
  expect(situacaoViagem({ ...base, status: 'AGENDADA', motorista_nome: 'Sem Motorista' })).toEqual({
    selo: 'Atenção',
    tom: 'vermelho',
    aviso: 'Sem motorista',
  });
  expect(situacaoViagem({ ...base, status: 'AGENDADA', veiculo_placa: 'Sem Veículo' }).aviso).toBe('Sem veículo');
  expect(situacaoViagem({ ...base, status: 'AGENDADA', motorista_nome: null }).aviso).toBe('Sem motorista');
});

test('viagem concluída ou cancelada não pede atenção', () => {
  expect(situacaoViagem({ status: 'FINALIZADA', motorista_nome: 'Sem Motorista' }).aviso).toBeNull();
  expect(situacaoViagem({ status: 'CANCELADA', veiculo_placa: '' }).selo).toBe('Cancelada');
});

test('data de hoje, hora curta e ordenação', () => {
  const agora = new Date(2026, 9, 22, 10, 0);
  expect(ehDeHoje({ data: '2026-10-22' }, agora)).toBe(true);
  expect(ehDeHoje({ data: '2026-10-23T00:00:00' }, agora)).toBe(false);
  expect(horaCurta('07:30:00')).toBe('07:30');
  expect(horaCurta('2026-10-22T08:05:00')).toBe('08:05');
  expect(horaCurta(undefined)).toBe('--:--');
  const ordenadas = ordenarPorHorario([{ horario_inicio: '12:10:00' }, { horario_inicio: '06:30:00' }]);
  expect(ordenadas[0].horario_inicio).toBe('06:30:00');
});
