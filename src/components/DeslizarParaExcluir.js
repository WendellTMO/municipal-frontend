/**
 * Linha que o usuário arrasta para a esquerda para excluir (como no e-mail do celular).
 * Passou do limite e soltou: a linha sai da tela e onExcluir é chamado. Senão, volta ao lugar.
 * Funciona com dedo e mouse (PanResponder).
 */
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Icon, { IconNames } from './Icon';
import { borderRadius, colors, spacing } from '../theme';
import { deveExcluir, ehSwipeHorizontal } from '../utils/deslizarExcluir';

const DeslizarParaExcluir = ({ onExcluir, children }) => {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  const onExcluirRef = useRef(onExcluir);
  onExcluirRef.current = onExcluir;
  const larguraRef = useRef(width);
  larguraRef.current = width;

  const voltar = () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => ehSwipeHorizontal(g.dx, g.dy),
      onPanResponderMove: (_, g) => x.setValue(Math.min(0, g.dx)),
      onPanResponderRelease: (_, g) => {
        if (!deveExcluir(g.dx)) {
          voltar();
          return;
        }
        Animated.timing(x, {
          toValue: -larguraRef.current,
          duration: 180,
          useNativeDriver: true,
        }).start(() => onExcluirRef.current());
      },
      onPanResponderTerminate: voltar,
    }),
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.fundo} accessibilityElementsHidden importantForAccessibility="no">
        <Icon name={IconNames.delete} size="lg" color={colors.primary.contrast} />
      </View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  fundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.error.main,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: spacing.xl,
  },
});

export default DeslizarParaExcluir;
