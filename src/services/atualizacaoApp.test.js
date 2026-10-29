const mockDados = {};
jest.mock('../utils/storage', () => ({
  Storage: {
    getItem: jest.fn(async chave => (chave in mockDados ? mockDados[chave] : null)),
    setItem: jest.fn(async (chave, valor) => {
      mockDados[chave] = valor;
    }),
  },
}));
jest.mock('../config/api', () => ({ __esModule: true, default: { baseUrl: 'https://api.x.br/v1' } }));
jest.mock('../config/atualizacao', () => ({ ATUALIZACAO_VIA_APK_ATIVA: true }));
const mockVersao = jest.fn();
jest.mock('./versaoApp', () => ({ lerVersaoInstalada: () => mockVersao() }));

import { verificarAtualizacao } from './atualizacaoApp';

const JSON_OK = {
  versionCode: 6,
  versionName: '1.0.5-beta',
  apkUrl: 'https://x.br/buska.apk',
  notas: ['Correções'],
  minVersionCode: 1,
};
const responder = corpo => jest.fn(async () => ({ ok: true, json: async () => corpo }));
const HORA = 60 * 60 * 1000;

beforeEach(() => {
  Object.keys(mockDados).forEach(k => delete mockDados[k]);
  mockVersao.mockReturnValue({ versionCode: 5, versionName: '1.0.4-beta' });
  global.fetch = responder(JSON_OK);
});

test('busca em /app-version.json e devolve opcional', async () => {
  const r = await verificarAtualizacao(1000);
  expect(global.fetch.mock.calls[0][0]).toBe('https://api.x.br/app-version.json');
  expect(global.fetch.mock.calls[0][1].cache).toBe('no-store');
  expect(r).toEqual({ decisao: 'opcional', versionName: '1.0.5-beta', notas: ['Correções'], apkUrl: JSON_OK.apkUrl });
});

test('sem verificação no iOS e na web (versão nula)', async () => {
  mockVersao.mockReturnValue(null);
  expect(await verificarAtualizacao(1000)).toBeNull();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('erro de rede, JSON ruim e HTTP de erro ficam em silêncio', async () => {
  global.fetch = jest.fn(async () => {
    throw new Error('rede');
  });
  expect(await verificarAtualizacao(1000)).toBeNull();
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => { throw new Error('json'); } }));
  expect(await verificarAtualizacao(2000)).toBeNull();
  global.fetch = jest.fn(async () => ({ ok: false }));
  expect(await verificarAtualizacao(3000)).toBeNull();
});

test('timeout aborta a requisição', async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn(
    (url, opcoes) =>
      new Promise((_, rejeitar) => {
        opcoes.signal.addEventListener('abort', () => rejeitar(new Error('abort')));
      }),
  );
  const promessa = verificarAtualizacao(1000);
  await jest.advanceTimersByTimeAsync(5001);
  expect(await promessa).toBeNull();
  jest.useRealTimers();
});

test('apkUrl que não é https vira nenhuma', async () => {
  global.fetch = responder({ ...JSON_OK, apkUrl: 'http://x.br/a.apk' });
  expect(await verificarAtualizacao(1000)).toBeNull();
});

test('limite de 6 h: segunda consulta dentro do prazo não vai à rede', async () => {
  await verificarAtualizacao(1000);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(await verificarAtualizacao(1000 + 5 * HORA)).toBeNull();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await verificarAtualizacao(1000 + 6 * HORA);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('obrigatória ignora o limite', async () => {
  global.fetch = responder({ ...JSON_OK, minVersionCode: 6 });
  const r = await verificarAtualizacao(1000);
  expect(r.decisao).toBe('obrigatoria');
  await verificarAtualizacao(2000);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('falha de rede não consome o limite', async () => {
  global.fetch = jest.fn(async () => {
    throw new Error('rede');
  });
  await verificarAtualizacao(1000);
  global.fetch = responder(JSON_OK);
  expect((await verificarAtualizacao(2000)).decisao).toBe('opcional');
});
