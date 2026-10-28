import {
  parseNumeroDecimal,
  validarLatitude,
  validarLongitude,
  dividirParColado,
  coordenadasValidas,
} from './coordenadas';

describe('parseNumeroDecimal', () => {
  it('aceita ponto e vírgula', () => {
    expect(parseNumeroDecimal('-7.2290')).toBe(-7.229);
    expect(parseNumeroDecimal('-35,9020')).toBe(-35.902);
  });
  it('vazio ou lixo vira null', () => {
    expect(parseNumeroDecimal('')).toBeNull();
    expect(parseNumeroDecimal('  ')).toBeNull();
    expect(parseNumeroDecimal('abc')).toBeNull();
    expect(parseNumeroDecimal('-')).toBeNull();
    expect(parseNumeroDecimal('1.2.3')).toBeNull();
  });
});

describe('validação', () => {
  it('aceita valores dentro da faixa', () => {
    expect(validarLatitude('-7,2290')).toBe('');
    expect(validarLongitude('-35.9020')).toBe('');
    expect(validarLatitude('90')).toBe('');
    expect(validarLongitude('-180')).toBe('');
  });
  it('rejeita fora da faixa', () => {
    expect(validarLatitude('90.1')).toMatch(/entre -90 e 90/);
    expect(validarLongitude('181')).toMatch(/entre -180 e 180/);
  });
  it('rejeita vazio e texto', () => {
    expect(validarLatitude('')).toMatch(/Informe/);
    expect(validarLongitude('x')).toMatch(/inválida/);
  });
});

describe('dividirParColado', () => {
  it('divide par com vírgula e espaço', () => {
    expect(dividirParColado('-7.2290, -35.9020')).toEqual({latitude: '-7.2290', longitude: '-35.9020'});
    expect(dividirParColado('-7,2290, -35,9020')).toEqual({latitude: '-7,2290', longitude: '-35,9020'});
  });
  it('ignora o que não é par', () => {
    expect(dividirParColado('-7,2290')).toBeNull();
    expect(dividirParColado('-7.2290,-35.9020')).toBeNull();
    expect(dividirParColado('a, b')).toBeNull();
  });
});

describe('coordenadasValidas', () => {
  it('devolve números quando os dois são válidos', () => {
    expect(coordenadasValidas('-7,2290', '-35.9020')).toEqual({latitude: -7.229, longitude: -35.902});
  });
  it('devolve null se algum for inválido', () => {
    expect(coordenadasValidas('-7.2', '')).toBeNull();
    expect(coordenadasValidas('100', '-35')).toBeNull();
  });
});
