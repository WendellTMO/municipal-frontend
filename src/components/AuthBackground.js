/**
 * AuthBackground
 *
 * Fundo das telas de acesso: branco liso com faixa amarela e azul no rodapé.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

const AuthBackground = () => (
  <View style={styles.background} pointerEvents="none">
    <View style={styles.stripe}>
      <View style={[styles.half, { backgroundColor: colors.accent.main }]} />
      <View style={[styles.half, { backgroundColor: colors.primary.main }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.paper,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
  },
});

export default AuthBackground;
