import { dataLocal, formatarData } from './dataLocal';

test.each([
  ['2026-10-28', '28/10/2026', 28, 9],
  ['2026-01-01', '01/01/2026', 1, 0],
  ['2026-12-31', '31/12/2026', 31, 11],
  ['2026-03-01', '01/03/2026', 1, 2],
  ['2026-02-28', '28/02/2026', 28, 1],
])('data só com dia %s fica no mesmo dia local', (entrada, texto, dia, mes) => {
  const d = dataLocal(entrada);
  expect(d.getDate()).toBe(dia);
  expect(d.getMonth()).toBe(mes);
  expect(d.getHours()).toBe(0);
  expect(formatarData(entrada)).toBe(texto);
});

test('timestamp com fuso continua um instante absoluto', () => {
  const d = dataLocal('2026-10-28T15:30:00Z');
  expect(d.getTime()).toBe(Date.UTC(2026, 9, 28, 15, 30));
});

test('timestamp sem fuso continua local', () => {
  const d = dataLocal('2026-10-28T08:15:00');
  expect(d.getDate()).toBe(28);
  expect(d.getHours()).toBe(8);
});

test('vazio ou inválido', () => {
  expect(formatarData('')).toBe('');
  expect(formatarData(undefined)).toBe('');
  expect(formatarData('lixo')).toBe('');
});
