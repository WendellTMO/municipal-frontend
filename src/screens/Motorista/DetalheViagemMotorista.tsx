/**
 * DetalheViagemMotorista — Trip details for the driver (read-only view).
 *
 * What it shows:
 *  - Trip summary: type, scheduled time, status badge
 *  - Origin → destination
 *  - Confirmed students count + capacity bar + link to full list
 *  - Static map of the route stops (visualization only)
 *  - Ordered list of route stops
 *  - "Iniciar Viagem" CTA when status is AGENDADA
 *
 * What was removed:
 *  - "Configurações da Rota / Definir Pontos da Rota" — drivers do not manage routes
 *  - "Ver Rota Otimizada" — screen was empty and unused
 *  - RouteMap with onPontoChegado — navigation is in InicioFimViagem, not here
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { StaticRouteMap } from '../../features/map/index';
import { motoristaService } from '../../services/motoristaService';
import { useAuth } from '../../contexts/AuthContext';
import { unwrapItems } from '../../types';
import type { PontoFlatResponse } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import { horaCurta } from '../../utils/viagemPainel';
import { formatarSentido } from '../../utils/formatarSentido';

type RootParamList = Record<string, object | undefined>;
type Props = {
  navigation: NativeStackNavigationProp<RootParamList>;
  route: RouteProp<{ DetalheViagemMotorista: { viagem: Record<string, unknown> } }, 'DetalheViagemMotorista'>;
};

/** Backend status enum → display label + color */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AGENDADA:     { label: 'A iniciar',     color: colors.warning.dark,   bg: colors.warning.light },
  EM_ANDAMENTO: { label: 'Em andamento',  color: colors.primary.dark,   bg: colors.info.light },
  FINALIZADA:   { label: 'Finalizada',    color: colors.success.dark,   bg: colors.success.light },
  CANCELADA:    { label: 'Cancelada',     color: colors.error.dark,     bg: colors.error.light },
};

const DetalheViagemMotorista: React.FC<Props> = ({ navigation, route: navRoute }) => {
  const viagem = (navRoute?.params?.viagem ?? {}) as Record<string, unknown>;
  const { user } = useAuth();
  const isMotorista = user?.role?.toLowerCase() === 'motorista';

  const [pontosRota, setPontosRota] = useState<PontoFlatResponse[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const buscarPontos = async () => {
      const rotaId = viagem?.rota_id as string | undefined;
      if (!rotaId) return;
      try {
        setCarregando(true);
        const resp = await motoristaService.listarPontosRota(rotaId);
        const items = unwrapItems(resp) as PontoFlatResponse[];
        if (items.length > 0) setPontosRota(items);
      } catch {
        // keep empty list; map won't render
      } finally {
        setCarregando(false);
      }
    };
    buscarPontos();
  }, [viagem?.rota_id]);

  if (!viagem?.id) {
    return (
      <TelaSegura style={styles.container}>
        <SubHeader titulo="Detalhes da Viagem" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Icon name={IconNames.warning} size="xxl" color={colors.warning.main} />
          <Text style={styles.emptyText}>Dados da viagem não disponíveis</Text>
        </View>
      </TelaSegura>
    );
  }

  const status = (viagem.status as string) ?? 'AGENDADA';
  const statusCfg = STATUS_CONFIG[status] ?? { label: status, color: colors.text.hint, bg: colors.background.default };

  const totalAlunos = (viagem.total_alunos as number) ?? 0;
  const alunosConfirmados = (viagem.alunos_confirmados_count as number) ?? 0;
  const capacidadePercent = totalAlunos > 0 ? (alunosConfirmados / totalAlunos) * 100 : 0;

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Detalhes da Viagem" subtitulo={`${formatarSentido(viagem.tipo as string)} · ${horaCurta(viagem.horario_inicio as string)}`} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Summary card */}
          <View style={styles.card}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.viagemTipo}>{formatarSentido(viagem.tipo as string)}</Text>
                <Text style={styles.viagemHorario}>{horaCurta(viagem.horario_inicio as string)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
              </View>
            </View>

            <View style={styles.rotaInfo}>
              <View style={styles.pontoRota}>
                <View style={[styles.pontoIconWrap, { backgroundColor: colors.success.light }]}>
                  <Icon name={IconNames.location} size="md" color={colors.success.dark} />
                </View>
                <View style={styles.pontoInfo}>
                  <Text style={styles.pontoLabel}>Origem</Text>
                  <Text style={styles.pontoNome}>{viagem.origem as string}</Text>
                </View>
              </View>
              <View style={styles.linhaRota} />
              <View style={styles.pontoRota}>
                <View style={[styles.pontoIconWrap, { backgroundColor: colors.error.light }]}>
                  <Icon name={IconNames.flag} size="md" color={colors.error.dark} />
                </View>
                <View style={styles.pontoInfo}>
                  <Text style={styles.pontoLabel}>Destino</Text>
                  <Text style={styles.pontoNome}>{viagem.destino as string}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Students card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Alunos Confirmados</Text>
            <Text style={styles.alunosText}>
              {alunosConfirmados} de {totalAlunos} alunos confirmados
            </Text>
            {totalAlunos > 0 ? (
              <View style={styles.capacidadeBar}>
                <View
                  style={[
                    styles.capacidadeBarFill,
                    { width: `${capacidadePercent}%` as `${number}%` },
                    capacidadePercent >= 90 && { backgroundColor: colors.warning.main },
                  ]}
                />
              </View>
            ) : (
              <Text style={styles.emptyHint}>Nenhum aluno inscrito nesta rota</Text>
            )}
            <TouchableOpacity
              style={styles.verAlunosButton}
              onPress={() => navigation.navigate('ListaAlunosConfirmados', { viagem })}
              accessibilityRole="button"
              accessibilityLabel="Ver lista completa de alunos">
              <Icon name={IconNames.group} size="sm" color={colors.text.inverse} />
              <Text style={styles.verAlunosButtonText}>Ver Lista Completa</Text>
            </TouchableOpacity>
          </View>

          {/* Static map */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mapa da Rota</Text>
            {carregando ? (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator color={colors.primary.main} />
              </View>
            ) : pontosRota.length >= 2 ? (
              <StaticRouteMap pontosRota={pontosRota} />
            ) : (
              <View style={styles.mapPlaceholder}>
                <Icon name={IconNames.route} size="xl" color={colors.border.main} />
                <Text style={styles.emptyHint}>
                  {pontosRota.length === 0 ? 'Nenhum ponto cadastrado' : 'Adicione ao menos 2 pontos para ver o mapa'}
                </Text>
              </View>
            )}
          </View>

          {/* Stops list */}
          {pontosRota.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Paradas ({pontosRota.length})</Text>
              {pontosRota.map((ponto, index) => (
                <View key={ponto.id ?? index} style={styles.stopItem}>
                  <View style={styles.stopLeft}>
                    <View
                      style={[
                        styles.stopDot,
                        index === 0 && styles.stopDotFirst,
                        index === pontosRota.length - 1 && styles.stopDotLast,
                      ]}>
                      <Text style={styles.stopDotText}>{index + 1}</Text>
                    </View>
                    {index < pontosRota.length - 1 && <View style={styles.stopLine} />}
                  </View>
                  <View style={styles.stopRight}>
                    <Text style={styles.stopName}>{ponto.apelido ?? `Ponto ${index + 1}`}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Roteiro antes de iniciar: paradas e alunos confirmados */}
          {isMotorista && status === 'AGENDADA' && pontosRota.length > 0 && (
            <TouchableOpacity
              style={[styles.iniciarButton, { backgroundColor: colors.solid.teal }]}
              onPress={() => navigation.navigate('RoteiroViagem', { viagem, pontosRota })}
              accessibilityRole="button"
              accessibilityLabel="Ver roteiro">
              <Icon name={IconNames.route} size="lg" color={colors.text.inverse} />
              <Text style={styles.iniciarButtonText}>Roteiro</Text>
            </TouchableOpacity>
          )}

          {/* Iniciar CTA — only for motoristas when trip hasn't started yet */}
          {isMotorista && status === 'AGENDADA' && (
            <TouchableOpacity
              style={styles.iniciarButton}
              onPress={() => navigation.navigate('InicioFimViagem', { viagem })}
              accessibilityRole="button"
              accessibilityLabel="Iniciar viagem">
              <Icon name={IconNames.play} size="lg" color={colors.text.inverse} />
              <Text style={styles.iniciarButtonText}>Iniciar Viagem</Text>
            </TouchableOpacity>
          )}

          {/* Resume trip CTA — only for motoristas when already in progress */}
          {isMotorista && status === 'EM_ANDAMENTO' && (
            <TouchableOpacity
              style={[styles.iniciarButton, { backgroundColor: colors.success.dark }]}
              onPress={() => navigation.navigate('InicioFimViagem', { viagem })}
              accessibilityRole="button"
              accessibilityLabel="Retornar ao painel da viagem">
              <Icon name={IconNames.route} size="lg" color={colors.text.inverse} />
              <Text style={styles.iniciarButtonText}>Painel da Viagem</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </TelaSegura>
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
  headerTitleContainer: { flex: 1, marginLeft: spacing.md },
  title: { ...textStyles.h3, color: colors.primary.contrast },
  headerSubtitle: { ...textStyles.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyText: { ...textStyles.h4, color: colors.text.secondary },

  scrollView: { flex: 1 },
  content: { padding: spacing.base },

  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardTitle: { ...textStyles.h4, color: colors.text.primary, marginBottom: spacing.md },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  viagemTipo: { ...textStyles.body, color: colors.primary.dark, fontWeight: '600' as const, marginBottom: spacing.xs },
  viagemHorario: { ...textStyles.h1, color: colors.text.primary },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  statusText: { ...textStyles.caption, fontWeight: '600' as const },

  rotaInfo: { gap: spacing.sm },
  pontoRota: { flexDirection: 'row', alignItems: 'center' },
  pontoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  pontoInfo: { flex: 1 },
  pontoLabel: { ...textStyles.caption, color: colors.text.secondary, marginBottom: spacing.xxs },
  pontoNome: { ...textStyles.body, fontWeight: '600' as const, color: colors.text.primary },
  linhaRota: {
    width: 2,
    height: spacing.lg,
    backgroundColor: colors.border.light,
    marginLeft: spacing.lg,
    marginVertical: spacing.xs,
  },

  alunosText: { ...textStyles.bodySmall, color: colors.text.secondary, marginBottom: spacing.sm },
  capacidadeBar: {
    height: 8,
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  capacidadeBarFill: {
    height: '100%',
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.xs,
  },
  emptyHint: { ...textStyles.bodySmall, color: colors.text.hint, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.md },
  verAlunosButton: {
    backgroundColor: colors.primary.dark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.xs,
  },
  verAlunosButtonText: { ...textStyles.buttonSmall, color: colors.text.inverse },

  mapPlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },

  // Stops list
  stopItem: { flexDirection: 'row', alignItems: 'flex-start' },
  stopLeft: { width: 40, alignItems: 'center' },
  stopDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopDotFirst: { backgroundColor: colors.success.main },
  stopDotLast: { backgroundColor: colors.error.main },
  stopDotText: { ...textStyles.caption, color: '#fff', fontWeight: 'bold' as const },
  stopLine: {
    width: 2,
    height: spacing.xxl,
    backgroundColor: colors.border.light,
    marginTop: spacing.xs,
  },
  stopRight: { flex: 1, marginLeft: spacing.sm, paddingBottom: spacing.lg },
  stopName: { ...textStyles.body, color: colors.text.primary, paddingTop: spacing.xs },

  iniciarButton: {
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    minHeight: 60,
    ...shadows.md,
  },
  iniciarButtonText: { ...textStyles.button, color: colors.text.inverse, fontSize: fontSize.h4 },
});

export default DetalheViagemMotorista;
