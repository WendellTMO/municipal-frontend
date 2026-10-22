import { dayLabel } from './dayLabel';

const agora = new Date(2026, 9, 22, 15, 0); // quinta, 22/10/2026

test('HOJE e AMANHÃ', () => {
  expect(dayLabel('2026-10-22', agora)).toBe('HOJE');
  expect(dayLabel('2026-10-22T23:50:00', agora)).toBe('HOJE');
  expect(dayLabel('2026-10-23', agora)).toBe('AMANHÃ');
});

test('outros dias mostram o dia da semana e a data', () => {
  expect(dayLabel('2026-10-26', agora)).toBe('SEG 26/10');
  expect(dayLabel('2026-11-01', agora)).toBe('DOM 01/11');
});

test('data vazia devolve texto vazio', () => {
  expect(dayLabel('', agora)).toBe('');
  expect(dayLabel(undefined, agora)).toBe('');
});
