/**
 * Ação rápida: quadrado de cor sólida com ícone branco e uma palavra embaixo.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon from './Icon';

const ActionTile = ({
  icon,
  label,
  color = colors.solid.blue,
  onPress,
  disabled = false,
  accessibilityLabel,
  badge = 0,
}) => (
  <TouchableOpacity
    style={[styles.container, disabled && styles.disabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || label}
    accessibilityState={{ disabled }}>
    <View style={[styles.square, { backgroundColor: color }]}>
      <Icon name={icon} size="xl" color="#FFFFFF" />
      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.label} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 88 },
  disabled: { opacity: 0.45 },
  square: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStyles.caption,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

export default ActionTile;
