// src/features/map/components/LocationMap.native.tsx
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { LocationMapProps } from '../types';
import { useLeafletWebViewBridge } from '../hooks/useLeafletWebViewBridge';
import { normalizeRoutePoints } from '../utils/points';

// Prévia: esconde o zoom, desliga o arraste de um dedo (a página continua rolando)
// e avisa o app no toque simples. A pinça de dois dedos segue ligada.
const CONFIGURA_PREVIA = `
  document.head.insertAdjacentHTML('beforeend','<style>.leaflet-control-zoom{display:none}.leaflet-marker-icon{pointer-events:none}</style>');
  (function configurar() {
    var mapa = window.BuskaMap && window.BuskaMap.mapInstance;
    if (!mapa) { setTimeout(configurar, 200); return; }
    mapa.dragging.disable();
    mapa.doubleClickZoom.disable();
    mapa.keyboard.disable();
    mapa.on('click', function () { postMessage({ type: 'mapTap' }); });
  })();
  true;
`;

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
  centralizarTick = 0,
}: LocationMapProps) {
  const paradas = useMemo(() => normalizeRoutePoints(pontosRota), [pontosRota]);

  const {
    webViewRef,
    html,
    mapReady,
    mapError,
    loadingMap,
    handleMessage,
    reloadMap,
    setDestination,
    clearDestination,
    setUserMarker,
    clearUserMarker,
    setStops,
    setRoute,
    clearRoute,
    centralizarOnibus,
    setMargins,
    reloadKey,
  } = useLeafletWebViewBridge(onToque);

  useEffect(() => {
    if (!mapReady) return;

    if (!posicaoOnibus) {
      clearDestination();
      return;
    }

    setDestination(posicaoOnibus);
  }, [mapReady, posicaoOnibus, clearDestination, setDestination]);

  useEffect(() => {
    if (!mapReady) return;

    if (!posicaoAluno) {
      clearUserMarker();
      return;
    }

    setUserMarker(posicaoAluno);
  }, [mapReady, posicaoAluno, clearUserMarker, setUserMarker]);

  useEffect(() => {
    if (centralizarTick && mapReady) centralizarOnibus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centralizarTick]);

  useEffect(() => {
    if (!mapReady) return;
    if (rotaCoordenadas && rotaCoordenadas.length >= 2) setRoute(rotaCoordenadas);
    else clearRoute();
  }, [mapReady, rotaCoordenadas, setRoute, clearRoute]);

  useEffect(() => {
    if (!mapReady) return;
    setStops(paradas, proximaParadaId);
  }, [mapReady, paradas, proximaParadaId, setStops]);

  useEffect(() => {
    if (!mapReady) return;
    setMargins(margemSuperior, margemInferior);
  }, [mapReady, margemSuperior, margemInferior, setMargins]);

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={webViewRef}
        style={[styles.webview, mapError && styles.hidden]}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://buska.projeto1.lsd.ufcg.edu.br' }}
        userAgent="BusKa/1.0.0-beta (React Native; OpenStreetMap tile client, contact: contato.buska@gmail.com)"
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={handleMessage}
        injectedJavaScript={previa ? CONFIGURA_PREVIA : undefined}
        androidLayerType="software"
      />

      {loadingMap && !mapError && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#00B4D8" />
        </View>
      )}

      {mapError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorIcon}>🗺️</Text>
          <Text style={styles.errorTitle}>Mapa indisponível</Text>
          <Text style={styles.errorSubtitle}>Verifique sua conexão com a internet</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={reloadMap}>
            <Text style={styles.reloadText}>Tentar novamente</Text>
          </TouchableOpacity>
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
  webview: {
    flex: 1,
    opacity: 0.99,
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  errorIcon: { fontSize: 40, marginBottom: 8 },
  errorTitle: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 4 },
  errorSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 16 },
  reloadButton: {
    backgroundColor: '#00B4D8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reloadText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});