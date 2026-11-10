/** Três botões para filtrar as notificações: todas, não lidas ou lidas. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Tappable from './Tappable';

export type EstadoNotificacoes = 'todas' | 'nao_lidas' | 'lidas';

const OPCOES: { id: EstadoNotificacoes; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'nao_lidas', rotulo: 'Não lidas' },
  { id: 'lidas', rotulo: 'Lidas' },
];

const FiltroEstadoNotificacoes = ({
  valor,
  onMudar,
  cor = colors.primary.main,
}: {
  valor: EstadoNotificacoes;
  onMudar: (estado: EstadoNotificacoes) => void;
  cor?: string;
}) => (
  <View style={styles.linha} accessibilityRole="radiogroup">
    {OPCOES.map((opcao) => {
      const ativo = valor === opcao.id;
      return (
        <Tappable
          key={opcao.id}
          style={[styles.chip, ativo && { backgroundColor: cor, borderColor: cor }]}
          onPress={() => onMudar(opcao.id)}
          sombra={false}
          accessibilityRole="radio"
          accessibilityState={{ checked: ativo }}
          accessibilityLabel={opcao.rotulo}>
          <Text style={[styles.texto, ativo && styles.textoAtivo]}>{opcao.rotulo}</Text>
        </Tappable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  texto: { ...textStyles.caption, color: colors.text.primary, fontWeight: '700' as const },
  textoAtivo: { color: '#FFFFFF' },
});

export default FiltroEstadoNotificacoes;
