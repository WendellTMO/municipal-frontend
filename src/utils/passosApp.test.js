import {ehIos, montarPassosApp} from './passosApp';

test('detecta iPhone, iPad e iPad que se diz Mac', () => {
  expect(ehIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  expect(ehIos('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe(true);
  expect(ehIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
});

test('Android, Mac e UA vazio não são iOS', () => {
  expect(ehIos('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(false);
  expect(ehIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
  expect(ehIos(undefined)).toBe(false);
});

test('Android: cadastro feito, baixar o app, entrar', () => {
  const passos = montarPassosApp(false);
  expect(passos.map(p => p.titulo)).toEqual(['Cadastro concluído', 'Baixe o app', 'Abra o app e entre']);
  expect(passos[0].feito).toBe(true);
  expect(passos[1].acao).toBe('baixar');
  expect(passos[1].texto).toMatch(/fontes desconhecidas/);
  expect(passos.map(p => p.numero)).toEqual([1, 2, 3]);
});

test('iOS: passo 2 vira "chega em breve" sem botão de baixar', () => {
  const passos = montarPassosApp(true);
  expect(passos[1].titulo).toBe('O app para iPhone chega em breve');
  expect(passos[1].acao).toBeUndefined();
});
