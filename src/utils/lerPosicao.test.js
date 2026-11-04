import { lerPosicao } from './lerPosicao';

const posicao = { coords: { latitude: 1, longitude: 2 } };

test('GPS preciso respondeu: devolve a leitura sem segunda tentativa', () => {
  const geo = { getCurrentPosition: jest.fn((ok) => ok(posicao)) };
  const aoLer = jest.fn();
  lerPosicao(geo, aoLer, jest.fn());
  expect(aoLer).toHaveBeenCalledWith(posicao);
  expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
});

test('GPS preciso falhou por tempo: tenta a posição por rede', () => {
  const geo = {
    getCurrentPosition: jest.fn()
      .mockImplementationOnce((ok, falha) => falha({ code: 3 }))
      .mockImplementationOnce((ok) => ok(posicao)),
  };
  const aoLer = jest.fn();
  lerPosicao(geo, aoLer, jest.fn());
  expect(aoLer).toHaveBeenCalledWith(posicao);
  expect(geo.getCurrentPosition.mock.calls[1][2].enableHighAccuracy).toBe(false);
});

test('permissão negada: avisa na hora, sem segunda tentativa', () => {
  const geo = { getCurrentPosition: jest.fn((ok, falha) => falha({ code: 1 })) };
  const aoFalhar = jest.fn();
  lerPosicao(geo, jest.fn(), aoFalhar);
  expect(aoFalhar).toHaveBeenCalledWith({ code: 1 });
  expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
});

test('as duas tentativas falharam: avisa o erro da segunda', () => {
  const geo = { getCurrentPosition: jest.fn((ok, falha) => falha({ code: 2 })) };
  const aoFalhar = jest.fn();
  lerPosicao(geo, jest.fn(), aoFalhar);
  expect(aoFalhar).toHaveBeenCalledWith({ code: 2 });
  expect(geo.getCurrentPosition).toHaveBeenCalledTimes(2);
});
