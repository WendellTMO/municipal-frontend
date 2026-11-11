import { valorDoCookie, cabecalhosDaSessao } from './sessaoCookie';

test('lê um cookie entre vários', () => {
  expect(valorDoCookie('a=1; csrf_access_token=abc%3D; b=2', 'csrf_access_token')).toBe('abc=');
});

test('cookie ausente ou texto vazio dá null', () => {
  expect(valorDoCookie('a=1', 'csrf_access_token')).toBeNull();
  expect(valorDoCookie('', 'csrf_access_token')).toBeNull();
  expect(valorDoCookie(undefined, 'csrf_access_token')).toBeNull();
});

test('no app nativo nenhum cabeçalho é acrescentado', () => {
  expect(cabecalhosDaSessao('post', 'csrf_access_token=abc', false)).toEqual({});
});

test('na web, leitura leva só o pedido de cookie', () => {
  expect(cabecalhosDaSessao('get', 'csrf_access_token=abc', true)).toEqual({
    'X-Sessao-Cookie': '1',
  });
});

test('na web, escrita leva também o CSRF', () => {
  expect(cabecalhosDaSessao('post', 'csrf_access_token=abc', true)).toEqual({
    'X-Sessao-Cookie': '1',
    'X-CSRF-TOKEN': 'abc',
  });
});

test('na web, escrita sem cookie de CSRF segue sem o cabeçalho', () => {
  expect(cabecalhosDaSessao('delete', '', true)).toEqual({ 'X-Sessao-Cookie': '1' });
});
