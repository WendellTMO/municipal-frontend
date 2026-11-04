import { descreverDispositivo } from './dispositivo';

test('Android nativo: fabricante, modelo e versão com o nível da API', () => {
  const r = descreverDispositivo('android', { Manufacturer: 'samsung', Model: 'SM-S911B', Release: '14', Version: 34 });
  expect(r).toEqual({ dispositivo: 'samsung SM-S911B', versao_so: 'Android 14 (API 34)' });
});

test('iOS nativo: aparelho e versão do sistema', () => {
  expect(descreverDispositivo('ios', { osVersion: '18.7', interfaceIdiom: 'phone' })).toEqual({ dispositivo: 'iPhone', versao_so: 'iOS 18.7' });
  expect(descreverDispositivo('ios', { osVersion: '17.2', interfaceIdiom: 'pad' }).dispositivo).toBe('iPad');
});

test('web no Safari do iPhone', () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0.1 Mobile/15E148 Safari/604.1';
  expect(descreverDispositivo('web', {}, ua)).toEqual({ dispositivo: 'Safari 27.0.1', versao_so: 'iOS 18.7' });
});

test('web no Chrome do Android traz o modelo quando o navegador entrega', () => {
  const ua = 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
  expect(descreverDispositivo('web', {}, ua)).toEqual({ dispositivo: 'SM-S911B · Chrome 130.0.0.0', versao_so: 'Android 14' });
});

test('sem dados, tudo nulo e nunca passa do limite do backend', () => {
  expect(descreverDispositivo('web', {}, '')).toEqual({ dispositivo: null, versao_so: null });
  expect(descreverDispositivo('android', { Model: 'x'.repeat(300), Release: '14' }).dispositivo).toHaveLength(100);
});
