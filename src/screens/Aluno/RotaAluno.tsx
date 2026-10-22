import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { useToast } from '../../components/Toast';
import { unwrapItems } from '../../types';
import type { PontoFlatResponse } from '../../types';
import type { ViagemAgendaUI } from '../../services/alunoService';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';

type RootParamList = Record<string, object | undefined>;
type Props = {
  navigation: NativeStackNavigationProp<RootParamList>;
  route: RouteProp<{ RotaAluno: { rota?: Record<string, unknown> } }, 'RotaAluno'>;
};

const CAPACITY_WARN = 0.85;

const CapacityPill: React.FC<{ confirmed: number; total: number }> = ({
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
      accessibilityLabel={`${confirmed} de ${total} vagas confirmadas`}>
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
      <View style={styles.capacityRow}>
        <Text style={styles.capacityText}>{confirmed}/{total} vagas</Text>
        {quaseLotado && (
          <View style={styles.quaseLotadoBadge}>
            <Text style={styles.quaseLotadoText}>Quase lotado</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const RotaAluno: React.FC<Props> = ({ navigation, route }) => {
  const rota = route?.params?.rota;
  const toast = useToast();

  const [viagens, setViagens] = useState<ViagemAgendaUI[]>([]);
  const [presencasStatus, setPresencasStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingPresenca, setUpdatingPresenca] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const isAllTrips = !rota;
  const screenTitle = isAllTrips ? 'Minhas Viagens' : (rota.nome as string);

  const loadViagens = useCallback(async () => {
    try {
      const todasViagens = await alunoService.listarViagens();
      const viagensFiltradas = isAllTrips
        ? todasViagens
        : todasViagens.filter((v) => v.rota_id === (rota.id as string));

      setViagens(viagensFiltradas);

      const statusMap: Record<string, boolean> = {};
      viagensFiltradas.forEach((viagem) => {
        statusMap[viagem.id ?? ''] = viagem.status_confirmacao ?? false;
      });
      setPresencasStatus(statusMap);
    } catch {
      toast.error('Não foi possível carregar as viagens.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAllTrips, rota?.id, toast]);

  useEffect(() => {
    loadViagens();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadViagens]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      if (isMountedRef.current) loadViagens();
    });
    return unsubscribe as (() => void) | undefined;
  }, [navigation, loadViagens]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return { color: colors.success.main, bg: colors.success.light, icon: IconNames.checkCircle };
      case 'Não confirmado':
        return { color: colors.warning.main, bg: colors.warning.light, icon: IconNames.warning };
      case 'Encerrada':
        return { color: colors.text.secondary, bg: colors.neutral[100], icon: IconNames.checkCircle };
      case 'Cancelada':
        return { color: colors.error.main, bg: colors.error.light, icon: IconNames.error };
      default:
        return { color: colors.text.hint, bg: colors.neutral[100], icon: IconNames.info };
    }
  };

  const handleConfirmarPresenca = async (viagem: ViagemAgendaUI, currentStatus: string) => {
    if (!viagem.id) return;
    try {
      setUpdatingPresenca(viagem.id);
      const novoStatus = currentStatus !== 'Confirmado';

      let pontoEmbarqueId = viagem.ponto_embarque_id;
      if (novoStatus && !pontoEmbarqueId && viagem.rota_id) {
        try {
          const pontos = await alunoService.listarPontosRota(viagem.rota_id).then(unwrapItems);
          if (pontos && pontos.length > 0) {
            pontoEmbarqueId = ((pontos as PontoFlatResponse[])[0] as Record<string, unknown>).id as string;
          }
        } catch (e: unknown) {
          toast.error(`Erro ao buscar pontos: ${(e as Error).message || 'erro desconhecido'}`);
          return;
        }
      }

      if (novoStatus && !pontoEmbarqueId) {
        toast.error('Nenhum ponto de embarque disponível.');
        return;
      }

      await alunoService.alterarPresencaViagem(viagem.id, novoStatus, pontoEmbarqueId ?? null);
      setPresencasStatus((prev) => ({ ...prev, [viagem.id!]: novoStatus }));
      toast.success(novoStatus ? 'Presença confirmada!' : 'Presença cancelada.');
      loadViagens();
    } catch (error: unknown) {
      const msg = (error as Record<string, unknown>)?.message as string ||
        (error as Record<string, unknown>)?.error as string ||
        'Não foi possível atualizar a presença.';
      toast.error(msg);
    } finally {
      setUpdatingPresenca(null);
    }
  };

  const podeConfirmar = (viagem: ViagemAgendaUI): boolean => {
    if (!viagem.data) return true;
    const [year, month, day] = viagem.data.split('-').map(Number);
    const tripDate = new Date(year, month - 1, day);
    if (isNaN(tripDate.getTime())) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tripDate >= today;
  };

  const getStatusFromViagem = (viagem: ViagemAgendaUI): string => {
    const isConfirmed = presencasStatus[viagem.id ?? ''] ?? viagem.status_confirmacao;
    return isConfirmed ? 'Confirmado' : 'Não confirmado';
  };

  const formatTime = (t?: string) =>
    t ? (t.includes('T') ? t.substring(11, 16) : t.substring(0, 5)) : '--:--';
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader
        titulo={screenTitle}
        subtitulo={`${viagens.length} viage${viagens.length !== 1 ? 'ns' : 'm'}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={withFabSpace()}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadViagens();
            }}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }>
        <View style={styles.content}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Viagens
          </Text>

          {viagens.length > 0 ? (
            viagens.map((viagem) => {
              const status = getStatusFromViagem(viagem);
              const statusConfig = getStatusConfig(status);
              const isUpdating = updatingPresenca === viagem.id;

              return (
                <View
                  key={viagem.id}
                  style={styles.viagemCard}
                  accessible
                  accessibilityLabel={`Viagem ${viagem.tipo ?? ''} às ${formatTime(viagem.horario_inicio)}, ${formatDate(viagem.data)}, ${status}`}>
                  <View style={styles.viagemHeader}>
                    <View style={styles.viagemInfo}>
                      <View style={styles.viagemTipoContainer}>
                        <View style={styles.tipoBadge}>
                          <Text style={styles.viagemTipo}>{viagem.tipo}</Text>
                        </View>
                        <Text style={styles.viagemHorario}>
                          {formatTime(viagem.horario_inicio)}
                        </Text>
                      </View>
                      <View style={styles.dateRow}>
                        <Icon name={IconNames.calendarToday} size="sm" color={colors.text.secondary} />
                        <Text style={styles.viagemData}>{formatDate(viagem.data)}</Text>
                      </View>
                      {isAllTrips && viagem.rota_nome && (
                        <View style={styles.dateRow}>
                          <Icon name={IconNames.route} size="sm" color={colors.text.secondary} />
                          <Text style={styles.viagemData}>{viagem.rota_nome}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Icon name={statusConfig.icon} size="xs" color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {status}
                      </Text>
                    </View>
                  </View>

                  {/* Capacity */}
                  <CapacityPill
                    confirmed={viagem.alunos_confirmados_count}
                    total={viagem.total_alunos}
                  />

                  {podeConfirmar(viagem) && (
                    <TouchableOpacity
                      style={[
                        styles.confirmarButton,
                        status === 'Confirmado' && styles.confirmarButtonActive,
                        isUpdating && styles.confirmarButtonDisabled,
                      ]}
                      onPress={() => handleConfirmarPresenca(viagem, status)}
                      disabled={isUpdating}
                      accessibilityRole="button"
                      accessibilityLabel={
                        status === 'Confirmado' ? 'Cancelar presença' : 'Confirmar presença'
                      }
                      accessibilityState={{ disabled: isUpdating }}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                      {isUpdating ? (
                        <ActivityIndicator color={colors.primary.contrast} />
                      ) : (
                        <>
                          <Icon
                            name={status === 'Confirmado' ? IconNames.close : IconNames.checkCircle}
                            size="md"
                            color={colors.primary.contrast}
                          />
                          <Text style={styles.confirmarButtonText}>
                            {status === 'Confirmado' ? 'Cancelar Presença' : 'Confirmar Presença'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.detalhesButton}
                    onPress={() =>
                      navigation.navigate('DetalheViagem', {
                        rota: rota || { id: viagem.rota_id, nome: viagem.rota_nome },
                        viagem,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Ver detalhes desta viagem"
                    accessibilityHint="Abre a tela de detalhes">
                    <Text style={styles.detalhesButtonText}>Ver Detalhes</Text>
                    <Icon name={IconNames.chevronRight} size="md" color={colors.primary.main} />
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState} accessible accessibilityLabel="Nenhuma viagem encontrada">
              <Icon name={IconNames.schedule} size="huge" color={colors.neutral[300]} />
              <Text style={styles.emptyStateText}>
                {isAllTrips
                  ? 'Nenhuma viagem agendada nas suas rotas'
                  : 'Nenhuma viagem encontrada para esta rota'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: spacing.md },
  title: { ...textStyles.h3, color: colors.primary.contrast },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { padding: spacing.base },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  viagemCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  viagemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  viagemInfo: { flex: 1 },
  viagemTipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  tipoBadge: {
    backgroundColor: colors.primary.lighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  viagemTipo: { ...textStyles.caption, color: colors.primary.dark, fontWeight: '600' },
  viagemHorario: { ...textStyles.h3, color: colors.text.primary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  viagemData: { ...textStyles.bodySmall, color: colors.text.secondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: { ...textStyles.caption, fontWeight: '600' },

  // Capacity
  capacityWrap: {
    marginBottom: spacing.md,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
    marginBottom: spacing.xxs,
  },
  barFill: { height: 4, borderRadius: 2 },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  capacityText: { ...textStyles.caption, color: colors.text.secondary, flex: 1 },
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

  confirmarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 48,
    ...shadows.xs,
  },
  confirmarButtonActive: { backgroundColor: colors.error.main },
  confirmarButtonDisabled: { opacity: 0.6 },
  confirmarButtonText: { ...textStyles.button, color: colors.primary.contrast },
  detalhesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    minHeight: 44,
  },
  detalhesButtonText: { ...textStyles.bodySmall, color: colors.primary.main, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', padding: spacing.xxl, gap: spacing.base },
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default RotaAluno;
