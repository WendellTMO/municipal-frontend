import type { LatLng, RoutePoint } from '../types';
import { distanceInMeters } from './geo';
import { normalizeRoutePoints } from './points';

// Parametros ajustaveis do desenho proposto.
export const LIMITE_DESVIO_METROS = 60;
export const LEITURAS_PARA_DESVIO = 3;
export const INTERVALO_MIN_RECALCULO_MS = 30_000;
export const MOVIMENTO_MINIMO_METROS = 5;

// Distancia da posicao ao ponto mais proximo do tracado, medida ao segmento.
// Projecao plana local: erro desprezivel nos poucos metros entre dois vertices de rua.
export function distanciaAoTracadoMetros(posicao: LatLng, coordenadas: LatLng[]): number {
  if (coordenadas.length === 0) return Infinity;
  if (coordenadas.length === 1) return distanceInMeters(posicao, coordenadas[0]);
  const metrosPorGrauLat = 111320;
  const metrosPorGrauLng = metrosPorGrauLat * Math.cos((posicao.latitude * Math.PI) / 180);
  let menor = Infinity;
  for (let i = 0; i < coordenadas.length - 1; i++) {
    const ax = (coordenadas[i].longitude - posicao.longitude) * metrosPorGrauLng;
    const ay = (coordenadas[i].latitude - posicao.latitude) * metrosPorGrauLat;
    const bx = (coordenadas[i + 1].longitude - posicao.longitude) * metrosPorGrauLng;
    const by = (coordenadas[i + 1].latitude - posicao.latitude) * metrosPorGrauLat;
    const dx = bx - ax;
    const dy = by - ay;
    const tamanho2 = dx * dx + dy * dy;
    // t e a fracao do segmento mais proxima da origem (a posicao), limitada a [0, 1].
    let t = tamanho2 === 0 ? 0 : (-ax * dx - ay * dy) / tamanho2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const px = ax + t * dx;
    const py = ay + t * dy;
    const distancia = Math.sqrt(px * px + py * py);
    if (distancia < menor) menor = distancia;
  }
  return menor;
}

export function foraDaRota(
  posicao: LatLng,
  coordenadasDaRota: LatLng[],
  limiteMetros: number = LIMITE_DESVIO_METROS,
): boolean {
  if (coordenadasDaRota.length < 2) return false;
  return distanciaAoTracadoMetros(posicao, coordenadasDaRota) > limiteMetros;
}

export type EstadoDesvio = { seguidas: number; ultimoRecalculoMs: number | null };

export const ESTADO_DESVIO_INICIAL: EstadoDesvio = { seguidas: 0, ultimoRecalculoMs: null };

type Leitura = { fora: boolean; emMovimento: boolean; semRota: boolean; agoraMs: number };

// Conta leituras seguidas fora da rota (so com o onibus em movimento) e decide se recalcula.
// Sem linha na tela (OSRM falhou antes) tambem recalcula, respeitando o mesmo intervalo.
export function avaliarLeitura(
  estado: EstadoDesvio,
  leitura: Leitura,
): { estado: EstadoDesvio; recalcular: boolean } {
  let seguidas = estado.seguidas;
  if (!leitura.fora) {
    seguidas = 0;
  } else if (leitura.emMovimento) {
    seguidas += 1;
  }
  const intervaloOk =
    estado.ultimoRecalculoMs === null ||
    leitura.agoraMs - estado.ultimoRecalculoMs >= INTERVALO_MIN_RECALCULO_MS;
  const precisa = leitura.semRota || seguidas >= LEITURAS_PARA_DESVIO;
  const recalcular = precisa && intervaloOk;
  return {
    estado: { seguidas, ultimoRecalculoMs: recalcular ? leitura.agoraMs : estado.ultimoRecalculoMs },
    recalcular,
  };
}

// Visao do aluno: sem saber quais paradas o motorista marcou, considera restantes
// a parada mais proxima do onibus e todas as seguintes na ordem da rota.
export function paradasRestantesPorProximidade(pontos: RoutePoint[], posicao: LatLng | null): LatLng[] {
  const ordenados = normalizeRoutePoints(pontos);
  const restantes: LatLng[] = [];
  if (!posicao || ordenados.length === 0) return restantes;
  let indiceMaisProxima = 0;
  let menor = Infinity;
  for (let i = 0; i < ordenados.length; i++) {
    const distancia = distanceInMeters(posicao, ordenados[i]);
    if (distancia < menor) {
      menor = distancia;
      indiceMaisProxima = i;
    }
  }
  for (let i = indiceMaisProxima; i < ordenados.length; i++) {
    restantes.push({ latitude: ordenados[i].latitude, longitude: ordenados[i].longitude });
  }
  return restantes;
}
