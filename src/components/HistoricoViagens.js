/**
 * Caixa "Histórico de viagens" da home do motorista. A viagem que passou sem ser registrada fica em
 * vermelho, com o botão "Foi feita" para o motorista confirmar que ela aconteceu.
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

const HistoricoViagens = ({ itens, onConfirmarFeita }) => {
  const [confirmando, setConfirmando] = useState(null);
  if (!itens || itens.length === 0) return null;

  const confirmar = async () => {
    const viagem = confirmando;
    setConfirmando(null);
    await onConfirmarFeita(viagem);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cabecalho}>
        <Icon name={IconNames.schedule} size="md" color={colors.primary.dark} />
        <Text style={styles.titulo} accessibilityRole="header">
          Histórico de viagens
        </Text>
      </View>

      {itens.map(({ viagem, situacao }) => {
        const info = SITUACAO[situacao];
        const naoRealizada = situacao === 'nao_realizada';
        return (
          <View key={viagem.id} style={[styles.linha, naoRealizada && styles.linhaVermelha]}>
            <View style={styles.textos}>
              <Text style={styles.quando}>
                {formatarData(viagem.data)} às {formatarHora(viagem.horario_inicio)}
              </Text>
              {viagem.rota_nome ? (
                <Text style={styles.rota} numberOfLines={1}>
                  {viagem.rota_nome}
                </Text>
              ) : null}
              <Text style={[styles.situacao, { color: info.cor }]}>{info.texto}</Text>
            </View>
            {naoRealizada ? (
              <Tappable
                style={styles.botao}
                onPress={() => setConfirmando(viagem)}
                accessibilityRole="button"
                accessibilityLabel={`Confirmar que a viagem de ${formatarData(viagem.data)} foi feita`}>
                <Text style={styles.botaoTexto}>Foi feita</Text>
              </Tappable>
            ) : null}
          </View>
        );
      })}

      <DialogoConfirmacao
        visible={!!confirmando}
        titulo="A viagem foi feita?"
        resumo="Ela vai aparecer como feita, sem registro no app."
        onCancelar={() => setConfirmando(null)}
        principal={{ texto: 'Sim, foi feita', cor: colors.success.main, onPress: confirmar }}
        secundario={{ texto: 'Voltar', cor: colors.neutral[500], onPress: () => setConfirmando(null) }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.paper,
    gap: spacing.sm,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  titulo: { ...textStyles.h4, color: colors.text.primary },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[50],
  },
  linhaVermelha: { backgroundColor: colors.error.light, borderWidth: 1, borderColor: colors.error.main },
  textos: { flex: 1 },
  quando: { ...textStyles.body, fontWeight: '700', color: colors.text.primary },
  rota: { ...textStyles.bodySmall, color: colors.text.secondary },
  situacao: { ...textStyles.caption, fontWeight: '700', marginTop: 2 },
  botao: {
    minHeight: 44,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { ...textStyles.body, color: '#FFFFFF', fontWeight: '700' },
});

export default HistoricoViagens;
