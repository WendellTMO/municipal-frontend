/**
 * Folha que sobe de baixo com uma lista de opções grandes. Mesmo desenho da folha "Avisar alunos"
 * da viagem: fundo claro, ícone azul e texto escuro, sem botões vermelhos. Escolher uma opção já
 * envia; Voltar, Escape, voltar do sistema e toque no fundo só fecham.
 */
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';

// opcoes: [{ texto, descricao, icone, onPress }]. `carregandoIndice` marca a que está enviando.
const FolhaMotivos = ({ visible, titulo, resumo, opcoes, carregandoIndice = -1, onCancelar }) => {
  const ocupado = carregandoIndice >= 0;
  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onCancelar} accessibilityViewIsModal>
      <View style={styles.fundo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onCancelar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View style={styles.folha}>
          <View style={styles.alca} accessibilityElementsHidden />
          <ScrollView contentContainerStyle={styles.conteudo}>
            <Text style={styles.titulo} accessibilityRole="header">
              {titulo}
            </Text>
            {resumo ? <Text style={styles.resumo}>{resumo}</Text> : null}
            {opcoes.map((opcao, i) => (
              <TouchableOpacity
                key={opcao.texto}
                style={[styles.opcao, ocupado && i !== carregandoIndice && styles.opcaoApagada]}
                onPress={opcao.onPress}
                disabled={ocupado}
                accessibilityRole="button"
                accessibilityLabel={opcao.texto}>
                <View style={styles.opcaoIcone}>
                  {i === carregandoIndice ? (
                    <ActivityIndicator color={colors.primary.dark} />
                  ) : (
                    <Icon name={opcao.icone} size="lg" color={colors.primary.dark} />
                  )}
                </View>
                <View style={styles.opcaoTextos}>
                  <Text style={styles.opcaoTitulo}>{opcao.texto}</Text>
                  {opcao.descricao ? <Text style={styles.opcaoDescricao}>{opcao.descricao}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.voltar}
              onPress={onCancelar}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityLabel="Voltar">
              <Text style={styles.voltarTexto}>Voltar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </ModalApp>
  );
};

const styles = StyleSheet.create({
  fundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' },
  folha: {
    maxHeight: '92%',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.sm,
  },
  alca: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.neutral[300], alignSelf: 'center' },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary },
  resumo: { ...textStyles.body, color: colors.text.secondary },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.lighter,
  },
  opcaoApagada: { opacity: 0.4 },
  opcaoIcone: { width: 44, alignItems: 'center' },
  opcaoTextos: { flex: 1 },
  opcaoTitulo: { ...textStyles.h4, color: colors.primary.dark, fontWeight: '700' },
  opcaoDescricao: { ...textStyles.bodySmall, color: colors.text.secondary },
  voltar: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg },
  voltarTexto: { ...textStyles.button, fontSize: 20, color: colors.text.secondary },
});

export default FolhaMotivos;
