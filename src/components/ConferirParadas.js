/**
 * Lista das paradas que o app não detectou, para o motorista confirmar ao finalizar:
 * nome à esquerda, e à direita um check (passou) ou um X (não passou).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';

// marcadas: { [pontoId]: true (passou) | false (não passou) }; ausente = ainda sem resposta.
const ConferirParadas = ({ paradas, marcadas, onMarcar, onMarcarTodos }) => (
  <>
    {onMarcarTodos && paradas.length > 1 ? (
      <TouchableOpacity
        style={styles.todos}
        onPress={onMarcarTodos}
        accessibilityRole="button"
        accessibilityLabel="Marcar todas as paradas como passou">
        <Icon name={IconNames.check} size="md" color={colors.success.dark} />
        <Text style={styles.todosTexto}>Marcar todos</Text>
      </TouchableOpacity>
    ) : null}
    <ScrollView style={styles.lista} accessibilityLabel="Paradas não detectadas">
      {paradas.map(parada => {
        const apelido = parada.ponto.apelido || `Parada ${parada.numero}`;
        const resposta = marcadas[parada.ponto.id];
        return (
          <View key={parada.ponto.id} style={styles.linha}>
            <Text style={styles.nome} numberOfLines={2}>
              {parada.numero}. {apelido}
            </Text>
            <TouchableOpacity
              style={[styles.botao, resposta === true && { backgroundColor: colors.success.main }]}
              onPress={() => onMarcar(parada.ponto.id, true)}
              accessibilityRole="button"
              accessibilityState={{ selected: resposta === true }}
              accessibilityLabel={`Passou por ${apelido}`}>
              <Icon name={IconNames.check} size="md" color={resposta === true ? '#FFFFFF' : colors.success.main} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, resposta === false && { backgroundColor: colors.error.main }]}
              onPress={() => onMarcar(parada.ponto.id, false)}
              accessibilityRole="button"
              accessibilityState={{ selected: resposta === false }}
              accessibilityLabel={`Não passou por ${apelido}`}>
              <Icon name={IconNames.close} size="md" color={resposta === false ? '#FFFFFF' : colors.error.main} />
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  </>
);

const styles = StyleSheet.create({
  todos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.success.light,
  },
  todosTexto: { ...textStyles.button, color: colors.success.dark },
  lista: { maxHeight: 260, marginBottom: spacing.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  nome: { ...textStyles.body, flex: 1, color: colors.text.primary },
  botao: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
});

export default ConferirParadas;
