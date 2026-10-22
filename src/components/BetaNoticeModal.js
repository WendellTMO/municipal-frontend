/**
 * Aviso exibido uma vez por usuário em cada aparelho, logo após o primeiro login.
 */
import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';
import { FeedbackBadge } from './FeedbackButton';

const BetaNoticeModal = ({ visible, onConfirm }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Image source={require('../../assets/icone-app.png')} style={styles.icone} />
        <Text style={styles.titulo}>Você é beta-tester do BusKá</Text>
        <Text style={styles.paragrafo}>
          O app ainda está em teste e <Text style={styles.destaque}>vai apresentar falhas</Text>.
          Isso é esperado.
        </Text>
        <Text style={styles.paragrafo}>
          Parte do seu trabalho aqui é nos avisar quando algo der errado, parecer estranho ou
          estiver faltando. Use o botão amarelo no canto da tela, em qualquer momento.
        </Text>
        <View style={styles.faixa}>
          <FeedbackBadge size={36} />
          <Text style={styles.faixaTexto}>
            Cada relato leva a tela em que você estava e a versão do app.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.botao}
          onPress={onConfirm}
          accessibilityRole="button">
          <Text style={styles.botaoTexto}>Entendi, vamos testar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: 28,
    padding: spacing.xl,
  },
  icone: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary.main,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  paragrafo: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
    marginBottom: spacing.md,
  },
  destaque: { fontWeight: '800', color: '#B45309' },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFF7E0',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  faixaTexto: { flex: 1, fontSize: 15, lineHeight: 21, color: '#7C5A00' },
  botao: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});

export default BetaNoticeModal;
