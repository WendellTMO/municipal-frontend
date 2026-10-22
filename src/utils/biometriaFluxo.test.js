import { deveBloquear, deveOferecer } from './biometriaFluxo';

test('pergunta só quando há biometria e nunca perguntou', () => {
  expect(deveOferecer({ disponivel: true, preferencia: null })).toBe(true);
  expect(deveOferecer({ disponivel: true, preferencia: 'sim' })).toBe(false);
  expect(deveOferecer({ disponivel: true, preferencia: 'nao' })).toBe(false);
  expect(deveOferecer({ disponivel: false, preferencia: null })).toBe(false);
});

test('pede biometria ao abrir só quando ativada e disponível', () => {
  expect(deveBloquear({ disponivel: true, preferencia: 'sim' })).toBe(true);
  expect(deveBloquear({ disponivel: true, preferencia: 'nao' })).toBe(false);
  expect(deveBloquear({ disponivel: true, preferencia: null })).toBe(false);
  expect(deveBloquear({ disponivel: false, preferencia: 'sim' })).toBe(false);
});
