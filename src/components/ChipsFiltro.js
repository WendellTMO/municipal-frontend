/**
 * Fileira de botões de filtro que ligam e desligam, cada um com a contagem entre parênteses.
 * chips: [{ id, texto, cor? }]. filtro e contagem são objetos indexados pelo id do chip.
 * Ligado mostra um visto (não depende só da cor). Desligado mostra a bolinha da cor do chip, se ele tiver uma.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
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
          {ligado ? <Icon name={IconNames.check} size="sm" color="#FFFFFF" /> : null}
          {!ligado && chip.cor ? <View style={[styles.bolinha, { backgroundColor: chip.cor }]} /> : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
  },
  chipLigado: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
  chipTexto: { ...textStyles.button, color: colors.text.secondary },
  chipTextoLigado: { color: '#FFFFFF' },
});

export default ChipsFiltro;
