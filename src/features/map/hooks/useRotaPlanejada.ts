import { useCallback, useEffect, useRef, useState } from 'react';
import { OSRM_BASE_URL } from '../../../config/osrm';
import type { LatLng } from '../types';
import { distanceInMeters } from '../utils/geo';
import {
  ESTADO_DESVIO_INICIAL,
  MOVIMENTO_MINIMO_METROS,
  avaliarLeitura,
  foraDaRota,
} from '../utils/desvioRota';
import { buscarTrajetoRuas, chaveTrajeto } from '../utils/trajetoRuas';

// Rota planejada: trajeto pelas ruas da posicao atual (ou da 1a parada) pelas paradas restantes.
// Recalcula quando as paradas restantes mudam e quando o onibus sai do traçado (calculo local
// no aparelho de quem ve o mapa). Falha do OSRM mantem a linha anterior. Sem dados devolve [].
export function useRotaPlanejada(posicao: LatLng | null, paradas: LatLng[], ativo: boolean): LatLng[] {
  const [rota, setRota] = useState<LatLng[]>([]);
  const rotaRef = useRef<LatLng[]>([]);
  const estadoRef = useRef(ESTADO_DESVIO_INICIAL);
  const anteriorRef = useRef<LatLng | null>(null);
  const usouPosicaoRef = useRef(false);
  const controleRef = useRef<AbortController | null>(null);
  const posicaoRef = useRef(posicao);
  posicaoRef.current = posicao;
  const paradasRef = useRef(paradas);
  paradasRef.current = paradas;
  const chave = chaveTrajeto(paradas);

  const recalcular = useCallback(() => {
    // Um calculo por vez: o novo cancela o anterior (ex.: parada visitada no meio do voo).
    controleRef.current?.abort();
    const controle = new AbortController();
    controleRef.current = controle;
    const origem = posicaoRef.current;
    usouPosicaoRef.current = origem !== null;
    const pontos = origem ? [origem, ...paradasRef.current] : paradasRef.current;
    estadoRef.current = { ...estadoRef.current, ultimoRecalculoMs: Date.now() };
    buscarTrajetoRuas(pontos, { baseUrl: OSRM_BASE_URL, signal: controle.signal }).then((coordenadas) => {
      if (controle.signal.aborted || coordenadas.length < 2) return;
      rotaRef.current = coordenadas;
      setRota(coordenadas);
    });
  }, []);

  // Paradas restantes mudaram (ou a viagem comecou): calcula de novo.
  useEffect(() => {
    if (!ativo || paradasRef.current.length === 0) {
      controleRef.current?.abort();
      rotaRef.current = [];
      estadoRef.current = ESTADO_DESVIO_INICIAL;
      setRota((atual) => (atual.length > 0 ? [] : atual));
      return;
    }
    recalcular();
    return () => controleRef.current?.abort();
  }, [ativo, chave, recalcular]);

  // Cada leitura nova de posicao: detecta desvio.
  useEffect(() => {
    if (!ativo || !posicao || paradasRef.current.length === 0) return;
    const anterior = anteriorRef.current;
    anteriorRef.current = posicao;
    // A rota saiu da 1a parada porque nao havia GPS: refaz a partir da primeira posicao.
    if (!usouPosicaoRef.current) {
      recalcular();
      return;
    }
    const semRota = rotaRef.current.length < 2;
    const resultado = avaliarLeitura(estadoRef.current, {
      fora: foraDaRota(posicao, rotaRef.current),
      emMovimento: anterior !== null && distanceInMeters(anterior, posicao) >= MOVIMENTO_MINIMO_METROS,
      semRota,
      agoraMs: Date.now(),
    });
    estadoRef.current = resultado.estado;
    if (resultado.recalcular) recalcular();
  }, [ativo, posicao, recalcular]);

  return rota;
}
