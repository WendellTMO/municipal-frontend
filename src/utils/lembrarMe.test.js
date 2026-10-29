import { deveEncerrarSessao } from './lembrarMe';

test('sessão sem Lembrar-me é encerrada ao abrir o app', () => {
  expect(deveEncerrarSessao({ temToken: true, sessaoTemporaria: true })).toBe(true);
});

test('sessão com Lembrar-me continua', () => {
  expect(deveEncerrarSessao({ temToken: true, sessaoTemporaria: false })).toBe(false);
  expect(deveEncerrarSessao({ temToken: true, sessaoTemporaria: null })).toBe(false);
});

test('sem sessão guardada não há o que encerrar', () => {
  expect(deveEncerrarSessao({ temToken: false, sessaoTemporaria: true })).toBe(false);
});
