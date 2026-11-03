import { criarBuscaRemota } from './buscaRemota';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const vazio = () => new Promise(() => {});

test('digitar rápido faz uma busca só, com o último texto', async () => {
  const buscar = jest.fn().mockResolvedValue([]);
  const busca = criarBuscaRemota({ buscar, aoMudar: () => {}, esperaMs: 250 });
  busca.digitar('u');
  busca.digitar('uf');
  busca.digitar('ufc');
  jest.advanceTimersByTime(249);
  expect(buscar).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(buscar).toHaveBeenCalledTimes(1);
  expect(buscar).toHaveBeenCalledWith('ufc');
});

test('resposta de uma busca antiga não sobrescreve a mais nova', async () => {
  const estados = [];
  let responderPrimeira;
  const buscar = jest
    .fn()
    .mockImplementationOnce(() => new Promise(r => (responderPrimeira = r)))
    .mockResolvedValueOnce(['nova']);
  const busca = criarBuscaRemota({ buscar, aoMudar: e => estados.push(e) });
  const primeira = busca.agora('a');
  await busca.agora('ab');
  responderPrimeira(['velha']);
  await primeira;
  const itens = estados.filter(e => e.itens).map(e => e.itens);
  expect(itens).toEqual([['nova']]);
});

test('erro da busca atual vira estado de erro e o da antiga é ignorado', async () => {
  const estados = [];
  const busca = criarBuscaRemota({ buscar: jest.fn().mockRejectedValue(new Error('rede')), aoMudar: e => estados.push(e) });
  await busca.agora('x');
  expect(estados[estados.length - 1]).toEqual({ carregando: false, erro: true });
});

test('cancelar descarta a busca pendente e a resposta em andamento', async () => {
  const buscar = jest.fn().mockReturnValue(vazio());
  const aoMudar = jest.fn();
  const busca = criarBuscaRemota({ buscar, aoMudar });
  busca.digitar('a');
  busca.cancelar();
  jest.advanceTimersByTime(1000);
  expect(buscar).not.toHaveBeenCalled();
});
