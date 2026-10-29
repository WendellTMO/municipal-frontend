import { montarCorpoParada, mensagemErroParada, paradasDaResposta } from './novaParada';

describe('montarCorpoParada', () => {
  it('ponto existente manda ponto_id e posicao', () => {
    expect(montarCorpoParada({ pontoExistente: { id: 'abc' }, posicao: 'fim' })).toEqual({
      ponto_id: 'abc',
      posicao: 'fim',
    });
  });
  it('ponto novo manda apelido, coordenadas e posicao padrao proxima', () => {
    const pino = { latitude: -7.23, longitude: -35.88 };
    expect(montarCorpoParada({ pino, nome: '  Praça  ' })).toEqual({
      apelido: 'Praça',
      latitude: -7.23,
      longitude: -35.88,
      posicao: 'proxima',
    });
  });
  it('sem nome omite o apelido', () => {
    const corpo = montarCorpoParada({ pino: { latitude: 1, longitude: 2 }, nome: '  ', posicao: 'fim' });
    expect(corpo).toEqual({ latitude: 1, longitude: 2, posicao: 'fim' });
  });
  it('corta o apelido em 100 caracteres', () => {
    const corpo = montarCorpoParada({ pino: { latitude: 1, longitude: 2 }, nome: 'a'.repeat(150) });
    expect(corpo.apelido).toHaveLength(100);
  });
  it('ponto existente nunca leva apelido nem coordenadas', () => {
    const corpo = montarCorpoParada({ pontoExistente: { id: 'x' }, pino: { latitude: 1, longitude: 2 }, nome: 'n' });
    expect(Object.keys(corpo).sort()).toEqual(['ponto_id', 'posicao']);
  });
  it('sem escolha devolve null', () => {
    expect(montarCorpoParada({ nome: 'x' })).toBeNull();
  });
});

describe('mensagemErroParada', () => {
  it('409 avisa que o ponto já está na viagem', () => {
    expect(mensagemErroParada({ statusCode: 409 })).toBe('Esse ponto já está na viagem.');
  });
  it('sem status usa a mensagem do erro', () => {
    expect(mensagemErroParada({ message: 'Sem conexão.' })).toBe('Sem conexão.');
  });
});

describe('paradasDaResposta', () => {
  it('troca ponto_id por id', () => {
    const r = paradasDaResposta([{ ponto_id: 'p1', apelido: 'A', latitude: 1, longitude: 2, ordem: 1, visitado: false }]);
    expect(r).toEqual([{ id: 'p1', apelido: 'A', latitude: 1, longitude: 2, ordem: 1 }]);
  });
});
