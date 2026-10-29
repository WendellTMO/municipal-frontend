/**
 * EmptyState Component
 * 
 * Accessible component for displaying empty list states
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, textStyles, borderRadius } from '../theme';
import Icon, { IconNames } from './Icon';

const EmptyState = ({
  icon = IconNames.inbox,
  title = 'Nenhum item encontrado',
  description,
  actionLabel,
  onAction,
  iconColor = colors.text.hint,
}) => {
  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
    >
      <View style={styles.iconContainer}>
        <Icon name={icon} size="huge" color={iconColor} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint="Toque para executar a ação"
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  actionButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
});

export default EmptyState;
