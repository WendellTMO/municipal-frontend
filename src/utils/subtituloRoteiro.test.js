import { subtituloRoteiro, tituloRoteiro } from './subtituloRoteiro';

test('título traz o sentido e o horário', () => {
  expect(tituloRoteiro({ tipo: 'IDA', horario_inicio: '06:35:00' })).toBe('Ida · 06:35');
});

test('título sem horário mostra só o sentido', () => {
  expect(tituloRoteiro({ tipo: 'CIRCULAR' })).toBe('Circular');
});

test('subtítulo usa origem e destino', () => {
  expect(subtituloRoteiro({ origem: 'Galante', destino: 'UFCG' })).toBe('Galante → UFCG');
});

test('sem origem e destino não há subtítulo', () => {
  expect(subtituloRoteiro({ tipo: 'CIRCULAR' })).toBeNull();
});
