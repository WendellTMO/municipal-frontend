/**
 * Tela cheia de confirmação (Modal em tela cheia, funciona igual na web e no nativo).
 * Conteúdo e botões ficam juntos no alto (sem vazio no meio); se a lista crescer, ela
 * rola e os botões continuam visíveis embaixo dela. Voltar do sistema ou Escape cancelam.
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
  // O corpo tem a altura do conteúdo e só rola quando passa da tela; os botões ficam logo abaixo.
  corpo: { flexGrow: 0, flexShrink: 1 },
  corpoConteudo: { gap: spacing.md, paddingBottom: spacing.base },
  botoes: { paddingTop: spacing.base, paddingBottom: spacing.base },
  principal: { minHeight: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  principalTexto: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  espaco: { height: spacing.base },
  secundario: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  secundarioTexto: { fontSize: 17, fontWeight: '800' },
});

export default ConfirmacaoTelaCheia;
