import { aguardarCondicao } from './aguardarCondicao';

const semEspera = () => Promise.resolve();

test('devolve true assim que a condição é atendida', async () => {
  let chamadas = 0;
  const ok = await aguardarCondicao({
    verificar: async () => ++chamadas === 3,
    tentativas: 10,
    esperaMs: 1000,
    dormir: semEspera,
  });
  expect(ok).toBe(true);
  expect(chamadas).toBe(3);
});

test('desiste depois das tentativas', async () => {
  let chamadas = 0;
  const ok = await aguardarCondicao({
    verificar: async () => {
      chamadas += 1;
      return false;
    },
    tentativas: 4,
    esperaMs: 1000,
    dormir: semEspera,
  });
  expect(ok).toBe(false);
  expect(chamadas).toBe(4);
});

test('desiste na hora quando cancelado', async () => {
  const verificar = jest.fn(async () => true);
  const ok = await aguardarCondicao({ verificar, tentativas: 5, esperaMs: 10, cancelado: () => true, dormir: semEspera });
  expect(ok).toBe(false);
  expect(verificar).not.toHaveBeenCalled();
});
