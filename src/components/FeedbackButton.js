/**
 * Botão flutuante de feedback (círculo dourado com uma exclamação).
 * FeedbackBadge é o mesmo desenho sem posição, usado no aviso beta.
 */
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import Icon, { IconNames } from './Icon';

const ICON_COLOR = '#0D3B8F';

export const FeedbackBadge = ({ size = 56 }) => (
  <View
    style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2 },
    ]}>
    <Icon
      name={IconNames.priorityHigh}
      size={Math.round(size * 0.55)}
      color={ICON_COLOR}
    />
  </View>
);

// shortcut: sem SafeAreaProvider no app, o iOS ganha 34 px fixos para a barra inferior.
const BOTTOM = 24 + (Platform.OS === 'ios' ? 34 : 0);

const FeedbackButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.container}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel="Enviar feedback">
    <FeedbackBadge size={56} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    bottom: BOTTOM,
    zIndex: 50,
  },
  circle: {
    backgroundColor: colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.main,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
});

export default FeedbackButton;
