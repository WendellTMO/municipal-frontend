import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTrajetoRuas } from '../hooks/useTrajetoRuas';
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from '../utils/tiles';

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

interface OpcoesHtml {
  numerar?: boolean;
  pino?: { latitude: number; longitude: number } | null;
  margemTopo: number;
  margemBase: number;
}

function pontosValidos(points: RoutePoint[]): RoutePoint[] {
  return [...points]
    .filter(p => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    })
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

function buildStaticRouteHtml(
  points: RoutePoint[],
  trajeto: { latitude: number; longitude: number }[],
  opcoes: OpcoesHtml,
): string {
  const validPoints = pontosValidos(points);
  const pinoJson = JSON.stringify(opcoes.pino || null);
  const ruasJson = JSON.stringify(trajeto.map(c => [c.latitude, c.longitude]));

  const pointsJson = JSON.stringify(
    validPoints.map((p, i) => ({
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      label: opcoes.numerar
        ? String(i + 1)
        : i === 0 ? 'A' : i === validPoints.length - 1 ? 'B' : String(i + 1),
      color: opcoes.numerar
        ? '#4285F4'
        : i === 0 ? '#34A853' : i === validPoints.length - 1 ? '#EA4335' : '#4285F4',
      name: p.nome || p.apelido || `Ponto ${i + 1}`,
    })),
  );

  return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #f5f5f5; }
    body { overflow: hidden; }
    .leaflet-container { width: 100%; height: 100%; }
    .custom-pin { background: transparent; border: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function() {
      if (typeof L === 'undefined') return;

      var points = ${pointsJson};
      var ruas = ${ruasJson};
      var pino = ${pinoJson};
      var map = L.map('map', { zoomControl: ${!opcoes.numerar} }).setView([-15.78, -47.93], 5);

      L.tileLayer('${TILE_URL}', {
        attribution: '${TILE_ATTRIBUTION}',
        maxZoom: ${TILE_MAX_ZOOM},
      }).addTo(map);

      var latLngs = [];

      points.forEach(function(point) {
        var latLng = L.latLng(point.lat, point.lng);
        latLngs.push(latLng);

        var pinHtml = [
          '<div style="display:flex;flex-direction:column;align-items:center">',
            '<div style="',
              'width:28px;height:28px;border-radius:50%;',
              'background:' + point.color + ';',
              'color:white;display:flex;align-items:center;justify-content:center;',
              'font-size:12px;font-weight:bold;',
              'border:3px solid white;',
              'box-shadow:0 2px 6px rgba(0,0,0,0.35);',
            '">' + point.label + '</div>',
            '<div style="',
              'width:0;height:0;',
              'border-left:5px solid transparent;',
              'border-right:5px solid transparent;',
              'border-top:7px solid ' + point.color + ';',
              'margin-top:-1px;',
            '"></div>',
          '</div>',
        ].join('');

        var icon = L.divIcon({
          className: 'custom-pin',
          html: pinHtml,
          iconSize: [28, 42],
          iconAnchor: [14, 42],
          popupAnchor: [0, -42],
        });

        L.marker(latLng, { icon: icon }).addTo(map).bindPopup('<strong>' + point.name + '</strong>');
      });

      if (latLngs.length >= 2) {
        if (ruas.length >= 2) {
          L.polyline(ruas, { color: '#4285F4', weight: 5, opacity: 0.85 }).addTo(map);
        } else {
          L.polyline(latLngs, {
            color: '#4285F4',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 4',
          }).addTo(map);
        }
        map.fitBounds(L.latLngBounds(latLngs.concat(ruas)), {
          paddingTopLeft: [40, ${opcoes.margemTopo}],
          paddingBottomRight: [40, ${40 + opcoes.margemBase}],
        });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 15);
      }

      if (pino) {
        var pinoHtml = '<div style="display:flex;flex-direction:column;align-items:center">' +
          '<div style="width:30px;height:30px;border-radius:50%;background:#F5A623;border:3px solid white"></div>' +
          '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid #F5A623;margin-top:-1px"></div></div>';
        L.marker([pino.latitude, pino.longitude], {
          icon: L.divIcon({ className: 'custom-pin', html: pinoHtml, iconSize: [30, 45], iconAnchor: [15, 45] }),
        }).addTo(map);
        map.panTo([pino.latitude, pino.longitude]);
      }

      map.on('contextmenu', function(e) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'longPress', latitude: e.latlng.lat, longitude: e.latlng.lng,
          }));
        } catch(err) {}
      });

      try {
        window.ReactNativeWebView &&
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
      } catch(e) {}
    })();
  </script>
</body>
</html>
  `;
}

export default function StaticRouteMap({
  pontosRota,
  altura,
  numerar,
  pino,
  aoTocarLongo,
  margemTopo = 40,
  margemBase = 0,
}: StaticRouteMapProps) {
  const [loading, setLoading] = useState(true);

  const paradas = useMemo(() => {
    const lista: { latitude: number; longitude: number }[] = [];
    for (const p of pontosValidos(pontosRota || [])) {
      lista.push({ latitude: Number(p.latitude), longitude: Number(p.longitude) });
    }
    return lista;
  }, [pontosRota]);
  const trajeto = useTrajetoRuas(paradas);

  // A chave muda quando o trajeto chega, e o WebView recarrega ja com a rota pelas ruas.
  const { html, webViewKey } = useMemo(() => {
    const keyParts = (pontosRota || []).map(
      p => `${p.id}-${p.latitude}-${p.longitude}-${p.ordem}`,
    );
    return {
      html: buildStaticRouteHtml(pontosRota || [], trajeto, { numerar, pino, margemTopo, margemBase }),
      webViewKey: keyParts.join('|') + '#' + trajeto.length + '#' + (pino ? `${pino.latitude},${pino.longitude}` : '') + '#' + margemBase,
    };
  }, [pontosRota, trajeto, numerar, pino, margemTopo, margemBase]);

  return (
    <View style={[styles.container, altura !== undefined && { height: altura, borderRadius: 0 }]}>
      <WebView
        key={webViewKey}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://buska.projeto1.lsd.ufcg.edu.br' }}
        userAgent="BusKa/1.0.0-beta (React Native; OpenStreetMap tile client, contact: contato.buska@gmail.com)"
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={event => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'mapReady') setLoading(false);
            if (data.type === 'longPress' && aoTocarLongo) {
              aoTocarLongo({ latitude: data.latitude, longitude: data.longitude });
            }
          } catch {}
        }}
        androidLayerType="software"
      />
      {loading && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#00B4D8" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
    opacity: 0.99,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
});
