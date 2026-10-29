import {
  semAcento,
  filtrarPontos,
  textoContagem,
  textoContinuar,
  interpretarEntrada,
  renumerar,
} from './pontosRota';
import { moverItem } from './ordemInstituicoes';

const pontos = [
  { id: '1', apelido: 'Mercado Central', endereco: 'Centro' },
  { id: '2', apelido: 'Praça da Bandeira' },
  { id: '3', apelido: 'Mercado da Prata' },
];

describe('semAcento', () => {
  it('tira acento e caixa', () => {
    expect(semAcento('  Praça ÁGUA ')).toBe('praca agua');
  });
});

describe('filtrarPontos', () => {
  it('acha sem acento e sem diferenciar maiúscula', () => {
    expect(filtrarPontos(pontos, 'PRACA').itens.map(p => p.id)).toEqual(['2']);
  });
  it('busca também no endereço', () => {
    expect(filtrarPontos(pontos, 'centro').total).toBe(1);
  });
  it('termo vazio não lista nada', () => {
    expect(filtrarPontos(pontos, '  ')).toEqual({ itens: [], total: 0 });
  });
  it('limita a lista mas conta todos', () => {
    const muitos = [];
    for (let i = 0; i < 20; i++) muitos.push({ id: String(i), apelido: `Mercado ${i}` });
    const r = filtrarPontos(muitos, 'mercado');
    expect(r.itens).toHaveLength(8);
    expect(r.total).toBe(20);
  });
});

describe('textos', () => {
  it('contagem e continuar', () => {
    expect(textoContagem(4, 312)).toBe('4 resultados em 312 pontos');
    expect(textoContagem(1, 312)).toBe('1 resultado em 312 pontos');
    expect(textoContinuar(1)).toBe('Continuar com 1 ponto');
    expect(textoContinuar(3)).toBe('Continuar com 3 pontos');
  });
});

describe('interpretarEntrada', () => {
  it('reconhece par com ponto decimal', () => {
    expect(interpretarEntrada('-7.2290, -35.8808')).toEqual({
      tipo: 'coordenadas',
      latitude: -7.229,
      longitude: -35.8808,
    });
  });
  it('reconhece vírgula decimal', () => {
    expect(interpretarEntrada('-7,2290, -35,8808').latitude).toBe(-7.229);
    expect(interpretarEntrada('-7,2290 -35,8808').longitude).toBe(-35.8808);
  });
  it('par sem espaço', () => {
    expect(interpretarEntrada('-7.2290,-35.8808').tipo).toBe('coordenadas');
  });
  it('fora do intervalo vira busca de endereço', () => {
    expect(interpretarEntrada('95, -35').tipo).toBe('endereco');
  });
  it('endereço com número não é coordenada', () => {
    expect(interpretarEntrada('Rua Maciel Pinheiro, 300').tipo).toBe('endereco');
    expect(interpretarEntrada('300').tipo).toBe('endereco');
  });
  it('vazio', () => {
    expect(interpretarEntrada('   ').tipo).toBe('vazio');
  });
});

describe('reordenação', () => {
  it('move e renumera', () => {
    const lista = moverItem(pontos, 2, 0);
    expect(lista.map(p => p.id)).toEqual(['3', '1', '2']);
    expect(renumerar(lista).map(p => p.ordem)).toEqual([1, 2, 3]);
  });
});
