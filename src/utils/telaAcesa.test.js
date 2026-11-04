import { NativeModules, Platform } from 'react-native';
import { manterTelaAcesa } from './telaAcesa';

jest.mock('react-native', () => ({ Platform: { OS: 'android' }, NativeModules: {} }));

test('no Android acende ao entrar e solta ao sair', () => {
  Platform.OS = 'android';
  NativeModules.TelaAcesa = { definir: jest.fn() };
  const soltar = manterTelaAcesa();
  expect(NativeModules.TelaAcesa.definir).toHaveBeenLastCalledWith(true);
  soltar();
  expect(NativeModules.TelaAcesa.definir).toHaveBeenLastCalledWith(false);
});

test('sem o módulo nativo não quebra', () => {
  Platform.OS = 'android';
  delete NativeModules.TelaAcesa;
  expect(() => manterTelaAcesa()()).not.toThrow();
});

test('na web pede a trava de tela e solta ao sair', async () => {
  Platform.OS = 'web';
  const release = jest.fn().mockResolvedValue();
  global.navigator = { wakeLock: { request: jest.fn().mockResolvedValue({ release }) } };
  global.document = { visibilityState: 'visible', addEventListener: jest.fn(), removeEventListener: jest.fn() };
  const soltar = manterTelaAcesa();
  await Promise.resolve();
  await Promise.resolve();
  expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
  soltar();
  expect(release).toHaveBeenCalled();
  expect(document.removeEventListener).toHaveBeenCalled();
});

test('na web sem Wake Lock não faz nada', () => {
  Platform.OS = 'web';
  global.navigator = {};
  expect(() => manterTelaAcesa()()).not.toThrow();
});
