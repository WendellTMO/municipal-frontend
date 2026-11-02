/**
 * Chegadas aos pontos durante a viagem, calculadas no aparelho do motorista.
 *
 * `visitados` guarda os ids dos pontos já alcançados (em qualquer ordem). `pendentes` é a fila de
 * eventos que ainda não foram confirmados pelo servidor: ela sobrevive à falta de internet e só
 * esvazia quando o servidor responde. Todas as funções devolvem um estado novo.
 */
import { distanceInMeters } from '../features/map/utils/geo';
import type { ChegadaEvento, ChegadasResposta } from '../services/motoristaService';

type Posicao = { latitude: number; longitude: number };
type Ponto = { id?: string; latitude: number; longitude: number };
export type EstadoChegadas = { visitados: string[]; pendentes: ChegadaEvento[] };

export const RAIO_CHEGADA_M = 50;

export const estadoVazio = (): EstadoChegadas => ({ visitados: [], pendentes: [] });

const METROS_POR_GRAU = 111320;
// Trecho maior que isso entre duas leituras é salto de GPS (túnel, sinal perdido), não percurso.
const TRECHO_MAXIMO_M = 200;

// Menor distância em metros do ponto ao trecho reto a->b (plano local, bom para trechos curtos).
export const distanciaAoTrecho = (ponto: Posicao, a: Posicao, b: Posicao): number => {
  const cos = Math.cos((ponto.latitude * Math.PI) / 180);
  const ax = (a.longitude - ponto.longitude) * METROS_POR_GRAU * cos;
  const ay = (a.latitude - ponto.latitude) * METROS_POR_GRAU;
  const bx = (b.longitude - ponto.longitude) * METROS_POR_GRAU * cos;
  const by = (b.latitude - ponto.latitude) * METROS_POR_GRAU;
  const dx = bx - ax;
  const dy = by - ay;
  const comprimento2 = dx * dx + dy * dy;
  let t = 0;
  if (comprimento2 > 0) t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / comprimento2));
  return Math.hypot(ax + t * dx, ay + t * dy);
};

// Ids dos pontos ainda não visitados que estão dentro do raio, em qualquer ordem da lista.
// `anterior` é a leitura de GPS logo antes desta: se o ônibus cortou o raio entre as duas
// leituras sem ter uma leitura dentro dele, o ponto também conta. Só passe `anterior` quando
// as leituras forem próximas no tempo; trechos acima de 200 m são ignorados como salto de GPS.
export const pontosAlcancados = (
  posicao: Posicao | null,
  pontos: Ponto[],
  visitados: string[],
  { raio = RAIO_CHEGADA_M, anterior = null }: { raio?: number; anterior?: Posicao | null } = {},
): string[] => {
  const ids: string[] = [];
  if (!posicao) return ids;
  for (const ponto of pontos) {
    if (!ponto.id || visitados.includes(ponto.id)) continue;
    let distancia = distanceInMeters(posicao, ponto);
    if (anterior && distanceInMeters(anterior, posicao) <= TRECHO_MAXIMO_M) {
      distancia = Math.min(distancia, distanciaAoTrecho(ponto, anterior, posicao));
    }
    if (distancia <= raio) ids.push(ponto.id);
  }
  return ids;
};

// origem: 'auto' (GPS), 'manual' (botão Cheguei) ou 'conferencia' (tela de finalizar).
export const registrarChegada = (
  estado: EstadoChegadas,
  ponto: { id?: string },
  origem: ChegadaEvento['origem'],
  posicao: Posicao | null,
  agora: Date = new Date(),
): EstadoChegadas => {
  // Ponto sem id não tem como ser informado ao servidor.
  if (!ponto.id || estado.visitados.includes(ponto.id)) return estado;
  const evento: ChegadaEvento = { ponto_id: ponto.id, detectado_em: agora.toISOString(), origem };
  if (posicao) {
    evento.latitude = posicao.latitude;
    evento.longitude = posicao.longitude;
  }
  return {
    visitados: [...estado.visitados, ponto.id],
    pendentes: [...estado.pendentes, evento],
  };
};

// Tira da fila os eventos que o servidor já respondeu (aceitos ou rejeitados).
export const removerProcessados = (estado: EstadoChegadas, idsProcessados: string[]): EstadoChegadas => {
  const restantes: ChegadaEvento[] = [];
  for (const evento of estado.pendentes) {
    if (!idsProcessados.includes(evento.ponto_id)) restantes.push(evento);
  }
  return { visitados: estado.visitados, pendentes: restantes };
};

// Lê o corpo da resposta do servidor; qualquer formato inesperado não tira nada da fila.
export const idsProcessados = (resposta: ChegadasResposta | null | undefined): string[] => {
  const ids: string[] = [];
  if (!resposta || !Array.isArray(resposta.aceitos) || !Array.isArray(resposta.rejeitados)) return ids;
  for (const id of resposta.aceitos) ids.push(id);
  for (const rejeitado of resposta.rejeitados) ids.push(rejeitado.ponto_id);
  return ids;
};
