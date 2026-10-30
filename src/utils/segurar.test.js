import { criarSegurar } from './segurar';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('dispara depois do tempo parado', () => {
  const aoSegurar = jest.fn();
  const s = criarSegurar({ esperaMs: 450, aoSegurar });
  s.iniciar();
  jest.advanceTimersByTime(449);
  expect(aoSegurar).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(aoSegurar).toHaveBeenCalledTimes(1);
  expect(s.segurou()).toBe(true);
});

test('soltar ou arrastar antes cancela', () => {
  const aoSegurar = jest.fn();
  const s = criarSegurar({ esperaMs: 450, aoSegurar });
  s.iniciar();
  jest.advanceTimersByTime(300);
  s.cancelar();
  jest.advanceTimersByTime(1000);
  expect(aoSegurar).not.toHaveBeenCalled();
  expect(s.segurou()).toBe(false);
});

test('um novo início zera o estado anterior', () => {
  const aoSegurar = jest.fn();
  const s = criarSegurar({ esperaMs: 100, aoSegurar });
  s.iniciar();
  jest.advanceTimersByTime(100);
  s.iniciar();
  expect(s.segurou()).toBe(false);
});
