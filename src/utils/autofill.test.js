import { NativeModules, Platform } from 'react-native';
import { confirmarFormularioDeLogin } from './autofill';

jest.mock('react-native', () => ({ Platform: { OS: 'android' }, NativeModules: {} }));

beforeEach(() => {
  Platform.OS = 'android';
  NativeModules.AutofillCommit = { commit: jest.fn() };
});

test('no Android chama o commit do módulo nativo', () => {
  confirmarFormularioDeLogin();
  expect(NativeModules.AutofillCommit.commit).toHaveBeenCalledTimes(1);
});

test('fora do Android não faz nada', () => {
  Platform.OS = 'ios';
  confirmarFormularioDeLogin();
  expect(NativeModules.AutofillCommit.commit).not.toHaveBeenCalled();
});

test('sem o módulo nativo não quebra', () => {
  delete NativeModules.AutofillCommit;
  expect(() => confirmarFormularioDeLogin()).not.toThrow();
});
