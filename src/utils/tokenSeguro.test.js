import * as Keychain from 'react-native-keychain';
import { gravarToken, lerToken, apagarToken } from './tokenSeguro';
import { Storage, STORAGE_KEYS } from './storage';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));
jest.mock('./storage', () => ({
  Storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
  STORAGE_KEYS: { ACCESS_TOKEN: 'access_token' },
}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

test('grava no cofre e limpa o armazenamento comum', async () => {
  await gravarToken('abc');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith('buska', 'abc', { service: 'buska.token' });
  expect(Storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
  expect(Storage.setItem).not.toHaveBeenCalled();
});

test('lê do cofre sem tocar no armazenamento comum', async () => {
  Keychain.getGenericPassword.mockResolvedValue({ username: 'buska', password: 'abc' });
  expect(await lerToken()).toBe('abc');
  expect(Storage.getItem).not.toHaveBeenCalled();
});

test('token antigo do armazenamento comum passa para o cofre', async () => {
  Keychain.getGenericPassword.mockResolvedValue(false);
  Storage.getItem.mockResolvedValue('velho');
  expect(await lerToken()).toBe('velho');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith('buska', 'velho', { service: 'buska.token' });
  expect(Storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
});

test('sem token em lugar nenhum devolve null', async () => {
  Keychain.getGenericPassword.mockResolvedValue(false);
  Storage.getItem.mockResolvedValue(null);
  expect(await lerToken()).toBeNull();
});

test('cofre que falha ao gravar mantém o login no armazenamento comum', async () => {
  Keychain.setGenericPassword.mockRejectedValue(new Error('keystore'));
  await gravarToken('abc');
  expect(Storage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'abc');
});

test('apagar limpa o cofre e o armazenamento comum', async () => {
  await apagarToken();
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({ service: 'buska.token' });
  expect(Storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
});
