import type { PontoFlatResponse } from '../../types';

export type RoutePoint = PontoFlatResponse;

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type NormalizedRoutePoint = RoutePoint & {
  latitude: number;
  longitude: number;
};

export type LocationMapProps = {
  /** Paradas da rota, desenhadas como círculos numerados. */
  pontosRota: RoutePoint[];
  /** Onde o ônibus está agora. */
  posicaoOnibus?: LatLng | null;
  /** Qual parada é a próxima, para destacar no mapa. */
  proximaParadaId?: string | null;
  posicaoAluno?: LatLng | null;
  /** Faixas da interface que ficam por cima do mapa, para os controles do
   *  Leaflet não sumirem embaixo do cabeçalho nem do painel. */
  margemSuperior?: number;
  margemInferior?: number;
  /** Modo prévia: sem botões de zoom, sem arraste e sem rolagem do mouse. Só a
   *  pinça de dois dedos dá zoom, e o toque simples chama onToque. */
  previa?: boolean;
  onToque?: () => void;
  /** Linha do trajeto até a próxima parada (motorista). */
  rotaCoordenadas?: LatLng[];
  /** false mantém o enquadramento das paradas em vez de recentrar no ônibus a cada leitura. */
  seguirOnibus?: boolean;
  /** Cada aumento deste número leva o mapa ao ônibus (zoom 16 ou o atual, se maior). */
  centralizarTick?: number;
  /** Avisa quando o seguimento automático do ônibus liga ou desliga (arrastar ou dar zoom desliga). */
  onSeguirChange?: (seguindo: boolean) => void;
};

export type RouteMapProps = {
  pontosRota: RoutePoint[];
  onPontoChegado?: (ponto: RoutePoint) => void;
};

export type RoutePolylineResult = {
  coordinates: LatLng[];
  distanceMeters?: number;
  durationSeconds?: number;
};