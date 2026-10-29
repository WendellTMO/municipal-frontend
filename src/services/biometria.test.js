const mockLeitor = { isSensorAvailable: jest.fn(), simplePrompt: jest.fn() };
jest.mock('react-native-biometrics', () => jest.fn(() => mockLeitor));
jest.mock('../utils/storage', () => {
  const dados = {};
  return {
    Storage: {
      getItem: jest.fn(async chave => (chave in dados ? dados[chave] : null)),
      setItem: jest.fn(async (chave, valor) => {
        dados[chave] = valor;
      }),
      removeItem: jest.fn(async chave => {
        delete dados[chave];
      }),
    },
  };
});

import {
  biometriaDisponivel,
  desligarNoLogout,
  gravarPreferencia,
  lerPreferencia,
  pedirBiometria,
  rotuloAtual,
} from './biometria';

test('disponível só quando o sensor responde available', async () => {
  mockLeitor.isSensorAvailable.mockResolvedValueOnce({ available: true });
  expect(await biometriaDisponivel()).toBe(true);
  mockLeitor.isSensorAvailable.mockResolvedValueOnce({ available: false });
  expect(await biometriaDisponivel()).toBe(false);
  mockLeitor.isSensorAvailable.mockRejectedValueOnce(new Error('sem sensor'));
  expect(await biometriaDisponivel()).toBe(false);
});

test('o rótulo segue o tipo que o aparelho informa', async () => {
  mockLeitor.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'FaceID' });
  await biometriaDisponivel();
  expect(rotuloAtual()).toBe('Face ID');
  mockLeitor.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'TouchID' });
  await biometriaDisponivel();
  expect(rotuloAtual()).toBe('Touch ID');
  mockLeitor.isSensorAvailable.mockResolvedValueOnce({ available: true, biometryType: 'Biometrics' });
  await biometriaDisponivel();
  expect(rotuloAtual()).toBe('a biometria do aparelho');
});

test('pedir biometria devolve false ao cancelar ou falhar', async () => {
  mockLeitor.simplePrompt.mockResolvedValueOnce({ success: true });
  expect(await pedirBiometria('Confirme')).toBe(true);
  mockLeitor.simplePrompt.mockResolvedValueOnce({ success: false });
  expect(await pedirBiometria('Confirme')).toBe(false);
  mockLeitor.simplePrompt.mockRejectedValueOnce(new Error('falhou'));
  expect(await pedirBiometria('Confirme')).toBe(false);
});

test('logout apaga o sim e mantém o nao', async () => {
  await gravarPreferencia('sim');
  expect(await lerPreferencia()).toBe('sim');
  await desligarNoLogout();
  expect(await lerPreferencia()).toBeNull();
  await gravarPreferencia('nao');
  await desligarNoLogout();
  expect(await lerPreferencia()).toBe('nao');
});
