/**
 * Fileira de botões de filtro que ligam e desligam, cada um com a contagem entre parênteses.
 * chips: [{ id, texto }]. filtro e contagem são objetos indexados pelo id do chip.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Tappable from './Tappable';

const ChipsFiltro = ({ chips, filtro, contagem, onAlternar }) => (
  <View style={styles.filtros} accessibilityRole="toolbar">
    {chips.map(chip => {
      const ligado = filtro[chip.id];
      return (
        <Tappable
          key={chip.id}
          sombra={false}
          style={[styles.chip, ligado && styles.chipLigado]}
          onPress={() => onAlternar(chip.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: ligado }}
          accessibilityLabel={`${chip.texto}, ${contagem[chip.id]} viagens, ${ligado ? 'mostrando' : 'escondidas'}`}>
          <Text style={[styles.chipTexto, ligado && styles.chipTextoLigado]}>
            {chip.texto} ({contagem[chip.id]})
          </Text>
        </Tappable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
  },
  chipLigado: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  chipTexto: { ...textStyles.button, color: colors.text.secondary },
  chipTextoLigado: { color: '#FFFFFF' },
});

export default ChipsFiltro;
