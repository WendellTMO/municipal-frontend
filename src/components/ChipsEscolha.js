/**
 * Fileira de botões em que só um fica ligado (sentido, rota, ordem, atalho de período).
 * opcoes: [{ id, texto }]. Tocar no que já está ligado chama onEscolher com o mesmo id.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Tappable from './Tappable';

const ChipsEscolha = ({ opcoes, valor, onEscolher }) => (
  <View style={styles.fileira} accessibilityRole="radiogroup">
    {opcoes.map(opcao => {
      const ligado = opcao.id === valor;
      return (
        <Tappable
          key={opcao.id}
          sombra={false}
          style={[styles.chip, ligado && styles.chipLigado]}
          onPress={() => onEscolher(opcao.id)}
          accessibilityRole="radio"
          accessibilityState={{ selected: ligado }}
          accessibilityLabel={opcao.texto}>
          <Text style={[styles.texto, ligado && styles.textoLigado]}>{opcao.texto}</Text>
        </Tappable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  fileira: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
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
  texto: { ...textStyles.button, color: colors.text.secondary },
  textoLigado: { color: '#FFFFFF' },
});

export default ChipsEscolha;
