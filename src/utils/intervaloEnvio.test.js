import { proximoIntervaloMs } from './intervaloEnvio';

const FALLBACK = 20000;

test('sem resposta ou sem o campo usa o fallback', () => {
  expect(proximoIntervaloMs(undefined, FALLBACK)).toBe(FALLBACK);
  expect(proximoIntervaloMs({}, FALLBACK)).toBe(FALLBACK);
  expect(proximoIntervaloMs({ intervalo_sugerido_segundos: 'x' }, FALLBACK)).toBe(FALLBACK);
});

test('valor fora da faixa fica entre 3 e 60 s', () => {
  expect(proximoIntervaloMs({ intervalo_sugerido_segundos: 1 }, FALLBACK)).toBe(3000);
  expect(proximoIntervaloMs({ intervalo_sugerido_segundos: 600 }, FALLBACK)).toBe(60000);
});

test('observadores true (5 s) e false (30 s)', () => {
  expect(proximoIntervaloMs({ observadores: true, intervalo_sugerido_segundos: 5 }, FALLBACK)).toBe(5000);
  expect(proximoIntervaloMs({ observadores: false, intervalo_sugerido_segundos: 30 }, FALLBACK)).toBe(30000);
});
