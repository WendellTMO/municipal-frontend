import { alturaVisivel, snapMaisProximo, proximoSnapNoToque } from './folhaInferior';

describe('folhaInferior', () => {
  const alturas = {
    recolhida: alturaVisivel('recolhida', 600, 110, 76),
    meia: alturaVisivel('meia', 600, 110, 76),
    expandida: alturaVisivel('expandida', 600, 110, 76),
  };
  it('três posições crescentes', () => {
    expect(alturas).toEqual({ recolhida: 108, meia: 300, expandida: 490 });
  });
  it('escolhe a posição mais próxima', () => {
    expect(snapMaisProximo(150, alturas)).toBe('recolhida');
    expect(snapMaisProximo(260, alturas)).toBe('meia');
    expect(snapMaisProximo(450, alturas)).toBe('expandida');
  });
  it('toque na alça alterna', () => {
    expect(proximoSnapNoToque('recolhida')).toBe('meia');
    expect(proximoSnapNoToque('meia')).toBe('expandida');
    expect(proximoSnapNoToque('expandida')).toBe('meia');
  });
});
