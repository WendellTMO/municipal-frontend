/**
 * Botões com X para cada filtro que está valendo, mais a contagem. Tocar no botão tira só aquele filtro.
 * itens vem de resumoDoFiltro: [{ id, texto }].
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import Tappable from './Tappable';

const FiltrosAtivos = ({ itens, resumo, onRemover }) => (
  <View style={styles.bloco}>
    <View style={styles.fileira}>
      {itens.map(item => (
        <Tappable
          key={item.id}
          sombra={false}
          style={styles.chip}
          onPress={() => onRemover(item)}
          accessibilityRole="button"
          accessibilityLabel={`Tirar filtro: ${item.texto}`}>
          <Text style={styles.texto} numberOfLines={1}>
            {item.texto}
          </Text>
          <Icon name={IconNames.close} size="sm" color={colors.primary.dark} />
        </Tappable>
      ))}
    </View>
    <Text style={styles.resumo} accessibilityLiveRegion="polite">
      {resumo}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  bloco: { marginBottom: spacing.base, gap: spacing.sm },
  fileira: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.primary.lighter,
  },
  texto: { ...textStyles.button, color: colors.primary.dark, flexShrink: 1 },
  resumo: { ...textStyles.bodySmall, color: colors.text.secondary },
});

export default FiltrosAtivos;
