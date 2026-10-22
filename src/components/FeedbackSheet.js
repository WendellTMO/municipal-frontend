/**
 * Janela que sobe de baixo para o usuário enviar um relato (bug, sugestão ou dúvida).
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import feedbackService from '../services/feedbackService';
import { getErrorMessageFromError } from '../utils/errors';
import {
  TIPOS_FEEDBACK,
  MENSAGEM_MAX,
  isMensagemValida,
  buildFeedbackPayload,
} from '../utils/feedback';

const FeedbackSheet = ({ visible, onClose, tela, onSent }) => {
  const [tipo, setTipo] = useState('BUG');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [focused, setFocused] = useState(false);

  const podeEnviar = isMensagemValida(mensagem) && !loading;

  const handleEnviar = async () => {
    setErro('');
    setLoading(true);
    try {
      await feedbackService.enviarFeedback(
        buildFeedbackPayload({ tipo, mensagem, tela, plataforma: Platform.OS }),
      );
      setMensagem('');
      setTipo('BUG');
      onSent();
    } catch (e) {
      // Mantém o texto digitado para o usuário tentar de novo.
      setErro(getErrorMessageFromError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fechar"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <Text style={styles.title}>Enviar feedback</Text>
            <Text style={styles.subtitle}>
              Conte o que aconteceu. Quanto mais detalhe, melhor.
            </Text>

            <View style={styles.chips}>
              {TIPOS_FEEDBACK.map(item => {
                const ativo = tipo === item.tipo;
                return (
                  <TouchableOpacity
                    key={item.tipo}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => setTipo(item.tipo)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativo }}>
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[styles.input, focused && styles.inputFocado]}
              placeholder="O que você estava fazendo e o que deu errado?"
              placeholderTextColor={colors.text.hint}
              value={mensagem}
              onChangeText={setMensagem}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              multiline
              numberOfLines={5}
              maxLength={MENSAGEM_MAX}
              textAlignVertical="top"
              accessibilityLabel="Mensagem do feedback"
            />

            <Text style={styles.nota}>
              Enviamos junto a tela atual, a versão do app e o seu perfil.
            </Text>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <TouchableOpacity
              style={[styles.botao, !podeEnviar && styles.botaoDesabilitado]}
              onPress={handleEnviar}
              disabled={!podeEnviar}
              accessibilityRole="button"
              accessibilityState={{ disabled: !podeEnviar }}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botaoTexto}>Enviar</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...textStyles.h3, color: colors.text.primary },
  subtitle: { ...textStyles.body, color: colors.text.secondary, marginTop: 4 },
  chips: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  chipAtivo: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  chipTexto: { ...textStyles.body, fontWeight: '600', color: colors.text.primary },
  chipTextoAtivo: { color: '#FFFFFF' },
  input: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.neutral[50],
  },
  inputFocado: { borderColor: colors.primary.main, backgroundColor: colors.background.paper },
  nota: { ...textStyles.caption, color: colors.text.secondary, marginTop: spacing.sm },
  erro: { ...textStyles.bodySmall, color: colors.error.main, marginTop: spacing.sm },
  botao: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  botaoDesabilitado: { opacity: 0.45 },
  botaoTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});

export default FeedbackSheet;
