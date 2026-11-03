/**
 * Lista do histórico de viagens do motorista. A viagem que passou sem ser registrada fica em vermelho,
 * com o botão "Marcar como feita": o motorista confirma que ela aconteceu, mesmo sem registro no app.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import Tappable from './Tappable';
import DialogoConfirmacao from './DialogoConfirmacao';
import { formatarData } from '../utils/dataLocal';
import { formatarHora } from '../utils/formatarHora';

const SITUACAO = {
  feita: { texto: 'Feita', cor: colors.success.main },
  feita_sem_app: { texto: 'Feita, sem registro no app', cor: colors.warning.main },
  cancelada: { texto: 'Cancelada', cor: colors.neutral[500] },
  nao_realizada: { texto: 'Não realizada', cor: colors.error.main },
};

const quando = viagem => `${formatarData(viagem.data)} às ${formatarHora(viagem.horario_inicio)}`;

const HistoricoViagens = ({ itens, onConfirmarFeita }) => {
  const [confirmando, setConfirmando] = useState(null);

  const confirmar = async () => {
    const viagem = confirmando;
    setConfirmando(null);
    await onConfirmarFeita(viagem);
  };

  return (
    <View style={styles.lista}>
      {itens.map(({ viagem, situacao }) => {
        const info = SITUACAO[situacao];
        const naoRealizada = situacao === 'nao_realizada';
        return (
          <View key={viagem.id} style={[styles.linha, naoRealizada && styles.linhaVermelha]}>
            <View style={styles.topo}>
              <View style={styles.textos}>
                <Text style={styles.quando}>{quando(viagem)}</Text>
                {viagem.rota_nome ? (
                  <Text style={styles.rota} numberOfLines={1}>
                    {viagem.rota_nome}
                  </Text>
                ) : null}
                <Text style={[styles.situacao, { color: info.cor }]}>{info.texto}</Text>
              </View>
            </View>
            {naoRealizada ? (
              <Tappable
                style={styles.botao}
                onPress={() => setConfirmando(viagem)}
                accessibilityRole="button"
                accessibilityLabel={`Marcar como feita a viagem de ${quando(viagem)}`}>
                <Icon name={IconNames.check} size="md" color="#FFFFFF" />
                <Text style={styles.botaoTexto}>Marcar como feita</Text>
              </Tappable>
            ) : null}
          </View>
        );
      })}

      <DialogoConfirmacao
        visible={!!confirmando}
        titulo="Marcar como feita?"
        resumo={
          confirmando
            ? `A viagem de ${quando(confirmando)} vai ficar como feita, sem registro no app.`
            : ''
        }
        onCancelar={() => setConfirmando(null)}
        principal={{ texto: 'Sim, marcar como feita', cor: colors.success.main, onPress: confirmar }}
        secundario={{ texto: 'Cancelar', cor: colors.neutral[500], onPress: () => setConfirmando(null) }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  lista: { gap: spacing.sm },
  linha: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
  },
  linhaVermelha: { backgroundColor: colors.error.light, borderWidth: 1, borderColor: colors.error.main },
  topo: { flexDirection: 'row', alignItems: 'center' },
  textos: { flex: 1 },
  quando: { ...textStyles.body, fontWeight: '700', color: colors.text.primary },
  rota: { ...textStyles.bodySmall, color: colors.text.secondary },
  situacao: { ...textStyles.caption, fontWeight: '700', marginTop: 2 },
  botao: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { ...textStyles.body, color: '#FFFFFF', fontWeight: '700' },
});

export default HistoricoViagens;
