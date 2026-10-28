import { topoDoCabecalho } from './topoCabecalho';

describe('topoDoCabecalho', () => {
  it('sem inset mantém os 42 px do cabeçalho de 113 px', () => {
    expect(topoDoCabecalho(0)).toBe(42);
    expect(topoDoCabecalho(undefined)).toBe(42);
  });
  it('barra de status do Android (24 a 28 px) soma uma vez só', () => {
    expect(topoDoCabecalho(24)).toBe(42);
    expect(topoDoCabecalho(28)).toBe(46);
  });
  it('entalhe e Dynamic Island crescem junto com o inset', () => {
    expect(topoDoCabecalho(47)).toBe(65);
    expect(topoDoCabecalho(59)).toBe(77);
  });
});
