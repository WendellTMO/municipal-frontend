/**
 * Tela cheia de confirmação (Modal em tela cheia, funciona igual na web e no nativo).
 * O botão principal é a opção segura e grande. O secundário fica separado, mais
 * embaixo, para não ser tocado por engano. Voltar do sistema ou Escape cancelam.
 */
import React from 'react';
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';

const ConfirmacaoTelaCheia = ({ visible, titulo, onCancelar, principal, secundario, children }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onCancelar} accessibilityViewIsModal>
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      <ScrollView style={styles.corpo} contentContainerStyle={styles.corpoConteudo}>
        {children}
      </ScrollView>
      <View style={styles.botoes}>
        <TouchableOpacity
          style={[styles.principal, { backgroundColor: principal.cor }]}
          onPress={principal.onPress}
          disabled={principal.carregando}
          accessibilityRole="button"
          accessibilityLabel={principal.texto}>
          {principal.carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.principalTexto}>{principal.texto}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.espaco} />
        <TouchableOpacity
          style={[styles.secundario, { backgroundColor: secundario.cor }]}
          onPress={secundario.onPress}
          disabled={secundario.carregando}
          accessibilityRole="button"
          accessibilityLabel={secundario.texto}>
          {secundario.carregando ? (
            <ActivityIndicator color={secundario.corTexto} />
          ) : (
            <Text style={[styles.secundarioTexto, { color: secundario.corTexto }]}>{secundario.texto}</Text>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  conteudo: { flex: 1, padding: spacing.lg },
  titulo: { ...textStyles.h2, color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.base },
  corpo: { flex: 1 },
  corpoConteudo: { gap: spacing.md, paddingBottom: spacing.base },
  botoes: { paddingBottom: spacing.base },
  principal: { minHeight: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  principalTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  espaco: { height: spacing.xxl + spacing.lg },
  secundario: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  secundarioTexto: { fontSize: 17, fontWeight: '800' },
});

export default ConfirmacaoTelaCheia;
