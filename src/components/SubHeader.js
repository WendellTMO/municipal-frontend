/**
 * Cabeçalho das telas internas do gestor: botão voltar e título.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';

const SubHeader = ({ titulo, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.voltar}
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel="Voltar">
      <Icon name={IconNames.back} size="md" color="#FFFFFF" />
    </TouchableOpacity>
    <Text style={styles.titulo} accessibilityRole="header">
      {titulo}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl + 18,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...textStyles.h3, color: '#FFFFFF' },
});

export default SubHeader;
