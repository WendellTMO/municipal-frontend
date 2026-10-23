jest.mock('./storage', () => {
  const dados = {};
  return {
    Storage: {
      getItem: jest.fn(async chave => (chave in dados ? dados[chave] : null)),
      setItem: jest.fn(async (chave, valor) => {
        dados[chave] = valor;
      }),
    },
  };
});

import { Storage } from './storage';
import { assinarPosicao, CHAVE_POSICAO, definirPosicao, lerPosicao, reiniciarFabStore } from './fabStore';
import { encaixar } from './fabPosicao';

beforeEach(() => reiniciarFabStore());

test('uma instância que arrasta avisa as outras e grava no storage', () => {
  const raiz = jest.fn();
  const modal = jest.fn();
  assinarPosicao(raiz);
  assinarPosicao(modal);
  definirPosicao({ lado: 'esq', baixo: 300 });
  expect(lerPosicao()).toEqual({ lado: 'esq', baixo: 300 });
  expect(raiz).toHaveBeenCalled();
  expect(modal).toHaveBeenCalled();
  expect(Storage.setItem).toHaveBeenCalledWith(CHAVE_POSICAO, { lado: 'esq', baixo: 300 });
});

test('lê a posição salva ao assinar pela primeira vez', async () => {
  await Storage.setItem(CHAVE_POSICAO, { lado: 'dir', baixo: 120 });
  const ouvinte = jest.fn();
  assinarPosicao(ouvinte);
  await new Promise(r => setTimeout(r, 0));
  expect(lerPosicao()).toEqual({ lado: 'dir', baixo: 120 });
  expect(ouvinte).toHaveBeenCalled();
});

test('encaixar escolhe a borda mais próxima nos dois sentidos e limita a altura', () => {
  const base = { largura: 390, altura: 844, tamanho: 56, topo: 48, rodape: 24 };
  expect(encaixar({ ...base, x: 20, y: 400 })).toEqual({ lado: 'esq', baixo: 844 - 56 - 400 });
  expect(encaixar({ ...base, x: 300, y: 400 })).toEqual({ lado: 'dir', baixo: 844 - 56 - 400 });
  expect(encaixar({ ...base, x: 150, y: 400 }).lado).toBe('esq');
  expect(encaixar({ ...base, x: 250, y: 400 }).lado).toBe('dir');
  expect(encaixar({ ...base, x: 20, y: 5000 }).baixo).toBe(24);
});
