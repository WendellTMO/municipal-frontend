/**
 * Cartão de próxima viagem (aluno e motorista). O conteúdo principal é um único botão;
 * os filhos (ex.: "Iniciar viagem") ficam abaixo, fora desse botão.
 * shortcut: fundo sólido porque o app não tem biblioteca de degradê; trocar por
 * colors.gradients quando houver uma.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import Tappable from './Tappable';

const TripHeroCard = ({
  dayLabel,
  time,
  statusLabel,
  statusColor = colors.success.main,
  statusIcon = IconNames.checkCircle,
  title,
  subtitle = undefined,
  onPress,
  accessibilityLabel,
  children = undefined,
}) => (
  <View style={styles.card}>
    <Tappable
      navega
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <View style={styles.topRow}>
        <Text style={styles.day}>{dayLabel}</Text>
        {statusLabel ? (
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Icon name={statusIcon} size="xs" color="#FFFFFF" />
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.bottomRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.arrow}>
          <Icon name={IconNames.chevronRight} size="md" color="#FFFFFF" />
        </View>
      </View>
    </Tappable>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    margin: spacing.base,
    marginTop: spacing.lg,
    padding: spacing.lg,
    // Fundo sólido escuro: todo o conteúdo é branco ou quase.
    backgroundColor: '#0D5BCF',
    borderRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  day: { ...textStyles.caption, color: '#DBEAFE', letterSpacing: 2, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  badgeText: { ...textStyles.caption, color: '#FFFFFF', fontWeight: '700' },
  time: { ...textStyles.display2, color: '#FFFFFF', marginTop: spacing.xs },
  bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  titleWrap: { flex: 1 },
  title: { ...textStyles.h4, color: '#FFFFFF' },
  subtitle: { ...textStyles.bodySmall, color: '#DBEAFE', marginTop: 2 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});

export default TripHeroCard;
