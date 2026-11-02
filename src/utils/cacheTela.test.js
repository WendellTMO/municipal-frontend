import { chaveDoCache, guardarCache, lerCache, limparCache } from './cacheTela';

afterEach(() => limparCache());

test('guarda e devolve o valor da chave', () => {
  const chave = chaveDoCache('u1', 'viagens');
  expect(lerCache(chave)).toBeUndefined();
  guardarCache(chave, [1, 2]);
  expect(lerCache(chave)).toEqual([1, 2]);
});

test('usuários diferentes não enxergam o dado um do outro', () => {
  guardarCache(chaveDoCache('u1', 'viagens'), ['do u1']);
  expect(lerCache(chaveDoCache('u2', 'viagens'))).toBeUndefined();
});

test('limpar esvazia tudo', () => {
  guardarCache(chaveDoCache('u1', 'viagens'), ['x']);
  limparCache();
  expect(lerCache(chaveDoCache('u1', 'viagens'))).toBeUndefined();
});
