import { subtituloRoteiro } from './subtituloRoteiro';

test('usa origem, destino e horário', () => {
  const v = { origem: 'Galante', destino: 'UFCG', tipo: 'IDA', horario_inicio: '06:35:00' };
  expect(subtituloRoteiro(v)).toBe('Galante → UFCG · 06:35');
});

test('sem origem e destino mostra o sentido', () => {
  expect(subtituloRoteiro({ tipo: 'CIRCULAR', horario_inicio: '12:00:00' })).toBe('Circular · 12:00');
});
