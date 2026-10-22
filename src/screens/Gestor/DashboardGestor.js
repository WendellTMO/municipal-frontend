import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { listarOcorrencias, resolverOcorrencia } from '../../services/ocorrenciaService';
import { useAuth } from '../../contexts/AuthContext';
import { gestorService } from '../../services/gestorService';
import { unwrapItems } from '../../types';
import {
  borderRadius,
  colors,
  fontWeight,
  shadows,
  spacing,
  textStyles,
} from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { confirmAction } from '../../utils/confirm';
import { webTitleProps } from '../../utils/webTitle';
import ActionTile from '../../components/ActionTile';

const GESTOR_COLOR = colors.roles.gestor;
const GESTOR_DARK  = colors.accent.dark;

const today = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ─── Metric Card ────────────────────────────────────────────────────────────

const MetricCard = ({ icon, label, value, loading, color }) => (
  <View
    style={metricStyles.card}
    accessible
    accessibilityLabel={`${label} hoje: ${value ?? 'indisponível'}`}
    {...webTitleProps(label)}>
    <View style={[metricStyles.square, { backgroundColor: color }]}>
      <Icon name={icon} size="lg" color="#FFFFFF" />
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={color} style={metricStyles.loading} />
    ) : (
      <Text style={metricStyles.value}>{value ?? '—'}</Text>
    )}
  </View>
);

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    ...shadows.sm,
  },
  square: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: { ...textStyles.h2, color: colors.text.primary },
  loading: { marginLeft: spacing.sm },
});

// ─── Stat Row ────────────────────────────────────────────────────────────────

const StatItem = ({ icon, color, label, value, loading }) => (
  <View
    style={statStyles.item}
    accessible
    accessibilityLabel={`${label}: ${value ?? 'indisponível'}`}
    {...webTitleProps(label)}>
    <Icon name={icon} size="lg" color={color} />
    {loading ? (
      <ActivityIndicator size="small" color={color} />
    ) : (
      <Text style={statStyles.value}>{value ?? '—'}</Text>
    )}
  </View>
);

const statStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  value: { ...textStyles.h4, color: colors.text.primary },
});

// ─── Status helpers ───────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardGestor = ({ navigation }) => {
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = () => {
    confirmAction({
      title: 'Sair',
      message: 'Deseja encerrar sua sessão?',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: () => logout(),
    });
  };

  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [counts, setCounts] = useState({
    viagens: null,
    motoristas: null,
    onibus: null,
    alunos: null,
  });

  const [relatorio, setRelatorio] = useState(null);
  const [recentes, setRecentes] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loadingOcorrencias, setLoadingOcorrencias] = useState(true);
  const [resolvendo, setResolvendo] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoadingCounts(true);
      setLoadingRelatorio(true);

      const dataHoje = today();
      const data7Dias = daysAgo(7);

      const [viagensHoje, motoristas, onibus, alunos, relatorioData] = await Promise.all([
        gestorService.listarViagens({ data_inicio: dataHoje, data_fim: dataHoje })
          .then(unwrapItems).catch(() => []),
        gestorService.listarMotoristas()
          .then(unwrapItems).catch(() => []),
        gestorService.listarOnibus()
          .then(unwrapItems).catch(() => []),
        gestorService.listarAlunos()
          .then(unwrapItems).catch(() => []),
        gestorService.obterRelatorio(data7Dias, dataHoje).catch(() => null),
      ]);

      setCounts({
        viagens: viagensHoje.length,
        motoristas: motoristas.length,
        onibus: onibus.length,
        alunos: alunos.length,
      });
      setRelatorio(relatorioData);
    } catch (e) {
      toast.error('Erro ao carregar dados do painel.');
    } finally {
      setLoadingCounts(false);
      setLoadingRelatorio(false);
    }
  }, []);

  const loadRecentes = useCallback(async () => {
    try {
      const viagens = await gestorService.listarViagens().then(unwrapItems).catch(() => []);
      setRecentes(
        viagens
          .sort((a, b) => new Date(b.data) - new Date(a.data))
          .slice(0, 5),
      );
    } catch {}
  }, []);

  const loadOcorrencias = useCallback(async () => {
    try {
      setLoadingOcorrencias(true);
      const data = await listarOcorrencias('ABERTA');
      setOcorrencias(Array.isArray(data) ? data : []);
    } catch {
      setOcorrencias([]);
    } finally {
      setLoadingOcorrencias(false);
    }
  }, []);

  const handleResolver = async (id) => {
    setResolvendo(id);
    try {
      await resolverOcorrencia(id);
      setOcorrencias((prev) => prev.filter((o) => o.id !== id));
      toast.success('Ocorrência resolvida!');
    } catch {
      toast.error('Não foi possível resolver a ocorrência.');
    } finally {
      setResolvendo(null);
    }
  };

  useEffect(() => {
    loadData();
    loadRecentes();
    loadOcorrencias();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadRecentes(), loadOcorrencias()]);
    setRefreshing(false);
  };

  const navigateToTab = (tabName) => {
    try {
      navigation.navigate(tabName);
    } catch {
      navigation.getParent?.()?.navigate(tabName);
    }
  };

  const getUserInitials = () => {
    const name = user?.nome ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'G';
  };

  const getMunicipio = () => {
    const m = user?.municipio;
    if (!m) return '';
    return m.uf ? `${m.nome} · ${m.uf}` : m.nome;
  };

  const formatDate = (ds) => {
    if (!ds) return '';
    const [y, mo, d] = ds.split('T')[0].split('-');
    return `${d}/${mo}/${y}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[GESTOR_COLOR]}
            tintColor={GESTOR_COLOR}
          />
        }>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Olá, {user?.nome?.split(' ')[0] ?? 'Gestor'}!</Text>
              <Text style={styles.headerSub}>
                {getMunicipio() ? `Gestor · ${getMunicipio()}` : 'Painel do Gestor'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.7}>
                <Icon name="logout" size="sm" color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.content}>

          {/* ── Métricas de hoje ──────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Hoje</Text>
          <View style={styles.metricsRow}>
            <MetricCard
              icon={IconNames.route}
              label="Viagens"
              value={counts.viagens}
              loading={loadingCounts}
              color={colors.solid.amber}
            />
            <MetricCard
              icon={IconNames.person}
              label="Motoristas"
              value={counts.motoristas}
              loading={loadingCounts}
              color={colors.solid.teal}
            />
          </View>
          <View style={[styles.metricsRow, { marginTop: spacing.sm }]}>
            <MetricCard
              icon={IconNames.group}
              label="Alunos"
              value={counts.alunos}
              loading={loadingCounts}
              color={colors.solid.green}
            />
            <MetricCard
              icon={IconNames.bus}
              label="Ônibus"
              value={counts.onibus}
              loading={loadingCounts}
              color={colors.solid.blue}
            />
          </View>

          {/* ── Relatório 7 dias ──────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Últimos 7 dias</Text>
          <View style={styles.relatorioCard}>
            <View style={styles.statsRow}>
              <StatItem
                icon={IconNames.checkCircle}
                color={colors.solid.green}
                label="Viagens realizadas"
                value={relatorio?.viagens_realizadas}
                loading={loadingRelatorio}
              />
              <StatItem
                icon={IconNames.group}
                color={colors.solid.blue}
                label="Alunos transportados"
                value={relatorio?.alunos_transportados}
                loading={loadingRelatorio}
              />
              <StatItem
                icon={IconNames.speed}
                color={colors.solid.teal}
                label="Km rodados"
                value={relatorio?.km_total_rodado != null
                  ? `${Number(relatorio.km_total_rodado).toFixed(0)} km`
                  : null}
                loading={loadingRelatorio}
              />
              <StatItem
                icon={IconNames.seat}
                color={colors.solid.amber}
                label="Vagas desperdiçadas"
                value={relatorio?.vagas_desperdicadas}
                loading={loadingRelatorio}
              />
            </View>
          </View>

          {/* ── Ações rápidas ─────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.qaGrid}>
            <ActionTile icon={IconNames.add} label="Nova viagem" color={colors.solid.amber} onPress={() => navigateToTab('ViagensTab')} />
            <ActionTile icon={IconNames.editCalendar} label="Gerar lote" color={colors.solid.amber} onPress={() => navigateToTab('ViagensTab')} />
            <ActionTile icon={IconNames.route} label="Nova rota" color={colors.solid.teal} onPress={() => navigateToTab('RotasTab')} />
            <ActionTile icon={IconNames.person} label="Motoristas" color={colors.solid.teal} onPress={() => navigateToTab('EquipeTab')} />
            <ActionTile icon={IconNames.bus} label="Frota" color={colors.solid.blue} onPress={() => navigateToTab('FrotaTab')} />
            <ActionTile icon={IconNames.group} label="Alunos" color={colors.solid.green} onPress={() => navigateToTab('EquipeTab')} />
          </View>

          {/* ── Viagens recentes ─────────────────────────────────────────── */}
          {recentes.length > 0 && (
            <>
              <View style={styles.recentesHeader}>
                <Text style={styles.sectionTitle}>Viagens recentes</Text>
                <TouchableOpacity onPress={() => navigateToTab('ViagensTab')}
                  accessibilityRole="button" accessibilityLabel="Ver todas as viagens">
                  <Text style={styles.verTodas}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              {recentes.map(v => {
                const cor = STATUS_COLOR[v.status] ?? colors.text.hint;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={styles.recenteCard}
                    onPress={() => navigateToTab('ViagensTab')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Viagem ${v.rota_nome ?? 'Rota'}, ${STATUS_LABEL[v.status] ?? v.status}`}>
                    <View style={styles.recenteLeft}>
                      <Text style={styles.recenteRota} numberOfLines={1}>
                        {v.rota_nome ?? 'Rota'}
                      </Text>
                      <Text style={styles.recenteData}>
                        {formatDate(v.data)}{v.horario_inicio ? ` · ${v.horario_inicio.substring(0, 5)}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cor + '20' }]}>
                      <Text style={[styles.statusText, { color: cor }]}>
                        {STATUS_LABEL[v.status] ?? v.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── Ocorrências abertas ───────────────────────────────────────── */}
          <View style={styles.recentesHeader}>
            <View style={styles.ocorrenciasHeaderLeft}>
              <Text style={styles.sectionTitle}>Ocorrências</Text>
              {!loadingOcorrencias && ocorrencias.length > 0 && (
                <View style={styles.ocorrenciaBadge}>
                  <Text style={styles.ocorrenciaBadgeText}>{ocorrencias.length}</Text>
                </View>
              )}
            </View>
          </View>

          {loadingOcorrencias ? (
            <ActivityIndicator size="small" color={GESTOR_COLOR} style={{ marginVertical: spacing.base }} />
          ) : ocorrencias.length === 0 ? (
            <View style={styles.ocorrenciasEmpty}>
              <Icon name={IconNames.checkCircle} size="lg" color={colors.success.main} />
              <Text style={styles.ocorrenciasEmptyText}>Nenhuma ocorrência aberta</Text>
            </View>
          ) : (
            ocorrencias.map((o) => {
              const TIPO_LABEL = {
                ATRASO: 'Atraso',
                SUPERLOTACAO: 'Superlotação',
                COMPORTAMENTO: 'Comportamento',
                CANCELAMENTO: 'Cancelamento',
                OUTRO: 'Outro',
              };
              return (
                <View key={o.id} style={styles.ocorrenciaCard}
                  accessible
                  accessibilityLabel={`Ocorrência ${TIPO_LABEL[o.tipo] ?? o.tipo} de ${o.autor_nome}`}>
                  <View style={styles.ocorrenciaHeader}>
                    <View style={[styles.ocorrenciaTipoBadge]}>
                      <Text style={styles.ocorrenciaTipoText}>{TIPO_LABEL[o.tipo] ?? o.tipo}</Text>
                    </View>
                    <Text style={styles.ocorrenciaAutor}>{o.autor_nome}</Text>
                  </View>
                  {o.descricao ? (
                    <Text style={styles.ocorrenciaDescricao} numberOfLines={2}>{o.descricao}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.resolverBtn, resolvendo === o.id && styles.resolverBtnDisabled]}
                    onPress={() => handleResolver(o.id)}
                    disabled={resolvendo === o.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Marcar ocorrência de ${o.autor_nome} como resolvida`}>
                    {resolvendo === o.id ? (
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                      <>
                        <Icon name={IconNames.checkCircle} size="sm" color={colors.text.inverse} />
                        <Text style={styles.resolverBtnText}>Resolver</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          <View style={{ height: spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scroll: { flex: 1 },
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...textStyles.h2,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  headerSub: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xxs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...textStyles.h4,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.base,
    marginTop: -spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.base,
  },
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  relatorioCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    ...shadows.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    rowGap: spacing.lg,
  },
  recentesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.base,
  },
  verTodas: {
    ...textStyles.bodySmall,
    color: GESTOR_COLOR,
    fontWeight: fontWeight.semiBold,
  },
  recenteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  recenteLeft: { flex: 1, marginRight: spacing.md },
  recenteRota: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  recenteData: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: fontWeight.semiBold,
  },

  // Ocorrências
  ocorrenciasHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ocorrenciaBadge: {
    backgroundColor: colors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginTop: spacing.base,
  },
  ocorrenciaBadgeText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: '700',
  },
  ocorrenciasEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ocorrenciasEmptyText: {
    ...textStyles.body,
    color: colors.success.dark,
  },
  ocorrenciaCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
    ...shadows.xs,
  },
  ocorrenciaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  ocorrenciaTipoBadge: {
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ocorrenciaTipoText: {
    ...textStyles.caption,
    color: colors.warning.dark,
    fontWeight: '700',
  },
  ocorrenciaAutor: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  ocorrenciaDescricao: {
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  resolverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-end',
    minHeight: 36,
  },
  resolverBtnDisabled: { opacity: 0.6 },
  resolverBtnText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: '700',
  },
});

export default DashboardGestor;
