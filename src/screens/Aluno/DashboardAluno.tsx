import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { alunoService } from '../../services';
import { getNotificacoes } from '../../services/notificacaoService';
import { useAuth } from '../../contexts/AuthContext';
import { borderRadius, colors, shadows, spacing, textStyles } from '../../theme';
import {
  ActionTile,
  Icon,
  IconNames,
  LoadingSpinner,
  PainelHeader,
  TripAlertBanner,
  TripHeroCard,
} from '../../components';
import { dayLabel } from '../../utils/dayLabel';
import { escolherViagemDeHoje } from '../../utils/viagemAluno';
import { horaCurta } from '../../utils/viagemPainel';
import AgoraCard from '../../components/AgoraCard';
import PresencaAcoes from '../../components/PresencaAcoes';
import { aceitaPresenca } from '../../utils/presenca';
import MiniMapaOnibus from '../../components/MiniMapaOnibus';
import type { TripAlert } from '../../components/TripAlertBanner';
import { unwrapItems } from '../../types';
import type { ViagemAgendaUI } from '../../services/alunoService';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import Tappable from '../../components/Tappable';

type RootParamList = Record<string, object | undefined>;
type Props = { navigation: NativeStackNavigationProp<RootParamList> };

const DashboardAluno: React.FC<Props> = ({ navigation }) => {
  const [rotasCadastradas, setRotasCadastradas] = useState<ViagemAgendaUI[]>([]);
  const [proximaViagem, setProximaViagem] = useState<
    (ViagemAgendaUI & { horario: string; status: string }) | null
  >(null);
  const [todayTrip, setTodayTrip] = useState<ViagemAgendaUI | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<TripAlert | null>(null);
  const prevUnreadRef = useRef(0);
  const { user, logout } = useAuth();

  const userRecord = user as Record<string, unknown>;
  const userStatus = userRecord?.status as string | undefined;
  const isPendingApproval = userStatus === 'PENDING_APPROVAL';
  const isAwaitingGuardian =
    userStatus === 'PENDING_SIGNUP' &&
    !!userRecord?.email_responsavel &&
    !userRecord?.guardian_consented_at;

  const loadNotifBadge = useCallback(async () => {
    try {
      const notifs = await getNotificacoes();
      const count = notifs.filter((n) => !n.enviada).length;
      if (count > prevUnreadRef.current && prevUnreadRef.current > 0) {
        const newest = notifs.find((n) => !n.enviada);
        if (newest) {
          const isUrgent = ['Iniciada', 'Cancelada', 'Aviso'].some((kw) =>
            newest.titulo.includes(kw),
          );
          if (isUrgent) {
            setAlert({
              id: newest.id,
              titulo: newest.titulo,
              mensagem: newest.mensagem,
              variant: newest.titulo.includes('Cancelada') ? 'error' : 'info',
              onPress: () => navigation.navigate('Notificacoes'),
            });
          }
        }
      }
      prevUnreadRef.current = count;
      setUnreadCount(count);
    } catch {
      // non-critical — badge just won't update
    }
  }, [navigation]);

  const loadData = useCallback(async () => {
    try {
      const rotas = await alunoService.listarMinhasRotas().then(unwrapItems);
      setRotasCadastradas(rotas as ViagemAgendaUI[]);

      const todasViagens = await alunoService.listarViagens();

      if (todasViagens.length > 0) {
        const now = new Date();
        const upcoming = todasViagens
          .filter((v) => {
            try {
              const dt = v.horario_inicio
                ? new Date(`${v.data}T${v.horario_inicio}`)
                : new Date(v.data ?? '');
              return dt >= now;
            } catch {
              return false;
            }
          })
          .sort((a, b) => {
            try {
              return (
                new Date(`${a.data}T${a.horario_inicio ?? '00:00'}`).getTime() -
                new Date(`${b.data}T${b.horario_inicio ?? '00:00'}`).getTime()
              );
            } catch {
              return 0;
            }
          });

        const next = upcoming[0] ?? null;
        setProximaViagem(
          next
            ? {
                ...next,
                horario: (next.horario_inicio ?? '--:--').substring(0, 5),
                status: next.status_confirmacao ? 'Confirmado' : 'Não confirmado',
              }
            : null,
        );

        setTodayTrip(escolherViagemDeHoje(todasViagens));
      } else {
        setProximaViagem(null);
        setTodayTrip(null);
      }
    } catch {
      setProximaViagem(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadNotifBadge();
    const interval = setInterval(loadNotifBadge, 60_000);
    return () => clearInterval(interval);
  }, [loadData, loadNotifBadge]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    loadNotifBadge();
  };

  const todayBannerConfig = (() => {
    if (!todayTrip) return null;
    switch (todayTrip.status_viagem) {
      case 'CANCELADA':
        return {
          bg: colors.error.light,
          border: colors.error.main,
          text: colors.error.dark,
          icon: IconNames.close,
          label: 'Viagem de hoje cancelada',
          sub: 'Entre em contato com o gestor',
          onPress: undefined,
        };
      default:
        return null;
    }
  })();

  const abrirDetalheViagem = () => {
    if (!proximaViagem) return;
    const rota = (rotasCadastradas as unknown[]).find(
      (r: unknown) => (r as Record<string, unknown>).id === proximaViagem.rota_id,
    );
    if (rota) navigation.navigate('DetalheViagem', { rota, viagem: proximaViagem });
  };

  const emAndamento = todayTrip?.status_viagem === 'EM_ANDAMENTO';

  // Com a viagem em andamento, o mapa mostra ela; senão mostra a próxima.
  const abrirLocalizacao = () => {
    const viagem = emAndamento ? todayTrip : proximaViagem;
    if (!viagem) return;
    const rota =
      (rotasCadastradas as unknown[]).find(
        (r: unknown) => (r as Record<string, unknown>).id === viagem.rota_id,
      ) ?? { id: viagem.rota_id, nome: viagem.rota_nome };
    navigation.navigate('LocalizacaoOnibus', { rota, viagem });
  };

  let proximaViagemLabel = '';
  if (proximaViagem) {
    const dia = dayLabel(proximaViagem.data);
    let quando = `em ${dia}`;
    if (dia === 'HOJE') quando = 'hoje';
    if (dia === 'AMANHÃ') quando = 'amanhã';
    const confirmada = proximaViagem.status === 'Confirmado' ? 'confirmada' : 'não confirmada';
    const rota = (proximaViagem.rota_nome ?? 'Rota').replace(/→/g, 'para');
    proximaViagemLabel = `Próxima viagem ${quando} às ${proximaViagem.horario}, ${rota}, ${confirmada}`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          fullScreen
          message="Carregando suas informações..."
          color={colors.secondary.main}
          accessibilityLabel="Carregando painel do aluno"
        />
      </SafeAreaView>
    );
  }

  if (isAwaitingGuardian || isPendingApproval) {
    const isGuardian = isAwaitingGuardian;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.blockedRoot}>
          <View style={styles.blockedIconWrap}>
            <Icon
              name={isGuardian ? 'mail-outline' : IconNames.schedule}
              size="xl"
              color={isGuardian ? colors.warning.dark : colors.primary.main}
              style={undefined}
            />
          </View>

          <Text style={styles.blockedTitle}>
            {isGuardian ? 'Aguardando responsável' : 'Cadastro em análise'}
          </Text>

          <Text style={styles.blockedBody}>
            {isGuardian
              ? `Um e-mail de autorização foi enviado para ${userRecord?.email_responsavel as string}. O responsável precisa confirmar antes de você continuar.`
              : 'Seu responsável já autorizou o cadastro. O gestor municipal está analisando sua solicitação e você será avisado quando for aprovado.'}
          </Text>

          {isGuardian && (
            <View style={styles.blockedHint}>
              <Icon name="info-outline" size="sm" color={colors.text.hint} style={undefined} />
              <Text style={styles.blockedHintText}>
                Não recebeu? Peça ao responsável para verificar a caixa de spam.
              </Text>
            </View>
          )}

          <Tappable
            style={styles.blockedLogoutBtn}
            onPress={() => void logout()}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta">
            <Icon name="logout" size="sm" color={colors.text.secondary} style={undefined} />
            <Text style={styles.blockedLogoutText}>Sair da conta</Text>
          </Tappable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TripAlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      <ScrollView
        contentContainerStyle={withFabSpace()}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }>
        <PainelHeader
          perfil="Aluno"
          unreadCount={unreadCount}
          onBellPress={() => navigation.navigate('Notificacoes')}
          onOpenConfig={() => navigation.navigate('ConfigNotificacoesAluno')}
        />

        {/* Today's Trip Banner */}
        {todayBannerConfig && (
          <Tappable
            style={[
              styles.todayBanner,
              {
                backgroundColor: todayBannerConfig.bg,
                borderColor: todayBannerConfig.border,
              },
            ]}
            onPress={todayBannerConfig.onPress}
            disabled={!todayBannerConfig.onPress}
            activeOpacity={0.8}
            accessible
            accessibilityRole={todayBannerConfig.onPress ? 'button' : 'text'}
            accessibilityLabel={`${todayBannerConfig.label}. ${todayBannerConfig.sub}`}>
            <View
              style={[
                styles.todayBannerIcon,
                { backgroundColor: todayBannerConfig.border + '20' },
              ]}>
              <Icon
                name={todayBannerConfig.icon}
                size="lg"
                color={todayBannerConfig.border}
                accessibilityElementsHidden
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.todayBannerLabel, { color: todayBannerConfig.text }]}>
                {todayBannerConfig.label}
              </Text>
              <Text style={[styles.todayBannerSub, { color: todayBannerConfig.text }]}>
                {todayBannerConfig.sub}
              </Text>
            </View>
            {todayBannerConfig.onPress && (
              <Icon
                name={IconNames.chevronRight}
                size="md"
                color={todayBannerConfig.border}
                accessibilityElementsHidden
              />
            )}
          </Tappable>
        )}

        {/* Ônibus a caminho */}
        {emAndamento && todayTrip && (
          <AgoraCard
            rotaNome={todayTrip.rota_nome ?? 'Rota'}
            hora={horaCurta(todayTrip.horario_inicio)}
            onPress={abrirLocalizacao}>
            <MiniMapaOnibus
              rotaId={todayTrip.rota_id}
              viagemId={todayTrip.id}
              embarqueId={todayTrip.ponto_embarque_id}
              onPress={abrirLocalizacao}
            />
          </AgoraCard>
        )}

        {/* Próxima Viagem */}
        {proximaViagem && !emAndamento && (
          <TripHeroCard
            dayLabel={dayLabel(proximaViagem.data)}
            time={proximaViagem.horario}
            statusLabel={proximaViagem.status}
            statusColor={
              proximaViagem.status === 'Confirmado' ? colors.success.main : colors.warning.main
            }
            statusIcon={
              proximaViagem.status === 'Confirmado' ? IconNames.checkCircle : IconNames.warning
            }
            title={proximaViagem.rota_nome ?? 'Rota'}
            accessibilityLabel={proximaViagemLabel}
            onPress={abrirDetalheViagem}>
            {aceitaPresenca(proximaViagem.status_viagem) ? (
              <PresencaAcoes
                key={proximaViagem.id}
                viagem={proximaViagem}
                confirmadaInicial={!!proximaViagem.status_confirmacao}
                onMudou={(c) =>
                  setProximaViagem((prev) =>
                    prev ? { ...prev, status_confirmacao: c, status: c ? 'Confirmado' : 'Não confirmado' } : prev,
                  )
                }
              />
            ) : null}
          </TripHeroCard>
        )}

        {/* Quick Actions */}
        <View style={styles.botoesRapidos} accessibilityRole="toolbar">
          <ActionTile
            icon={IconNames.bus}
            label="Viagens"
            accessibilityLabel="Minhas Viagens"
            color={colors.solid.blue}
            onPress={() => navigation.navigate('RotaAluno')}
          />
          <ActionTile
            icon={IconNames.location}
            label="Localização"
            accessibilityLabel="Localização do ônibus"
            color={colors.solid.green}
            disabled={!proximaViagem && !emAndamento}
            onPress={abrirLocalizacao}
          />
          <ActionTile
            icon={IconNames.route}
            label="Rotas"
            accessibilityLabel="Rotas disponíveis"
            color={colors.solid.teal}
            onPress={() => navigation.navigate('SelecaoRotas')}
          />
          <ActionTile
            icon={IconNames.person}
            label="Perfil"
            accessibilityLabel="Editar meu perfil"
            color={colors.neutral[600]}
            onPress={() => navigation.navigate('EditarPerfilAluno')}
          />
        </View>

        {/* Enrolled Routes */}
        <View style={styles.rotasSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Minhas rotas
            </Text>
            <Tappable navega
              style={styles.verTodasButton}
              onPress={() => navigation.navigate('SelecaoRotas')}
              accessibilityRole="button"
              accessibilityLabel="Ver todas as rotas">
              <Text style={styles.verTodasText}>Ver todas</Text>
              <Icon name={IconNames.chevronRight} size="sm" color={colors.secondary.main} accessibilityElementsHidden />
            </Tappable>
          </View>

          {rotasCadastradas.length > 0 ? (
            (rotasCadastradas as unknown[]).map((rota: unknown) => {
              const r = rota as Record<string, unknown>;
              return (
                <Tappable navega
                  key={r.id as string}
                  style={styles.rotaCard}
                  onPress={() => navigation.navigate('RotaAluno', { rota })}
                  accessibilityRole="button"
                  accessibilityLabel={`Rota ${r.nome as string}`}>
                  <View style={styles.rotaIconContainer}>
                    <Icon name={IconNames.route} size="lg" color={colors.primary.main} accessibilityElementsHidden />
                  </View>
                  <View style={styles.rotaInfo}>
                    <Text style={styles.rotaNome}>{r.nome as string}</Text>
                    {r.municipio_nome ? (
                      <Text style={styles.rotaBairro}>
                        {`${r.municipio_nome as string}${r.municipio_uf ? ` - ${r.municipio_uf as string}` : ''}`}
                      </Text>
                    ) : null}
                  </View>
                  <Icon name={IconNames.chevronRight} size="md" color={colors.neutral[400]} accessibilityElementsHidden />
                </Tappable>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name={IconNames.route} size="huge" color={colors.neutral[300]} accessibilityElementsHidden />
              </View>
              <Text style={styles.emptyStateTitle}>Nenhuma rota cadastrada</Text>
              <Text style={styles.emptyStateText}>
                Você ainda não está inscrito em nenhuma rota de transporte escolar
              </Text>
              <Tappable navega
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('SelecaoRotas')}
                accessibilityRole="button"
                accessibilityLabel="Ver rotas disponíveis">
                <Icon name={IconNames.add} size="md" color={colors.primary.contrast} accessibilityElementsHidden />
                <Text style={styles.emptyStateButtonText}>Ver rotas disponíveis</Text>
              </Tappable>
            </View>
          )}
        </View>

        {/* Settings */}
        <Tappable navega
          style={styles.configButton}
          onPress={() => navigation.navigate('ConfigNotificacoesAluno')}
          accessibilityRole="button"
          accessibilityLabel="Configurações de notificações">
          <Icon name={IconNames.settings} size="base" color={colors.text.secondary} accessibilityElementsHidden />
          <Text style={styles.configButtonText}>Configurações</Text>
          <Icon name={IconNames.chevronRight} size="md" color={colors.neutral[400]} accessibilityElementsHidden />
        </Tappable>

        <SairDaConta />

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: { flex: 1 },

  // Header

  // Today Banner
  todayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  todayBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBannerLabel: {
    ...textStyles.h5,
    fontWeight: '700',
  },
  todayBannerSub: {
    ...textStyles.bodySmall,
    marginTop: spacing.xxs,
  },

  // Próxima Viagem Card

  // Capacity

  // Quick Actions
  botoesRapidos: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },

  // Routes
  rotasSection: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  verTodasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
  },
  verTodasText: {
    ...textStyles.bodySmall,
    color: colors.secondary.main,
    fontWeight: '600',
  },
  rotaCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
    minHeight: 64,
  },
  rotaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rotaInfo: { flex: 1 },
  rotaNome: {
    ...textStyles.h5,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  rotaBairro: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  emptyIconContainer: { marginBottom: spacing.base },
  emptyStateTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
    minHeight: 48,
  },
  emptyStateButtonText: {
    ...textStyles.button,
    color: colors.primary.contrast,
  },

  // Blocked state (PENDING_SIGNUP guardian / PENDING_APPROVAL)
  blockedRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  blockedIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.warning.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  blockedTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  blockedBody: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  blockedHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  blockedHintText: {
    ...textStyles.bodySmall,
    color: colors.text.hint,
    flex: 1,
    lineHeight: 18,
  },
  blockedLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  blockedLogoutText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },

  // Config
  configButton: {
    marginHorizontal: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.xs,
    minHeight: 56,
  },
  configButtonText: {
    ...textStyles.body,
    color: colors.text.secondary,
    flex: 1,
  },
});

export default DashboardAluno;
