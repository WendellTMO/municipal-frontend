/**
 * Barra de navegação inferior (como Mercado Pago, Instagram e WhatsApp): os atalhos principais
 * ficam no rodapé, onde o polegar alcança primeiro. Cuida sozinha da área segura de baixo.
 *
 * É uma instância única (BarraGlobal), fixa embaixo: ao trocar de aba só o conteúdo muda por cima.
 * A pílula do item ativo desliza até o novo, e ícone e rótulo trocam de cor com um pequeno pulo.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import Tappable from './Tappable';
import { useFeedbackPadrao } from './FeedbackPadraoContext';

const CORES = { inativa: colors.neutral[500], ativa: colors.primary.main, pilula: colors.primary.lighter };

const LARGURA_PILULA = 56;
const ALTURA_PILULA = 30;

const BarraInferior = ({ itens, ativo }) => {
  const insets = useSafeAreaInsets();
  // O botão de feedback fica logo acima da barra, não por cima dos itens.
  useFeedbackPadrao('barra');

  const indiceAtivo = itens.findIndex(i => i.id === ativo);
  const [largura, setLargura] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const progresso = useRef(itens.map((item, i) => new Animated.Value(i === indiceAtivo ? 1 : 0))).current;
  const anterior = useRef(null);

  const larguraItem = largura / itens.length;
  const xDoIndice = i => i * larguraItem + (larguraItem - LARGURA_PILULA) / 2;

  useEffect(() => {
    if (!largura || indiceAtivo < 0) return;
    const indiceAnterior = anterior.current;
    anterior.current = indiceAtivo;
    if (indiceAnterior === null || indiceAnterior === indiceAtivo) {
      x.setValue(xDoIndice(indiceAtivo));
      return;
    }
    Animated.parallel([
      Animated.spring(x, { toValue: xDoIndice(indiceAtivo), friction: 9, tension: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(progresso[indiceAtivo], { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(progresso[indiceAnterior], { toValue: 0, duration: 260, useNativeDriver: false }),
    ]).start();
  }, [largura, indiceAtivo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={[styles.barra, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
      accessibilityRole="tablist"
      onLayout={e => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.pilula, { backgroundColor: CORES.pilula, transform: [{ translateX: x }] }]}
        />
      ) : null}
      {itens.map((item, i) => {
        const cores = CORES;
        const p = progresso[i];
        const corRotulo = p.interpolate({ inputRange: [0, 1], outputRange: [cores.inativa, cores.ativa] });
        const salto = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] });
        const selecionado = item.id === ativo;
        return (
          <Tappable
            key={item.id}
            style={styles.item}
            onPress={item.onPress}
            sombra={false}
            navega
            accessibilityRole="tab"
            accessibilityLabel={item.acessibilidade || item.rotulo}
            accessibilityState={{ selected: selecionado }}>
            <Animated.View style={[styles.areaIcone, { transform: [{ scale: salto }] }]}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.areaIcone, { opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                <Icon name={item.icone} size="base" color={cores.inativa} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, styles.areaIcone, { opacity: p }]}>
                <Icon name={item.icone} size="base" color={cores.ativa} />
              </Animated.View>
            </Animated.View>
            <Animated.Text style={[styles.rotulo, { color: corRotulo }]} numberOfLines={1}>
              {item.rotulo}
            </Animated.Text>
          </Tappable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  pilula: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    width: LARGURA_PILULA,
    height: ALTURA_PILULA,
    borderRadius: borderRadius.full,
  },
  item: { flex: 1, alignItems: 'center', gap: 2, minHeight: 56 },
  areaIcone: { width: LARGURA_PILULA, height: ALTURA_PILULA, alignItems: 'center', justifyContent: 'center' },
  rotulo: { ...textStyles.caption, fontSize: 11, lineHeight: 14, fontWeight: '600' },
});

export default BarraInferior;
