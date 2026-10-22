/**
 * Cabeçalho das telas internas: seta de voltar à esquerda, título (com subtítulo
 * opcional) e uma ação opcional à direita. Mesmo azul e mesma altura do PainelHeader.
 * Sem onBack não há seta (telas raiz das abas). children entra abaixo da linha.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';

const SubHeader = ({ titulo, subtitulo, onBack, direita, children }) => (
  <View style={styles.header}>
    <View style={styles.linha}>
      {onBack ? (
        <TouchableOpacity
          style={styles.voltar}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Icon name={IconNames.back} size="md" color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
      <View style={styles.textos}>
        <Text style={styles.titulo} numberOfLines={1} accessibilityRole="header">
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {direita || null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl + 18,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  voltar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  titulo: { ...textStyles.h3, color: '#FFFFFF' },
  subtitulo: { ...textStyles.bodySmall, color: '#DBEAFE', marginTop: 2 },
});

export default SubHeader;
