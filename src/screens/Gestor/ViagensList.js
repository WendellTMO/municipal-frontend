import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { api } from '../../api/client';
import { gestorService } from '../../services/gestorService';
import { unwrapItems } from '../../types';
import { useFetch } from '../../hooks';
import { borderRadius, colors, fontWeight, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { LoadingView, ErrorView } from '../../components/LoadingState';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';
import { formatarHora } from '../../utils/formatarHora';
import { dataLocal } from '../../utils/dataLocal';
import { isoLocal } from '../../utils/saudacao';

const GESTOR_COLOR = colors.roles.gestor;

const today = () => isoLocal(new Date());

const FILTERS = [
  { key: 'TODAS',       label: 'Todas' },
  { key: 'HOJE',        label: 'Hoje' },
  { key: 'AGENDADA',    label: 'Agendadas' },
  { key: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { key: 'FINALIZADA',  label: 'Finalizadas' },
  { key: 'CANCELADA',   label: 'Canceladas' },
];

const STATUS_LABEL = {
  AGENDADA: 'Agendada',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const STATUS_COLOR = {
  AGENDADA: colors.warning.main,
  EM_ANDAMENTO: colors.info.main,
  FINALIZADA: colors.success.main,
  CANCELADA: colors.error.main,
};

const ViagensList = ({ navigation }) => {
  const toast = useToast();
  const [filtroAtivo, setFiltroAtivo] = useState('TODAS');
  const [refreshing, setRefreshing] = useState(false);

  const fetchViagens = useCallback(async () => {
    const params = {};
    if (filtroAtivo === 'HOJE') {
      params.data_inicio = today();
      params.data_fim = today();
    } else if (filtroAtivo !== 'TODAS') {
      params.status = filtroAtivo;
    }
    const data = await gestorService.listarViagens(params).then(unwrapItems);
    return (data ?? []).sort((a, b) => dataLocal(b.data) - dataLocal(a.data));
  }, [filtroAtivo]);

  const { data: viagens, isLoading, isError, error, refetch } = useFetch(
    fetchViagens,
    [filtroAtivo],
    { showErrorToast: true },
  );

  const [cancelando, setCancelando] = useState(null);

  const handleCancelarViagem = (v) => {
    Alert.alert(
      'Cancelar viagem',
      `Cancelar a viagem da rota "${v.rota_nome ?? 'Rota'}" em ${formatDate(v.data)}?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar viagem',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelando(v.id);
              await api.put(`/viagens/${v.id}/cancelar`);
              toast.info('Viagem cancelada.');
              await refetch();
            } catch (e) {
              toast.error(e?.message ?? 'Erro ao cancelar viagem.');
            } finally {
              setCancelando(null);
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (ds) => {
    if (!ds) return '';
    const [y, mo, d] = ds.split('T')[0].split('-');
    return `${d}/${mo}/${y}`;
  };


  return (
    <TelaSegura style={styles.container}>
      {/* Header */}
      <SubHeader
        titulo="Viagens"
        subtitulo={viagens ? `${viagens.length} resultado(s)` : 'Todas as viagens'}
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
        direita={
          <Tappable navega
            style={styles.newButton}
            onPress={() => navigation.navigate('CriarViagem')}>
            <Icon name={IconNames.add} size="md" color="#FFFFFF" />
            <Text style={styles.newButtonText}>Nova</Text>
          </Tappable>
        }
      />

      {/* Filter chips */}
      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map(f => {
            const active = filtroAtivo === f.key;
            return (
              <Tappable
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFiltroAtivo(f.key)}
                activeOpacity={0.7}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Tappable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingView message="Carregando viagens..." />
      ) : isError ? (
        <ErrorView message={error?.message ?? 'Erro ao carregar viagens'} onRetry={refetch} />
      ) : (viagens ?? []).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name={IconNames.route} size="huge" color={colors.neutral[300]} />
          <Text style={styles.emptyText}>Nenhuma viagem encontrada</Text>
          <Text style={styles.emptySubtext}>
            {filtroAtivo === 'HOJE' ? 'Nenhuma viagem para hoje' : 'Tente outro filtro'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={withFabSpace()}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GESTOR_COLOR]}
              tintColor={GESTOR_COLOR}
            />
          }>
          <View style={styles.listContent}>
            {(viagens ?? []).map(v => {
              const cor = STATUS_COLOR[v.status] ?? colors.text.hint;
              const podeCancel = v.status === 'AGENDADA';
              return (
                <View key={v.id} style={styles.card}>
                  <Tappable navega
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('DetalheViagemMotorista', { viagem: v })}>

                    <View style={styles.cardTop}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardRota} numberOfLines={1}>
                          {v.rota_nome ?? 'Rota'}
                        </Text>
                        <Text style={styles.cardMotorista} numberOfLines={1}>
                          {v.motorista_nome ? `Motorista: ${v.motorista_nome}` : 'Sem motorista'}
                        </Text>
                        <View style={styles.cardMeta}>
                          <Icon name={IconNames.calendarToday} size="xs" color={colors.text.secondary} />
                          <Text style={styles.cardMetaText}>
                            {formatDate(v.data)} · {formatarHora(v.horario_inicio)}
                          </Text>
                          {v.total_alunos != null && (
                            <>
                              <View style={styles.dot} />
                              <Icon name={IconNames.group} size="xs" color={colors.text.secondary} />
                              <Text style={styles.cardMetaText}>
                                {v.alunos_confirmados_count ?? 0}/{v.total_alunos}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={[styles.badge, { backgroundColor: cor + '20' }]}>
                        <Text style={[styles.badgeText, { color: cor }]}>
                          {STATUS_LABEL[v.status] ?? v.status}
                        </Text>
                      </View>
                    </View>

                    {v.origem && v.destino && (
                      <Text style={styles.cardRota2} numberOfLines={1}>
                        {v.origem} → {v.destino}
                      </Text>
                    )}
                  </Tappable>

                  {podeCancel && (
                    <Tappable
                      style={[styles.cancelBtn, cancelando === v.id && { opacity: 0.5 }]}
                      onPress={() => handleCancelarViagem(v)}
                      disabled={cancelando === v.id}
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar viagem">
                      {cancelando === v.id ? (
                        <ActivityIndicator size="small" color={colors.error.main} />
                      ) : (
                        <>
                          <Icon name={IconNames.close} size="xs" color={colors.error.main} />
                          <Text style={styles.cancelBtnText}>Cancelar viagem</Text>
                        </>
                      )}
                    </Tappable>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h2,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  headerSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xxs,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  newButtonText: {
    ...textStyles.bodySmall,
    color: '#FFFFFF',
    fontWeight: fontWeight.semiBold,
  },
  filtersWrap: {
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    ...shadows.xs,
  },
  filters: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipActive: {
    backgroundColor: GESTOR_COLOR + '20',
    borderColor: GESTOR_COLOR,
  },
  chipText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: {
    color: GESTOR_COLOR,
    fontWeight: fontWeight.semiBold,
  },
  list: { flex: 1 },
  listContent: {
    padding: spacing.base,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: { flex: 1, marginRight: spacing.md },
  cardRota: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xxs,
  },
  cardMotorista: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardMetaText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.text.hint,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...textStyles.caption,
    fontWeight: fontWeight.semiBold,
  },
  cardRota2: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyText: {
    ...textStyles.h4,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...textStyles.caption,
    color: colors.text.hint,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  cancelBtnText: {
    ...textStyles.caption,
    color: colors.error.main,
    fontWeight: '600',
  },
});

export default ViagensList;
