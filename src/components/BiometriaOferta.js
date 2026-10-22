/**
 * Pergunta única depois de um login com senha: entrar com digital ou rosto nas
 * próximas vezes? Só aparece quando o aparelho tem biometria (nunca na web).
 */
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import { useAuth } from '../contexts/AuthContext';

const BiometriaOferta = () => {
  const { biometria } = useAuth();

  return (
    <Modal
      visible={biometria.oferta}
      transparent
      animationType="fade"
      onRequestClose={() => biometria.responderOferta(false)}>
      <View style={styles.fundo}>
        <View style={styles.caixa}>
          <View style={styles.icone}>
            <Icon name={IconNames.fingerprint} size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.titulo}>Entrar com digital ou rosto nas próximas vezes?</Text>
          <Text style={styles.texto}>
            Sua senha não é guardada. A biometria só abre a sessão neste aparelho.
          </Text>
          <TouchableOpacity
            style={styles.primario}
            onPress={() => biometria.responderOferta(true)}
            accessibilityRole="button"
            accessibilityLabel="Sim, entrar com biometria">
            <Text style={styles.primarioTexto}>Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secundario}
            onPress={() => biometria.responderOferta(false)}
            accessibilityRole="button"
            accessibilityLabel="Agora não">
            <Text style={styles.secundarioTexto}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  caixa: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background.paper,
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  icone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { ...textStyles.h4, color: colors.text.primary, textAlign: 'center' },
  texto: { ...textStyles.bodySmall, color: colors.text.secondary, textAlign: 'center' },
  primario: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarioTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secundario: { alignSelf: 'stretch', height: 48, alignItems: 'center', justifyContent: 'center' },
  secundarioTexto: { ...textStyles.body, color: colors.text.secondary, fontWeight: '700' },
});

export default BiometriaOferta;
