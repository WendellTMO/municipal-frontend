import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import type * as LeafletNS from 'leaflet';
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from '../utils/tiles';
import { destruirMapa } from '../utils/leafletSeguro';
import { useTrajetoRuas } from '../hooks/useTrajetoRuas';

type LeafletModule = typeof LeafletNS;
type LeafletMap = LeafletNS.Map;

interface RoutePoint {
  id?: string | number;
  latitude: number | string;
  longitude: number | string;
  nome?: string;
  apelido?: string;
  ordem?: number;
}

interface StaticRouteMapProps {
  pontosRota: RoutePoint[];
  // Tela cheia com a folha de pontos: altura própria, pinos 1..N, pino dourado e toque longo.
  altura?: number | '100%';
  numerar?: boolean;
  pino?: { latitude: number; longitude: number } | null;
  aoTocarLongo?: (local: { latitude: number; longitude: number }) => void;
  margemTopo?: number;
  margemBase?: number;
}

interface PreparedPoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
  name: string;
}

/**
 * Same visual contract as StaticRouteMap.native (A/B pins + dashed line),
 * drawn with the Leaflet DOM API instead of a WebView + HTML string.
 */
function preparePoints(points: RoutePoint[], numerar?: boolean): PreparedPoint[] {
  const validPoints = [...points]
    .filter((p) => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    })
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return validPoints.map((p, i) => ({
    lat: Number(p.latitude),
    lng: Number(p.longitude),
    label:
      numerar ? String(i + 1) : i === 0 ? 'A' : i === validPoints.length - 1 ? 'B' : String(i + 1),
    color:
      numerar
        ? '#4285F4'
        : i === 0
          ? '#34A853'
          : i === validPoints.length - 1
            ? '#EA4335'
            : '#4285F4',
    name: p.nome || p.apelido || `Ponto ${i + 1}`,
  }));
}

function pinHtml(point: PreparedPoint): string {
  return [
    '<div style="display:flex;flex-direction:column;align-items:center">',
    '<div style="',
    'width:28px;height:28px;border-radius:50%;',
    `background:${point.color};`,
    'color:white;display:flex;align-items:center;justify-content:center;',
    'font-size:12px;font-weight:bold;',
    'border:3px solid white;',
    'box-shadow:0 2px 6px rgba(0,0,0,0.35);',
    `">${point.label}</div>`,
    '<div style="',
    'width:0;height:0;',
    'border-left:5px solid transparent;',
    'border-right:5px solid transparent;',
    `border-top:7px solid ${point.color};`,
    'margin-top:-1px;',
    '"></div>',
    '</div>',
  ].join('');
}

const PINO_DOURADO = [
  '<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.35))">',
  '<div style="width:30px;height:30px;border-radius:50%;background:#F5A623;border:3px solid white"></div>',
  '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid #F5A623;margin-top:-1px"></div>',
  '</div>',
].join('');

export default function StaticRouteMap({
  pontosRota,
  altura,
  numerar,
  pino,
  aoTocarLongo,
  margemTopo = 40,
  margemBase = 0,
}: StaticRouteMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const LRef = useRef<LeafletModule | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const longoRef = useRef(aoTocarLongo);
  longoRef.current = aoTocarLongo;

  const points = useMemo(() => preparePoints(pontosRota ?? [], numerar), [pontosRota, numerar]);
  const paradas = useMemo(() => {
    const lista: { latitude: number; longitude: number }[] = [];
    for (const p of points) {
      lista.push({ latitude: p.lat, longitude: p.lng });
    }
    return lista;
  }, [points]);
  const trajeto = useTrajetoRuas(paradas);

  // ─── Map initialisation ───────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapRef.current || mapInstance.current) return;

      const leafletModule = await import('leaflet');
      const L = (leafletModule.default ?? leafletModule) as LeafletModule;
      if (!mounted || !mapRef.current) return;

      LRef.current = L;
      const map = L.map(mapRef.current, { zoomControl: !numerar }).setView(
        [-15.78, -47.93],
        5,
      );

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: TILE_MAX_ZOOM,
      }).addTo(map);

      // Toque longo no celular e botão direito no computador.
      map.on('contextmenu', (e: LeafletNS.LeafletMouseEvent) => {
        longoRef.current?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });

      mapInstance.current = map;
      setMapReady(true);
    };

    initMap().catch((err) => console.error('Erro ao carregar Leaflet:', err));

    return () => {
      mounted = false;
      if (mapInstance.current) {
        destruirMapa(mapInstance.current);
        mapInstance.current = null;
      }
    };
  }, []);

  // ─── Draw route (markers + dashed polyline) ───────────────────────────────

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !LRef.current) return;
    const map = mapInstance.current;
    const L = LRef.current;

    // Redrawn from scratch whenever the stop list changes.
    const layers: LeafletNS.Layer[] = [];
    const latLngs = points.map((p) => L.latLng(p.lat, p.lng));

    points.forEach((point, i) => {
      const icon = L.divIcon({
        className: 'custom-pin',
        html: pinHtml(point),
        iconSize: [28, 42],
        iconAnchor: [14, 42],
        popupAnchor: [0, -42],
      });
      layers.push(
        L.marker(latLngs[i], { icon })
          .addTo(map)
          .bindPopup(`<strong>${point.name}</strong>`),
      );
    });

    if (latLngs.length >= 2) {
      // Trajeto pelas ruas quando o OSRM respondeu; sem ele, a linha reta tracejada.
      const ruas: LeafletNS.LatLng[] = [];
      for (const c of trajeto) {
        ruas.push(L.latLng(c.latitude, c.longitude));
      }
      if (ruas.length >= 2) {
        layers.push(L.polyline(ruas, { color: '#4285F4', weight: 5, opacity: 0.85 }).addTo(map));
      } else {
        layers.push(
          L.polyline(latLngs, {
            color: '#4285F4',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 4',
          }).addTo(map),
        );
      }
      map.fitBounds(L.latLngBounds(latLngs.concat(ruas)), {
        paddingTopLeft: [40, margemTopo],
        paddingBottomRight: [40, 40 + margemBase],
      });
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 15);
    }

    return () => {
      // Mapa ja destruido pelo desmonte: mexer nele quebra com _leaflet_pos.
      if (mapInstance.current !== map) return;
      layers.forEach((layer) => map.removeLayer(layer));
    };
  }, [mapReady, points, trajeto, margemTopo, margemBase]);

  // Pino dourado do ponto que ainda vai ser adicionado.
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !LRef.current || !pino) return;
    const map = mapInstance.current;
    const L = LRef.current;
    const icon = L.divIcon({
      className: 'custom-pin',
      html: PINO_DOURADO,
      iconSize: [30, 45],
      iconAnchor: [15, 45],
    });
    const marcador = L.marker([pino.latitude, pino.longitude], { icon }).addTo(map);
    map.panTo([pino.latitude, pino.longitude]);
    return () => {
      if (mapInstance.current !== map) return;
      map.removeLayer(marcador);
    };
  }, [mapReady, pino]);

  const estilo = { ...(styles.container as React.CSSProperties) };
  if (altura !== undefined) {
    estilo.height = altura;
    estilo.borderRadius = 0;
  }
  return <div ref={mapRef} style={estilo} />;
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
});
