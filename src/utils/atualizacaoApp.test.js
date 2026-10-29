import {
  apkUrlSegura,
  decidirAtualizacao,
  deveConsultar,
  notasDaVersao,
  SEIS_HORAS_MS,
  urlArquivoVersao,
} from './atualizacaoApp';

describe('decidirAtualizacao', () => {
  test('igual: nenhuma', () => {
    expect(decidirAtualizacao(5, { versionCode: 5, minVersionCode: 1 })).toBe('nenhuma');
  });
  test('remoto menor: nenhuma', () => {
    expect(decidirAtualizacao(5, { versionCode: 4, minVersionCode: 1 })).toBe('nenhuma');
  });
  test('remoto maior: opcional', () => {
    expect(decidirAtualizacao(5, { versionCode: 6, minVersionCode: 5 })).toBe('opcional');
  });
  test('mínimo maior que o instalado: obrigatória', () => {
    expect(decidirAtualizacao(5, { versionCode: 9, minVersionCode: 6 })).toBe('obrigatoria');
  });
  test('campos ausentes: nenhuma', () => {
    expect(decidirAtualizacao(5, {})).toBe('nenhuma');
    expect(decidirAtualizacao(5, { versionCode: 6 })).toBe('opcional');
    expect(decidirAtualizacao(5, { minVersionCode: 6 })).toBe('obrigatoria');
  });
  test('remoto inválido ou instalado inválido: nenhuma', () => {
    expect(decidirAtualizacao(5, null)).toBe('nenhuma');
    expect(decidirAtualizacao(5, undefined)).toBe('nenhuma');
    expect(decidirAtualizacao(5, 'texto')).toBe('nenhuma');
    expect(decidirAtualizacao(null, { versionCode: 6 })).toBe('nenhuma');
    expect(decidirAtualizacao('abc', { versionCode: 6 })).toBe('nenhuma');
  });
  test('tipos errados: texto numérico vale, o resto não', () => {
    expect(decidirAtualizacao('5', { versionCode: '6' })).toBe('opcional');
    expect(decidirAtualizacao(5, { versionCode: '6', minVersionCode: '7' })).toBe('obrigatoria');
    expect(decidirAtualizacao(5, { versionCode: 'seis' })).toBe('nenhuma');
    expect(decidirAtualizacao(5, { versionCode: 6.5 })).toBe('nenhuma');
    expect(decidirAtualizacao(5, { versionCode: {}, minVersionCode: [] })).toBe('nenhuma');
  });
});

test('apkUrlSegura aceita só https', () => {
  expect(apkUrlSegura({ apkUrl: 'https://x.br/buska.apk' })).toBe('https://x.br/buska.apk');
  expect(apkUrlSegura({ apkUrl: 'http://x.br/buska.apk' })).toBeNull();
  expect(apkUrlSegura({ apkUrl: 'intent://x' })).toBeNull();
  expect(apkUrlSegura({})).toBeNull();
  expect(apkUrlSegura(null)).toBeNull();
});

test('notasDaVersao filtra e limita', () => {
  expect(notasDaVersao({ notas: ['a', '', 3, ' b ', 'c', 'd', 'e', 'f'] })).toEqual(['a', 'b', 'c', 'd', 'e']);
  expect(notasDaVersao({ notas: 'x' })).toEqual([]);
  expect(notasDaVersao(null)).toEqual([]);
});

test('urlArquivoVersao tira /v1 e barras', () => {
  expect(urlArquivoVersao('https://b.lsd.ufcg.edu.br/v1')).toBe('https://b.lsd.ufcg.edu.br/app-version.json');
  expect(urlArquivoVersao('https://b.lsd.ufcg.edu.br/v1/')).toBe('https://b.lsd.ufcg.edu.br/app-version.json');
  expect(urlArquivoVersao('http://localhost:5000')).toBe('http://localhost:5000/app-version.json');
});

test('deveConsultar respeita 6 h e a obrigatória ignora o limite', () => {
  const agora = 10 * SEIS_HORAS_MS;
  expect(deveConsultar(null, agora)).toBe(true);
  expect(deveConsultar({ em: agora - 1000, decisao: 'nenhuma' }, agora)).toBe(false);
  expect(deveConsultar({ em: agora - SEIS_HORAS_MS, decisao: 'opcional' }, agora)).toBe(true);
  expect(deveConsultar({ em: agora - 1000, decisao: 'obrigatoria' }, agora)).toBe(true);
  expect(deveConsultar({ em: agora + 1000, decisao: 'nenhuma' }, agora)).toBe(true);
});
