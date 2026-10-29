/**
 * Diálogo centralizado sobre fundo escurecido. Voltar do sistema, Escape e toque no
 * fundo só cancelam, nunca confirmam. Os dois botões ficam separados por um espaço.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import ModalApp from './ModalApp';

// botoes (lista) tem prioridade sobre principal e secundario. O primeiro botão é o maior.
const DialogoConfirmacao = ({ visible, titulo, resumo, onCancelar, principal, secundario, botoes }) => {
  const lista = botoes || [principal, secundario];
  return (
    <ModalApp visible={visible} transparent animationType="fade" onRequestClose={onCancelar} accessibilityViewIsModal>
      <View style={styles.fundo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onCancelar}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        />
        <View style={styles.cartao}>
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>
          {resumo ? <Text style={styles.resumo}>{resumo}</Text> : null}
          {lista.map((botao, i) => (
            <TouchableOpacity
              key={`${i}-${botao.texto}`}
              style={[styles.botao, i > 0 && styles.botaoSecundario, { backgroundColor: botao.cor }]}
              onPress={botao.onPress}
              disabled={botao.carregando}
              accessibilityRole="button"
              accessibilityLabel={botao.texto}>
              {botao.carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.botaoTexto, botao.corTexto ? { color: botao.corTexto } : null]}>{botao.texto}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ModalApp>
  );
};

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cartao: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background.paper,
    borderRadius: 24,
    padding: spacing.lg,
  },
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  resumo: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  // Botões grandes para motoristas idosos: mesma fonte nos dois, a diferença fica na altura e na cor.
  botao: { minHeight: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  botaoTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  botaoSecundario: { minHeight: 64, marginTop: 16 },
});

export default DialogoConfirmacao;
