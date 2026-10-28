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
import EscolhaPontoSheet, { LinhaDosPontos } from './EscolhaPontoSheet';

type Props = {
  viagem: {
    id?: string;
    rota_id?: string;
    tipo?: string;
    ponto_embarque_id?: string;
    ponto_destino_id?: string;
    precisa_escolher_ponto?: boolean;
  };
  confirmadaInicial: boolean;
  onMudou: (confirmada: boolean) => void;
};

const PresencaAcoes = ({ viagem, confirmadaInicial, onMudou }: Props) => {
  const { confirmada, salvando, confirmar, cancelar, alterar, linhaPontos, folhaProps } = usePresencaViagem(
    viagem,
    confirmadaInicial,
    onMudou,
  );
  const [dialogo, setDialogo] = useState(false);

  if (!confirmada) {
    return (
      <>
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
        <EscolhaPontoSheet {...folhaProps} />
      </>
    );
  }

  return (
    <>
      <LinhaDosPontos texto={linhaPontos} onAlterar={alterar} claro />
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
      <EscolhaPontoSheet {...folhaProps} />
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
  cancelarTexto: { ...textStyles.h5, color: '#FFFFFF', fontWeight: '800' as const },
  desabilitado: { opacity: 0.6 },
  // Botão vermelho sólido, mesma fonte do Confirmar presença e um pouco mais baixo.
  cancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.base,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.error.main,
  },
});

export default PresencaAcoes;
