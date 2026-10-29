import { formatarTempo } from './formatarTempo';

test('formata minutos e segundos', () => {
  expect(formatarTempo(65)).toBe('01:05');
});

test('formata com horas quando passa de uma hora', () => {
  expect(formatarTempo(3725)).toBe('01:02:05');
});
