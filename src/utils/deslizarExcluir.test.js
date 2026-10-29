import { deveExcluir, ehSwipeHorizontal, LIMITE_EXCLUIR } from './deslizarExcluir';

describe('deslizarExcluir', () => {
  it('só exclui arrastando para a esquerda além do limite', () => {
    expect(deveExcluir(-LIMITE_EXCLUIR)).toBe(true);
    expect(deveExcluir(-LIMITE_EXCLUIR + 1)).toBe(false);
    expect(deveExcluir(LIMITE_EXCLUIR * 2)).toBe(false);
  });

  it('gesto mais vertical que horizontal fica com a rolagem', () => {
    expect(ehSwipeHorizontal(-40, 5)).toBe(true);
    expect(ehSwipeHorizontal(-40, 40)).toBe(false);
    expect(ehSwipeHorizontal(-4, 0)).toBe(false);
  });
});
