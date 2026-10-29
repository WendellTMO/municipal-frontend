/**
 * Diálogo centralizado sobre fundo escurecido. Voltar do sistema, Escape e toque no
 * fundo só cancelam, nunca confirmam. Os dois botões ficam separados por um espaço.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import ModalApp from './ModalApp';

const DialogoConfirmacao = ({ visible, titulo, resumo, onCancelar, principal, secundario }) => (
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
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: principal.cor }]}
          onPress={principal.onPress}
          accessibilityRole="button"
          accessibilityLabel={principal.texto}>
          <Text style={[styles.botaoTexto, principal.corTexto ? { color: principal.corTexto } : null]}>{principal.texto}</Text>
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
            <Text style={[styles.botaoTexto, secundario.corTexto ? { color: secundario.corTexto } : null]}>{secundario.texto}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </ModalApp>
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
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  resumo: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  // Botões grandes para motoristas idosos: mesma fonte nos dois, a diferença fica na altura e na cor.
  botao: { minHeight: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  botaoTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  botaoSecundario: { minHeight: 64, marginTop: 16 },
});

export default DialogoConfirmacao;
