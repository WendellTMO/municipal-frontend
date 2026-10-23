import { atrasoDoToque, escalaPressionado } from './toque';

test('só toques que navegam têm atraso', () => {
  expect(atrasoDoToque({ navega: true, reduzirMovimento: false })).toBe(100);
  expect(atrasoDoToque({ navega: false, reduzirMovimento: false })).toBe(0);
  expect(atrasoDoToque({ navega: undefined, reduzirMovimento: false })).toBe(0);
});

test('reduzir movimento remove atraso e escala', () => {
  expect(atrasoDoToque({ navega: true, reduzirMovimento: true })).toBe(0);
  expect(escalaPressionado(true)).toBe(1);
  expect(escalaPressionado(false)).toBe(0.97);
});
