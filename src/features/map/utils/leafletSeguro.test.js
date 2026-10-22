import { destruirMapa } from './leafletSeguro';

test('para animações, desliga eventos, limpa o zoom animado e remove', () => {
  const chamadas = [];
  const mapa = {
    _animatingZoom: true,
    stop: () => chamadas.push('stop'),
    off: () => chamadas.push('off'),
    remove: () => chamadas.push('remove'),
  };
  destruirMapa(mapa);
  expect(chamadas).toEqual(['stop', 'off', 'remove']);
  expect(mapa._animatingZoom).toBe(false);
});

test('não quebra se o mapa já está meio desmontado', () => {
  const mapa = {
    stop: () => {
      throw new Error('x');
    },
    remove: () => {
      throw new Error('y');
    },
  };
  expect(() => destruirMapa(mapa)).not.toThrow();
});
