/**
 * Diálogo centralizado sobre fundo escurecido. Voltar do sistema, Escape e toque no
 * fundo só cancelam, nunca confirmam. Os dois botões ficam separados por um espaço.
 */
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';

const DialogoConfirmacao = ({ visible, titulo, resumo, onCancelar, principal, secundario }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar} accessibilityViewIsModal>
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
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: principal.cor }]}
          onPress={principal.onPress}
          accessibilityRole="button"
          accessibilityLabel={principal.texto}>
          <Text style={styles.botaoTexto}>{principal.texto}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botao, styles.botaoSecundario, { backgroundColor: secundario.cor }]}
          onPress={secundario.onPress}
          disabled={secundario.carregando}
          accessibilityRole="button"
          accessibilityLabel={secundario.texto}>
          {secundario.carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoTexto}>{secundario.texto}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

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
  titulo: { ...textStyles.h3, color: colors.text.primary, textAlign: 'center' },
  resumo: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  // Mesma fonte nos dois botões; a diferença fica na altura e na cor.
  botao: { minHeight: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  botaoSecundario: { minHeight: 48, marginTop: 14 },
});

export default DialogoConfirmacao;
