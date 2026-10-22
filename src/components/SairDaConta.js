/**
 * Linha "Sair da conta" em vermelho para o rodapé das telas. Usa a mesma
 * confirmação do menu do avatar.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { confirmAction } from '../utils/confirm';

export const confirmarSaida = logout => {
  confirmAction({
    title: 'Sair da conta',
    message: 'Deseja encerrar sua sessão?',
    confirmText: 'Sair',
    cancelText: 'Cancelar',
    destructive: true,
    onConfirm: () => logout(),
  });
};

const SairDaConta = () => {
  const { logout } = useAuth();
  return (
    <TouchableOpacity
      style={styles.linha}
      onPress={() => confirmarSaida(logout)}
      accessibilityRole="button"
      accessibilityLabel="Sair da conta">
      <Icon name={IconNames.logout} size="md" color={colors.error.main} />
      <Text style={styles.texto}>Sair da conta</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
    marginTop: spacing.lg,
  },
  texto: { ...textStyles.body, color: colors.error.main, fontWeight: '700' },
});

export default SairDaConta;
