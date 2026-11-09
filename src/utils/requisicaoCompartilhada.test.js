import { compartilhar, esquecerCompartilhada } from './requisicaoCompartilhada';

test('chamadas seguidas com a mesma chave dividem uma só busca', async () => {
  const buscar = jest.fn(() => Promise.resolve('dado'));
  const [a, b] = await Promise.all([compartilhar('k1', buscar), compartilhar('k1', buscar)]);
  expect(a).toBe('dado');
  expect(b).toBe('dado');
  expect(buscar).toHaveBeenCalledTimes(1);
});

test('chaves diferentes buscam separado', async () => {
  const buscar = jest.fn(() => Promise.resolve('x'));
  await compartilhar('k2', buscar);
  await compartilhar('k3', buscar);
  expect(buscar).toHaveBeenCalledTimes(2);
});

test('busca que falha não fica guardada', async () => {
  const falha = jest.fn(() => Promise.reject(new Error('rede')));
  await expect(compartilhar('k4', falha)).rejects.toThrow('rede');
  const ok = jest.fn(() => Promise.resolve('ok'));
  expect(await compartilhar('k4', ok)).toBe('ok');
});

test('esquecer força uma busca nova', async () => {
  const buscar = jest.fn(() => Promise.resolve('d'));
  await compartilhar('k5', buscar);
  esquecerCompartilhada('k5');
  await compartilhar('k5', buscar);
  expect(buscar).toHaveBeenCalledTimes(2);
});

test('depois do prazo busca de novo', async () => {
  const buscar = jest.fn(() => Promise.resolve('d'));
  await compartilhar('k6', buscar, 0);
  await new Promise(r => setTimeout(r, 2));
  await compartilhar('k6', buscar, 0);
  expect(buscar).toHaveBeenCalledTimes(2);
});
