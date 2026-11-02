import {
  estadoVazio,
  idsProcessados,
  pontosAlcancados,
  registrarChegada,
  removerProcessados,
} from './chegadasViagem';

const p1 = { id: 'a', latitude: -7.23, longitude: -35.88 };
const p2 = { id: 'b', latitude: -7.24, longitude: -35.88 };
const p3 = { id: 'c', latitude: -7.25, longitude: -35.88 };
const agora = new Date('2026-11-02T12:00:00Z');

test('acha pontos dentro do raio em qualquer ordem da lista', () => {
  const perto = { latitude: -7.25, longitude: -35.88 };
  expect(pontosAlcancados(perto, [p1, p2, p3], [])).toEqual(['c']);
});

test('ônibus que cortou o raio entre duas leituras conta quando se informa a leitura anterior', () => {
  // Duas leituras a cerca de 110 m uma da outra, com o ponto a ~20 m do meio do trecho.
  const antes = { latitude: -7.2295, longitude: -35.88 };
  const depois = { latitude: -7.2305, longitude: -35.88 };
  const ponto = { id: 'x', latitude: -7.23, longitude: -35.88018 };
  expect(pontosAlcancados(depois, [ponto], [])).toEqual([]);
  expect(pontosAlcancados(depois, [ponto], [], { anterior: antes })).toEqual(['x']);
});

test('trecho que passa longe do ponto não conta', () => {
  const antes = { latitude: -7.2295, longitude: -35.88 };
  const depois = { latitude: -7.2305, longitude: -35.88 };
  const longe = { id: 'y', latitude: -7.23, longitude: -35.8795 };
  expect(pontosAlcancados(depois, [longe], [], { anterior: antes })).toEqual([]);
});

test('salto de GPS não marca os pontos do caminho', () => {
  const longe = { latitude: -7.2, longitude: -35.92 };
  const aqui = { latitude: -7.23, longitude: -35.88 };
  const meio = { id: 'm', latitude: -7.215, longitude: -35.9 };
  expect(pontosAlcancados(aqui, [meio], [], { anterior: longe })).toEqual([]);
});

test('ponto já visitado não é alcançado de novo', () => {
  expect(pontosAlcancados({ latitude: -7.23, longitude: -35.88 }, [p1, p2], ['a'])).toEqual([]);
});

test('sem posição não alcança nada', () => {
  expect(pontosAlcancados(null, [p1], [])).toEqual([]);
});

test('registrar põe o ponto em visitados e o evento na fila', () => {
  const posicao = { latitude: -7.23, longitude: -35.88 };
  const estado = registrarChegada(estadoVazio(), p1, 'auto', posicao, agora);
  expect(estado.visitados).toEqual(['a']);
  expect(estado.pendentes).toEqual([
    { ponto_id: 'a', detectado_em: '2026-11-02T12:00:00.000Z', origem: 'auto', latitude: -7.23, longitude: -35.88 },
  ]);
});

test('registrar o mesmo ponto duas vezes não duplica o evento', () => {
  const uma = registrarChegada(estadoVazio(), p1, 'auto', null, agora);
  expect(registrarChegada(uma, p1, 'manual', null, agora)).toBe(uma);
});

test('a fila guarda a ordem em que as chegadas aconteceram, mesmo fora da ordem da rota', () => {
  let estado = registrarChegada(estadoVazio(), p3, 'auto', null, agora);
  estado = registrarChegada(estado, p1, 'manual', null, agora);
  expect(estado.pendentes.map(e => e.ponto_id)).toEqual(['c', 'a']);
});

test('sem resposta do servidor a fila continua cheia', () => {
  const estado = registrarChegada(estadoVazio(), p1, 'auto', null, agora);
  expect(removerProcessados(estado, idsProcessados(null)).pendentes).toHaveLength(1);
  expect(removerProcessados(estado, idsProcessados({ aceitos: 'x' })).pendentes).toHaveLength(1);
});

test('aceitos e rejeitados saem da fila e visitados fica como está', () => {
  let estado = registrarChegada(estadoVazio(), p1, 'auto', null, agora);
  estado = registrarChegada(estado, p2, 'manual', null, agora);
  estado = registrarChegada(estado, p3, 'manual', null, agora);
  const resposta = { aceitos: ['a'], rejeitados: [{ ponto_id: 'b', motivo: 'longe_do_ponto' }] };
  const depois = removerProcessados(estado, idsProcessados(resposta));
  expect(depois.pendentes.map(e => e.ponto_id)).toEqual(['c']);
  expect(depois.visitados).toEqual(['a', 'b', 'c']);
});
