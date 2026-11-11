import { coordenadaValida } from './coordenadaValida';

test('aceita latitude e longitude dentro da faixa', () => {
  expect(coordenadaValida(-7.23, -35.88)).toBe(true);
  expect(coordenadaValida(90, 180)).toBe(true);
  expect(coordenadaValida(0, 0)).toBe(true);
});

test('recusa fora da faixa', () => {
  expect(coordenadaValida(91, 0)).toBe(false);
  expect(coordenadaValida(0, -181)).toBe(false);
});

test('recusa o que não é número finito', () => {
  expect(coordenadaValida('-7.23', -35.88)).toBe(false);
  expect(coordenadaValida(NaN, 0)).toBe(false);
  expect(coordenadaValida(Infinity, 0)).toBe(false);
  expect(coordenadaValida(null, undefined)).toBe(false);
});
