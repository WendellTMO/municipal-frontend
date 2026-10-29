/**
 * Folha inferior recolhível sobre um mapa em tela cheia.
 * Três posições: recolhida (alça e rodapé), meia e expandida. Puxar a alça muda de posição,
 * tocar nela alterna. O rodapé (botão fixo) fica por cima da folha, no fim da tela.
 * Animated e PanResponder, sem biblioteca. onMudarSnap só dispara quando o dedo solta.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { ALCA_ALTURA, alturaVisivel, snapMaisProximo, proximoSnapNoToque } from '../utils/folhaInferior';

const FolhaInferior = ({ alturaTela, reservaTopo, alturaRodape, snap, onMudarSnap, rodape, children }) => {
  const alturas = {
    recolhida: alturaVisivel('recolhida', alturaTela, reservaTopo, alturaRodape),
    meia: alturaVisivel('meia', alturaTela, reservaTopo, alturaRodape),
    expandida: alturaVisivel('expandida', alturaTela, reservaTopo, alturaRodape),
  };
  // translateY 0 = folha toda visível; cresce ao recolher.
  const deslocamentoDe = nome => alturas.expandida - alturas[nome];

  const ty = useRef(new Animated.Value(deslocamentoDe(snap))).current;
  const vivo = useRef({ alturas, snap, onMudarSnap, inicio: 0 });
  vivo.current.alturas = alturas;
  vivo.current.snap = snap;
  vivo.current.onMudarSnap = onMudarSnap;

  useEffect(() => {
    Animated.timing(ty, { toValue: deslocamentoDe(snap), duration: 220, useNativeDriver: false }).start();
  }, [snap, alturaTela, reservaTopo, alturaRodape]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        ty.stopAnimation(valor => {
          vivo.current.inicio = valor;
        });
      },
      onPanResponderMove: (_, g) => {
        const a = vivo.current.alturas;
        const minimo = 0;
        const maximo = a.expandida - a.recolhida;
        ty.setValue(Math.min(maximo, Math.max(minimo, vivo.current.inicio + g.dy)));
      },
      onPanResponderRelease: (_, g) => {
        const { alturas: a, snap: atual, onMudarSnap: mudar } = vivo.current;
        if (Math.abs(g.dy) < 6 && Math.abs(g.dx) < 6) {
          mudar(proximoSnapNoToque(atual));
          return;
        }
        // vy positivo = dedo descendo = folha recolhendo.
        const visivel = a.expandida - (vivo.current.inicio + g.dy) - g.vy * 120;
        const destino = snapMaisProximo(visivel, a);
        if (destino === atual) {
          Animated.timing(ty, { toValue: a.expandida - a[atual], duration: 160, useNativeDriver: false }).start();
        }
        mudar(destino);
      },
    }),
  ).current;

  return (
    <>
      <Animated.View
        style={[styles.folha, { height: alturas.expandida, transform: [{ translateY: ty }] }]}
        pointerEvents="box-none">
        <View
          {...pan.panHandlers}
          style={styles.alcaZona}
          accessibilityRole="button"
          accessibilityLabel="Recolher ou expandir a lista">
          <View style={styles.alca} />
        </View>
        <View style={[styles.corpo, { paddingBottom: deslocamentoDe(snap) }]}>{children}</View>
      </Animated.View>
      {rodape ? <View style={[styles.rodape, { height: alturaRodape }]}>{rodape}</View> : null}
    </>
  );
};

const styles = StyleSheet.create({
  folha: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  alcaZona: {
    height: ALCA_ALTURA,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { touchAction: 'none', cursor: 'grab' } : null),
  },
  alca: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.neutral[300] },
  corpo: { flex: 1 },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
    elevation: 13,
    zIndex: 13,
  },
});

export default FolhaInferior;
