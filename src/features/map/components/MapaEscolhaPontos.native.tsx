import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTrajetoRuas } from '../hooks/useTrajetoRuas';
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from '../utils/tiles';
import { linhaDoTrajeto } from '../utils/pinosEscolha';
import type { MapaEscolhaPontosProps, PontoDoMapa } from './MapaEscolhaPontos.tipos';

/**
 * Mapa da escolha de pontos (celular): WebView com Leaflet. O HTML é montado uma vez por lista
 * de pontos; embarque, desembarque, destaque, posição e trajeto chegam por `window.atualizar`,
 * sem recarregar a página (o zoom e a posição do mapa ficam como o aluno deixou).
 */
function montarHtml(pontos: PontoDoMapa[]): string {
  const pontosJson = JSON.stringify(
    pontos.map((p) => ({ id: p.id, apelido: p.apelido, latitude: p.latitude, longitude: p.longitude })),
  );
  return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #EAF0E6; }
    body { overflow: hidden; }
    .pino-escolha { background: transparent; border: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      function postar(carga) {
        try { window.ReactNativeWebView.postMessage(JSON.stringify(carga)); } catch (e) {}
      }
      if (typeof L === 'undefined') { postar({ type: 'erro' }); return; }

      var pontos = ${pontosJson};
      var mapa = L.map('map', { zoomControl: false }).setView([-15.78, -47.93], 5);
      L.tileLayer('${TILE_URL}', { attribution: '${TILE_ATTRIBUTION}', maxZoom: ${TILE_MAX_ZOOM} }).addTo(mapa);
      var camadaPinos = L.layerGroup().addTo(mapa);
      var camadaLinha = L.layerGroup().addTo(mapa);
      var camadaUsuario = L.layerGroup().addTo(mapa);
      var chaveLinha = '';
      var chaveUsuario = '';

      if (pontos.length > 0) {
        mapa.fitBounds(L.latLngBounds(pontos.map(function (p) { return [p.latitude, p.longitude]; })), { padding: [48, 48], maxZoom: 17 });
      }

      function pinoHtml(rotulo, cor, escolhido, anel, etiqueta) {
        var texto = escolhido ? '#FFFFFF' : '#156EF2';
        var borda = escolhido ? '#FFFFFF' : '#156EF2';
        var anelHtml = anel ? '<div style="position:absolute;left:-3px;top:-3px;width:40px;height:40px;border-radius:50%;border:4px solid #F5A623;box-sizing:border-box"></div>' : '';
        var chip = etiqueta ? '<div style="position:absolute;top:40px;left:50%;transform:translateX(-50%);background:#F5A623;color:#1E293B;font:800 12px sans-serif;padding:2px 8px;border-radius:10px;white-space:nowrap">' + etiqueta + '</div>' : '';
        return '<div style="position:relative;width:34px;height:34px">' + anelHtml +
          '<div style="position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50%;background:' + cor + ';border:3px solid ' + borda + ';box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box;color:' + texto + ';font:800 14px sans-serif;display:flex;align-items:center;justify-content:center">' + rotulo + '</div>' + chip + '</div>';
      }

      window.atualizar = function (e) {
        camadaPinos.clearLayers();
        pontos.forEach(function (p, i) {
          var embarque = p.id === e.emb;
          var desembarque = p.id === e.des;
          var cor = embarque ? '#16A34A' : desembarque ? '#DC2626' : '#FFFFFF';
          var rotulo = embarque ? 'E' : desembarque ? 'D' : String(i + 1);
          var destaque = e.destaque && e.destaque.id === p.id;
          var icone = L.divIcon({
            className: 'pino-escolha',
            html: pinoHtml(rotulo, cor, embarque || desembarque, destaque, destaque ? e.destaque.rotulo : ''),
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });
          var marcador = L.marker([p.latitude, p.longitude], { icon: icone }).addTo(camadaPinos);
          marcador.on('click', function () { postar({ type: 'ponto', id: p.id }); });
        });

        var chave = e.linha ? JSON.stringify(e.linha) + e.linhaReta : '';
        if (chave !== chaveLinha) {
          chaveLinha = chave;
          camadaLinha.clearLayers();
          if (e.linha && e.linha.length >= 2) {
            var linha = L.polyline(e.linha, { color: '#156EF2', weight: 6, opacity: 0.9, dashArray: e.linhaReta ? '8, 6' : null }).addTo(camadaLinha);
            mapa.fitBounds(linha.getBounds(), { padding: [56, 56], maxZoom: 17 });
          }
        }

        var chaveU = e.usuario ? e.usuario.latitude + ',' + e.usuario.longitude : '';
        if (chaveU !== chaveUsuario) {
          chaveUsuario = chaveU;
          camadaUsuario.clearLayers();
          if (e.usuario) {
            L.circleMarker([e.usuario.latitude, e.usuario.longitude], { radius: 9, color: '#FFFFFF', weight: 3, fillColor: '#156EF2', fillOpacity: 1 }).addTo(camadaUsuario);
            var alvo = null;
            if (e.destaque) {
              pontos.forEach(function (p) { if (p.id === e.destaque.id) alvo = p; });
            }
            if (alvo) {
              mapa.fitBounds(L.latLngBounds([[e.usuario.latitude, e.usuario.longitude], [alvo.latitude, alvo.longitude]]), { padding: [64, 64], maxZoom: 17 });
            } else {
              mapa.setView([e.usuario.latitude, e.usuario.longitude], 16);
            }
          }
        }
      };

      postar({ type: 'pronto' });
    })();
  </script>
</body>
</html>
  `;
}

export default function MapaEscolhaPontos({
  pontos,
  embarqueId,
  desembarqueId,
  destaque,
  usuario,
  aoTocarPonto,
  altura = 300,
}: MapaEscolhaPontosProps) {
  const webRef = useRef<WebView>(null);
  const [pronto, setPronto] = useState(false);
  const chavePontos = pontos.map((p) => p.id).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => montarHtml(pontos), [chavePontos]);

  const paradas = linhaDoTrajeto(pontos, embarqueId, desembarqueId);
  const trajeto = useTrajetoRuas(paradas);

  const estado = useMemo(() => {
    const porRuas = trajeto.length >= 2;
    const origem = porRuas ? trajeto : paradas;
    return {
      emb: embarqueId,
      des: desembarqueId,
      destaque,
      usuario,
      linha: origem.map((c) => [c.latitude, c.longitude]),
      linhaReta: !porRuas,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embarqueId, desembarqueId, destaque, usuario, trajeto, chavePontos]);

  useEffect(() => {
    if (!pronto) return;
    webRef.current?.injectJavaScript(`window.atualizar(${JSON.stringify(estado)}); true;`);
  }, [pronto, estado]);

  return (
    <View style={[styles.container, { height: altura }]}>
      <WebView
        key={chavePontos}
        ref={webRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://buska.projeto1.lsd.ufcg.edu.br' }}
        userAgent="BusKa/1.0.0-beta (React Native; OpenStreetMap tile client, contact: contato.buska@gmail.com)"
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        setSupportMultipleWindows={false}
        androidLayerType="software"
        onMessage={(evento) => {
          try {
            const dado = JSON.parse(evento.nativeEvent.data);
            if (dado.type === 'pronto') setPronto(true);
            if (dado.type === 'ponto') aoTocarPonto(String(dado.id));
          } catch {}
        }}
      />
      {!pronto && (
        <View pointerEvents="none" style={styles.carregando}>
          <ActivityIndicator size="small" color="#00B4D8" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', backgroundColor: '#EAF0E6' },
  webview: { flex: 1, opacity: 0.99, backgroundColor: 'transparent' },
  carregando: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF0E6' },
});
