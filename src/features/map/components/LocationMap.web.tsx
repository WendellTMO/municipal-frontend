import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type * as LeafletNS from 'leaflet';

import type { LocationMapProps } from '../types';
import { normalizeRoutePoints } from '../utils/points';
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from '../utils/tiles';
import { destruirMapa } from '../utils/leafletSeguro';

type LeafletModule = typeof LeafletNS;
type LeafletMap = LeafletNS.Map;
type LeafletMarker = LeafletNS.Marker;

const ZOOM_CENTRALIZAR = 16;

export default function LocationMap({
  pontosRota,
  posicaoOnibus,
  proximaParadaId,
  posicaoAluno,
  margemSuperior = 0,
  margemInferior = 0,
  previa = false,
  onToque,
  rotaCoordenadas,
  seguirOnibus = true,
  centralizarTick = 0,
  onSeguirChange,
}: LocationMapProps) {
  const controles = !previa;
  // O mapa é criado uma vez; o ref entrega a ele o onToque mais recente.
  const onToqueRef = useRef(onToque);
  onToqueRef.current = onToque;
  const onSeguirRef = useRef(onSeguirChange);
  onSeguirRef.current = onSeguirChange;
  // Seguir o ônibus: arrastar ou dar zoom para; o botão Minha posição religa.
  const seguindoRef = useRef(seguirOnibus);
  const programaticoRef = useRef(false);

  const pararDeSeguir = () => {
    if (!seguindoRef.current) return;
    seguindoRef.current = false;
    onSeguirRef.current?.(false);
  };
  // setView feito pelo app não conta como gesto do usuário (o zoomstart sai síncrono).
  const irPara = (map: LeafletMap, centro: [number, number], zoom: number) => {
    programaticoRef.current = true;
    map.setView(centro, zoom);
    programaticoRef.current = false;
  };
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const LRef = useRef<LeafletModule | null>(null);
  const destMarkerRef = useRef<LeafletMarker | null>(null);
  const alunoMarkerRef = useRef<LeafletMarker | null>(null);
  const rotaLinhaRef = useRef<LeafletNS.Polyline | null>(null);
  const paradasRef = useRef<LeafletMarker[]>([]);
  const enquadrouRef = useRef<string | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [loadingMap, setLoadingMap] = useState(true);

  const paradas = useMemo(() => normalizeRoutePoints(pontosRota), [pontosRota]);

  const destinationLatLng = posicaoOnibus ?? null;

  // ─── Map initialisation ───────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (mapInstance.current || !mapRef.current) return;

      const leafletModule = await import('leaflet');
      const L = (leafletModule.default ?? leafletModule) as LeafletModule;
      LRef.current = L;

      if (!mounted || !mapRef.current) return;

      // Zoom à direita: o canto de cima à esquerda é do selo de estado do ônibus.
      // Prévia: só pinça de dois dedos dá zoom. O arraste de um dedo fica desligado
      // para a página continuar rolando, e a rolagem do mouse não é capturada.
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: controles,
        dragging: controles,
        scrollWheelZoom: controles,
        doubleClickZoom: controles,
        boxZoom: controles,
        keyboard: controles,
        touchZoom: true,
      }).setView([-23.55, -46.63], 13);
      if (controles) {
        L.control.zoom({ position: 'topright' }).addTo(map);
      } else {
        L.control.attribution({ prefix: false }).addAttribution('© OSM').addTo(map);
        map.on('click', () => onToqueRef.current?.());
      }

      L.tileLayer(TILE_URL, {
        attribution: controles ? TILE_ATTRIBUTION : '',
        maxZoom: TILE_MAX_ZOOM,
      }).addTo(map);

      map.on('dragstart', pararDeSeguir);
      map.on('zoomstart', () => {
        if (!programaticoRef.current) pararDeSeguir();
      });
      mapInstance.current = map;
      setMapReady(true);
      setLoadingMap(false);
    };

    initMap().catch((err) => {
      console.error('Erro Leaflet:', err);
      setLoadingMap(false);
    });

    return () => {
      mounted = false;
      if (mapInstance.current) {
        destruirMapa(mapInstance.current);
        mapInstance.current = null;
      }
    };
  }, []);

  // ─── Trajeto até a próxima parada ─────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !LRef.current) return;
    const map = mapInstance.current;
    const L = LRef.current;
    if (rotaLinhaRef.current) {
      map.removeLayer(rotaLinhaRef.current);
      rotaLinhaRef.current = null;
    }
    if (!rotaCoordenadas || rotaCoordenadas.length < 2) return;
    rotaLinhaRef.current = L.polyline(
      rotaCoordenadas.map((c) => L.latLng(c.latitude, c.longitude)),
      { color: '#1565C0', weight: 5, opacity: 0.8 },
    ).addTo(map);
  }, [mapReady, rotaCoordenadas]);

  // ─── Botão "minha posição": leva o mapa ao ônibus ─────────────────────────

  useEffect(() => {
    if (!centralizarTick || !mapReady || !mapInstance.current || !destinationLatLng) return;
    const map = mapInstance.current;
    if (seguirOnibus && !seguindoRef.current) {
      seguindoRef.current = true;
      onSeguirRef.current?.(true);
    }
    irPara(
      map,
      [destinationLatLng.latitude, destinationLatLng.longitude],
      Math.max(map.getZoom(), ZOOM_CENTRALIZAR),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centralizarTick]);

  // ─── Destination marker ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !LRef.current) return;
    const map = mapInstance.current;
    const L = LRef.current;

    if (!destinationLatLng) {
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      return;
    }

    const latLng = L.latLng(destinationLatLng.latitude, destinationLatLng.longitude);

    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng(latLng);
    } else {
      destMarkerRef.current = L.marker(latLng, {
        icon: L.divIcon({
          className: 'onibus-icon',
          html: '<div style="font-size:26px;line-height:32px;text-align:center;">&#128652;</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
        interactive: controles,
      }).addTo(map);
    }

    if (seguirOnibus && seguindoRef.current) irPara(map, [latLng.lat, latLng.lng], map.getZoom());
  }, [mapReady, destinationLatLng, seguirOnibus]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !LRef.current) return;
    const map = mapInstance.current;
    const L = LRef.current;

    if (!posicaoAluno) {
      if (alunoMarkerRef.current) {
        map.removeLayer(alunoMarkerRef.current);
        alunoMarkerRef.current = null;
      }
      return;
    }

    const latLng = L.latLng(posicaoAluno.latitude, posicaoAluno.longitude);

    if (alunoMarkerRef.current) {
      alunoMarkerRef.current.setLatLng(latLng);
      return;
    }

    alunoMarkerRef.current = L.marker(latLng, {
      icon: L.divIcon({
        className: 'aluno-icon',
        html: '<div style="width:16px;height:16px;background:#2196F3;border:3px solid white;border-radius:50%;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      zIndexOffset: 1000,
    }).addTo(map);
  }, [mapReady, posicaoAluno]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !LRef.current) return;
    const map = mapInstance.current;
    const L = LRef.current;

    paradasRef.current.forEach((m) => map.removeLayer(m));
    paradasRef.current = [];

    paradas.forEach((parada, i) => {
      const proxima = parada.id === proximaParadaId;
      const marcador = L.marker(L.latLng(parada.latitude, parada.longitude), {
        icon: L.divIcon({
          className: 'parada-icon',
          html:
            '<div style="width:22px;height:22px;border-radius:50%;display:flex;' +
            'align-items:center;justify-content:center;font:700 12px sans-serif;' +
            'border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.4);background:' +
            (proxima ? '#1565C0' : '#90A4AE') + ';color:#fff;">' + (i + 1) + '</div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        interactive: controles, // na prévia o toque no marcador também abre a tela cheia
      }).addTo(map);
      // Popup em vez de tooltip: tooltip depende de passar o mouse, que não
      // existe em tela de toque.
      if (controles) marcador.bindPopup(
        '<b>' + (i + 1) + '.</b> ' + (parada.apelido ?? 'Parada ' + (i + 1)),
        { closeButton: false, offset: [0, -6] },
      );
      paradasRef.current.push(marcador);
    });

    // Enquadra a rota inteira na primeira vez e de novo quando as faixas de interface
    // (cabeçalho e painel) mudam de altura, para nenhuma parada ficar embaixo delas.
    const chave = `${margemSuperior}:${margemInferior}`;
    if (paradas.length > 1 && enquadrouRef.current !== chave) {
      map.fitBounds(
        paradas.map((p) => [p.latitude, p.longitude] as [number, number]),
        {
          paddingTopLeft: [40, 40 + margemSuperior],
          paddingBottomRight: [40, 40 + margemInferior],
        },
      );
      enquadrouRef.current = chave;
    }
  }, [mapReady, paradas, proximaParadaId, margemSuperior, margemInferior]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    // O Leaflet cria uma faixa por canto: .leaflet-top vem em left e right, e
    // .leaflet-bottom também. Mexer só na primeira deixa a atribuição escondida.
    mapRef.current.querySelectorAll<HTMLElement>('.leaflet-top').forEach((el) => {
      el.style.marginTop = `${margemSuperior + 8}px`;
    });
    mapRef.current.querySelectorAll<HTMLElement>('.leaflet-bottom').forEach((el) => {
      el.style.marginBottom = `${margemInferior + 4}px`;
    });
  }, [mapReady, margemSuperior, margemInferior]);

  return (
    <View style={styles.container}>
      <div ref={mapRef} style={styles.map as React.CSSProperties} />

      {loadingMap && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderRadius: 0,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
