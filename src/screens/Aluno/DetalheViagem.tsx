import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { alunoService } from '../../services';
import { borderRadius, colors, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { ReportSheet } from '../../components';
import { unwrapItems } from '../../types';
import type { PontoFlatResponse } from '../../types';
import type { ViagemAgendaUI } from '../../services/alunoService';
import { StaticRouteMap } from '../../features/map/index';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';
import DialogoConfirmacao from '../../components/DialogoConfirmacao';
import { usePresencaViagem } from '../../hooks/usePresencaViagem';
import { aceitaPresenca } from '../../utils/presenca';
import { formatarSentido } from '../../utils/formatarSentido';

type RootParamList = Record<string, object | undefined>;
type Props = {
  navigation: NativeStackNavigationProp<RootParamList>;
  route: RouteProp<{ DetalheViagem: { rota: Record<string, unknown>; viagem: ViagemAgendaUI } }, 'DetalheViagem'>;
};

const CAPACITY_WARN = 0.85;

const CapacityRow: React.FC<{ confirmed: number; total: number }> = ({
  confirmed,
  total,
}) => {
  if (total === 0) return null;
  const pct = Math.min(1, confirmed / total);
  const quaseLotado = pct >= CAPACITY_WARN;
  return (
    <View
      style={styles.capacityWrap}
      accessible
      accessibilityLabel={`${confirmed} de ${total} vagas confirmadas${quaseLotado ? ', quase lotado' : ''}`}>
      <View style={styles.capacityRow}>
        <Text style={styles.capacityLabel}>Vagas confirmadas</Text>
        <Text style={styles.capacityValue}>{confirmed} / {total}</Text>
        {quaseLotado && (
          <View style={styles.quaseLotadoBadge}>
            <Text style={styles.quaseLotadoText}>Quase lotado</Text>
          </View>
        )}
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct * 100}%` as `${number}%`,
              backgroundColor: quaseLotado ? colors.warning.main : colors.success.main,
            },
          ]}
        />
      </View>
    </View>
  );
};

const DetalheViagem: React.FC<Props> = ({ navigation, route }) => {
  const { rota, viagem } = route?.params || {};

  const {
    confirmada: presencaConfirmada,
    setConfirmada: setPresencaConfirmada,
    salvando: salvandoPresenca,
    confirmar,
    cancelar,
  } = usePresencaViagem(viagem, viagem?.status_confirmacao ?? false);
  const [cancelarVisivel, setCancelarVisivel] = useState(false);
  const [pontosRota, setPontosRota] = useState<PontoFlatResponse[]>([]);
  const [carregandoPontos, setCarregandoPontos] = useState(true);
  const [reportVisible, setReportVisible] = useState(false);

  useEffect(() => {
    setPresencaConfirmada(viagem?.status_confirmacao ?? false);
  }, [viagem?.status_confirmacao]);

  const carregarPontos = useCallback(async () => {
    const rotaId = rota?.id as string | undefined;
    if (!rotaId) {
      setCarregandoPontos(false);
      return;
    }
    try {
      setCarregandoPontos(true);
      const pontos = await alunoService.listarPontosRota(rotaId).then(unwrapItems);
      setPontosRota((pontos as PontoFlatResponse[]) || []);
    } catch {
      setPontosRota([]);
    } finally {
      setCarregandoPontos(false);
    }
  }, [rota?.id]);

  useEffect(() => {
    carregarPontos();
  }, [carregarPontos]);

  if (!rota || !viagem) {
    return (
      <SafeAreaView style={styles.container}>
        <SubHeader titulo="Detalhes da Viagem" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContent}>
          <Icon name={IconNames.warning} size="xxl" color={colors.warning.main} />
          <Text style={styles.emptyText}>Dados da viagem não disponíveis</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusViagem = viagem.status_viagem ?? 'AGENDADA';
  const emAndamento = statusViagem === 'EM_ANDAMENTO';

  const getSituacaoConfig = (s: string) => {
    switch (s) {
      case 'EM_ANDAMENTO':
        return { color: colors.secondary.main, bg: colors.secondary.lighter };
      case 'FINALIZADA':
        return { color: colors.success.main, bg: colors.success.light };
      case 'CANCELADA':
        return { color: colors.error.main, bg: colors.error.light };
      default:
        return { color: colors.text.hint, bg: colors.neutral[100] };
    }
  };

  const statusLabel: Record<string, string> = {
    AGENDADA: 'Agendada',
    EM_ANDAMENTO: 'Em Andamento',
    FINALIZADA: 'Finalizada',
    CANCELADA: 'Cancelada',
  };

  const situacaoConfig = getSituacaoConfig(statusViagem);
  const horario = (viagem.horario_inicio ?? '--:--').substring(0, 5);

  const getOrigem = () => {
    if (pontosRota.length > 0)
      return (pontosRota[0] as Record<string, unknown>).apelido as string ||
        (pontosRota[0] as Record<string, unknown>).nome as string || 'Ponto inicial';
    return (viagem as Record<string, unknown>).origem as string || rota.nome as string || 'Não informado';
  };

  const getDestino = () => {
    if (pontosRota.length > 1)
      return (pontosRota[pontosRota.length - 1] as Record<string, unknown>).apelido as string ||
        (pontosRota[pontosRota.length - 1] as Record<string, unknown>).nome as string || 'Ponto final';
    return (viagem as Record<string, unknown>).destino as string || 'Não informado';
  };

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader
        titulo="Detalhes da Viagem"
        subtitulo={`${formatarSentido(viagem.tipo)} • ${horario}`}
        onBack={() => navigation.goBack()}
        direita={
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Reportar problema nesta viagem"
            accessibilityHint="Abre formulário para registrar uma ocorrência">
            <Icon name={IconNames.warning} size="md" color={colors.primary.contrast} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.viagemHeader}>
              <View>
                <View style={styles.tipoBadge}>
                  <Text style={styles.viagemTipo}>{formatarSentido(viagem.tipo)}</Text>
                </View>
                <Text style={styles.viagemHorario}>{horario}</Text>
              </View>
              <View style={[styles.situacaoBadge, { backgroundColor: situacaoConfig.bg }]}>
                <Text style={[styles.situacaoText, { color: situacaoConfig.color }]}>
                  {statusLabel[statusViagem] ?? statusViagem}
                </Text>
              </View>
            </View>

            <View style={styles.rotaInfo}>
              <View style={styles.pontoRota}>
                <View style={[styles.pontoIcon, { backgroundColor: colors.secondary.lighter }]}>
                  <Icon name={IconNames.location} size="md" color={colors.secondary.main} />
                </View>
                <View style={styles.pontoInfo}>
                  <Text style={styles.pontoLabel}>Origem</Text>
                  <Text style={styles.pontoNome}>{getOrigem()}</Text>
                </View>
              </View>
              <View style={styles.linhaRota} />
              <View style={styles.pontoRota}>
                <View style={[styles.pontoIcon, { backgroundColor: colors.success.light }]}>
                  <Icon name="flag" size="md" color={colors.success.main} />
                </View>
                <View style={styles.pontoInfo}>
                  <Text style={styles.pontoLabel}>Destino</Text>
                  <Text style={styles.pontoNome}>{getDestino()}</Text>
                </View>
              </View>
            </View>

            {/* Capacity */}
            <CapacityRow
              confirmed={viagem.alunos_confirmados_count}
              total={viagem.total_alunos}
            />
          </View>

          {/* Presence Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status de Presença</Text>
            <View
              style={[
                styles.presencaStatus,
                presencaConfirmada ? styles.presencaConfirmada : styles.presencaNaoConfirmada,
              ]}
              accessible
              accessibilityLabel={presencaConfirmada ? 'Presença confirmada' : 'Presença não confirmada'}>
              <Icon
                name={presencaConfirmada ? IconNames.checkCircle : IconNames.warning}
                size="lg"
                color={presencaConfirmada ? colors.success.main : colors.warning.main}
              />
              <Text
                style={[
                  styles.presencaText,
                  { color: presencaConfirmada ? colors.success.main : colors.warning.main },
                ]}>
                {presencaConfirmada ? 'Presença Confirmada' : 'Presença Não Confirmada'}
              </Text>
            </View>

            {aceitaPresenca(statusViagem) && presencaConfirmada && (
              <Tappable
                style={styles.cancelarPresenca}
                onPress={() => setCancelarVisivel(true)}
                disabled={salvandoPresenca}
                accessibilityLabel="Cancelar presença nesta viagem">
                <Text style={styles.cancelarPresencaTexto}>Cancelar presença</Text>
              </Tappable>
            )}

            {aceitaPresenca(statusViagem) && !presencaConfirmada && (
              <TouchableOpacity
                style={styles.confirmarButton}
                onPress={confirmar}
                disabled={salvandoPresenca}
                accessibilityRole="button"
                accessibilityLabel="Confirmar presença nesta viagem">
                <Icon name={IconNames.checkCircle} size="md" color={colors.primary.contrast} />
                <Text style={styles.confirmarButtonText}>Confirmar Presença</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Route Points */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pontos da Rota</Text>
            {carregandoPontos ? (
              <Text style={styles.loadingText}>Carregando pontos...</Text>
            ) : pontosRota.length > 0 ? (
              pontosRota.map((ponto, index) => {
                const p = ponto as Record<string, unknown>;
                const tipo = p.tipo as string | undefined;
                return (
                  <View key={p.id as string} style={styles.pontoItem}>
                    <View style={styles.pontoItemLeft}>
                      <View
                        style={[
                          styles.pontoItemIcon,
                          tipo === 'origem' && { backgroundColor: colors.secondary.lighter },
                          tipo === 'destino' && { backgroundColor: colors.success.light },
                        ]}>
                        <Icon
                          name={
                            tipo === 'origem'
                              ? IconNames.location
                              : tipo === 'destino'
                              ? 'flag'
                              : 'circle'
                          }
                          size="sm"
                          color={
                            tipo === 'origem'
                              ? colors.secondary.main
                              : tipo === 'destino'
                              ? colors.success.main
                              : colors.text.secondary
                          }
                        />
                      </View>
                      {index < pontosRota.length - 1 && (
                        <View style={styles.pontoItemLine} />
                      )}
                    </View>
                    <View style={styles.pontoItemRight}>
                      <Text style={styles.pontoItemNome}>{p.apelido as string}</Text>
                      <Text style={styles.pontoItemTipo}>
                        {tipo === 'origem' ? 'Origem' : tipo === 'destino' ? 'Destino' : 'Parada'}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Nenhum ponto cadastrado para esta rota</Text>
            )}
          </View>

          {/* Map */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mapa da Rota</Text>
            {carregandoPontos ? (
              <View style={styles.mapaPlaceholder}>
                <Text style={styles.mapaPlaceholderLabel}>Carregando mapa...</Text>
              </View>
            ) : pontosRota.length > 0 ? (
              <StaticRouteMap pontosRota={pontosRota} />
            ) : (
              <View style={styles.mapaPlaceholder}>
                <Icon name={IconNames.map} size="huge" color={colors.neutral[300]} />
                <Text style={styles.mapaPlaceholderLabel}>Sem rota definida</Text>
              </View>
            )}
          </View>

          {/* Locate Bus */}
          <TouchableOpacity
            style={styles.localizacaoButton}
            onPress={() => navigation.navigate('LocalizacaoOnibus', { rota, viagem })}
            accessibilityRole="button"
            accessibilityLabel="Ver localização do ônibus no mapa">
            <Icon name={IconNames.myLocation} size="md" color={colors.primary.contrast} />
            <Text style={styles.localizacaoButtonText}>Ver Localização do Ônibus</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DialogoConfirmacao
        visible={cancelarVisivel}
        titulo="Cancelar presença?"
        resumo="O motorista deixa de contar com você nesta viagem."
        onCancelar={() => setCancelarVisivel(false)}
        principal={{ texto: 'Manter presença', cor: colors.success.main, onPress: () => setCancelarVisivel(false) }}
        secundario={{
          texto: 'Sim, cancelar',
          cor: colors.error.main,
          carregando: salvandoPresenca,
          onPress: async () => {
            await cancelar();
            setCancelarVisivel(false);
          },
        }}
      />

      <ReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        viagemId={viagem.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: { ...textStyles.h3, color: colors.primary.contrast },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  reportBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warning.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { padding: spacing.base },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  cardTitle: { ...textStyles.h4, color: colors.text.primary, marginBottom: spacing.base },
  viagemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  tipoBadge: {
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    alignSelf: 'flex-start',
  },
  viagemTipo: { ...textStyles.caption, color: colors.primary.dark, fontWeight: '600' },
  viagemHorario: { ...textStyles.display2, color: colors.text.primary },
  situacaoBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  situacaoText: { ...textStyles.caption, fontWeight: '600' },
  rotaInfo: { marginTop: spacing.sm },
  pontoRota: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pontoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pontoInfo: { flex: 1 },
  pontoLabel: { ...textStyles.caption, color: colors.text.secondary, marginBottom: spacing.xxs },
  pontoNome: { ...textStyles.h5, color: colors.text.primary },
  linhaRota: {
    width: 2,
    height: 20,
    backgroundColor: colors.border.light,
    marginLeft: 19,
    marginBottom: spacing.md,
  },

  // Capacity
  capacityWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  capacityLabel: { ...textStyles.caption, color: colors.text.secondary, flex: 1 },
  capacityValue: { ...textStyles.caption, color: colors.text.primary, fontWeight: '600' },
  quaseLotadoBadge: {
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  quaseLotadoText: {
    ...textStyles.caption,
    color: colors.warning.dark,
    fontWeight: '700',
    fontSize: 10,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },

  // Presence
  presencaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  presencaConfirmada: { backgroundColor: colors.success.light },
  presencaNaoConfirmada: { backgroundColor: colors.warning.light },
  cancelarPresenca: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error.main,
    borderRadius: borderRadius.md,
    minHeight: 48,
    marginTop: spacing.md,
    ...shadows.xs,
  },
  cancelarPresencaTexto: { ...textStyles.button, color: '#FFFFFF' },
  presencaText: { ...textStyles.h5 },
  confirmarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    minHeight: 52,
    ...shadows.xs,
  },
  confirmarButtonText: { ...textStyles.button, color: colors.primary.contrast },

  // Route Points
  pontoItem: { flexDirection: 'row', marginBottom: spacing.base },
  pontoItemLeft: { width: 40, alignItems: 'center', marginRight: spacing.md },
  pontoItemIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pontoItemLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: spacing.xs,
  },
  pontoItemRight: { flex: 1 },
  pontoItemNome: { ...textStyles.body, color: colors.text.primary, marginBottom: spacing.xxs },
  pontoItemTipo: { ...textStyles.caption, color: colors.text.secondary },

  // Map
  mapaPlaceholder: {
    height: 200,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  mapaPlaceholderLabel: { ...textStyles.body, color: colors.text.secondary },

  // Actions
  localizacaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginTop: spacing.sm,
    minHeight: 52,
    ...shadows.sm,
  },
  localizacaoButtonText: { ...textStyles.button, color: colors.primary.contrast },

  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.base,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingText: {
    ...textStyles.bodySmall,
    color: colors.text.hint,
    textAlign: 'center',
    padding: spacing.base,
  },
});

export default DetalheViagem;
