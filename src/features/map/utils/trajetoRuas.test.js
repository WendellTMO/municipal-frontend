import {
  buscarTrajetoRuas,
  chaveTrajeto,
  extrairCoordenadas,
  limparCacheTrajeto,
  montarUrlOsrm,
} from './trajetoRuas';

const A = { latitude: -7.2, longitude: -35.9 };
const B = { latitude: -7.21, longitude: -35.88 };
const C = { latitude: -7.23, longitude: -35.87 };

const respostaOk = {
  code: 'Ok',
  routes: [{ geometry: { coordinates: [[-35.9, -7.2], [-35.89, -7.205], [-35.87, -7.23]] } }],
};

const fetchOk = () => jest.fn().mockResolvedValue({ ok: true, json: async () => respostaOk });

beforeEach(() => limparCacheTrajeto());

test('monta a URL com lng,lat na ordem dos pontos e sem barra dupla', () => {
  expect(chaveTrajeto([A, B, C])).toBe('-35.9,-7.2;-35.88,-7.21;-35.87,-7.23');
  expect(montarUrlOsrm('https://osrm.exemplo/', [A, B])).toBe(
    'https://osrm.exemplo/route/v1/driving/-35.9,-7.2;-35.88,-7.21?overview=full&geometries=geojson',
  );
});

test('extrai coordenadas do GeoJSON trocando para latitude e longitude', () => {
  expect(extrairCoordenadas(respostaOk)).toEqual([
    { latitude: -7.2, longitude: -35.9 },
    { latitude: -7.205, longitude: -35.89 },
    { latitude: -7.23, longitude: -35.87 },
  ]);
});

test('resposta invalida vira lista vazia', () => {
  expect(extrairCoordenadas(null)).toEqual([]);
  expect(extrairCoordenadas({ code: 'NoRoute' })).toEqual([]);
  expect(extrairCoordenadas({ code: 'Ok', routes: [] })).toEqual([]);
  expect(extrairCoordenadas({ code: 'Ok', routes: [{ geometry: {} }] })).toEqual([]);
});

test('guarda o trajeto em cache e nao repete a chamada', async () => {
  const fetchImpl = fetchOk();
  const primeiro = await buscarTrajetoRuas([A, B, C], { baseUrl: 'https://x', fetchImpl });
  const segundo = await buscarTrajetoRuas([A, B, C], { baseUrl: 'https://x', fetchImpl });
  expect(primeiro.length).toBe(3);
  expect(segundo).toEqual(primeiro);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test('falha de rede, status ruim e menos de 2 pontos viram lista vazia', async () => {
  const falha = jest.fn().mockRejectedValue(new Error('offline'));
  expect(await buscarTrajetoRuas([A, B], { baseUrl: 'https://x', fetchImpl: falha })).toEqual([]);
  const erro500 = jest.fn().mockResolvedValue({ ok: false });
  expect(await buscarTrajetoRuas([A, C], { baseUrl: 'https://x', fetchImpl: erro500 })).toEqual([]);
  const nunca = fetchOk();
  expect(await buscarTrajetoRuas([A], { baseUrl: 'https://x', fetchImpl: nunca })).toEqual([]);
  expect(nunca).not.toHaveBeenCalled();
});

test('timeout cancela a chamada e cai no fallback', async () => {
  const lento = jest.fn((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('abortado')));
  }));
  const trajeto = await buscarTrajetoRuas([A, B], { baseUrl: 'https://x', fetchImpl: lento, timeoutMs: 20 });
  expect(trajeto).toEqual([]);
});

test('cancelar pelo signal aborta a chamada', async () => {
  const controle = new AbortController();
  const lento = jest.fn((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('abortado')));
  }));
  const promessa = buscarTrajetoRuas([A, B], { baseUrl: 'https://x', fetchImpl: lento, signal: controle.signal });
  controle.abort();
  expect(await promessa).toEqual([]);
});
