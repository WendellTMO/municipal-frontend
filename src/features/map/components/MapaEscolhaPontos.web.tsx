import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import type * as LeafletNS from 'leaflet';
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from '../utils/tiles';
import { destruirMapa } from '../utils/leafletSeguro';
import { useTrajetoRuas } from '../hooks/useTrajetoRuas';
import { corDoPino, linhaDoTrajeto, pinoEscolhaHtml, rotuloDoPino } from '../utils/pinosEscolha';
import type { MapaEscolhaPontosProps } from './MapaEscolhaPontos.tipos';

type LeafletModule = typeof LeafletNS;

/**
 * Mapa da escolha de pontos (navegador): pinos numerados, embarque e desembarque em destaque,
 * ponto mais próximo com anel dourado, posição do aluno e o trajeto pelas ruas entre os dois.
 */
export default function MapaEscolhaPontos({
  pontos,
  embarqueId,
  desembarqueId,
  destaque,
  usuario,
  aoTocarPonto,
  altura = 300,
}: MapaEscolhaPontosProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<LeafletNS.Map | null>(null);
  const LRef = useRef<LeafletModule | null>(null);
  const [pronto, setPronto] = useState(false);
  const aoTocarRef = useRef(aoTocarPonto);
  aoTocarRef.current = aoTocarPonto;

  const paradas = linhaDoTrajeto(pontos, embarqueId, desembarqueId);
  const trajeto = useTrajetoRuas(paradas);

  useEffect(() => {
    let ativo = true;
    const iniciar = async () => {
      if (!divRef.current || mapaRef.current) return;
      const modulo = await import('leaflet');
      const L = (modulo.default ?? modulo) as LeafletModule;
      if (!ativo || !divRef.current) return;
      LRef.current = L;
      const mapa = L.map(divRef.current, { zoomControl: false }).setView([-15.78, -47.93], 5);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM }).addTo(mapa);
      mapaRef.current = mapa;
      setPronto(true);
    };
    iniciar().catch((erro) => console.error('Erro ao carregar o mapa:', erro));
    return () => {
      ativo = false;
      if (mapaRef.current) {
        destruirMapa(mapaRef.current);
        mapaRef.current = null;
      }
    };
  }, []);

  // Enquadra todos os pontos quando a lista muda (não a cada escolha).
  const chavePontos = pontos.map((p) => p.id).join('|');
  useEffect(() => {
    if (!pronto || !mapaRef.current || !LRef.current || pontos.length === 0) return;
    const L = LRef.current;
    const limites = L.latLngBounds(pontos.map((p) => L.latLng(p.latitude, p.longitude)));
    mapaRef.current.fitBounds(limites, { padding: [48, 48], maxZoom: 17 });
  }, [pronto, chavePontos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pinos: redesenhados a cada escolha, sem mexer no zoom.
  useEffect(() => {
    if (!pronto || !mapaRef.current || !LRef.current) return;
    const mapa = mapaRef.current;
    const L = LRef.current;
    const camadas: LeafletNS.Layer[] = [];
    pontos.forEach((ponto, i) => {
      const doDestaque = destaque && destaque.id === ponto.id ? destaque.rotulo : null;
      const icone = L.divIcon({
        className: 'pino-escolha',
        html: pinoEscolhaHtml({
          rotulo: rotuloDoPino(ponto.id, i, embarqueId, desembarqueId),
          cor: corDoPino(ponto.id, embarqueId, desembarqueId),
          anelDourado: !!doDestaque,
          etiqueta: doDestaque,
        }),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const marcador = L.marker([ponto.latitude, ponto.longitude], { icon: icone, title: ponto.apelido }).addTo(mapa);
      marcador.on('click', () => aoTocarRef.current(ponto.id));
      camadas.push(marcador);
    });
    return () => {
      if (mapaRef.current !== mapa) return;
      camadas.forEach((c) => mapa.removeLayer(c));
    };
  }, [pronto, pontos, embarqueId, desembarqueId, destaque]);

  // Trajeto pelas ruas só entre embarque e desembarque. Sem resposta do serviço, linha reta.
  useEffect(() => {
    if (!pronto || !mapaRef.current || !LRef.current || paradas.length < 2) return;
    const mapa = mapaRef.current;
    const L = LRef.current;
    const ruas = trajeto.map((c) => L.latLng(c.latitude, c.longitude));
    const pontosDaLinha = ruas.length >= 2 ? ruas : paradas.map((p) => L.latLng(p.latitude, p.longitude));
    const linha = L.polyline(pontosDaLinha, {
      color: '#156EF2',
      weight: 6,
      opacity: 0.9,
      dashArray: ruas.length >= 2 ? undefined : '8, 6',
    }).addTo(mapa);
    mapa.fitBounds(linha.getBounds(), { padding: [56, 56], maxZoom: 17 });
    return () => {
      if (mapaRef.current !== mapa) return;
      mapa.removeLayer(linha);
    };
  }, [pronto, trajeto, embarqueId, desembarqueId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Posição do aluno: ponto azul, e o mapa mostra ele e o ponto mais próximo.
  useEffect(() => {
    if (!pronto || !mapaRef.current || !LRef.current || !usuario) return;
    const mapa = mapaRef.current;
    const L = LRef.current;
    const marcador = L.circleMarker([usuario.latitude, usuario.longitude], {
      radius: 9,
      color: '#FFFFFF',
      weight: 3,
      fillColor: '#156EF2',
      fillOpacity: 1,
    }).addTo(mapa);
    const alvo = destaque ? pontos.find((p) => p.id === destaque.id) : undefined;
    if (alvo) {
      mapa.fitBounds(L.latLngBounds([L.latLng(usuario.latitude, usuario.longitude), L.latLng(alvo.latitude, alvo.longitude)]), {
        padding: [64, 64],
        maxZoom: 17,
      });
    } else {
      mapa.setView([usuario.latitude, usuario.longitude], 16);
    }
    return () => {
      if (mapaRef.current !== mapa) return;
      mapa.removeLayer(marcador);
    };
  }, [pronto, usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={divRef} style={{ ...(styles.mapa as React.CSSProperties), height: altura }} />;
}

const styles = StyleSheet.create({
  mapa: { width: '100%', overflow: 'hidden', backgroundColor: '#EAF0E6' },
});
