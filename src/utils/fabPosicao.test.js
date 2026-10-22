import {
  ehArraste,
  ladoMaisProximo,
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
