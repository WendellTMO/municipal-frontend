import {
  decidirPosicao,
  ehArraste,
  ladoMaisProximo,
  limitarPonto,
  limitarBaixo,
  posicaoGuardada,
  xDoLado,
} from './fabPosicao';

test('toque de até 6px não é arraste', () => {
  expect(ehArraste(3, -5)).toBe(false);
  expect(ehArraste(6, 0)).toBe(false);
  expect(ehArraste(0, 7)).toBe(true);
});

test('limitarBaixo mantém o botão entre rodapé e topo reservados', () => {
  // janela 800, botão 56, topo 48, rodapé 24: baixo máximo 696
  expect(limitarBaixo(-10, 800, 56, 48, 24)).toBe(24);
  expect(limitarBaixo(300, 800, 56, 48, 24)).toBe(300);
  expect(limitarBaixo(900, 800, 56, 48, 24)).toBe(696);
});

test('janela menor que o botão não gera intervalo invertido', () => {
  expect(limitarBaixo(100, 60, 56, 48, 24)).toBe(24);
});

test('encaixa na borda mais próxima', () => {
  expect(ladoMaisProximo(100, 390)).toBe('esq');
  expect(ladoMaisProximo(300, 390)).toBe('dir');
  expect(xDoLado('esq', 390, 56, 18)).toBe(18);
  expect(xDoLado('dir', 390, 56, 18)).toBe(316);
});

test('posição guardada inválida volta ao padrão', () => {
  expect(posicaoGuardada({ lado: 'dir', baixo: 120 })).toEqual({ lado: 'dir', baixo: 120 });
  expect(posicaoGuardada(null)).toBeNull();
  expect(posicaoGuardada({ lado: 'meio', baixo: 1 })).toBeNull();
  expect(posicaoGuardada({ lado: 'esq', baixo: 'x' })).toBeNull();
});

test('posição salva vence o padrão da tela', () => {
  const base = { altura: 800, tamanho: 56, rodape: 24 };
  const guardada = { lado: 'esq', baixo: 200 };
  expect(decidirPosicao({ ...base, guardada, padraoTela: 'topo' })).toEqual(guardada);
});

test('sem posição salva usa o padrão da tela e senão o canto de baixo', () => {
  const base = { guardada: null, altura: 800, tamanho: 56, rodape: 24 };
  expect(decidirPosicao({ ...base, padraoTela: 'topo' })).toEqual({ lado: 'esq', baixo: 800 - 56 - 121 });
  expect(decidirPosicao({ ...base, padraoTela: null })).toEqual({ lado: 'dir', baixo: 24 });
});

test('limitarPonto prende o botão à janela e à faixa vertical', () => {
  const base = { largura: 390, altura: 800, tamanho: 56, topo: 48, rodape: 24 };
  expect(limitarPonto({ ...base, x: -50, y: 300 })).toEqual({ x: 0, y: 300 });
  expect(limitarPonto({ ...base, x: 999, y: 300 })).toEqual({ x: 334, y: 300 });
  expect(limitarPonto({ ...base, x: 100, y: 0 })).toEqual({ x: 100, y: 48 });
  expect(limitarPonto({ ...base, x: 100, y: 900 })).toEqual({ x: 100, y: 720 });
});
