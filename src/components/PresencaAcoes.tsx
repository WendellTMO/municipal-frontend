/**
 * Ações de presença no card da próxima viagem: botão grande Confirmar presença quando
 * ainda não confirmou e, confirmada, a ação discreta Cancelar presença, que pede
 * confirmação num diálogo antes de cancelar.
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import Tappable from './Tappable';
import DialogoConfirmacao from './DialogoConfirmacao';
import Icon, { IconNames } from './Icon';
import { colors, spacing, textStyles } from '../theme';
import { usePresencaViagem } from '../hooks/usePresencaViagem';

type Props = {
  viagem: { id?: string; rota_id?: string; ponto_embarque_id?: string };
  confirmadaInicial: boolean;
  onMudou: (confirmada: boolean) => void;
};

const PresencaAcoes = ({ viagem, confirmadaInicial, onMudou }: Props) => {
  const { confirmada, salvando, confirmar, cancelar } = usePresencaViagem(viagem, confirmadaInicial, onMudou);
  const [dialogo, setDialogo] = useState(false);

  if (!confirmada) {
    return (
      <Tappable
        style={[styles.confirmar, salvando && styles.desabilitado]}
        onPress={confirmar}
        disabled={salvando}
        accessibilityLabel="Confirmar presença">
        {salvando ? (
          <ActivityIndicator color={colors.primary.main} />
        ) : (
          <>
            <Icon name={IconNames.checkCircle} size="lg" color={colors.primary.main} style={undefined} />
            <Text style={styles.confirmarTexto}>Confirmar presença</Text>
          </>
        )}
      </Tappable>
    );
  }

  return (
    <>
      <Tappable
        style={styles.cancelar}
        onPress={() => setDialogo(true)}
        disabled={salvando}
        accessibilityLabel="Cancelar presença">
        <Text style={styles.cancelarTexto}>Cancelar presença</Text>
      </Tappable>
      <DialogoConfirmacao
        visible={dialogo}
        titulo="Cancelar presença?"
        resumo="O motorista deixa de contar com você nesta viagem."
        onCancelar={() => setDialogo(false)}
        principal={{ texto: 'Manter presença', cor: colors.success.main, onPress: () => setDialogo(false) }}
        secundario={{
          texto: 'Sim, cancelar',
          cor: colors.error.main,
          carregando: salvando,
          onPress: async () => {
            await cancelar();
            setDialogo(false);
          },
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  confirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.base,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  confirmarTexto: { ...textStyles.h5, color: colors.primary.main, fontWeight: '800' as const },
  desabilitado: { opacity: 0.6 },
  cancelar: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
  cancelarTexto: { ...textStyles.bodySmall, color: '#DBEAFE', fontWeight: '700' as const, textDecorationLine: 'underline' },
});

export default PresencaAcoes;
