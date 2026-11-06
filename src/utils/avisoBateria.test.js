import { deveMostrarAvisoDeBateria } from './avisoBateria';

test('aparece no Android até o motorista responder', () => {
  expect(deveMostrarAvisoDeBateria('android', null)).toBe(true);
  expect(deveMostrarAvisoDeBateria('android', true)).toBe(false);
});

test('não aparece na web nem no iOS', () => {
  expect(deveMostrarAvisoDeBateria('web', null)).toBe(false);
  expect(deveMostrarAvisoDeBateria('ios', null)).toBe(false);
});
