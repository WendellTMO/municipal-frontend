/**
 * Faixa vermelha clara para a viagem cancelada, com o motivo quando o motorista ou o gestor informou.
 * Mesma família visual do selo "Cancelada" que o app já usa (colors.error), sem mudar o cartão.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';

const AvisoViagemCancelada = ({ motivo, compacto = false }) => (
  <View style={[styles.faixa, compacto && styles.faixaCompacta]} accessible accessibilityRole="alert">
    <Icon name={IconNames.error} size={compacto ? 'md' : 'lg'} color={colors.error.dark} />
    <View style={styles.textos}>
      <Text style={styles.titulo}>Esta viagem não vai acontecer</Text>
      {motivo ? <Text style={styles.motivo}>Motivo: {motivo}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error.main,
    backgroundColor: colors.error.light,
    marginBottom: spacing.base,
  },
  faixaCompacta: { marginTop: spacing.sm, marginBottom: 0, padding: spacing.sm },
  textos: { flex: 1 },
  titulo: { ...textStyles.h5, color: colors.error.dark },
  motivo: { ...textStyles.body, color: colors.error.dark },
});

export default AvisoViagemCancelada;
