import {
  ESTADO_DESVIO_INICIAL,
  INTERVALO_MIN_RECALCULO_MS,
  avaliarLeitura,
  foraDaRota,
  paradasRestantesPorProximidade,
} from './desvioRota';

// Rua reta leste-oeste na latitude -7.2; 0.001 grau de longitude vale cerca de 110 m.
const RUA = [
  { latitude: -7.2, longitude: -35.9 },
  { latitude: -7.2, longitude: -35.89 },
];
const noMeio = (metrosAoNorte) => ({ latitude: -7.2 + metrosAoNorte / 111320, longitude: -35.895 });

describe('foraDaRota', () => {
  it('mede ao segmento, nao so aos vertices', () => {
    // 50 m ao lado do meio do segmento (vertices a ~550 m): dentro do limite de 60 m
    expect(foraDaRota(noMeio(50), RUA)).toBe(false);
    expect(foraDaRota(noMeio(70), RUA)).toBe(true);
  });
  it('depois do fim do segmento mede ao vertice', () => {
    const alemDoFim = { latitude: -7.2, longitude: -35.89 + 0.001 };
    expect(foraDaRota(alemDoFim, RUA)).toBe(true);
    expect(foraDaRota(alemDoFim, RUA, 200)).toBe(false);
  });
  it('respeita limite customizado', () => {
    expect(foraDaRota(noMeio(30), RUA, 20)).toBe(true);
  });
  it('sem tracado nao ha desvio', () => {
    expect(foraDaRota(noMeio(500), [])).toBe(false);
  });
});

describe('avaliarLeitura', () => {
  const fora = { fora: true, emMovimento: true, semRota: false };
  const dentro = { fora: false, emMovimento: true, semRota: false };
  const T0 = 1_000_000;

  it('so recalcula na terceira leitura seguida fora', () => {
    let r = avaliarLeitura(ESTADO_DESVIO_INICIAL, { ...fora, agoraMs: T0 });
    expect(r.recalcular).toBe(false);
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + 5000 });
    expect(r.recalcular).toBe(false);
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + 10000 });
    expect(r.recalcular).toBe(true);
  });
  it('ruido: uma leitura dentro zera a contagem', () => {
    let r = avaliarLeitura(ESTADO_DESVIO_INICIAL, { ...fora, agoraMs: T0 });
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + 1 });
    r = avaliarLeitura(r.estado, { ...dentro, agoraMs: T0 + 2 });
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + 3 });
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + 4 });
    expect(r.recalcular).toBe(false);
  });
  it('onibus parado fora da rota nao conta', () => {
    let estado = ESTADO_DESVIO_INICIAL;
    for (let i = 0; i < 5; i++) {
      const r = avaliarLeitura(estado, { ...fora, emMovimento: false, agoraMs: T0 + i });
      expect(r.recalcular).toBe(false);
      estado = r.estado;
    }
  });
  it('respeita o intervalo minimo entre recalculos', () => {
    let estado = { seguidas: 2, ultimoRecalculoMs: null };
    let r = avaliarLeitura(estado, { ...fora, agoraMs: T0 });
    expect(r.recalcular).toBe(true);
    // segue fora (OSRM falhou): bloqueado ate o intervalo passar
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + INTERVALO_MIN_RECALCULO_MS - 1 });
    expect(r.recalcular).toBe(false);
    r = avaliarLeitura(r.estado, { ...fora, agoraMs: T0 + INTERVALO_MIN_RECALCULO_MS });
    expect(r.recalcular).toBe(true);
  });
  it('sem linha na tela tenta de novo, tambem respeitando o intervalo', () => {
    const semRota = { fora: false, emMovimento: false, semRota: true };
    let r = avaliarLeitura({ seguidas: 0, ultimoRecalculoMs: T0 }, { ...semRota, agoraMs: T0 + 1000 });
    expect(r.recalcular).toBe(false);
    r = avaliarLeitura(r.estado, { ...semRota, agoraMs: T0 + INTERVALO_MIN_RECALCULO_MS });
    expect(r.recalcular).toBe(true);
  });
});

describe('paradasRestantesPorProximidade', () => {
  const pontos = [
    { id: 'c', ordem: 3, latitude: -7.23, longitude: -35.9 },
    { id: 'a', ordem: 1, latitude: -7.2, longitude: -35.9 },
    { id: 'b', ordem: 2, latitude: -7.21, longitude: -35.9 },
  ];
  it('parte da parada mais proxima, na ordem da rota', () => {
    const r = paradasRestantesPorProximidade(pontos, { latitude: -7.2101, longitude: -35.9 });
    expect(r.map((p) => p.latitude)).toEqual([-7.21, -7.23]);
  });
  it('sem posicao ou sem paradas devolve vazio', () => {
    expect(paradasRestantesPorProximidade(pontos, null)).toEqual([]);
    expect(paradasRestantesPorProximidade([], { latitude: 0, longitude: 0 })).toEqual([]);
  });
});
