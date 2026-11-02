import { validarNovaSenha } from './senha';

test('senha vazia, curta e diferente da confirmação geram erro', () => {
  expect(validarNovaSenha('', '')).toBe('Digite a nova senha.');
  expect(validarNovaSenha('1234567', '1234567')).toBe('A senha deve ter pelo menos 8 caracteres.');
  expect(validarNovaSenha('12345678', '12345679')).toBe('As senhas não conferem.');
});

test('senha com 8 caracteres iguais na confirmação passa', () => {
  expect(validarNovaSenha('12345678', '12345678')).toBe('');
});
