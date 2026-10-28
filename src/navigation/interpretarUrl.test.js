import {interpretarUrl} from './interpretarUrl';

describe('interpretarUrl', () => {
  it('abre ConvitePin com o token do caminho', () => {
    expect(interpretarUrl('/convite/abc123', '')).toEqual({
      route: 'ConvitePin',
      params: {token: 'abc123'},
    });
  });

  it('aceita barra final e decodifica o token', () => {
    expect(interpretarUrl('/convite/a%20b/', '').params.token).toBe('a b');
  });

  it('abre ConsentimentoResponsavel com o token da query', () => {
    expect(interpretarUrl('/guardian-consent', '?token=xyz')).toEqual({
      route: 'ConsentimentoResponsavel',
      params: {token: 'xyz'},
    });
  });

  it('ignora caminhos sem token ou desconhecidos', () => {
    expect(interpretarUrl('/convite/', '')).toBeNull();
    expect(interpretarUrl('/convite/a/b', '')).toBeNull();
    expect(interpretarUrl('/guardian-consent', '')).toBeNull();
    expect(interpretarUrl('/', '')).toBeNull();
    expect(interpretarUrl(undefined, undefined)).toBeNull();
  });
});
