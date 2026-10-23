import { formatarHora } from './formatarHora';

test('formatarHora tira os segundos de horário do dia', () => {
  expect(formatarHora('05:30:00')).toBe('05:30');
  expect(formatarHora('12:30')).toBe('12:30');
  expect(formatarHora('2026-10-22T08:05:00')).toBe('08:05');
});

test('formatarHora devolve --:-- sem valor', () => {
  expect(formatarHora(undefined)).toBe('--:--');
  expect(formatarHora(null)).toBe('--:--');
  expect(formatarHora('')).toBe('--:--');
});
