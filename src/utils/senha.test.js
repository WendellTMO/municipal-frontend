import { validarNovaSenha, validarTrocaDeSenha } from './senha';

test('senha vazia, curta e diferente da confirmação geram erro', () => {
  expect(validarNovaSenha('', '')).toBe('Digite a nova senha.');
  expect(validarNovaSenha('1234567', '1234567')).toBe('A senha deve ter pelo menos 8 caracteres.');
  expect(validarNovaSenha('12345678', '12345679')).toBe('As senhas não conferem.');
});

test('senha com 8 caracteres iguais na confirmação passa', () => {
  expect(validarNovaSenha('12345678', '12345678')).toBe('');
});

describe('validarTrocaDeSenha', () => {
  it('pede cada campo na ordem', () => {
    expect(validarTrocaDeSenha('', 'nova-senha-1', 'nova-senha-1')).toBe('Digite a senha atual.');
    expect(validarTrocaDeSenha('atual-123', '', '')).toBe('Digite a nova senha.');
  });

  it('recusa nova curta, longa demais, igual à atual ou diferente da confirmação', () => {
    expect(validarTrocaDeSenha('atual-123', 'curta', 'curta')).toMatch('pelo menos 8');
    expect(validarTrocaDeSenha('atual-123', 'a'.repeat(129), 'a'.repeat(129))).toMatch('no máximo 128');
    expect(validarTrocaDeSenha('atual-123', 'atual-123', 'atual-123')).toMatch('diferente da atual');
    expect(validarTrocaDeSenha('atual-123', 'nova-senha-1', 'nova-senha-2')).toMatch('não conferem');
  });

  it('aceita quando está tudo certo', () => {
    expect(validarTrocaDeSenha('atual-123', 'nova-senha-1', 'nova-senha-1')).toBe('');
  });
});
