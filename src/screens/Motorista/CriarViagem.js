import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { motoristaService } from '../../services/motoristaService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';

const isWeb = Platform.OS === 'web';

const DIAS_ORDER = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const DIAS_SHORT = { SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sáb', DOM: 'Dom' };
const SENTIDO_LABEL = { IDA: 'Ida', VOLTA: 'Volta', CIRCULAR: 'Circular' };
const SENTIDO_COLOR = {
  IDA: colors.info.main,
  VOLTA: colors.warning.main,
  CIRCULAR: colors.success.main,
};

const formatDias = (dias) => {
  if (!dias || dias.length === 0) return '—';
  const sorted = [...dias].sort((a, b) => DIAS_ORDER.indexOf(a) - DIAS_ORDER.indexOf(b));
  if (dias.length === 7) return 'Todos os dias';
  if (dias.length === 5 && !dias.includes('SAB') && !dias.includes('DOM')) return 'Seg a Sex';
  if (dias.length === 2 && dias.includes('SAB') && dias.includes('DOM')) return 'Fim de semana';
  return sorted.map(d => DIAS_SHORT[d] || d).join(', ');
};

const CriarViagem = ({ navigation, route }) => {
  const { user } = useAuth();
  const toast = useToast();
  const rotaParam = route?.params?.rota;

  const [rotas, setRotas] = useState([]);
  const [rotaSelecionada, setRotaSelecionada] = useState(rotaParam?.id || null);
  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRotas, setLoadingRotas] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [motoristas, setMotoristas] = useState([]);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);
  const [loadingMotoristas, setLoadingMotoristas] = useState(true);

  useEffect(() => {
    const loadDadosIniciais = async () => {
      try {
        const [rotasData, motoristasData] = await Promise.all([
          motoristaService.listarRotas().then(unwrapItems),
          motoristaService.listarMotoristas().then(unwrapItems),
        ]);

        const rotasList = rotasData || [];
        setRotas(rotasList);
        setMotoristas(motoristasData || []);

        if (rotaParam && rotasList.find(r => r.id === rotaParam.id)) {
          setRotaSelecionada(rotaParam.id);
          // Pre-select default motorista from route
          const rota = rotasList.find(r => r.id === rotaParam.id);
          if (rota?.motorista_id) setMotoristaSelecionado(rota.motorista_id);
        }
      } catch {
        toast.error('Não foi possível carregar os dados.');
      } finally {
        setLoadingRotas(false);
        setLoadingMotoristas(false);
      }
    };

    loadDadosIniciais();
  }, []);

  // When route changes, pre-select default motorista and load schedules
  useEffect(() => {
    if (!rotaSelecionada) {
      setHorarios([]);
      setHorarioSelecionado(null);
      return;
    }

    const rota = rotas.find(r => r.id === rotaSelecionada);
    if (rota?.motorista_id && !motoristaSelecionado) {
      setMotoristaSelecionado(rota.motorista_id);
    }

    const loadHorarios = async () => {
      try {
        setLoadingHorarios(true);
        const horariosData = await motoristaService.listarHorariosRota(rotaSelecionada).then(unwrapItems);
        setHorarios(horariosData || []);
        setHorarioSelecionado(null);
      } catch {
        setHorarios([]);
      } finally {
        setLoadingHorarios(false);
      }
    };

    loadHorarios();
  }, [rotaSelecionada]);

  const formatDateToString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDateOffset = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return formatDateToString(d);
  };

  const getTodayDate = () => formatDateToString(new Date());

  const handleCriarViagem = async () => {
    if (!rotaSelecionada) { toast.error('Selecione uma rota'); return; }
    if (!motoristaSelecionado) { toast.error('Selecione um motorista'); return; }
    if (!data.trim()) { toast.error('Informe a data da viagem'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      toast.error('Formato de data inválido. Use YYYY-MM-DD');
      return;
    }
    if (!horarioSelecionado && horarios.length > 0) {
      toast.error('Selecione um horário');
      return;
    }

    try {
      setLoading(true);
      await motoristaService.criarViagem({
        rota_id: rotaSelecionada,
        motorista_id: motoristaSelecionado,
        data: data.trim(),
        horario_id: horarioSelecionado || undefined,
      });
      toast.success('Viagem criada com sucesso!');
      navigation.goBack();
    } catch (error) {
      toast.error(error?.message || 'Não foi possível criar a viagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const rotaSelecionadaObj = rotas.find(r => r.id === rotaSelecionada);

  if (loadingRotas) {
    return (
      <SafeAreaView style={styles.container}>
        <SubHeader titulo="Nova Viagem" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.dark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader titulo="Nova Viagem" subtitulo="Configure os detalhes da viagem" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>

          {/* ── Rota ───────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rota *</Text>
            {rotas.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhuma rota cadastrada</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('CriarRota')}>
                  <Text style={styles.emptyButtonText}>Criar Rota</Text>
                </TouchableOpacity>
              </View>
            ) : (
              rotas.map(rota => {
                const selected = rotaSelecionada === rota.id;
                return (
                  <TouchableOpacity
                    key={rota.id}
                    style={[styles.listItem, selected && styles.listItemSelected]}
                    onPress={() => {
                      setRotaSelecionada(rota.id);
                      setMotoristaSelecionado(rota.motorista_id || null);
                    }}>
                    <View style={styles.listItemContent}>
                      <View style={[styles.listItemIcon, selected && styles.listItemIconSelected]}>
                        <Icon name={IconNames.route} size="sm" color={selected ? colors.primary.dark : colors.text.secondary} />
                      </View>
                      <View style={styles.listItemText}>
                        <Text style={[styles.listItemLabel, selected && styles.listItemLabelSelected]} numberOfLines={1}>
                          {rota.nome}
                        </Text>
                      </View>
                    </View>
                    {selected && <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Horário ─────────────────────────────────────────────────── */}
          {rotaSelecionada && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horário de Operação</Text>
              {loadingHorarios ? (
                <ActivityIndicator size="small" color={colors.primary.dark} style={{ marginTop: spacing.sm }} />
              ) : horarios.length === 0 ? (
                <View style={styles.infoBox}>
                  <Icon name={IconNames.info} size="sm" color={colors.info.main} />
                  <Text style={styles.infoText}>
                    Esta rota não possui horários. A viagem será criada sem horário fixo.
                  </Text>
                </View>
              ) : (
                horarios.map(horario => {
                  const selected = horarioSelecionado === horario.id;
                  const dias = (horario.dias || []).map(d => (typeof d === 'object' ? d.dia : d));
                  const diasLabel = formatDias(dias);
                  const sentidoColor = SENTIDO_COLOR[horario.sentido] || colors.neutral[400];
                  return (
                    <TouchableOpacity
                      key={horario.id}
                      style={[styles.horarioItem, selected && styles.horarioItemSelected]}
                      onPress={() => setHorarioSelecionado(selected ? null : horario.id)}>
                      <View style={styles.horarioItemLeft}>
                        <Text style={[styles.horarioTime, selected && styles.horarioTimeSelected]}>
                          {horario.horario_saida}
                        </Text>
                        <View style={styles.horarioMeta}>
                          <View style={[styles.sentidoTag, { backgroundColor: sentidoColor }]}>
                            <Text style={styles.sentidoTagText}>
                              {SENTIDO_LABEL[horario.sentido] || horario.sentido}
                            </Text>
                          </View>
                          <Text style={[styles.diasLabel, selected && styles.diasLabelSelected]}>
                            {diasLabel}
                          </Text>
                        </View>
                        {/* Day chips */}
                        <View style={styles.diasChipsRow}>
                          {DIAS_ORDER.map(d => {
                            const active = dias.includes(d);
                            return (
                              <View
                                key={d}
                                style={[
                                  styles.diaChip,
                                  active ? styles.diaChipActive : styles.diaChipInactive,
                                ]}>
                                <Text style={[styles.diaChipText, active ? styles.diaChipTextActive : styles.diaChipTextInactive]}>
                                  {DIAS_SHORT[d]}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                      {selected && (
                        <View style={styles.horarioCheck}>
                          <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* ── Data ───────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data da Viagem *</Text>
            <View style={styles.quickDatesRow}>
              {[
                { label: 'Hoje', offset: 0 },
                { label: 'Amanhã', offset: 1 },
                { label: '+2 dias', offset: 2 },
                { label: '+1 semana', offset: 7 },
              ].map(({ label, offset }) => {
                const val = getDateOffset(offset);
                const selected = data === val;
                return (
                  <TouchableOpacity
                    key={offset}
                    style={[styles.quickDateBtn, selected && styles.quickDateBtnSelected]}
                    onPress={() => setData(val)}>
                    <Text style={[styles.quickDateText, selected && styles.quickDateTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isWeb ? (
              <input
                type="date"
                value={data}
                min={getTodayDate()}
                onChange={e => setData(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%', padding: 16, fontSize: 16,
                  borderRadius: 8, border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.background.default, color: colors.text.primary,
                  fontFamily: 'inherit', marginTop: 8,
                }}
              />
            ) : (
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.hint}
                value={data}
                onChangeText={setData}
                editable={!loading}
                keyboardType="numbers-and-punctuation"
              />
            )}

            {data ? (
              <Text style={styles.selectedDateText}>
                {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            ) : null}
          </View>

          {/* ── Motorista ──────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motorista *</Text>
            {rotaSelecionadaObj?.motorista_id && (
              <View style={styles.infoBox}>
                <Icon name={IconNames.info} size="sm" color={colors.info.main} />
                <Text style={styles.infoText}>
                  O motorista padrão da rota foi pré-selecionado. Você pode alterar abaixo.
                </Text>
              </View>
            )}
            {loadingMotoristas ? (
              <ActivityIndicator size="small" color={colors.primary.dark} style={{ marginTop: spacing.sm }} />
            ) : (
              motoristas.map(mot => {
                const selected = motoristaSelecionado === mot.id;
                return (
                  <TouchableOpacity
                    key={mot.id}
                    style={[styles.listItem, selected && styles.listItemSelected]}
                    onPress={() => setMotoristaSelecionado(mot.id)}>
                    <View style={styles.listItemContent}>
                      <View style={[styles.listItemIcon, selected && styles.listItemIconSelected]}>
                        <Icon name={IconNames.person} size="sm" color={selected ? colors.primary.dark : colors.text.secondary} />
                      </View>
                      <View style={styles.listItemText}>
                        <Text style={[styles.listItemLabel, selected && styles.listItemLabelSelected]}>
                          {mot.nome}
                        </Text>
                        {mot.cnh && (
                          <Text style={styles.listItemSub}>CNH: {mot.cnh}</Text>
                        )}
                      </View>
                    </View>
                    {selected && <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (loading || !rotaSelecionada || !motoristaSelecionado || !data) && styles.submitBtnDisabled,
            ]}
            onPress={handleCriarViagem}
            disabled={loading || !rotaSelecionada || !motoristaSelecionado || !data}>
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.submitBtnText}>Criar Viagem</Text>
            )}
          </TouchableOpacity>
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
    width: 40, height: 40, borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main, justifyContent: 'center', alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: spacing.md },
  title: { ...textStyles.h3, color: colors.primary.contrast },
  subtitle: { ...textStyles.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs },
  headerIcon: {
    width: 44, height: 44, borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main, justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...textStyles.inputLabel, color: colors.text.primary,
    marginBottom: spacing.sm, fontWeight: fontWeight.semiBold,
  },

  // List-style selector
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.xs, borderWidth: 1.5, borderColor: colors.border.light,
    ...shadows.xs,
  },
  listItemSelected: { borderColor: colors.primary.dark, backgroundColor: colors.info.light },
  listItemContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listItemIcon: {
    width: 32, height: 32, borderRadius: borderRadius.sm,
    backgroundColor: colors.background.default,
    justifyContent: 'center', alignItems: 'center',
  },
  listItemIconSelected: { backgroundColor: colors.primary.light },
  listItemText: { flex: 1 },
  listItemLabel: { ...textStyles.body, color: colors.text.primary, fontWeight: fontWeight.medium },
  listItemLabelSelected: { color: colors.primary.dark, fontWeight: fontWeight.semiBold },
  listItemSub: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },

  // Schedule item
  horarioItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.border.light,
    ...shadows.xs,
  },
  horarioItemSelected: { borderColor: colors.primary.dark, backgroundColor: colors.info.light },
  horarioItemLeft: { flex: 1 },
  horarioTime: {
    fontSize: fontSize.h4, fontWeight: fontWeight.bold, color: colors.text.primary, marginBottom: 4,
  },
  horarioTimeSelected: { color: colors.primary.dark },
  horarioMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  sentidoTag: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  sentidoTagText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  diasLabel: { ...textStyles.caption, color: colors.text.secondary, fontWeight: fontWeight.medium },
  diasLabelSelected: { color: colors.primary.main },
  diasChipsRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  diaChip: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  diaChipActive: { backgroundColor: colors.primary.dark },
  diaChipInactive: { backgroundColor: colors.background.default, borderWidth: 1, borderColor: colors.border.light },
  diaChipText: { fontSize: 9, fontWeight: '600' },
  diaChipTextActive: { color: '#fff' },
  diaChipTextInactive: { color: colors.text.hint },
  horarioCheck: { marginLeft: spacing.sm },

  // Date
  quickDatesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md,
  },
  quickDateBtn: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  quickDateBtnSelected: { borderColor: colors.primary.dark, backgroundColor: colors.primary.dark },
  quickDateText: { ...textStyles.bodySmall, color: colors.text.secondary, fontWeight: fontWeight.medium },
  quickDateTextSelected: { color: colors.text.inverse },
  dateInput: {
    backgroundColor: colors.background.paper, borderRadius: borderRadius.md,
    padding: spacing.md, ...textStyles.inputText, borderWidth: 1, borderColor: colors.border.light,
    color: colors.text.primary,
  },
  selectedDateText: {
    ...textStyles.bodySmall, color: colors.success.main, marginTop: spacing.sm,
    fontWeight: fontWeight.medium,
  },

  // Info/empty
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.info.light, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.info.main,
  },
  infoText: { ...textStyles.bodySmall, color: colors.info.dark, flex: 1 },
  emptyState: {
    alignItems: 'center', padding: spacing.xl,
    backgroundColor: colors.background.paper, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border.light,
  },
  emptyText: { ...textStyles.bodySmall, color: colors.text.secondary, marginBottom: spacing.md },
  emptyButton: {
    backgroundColor: colors.primary.dark, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  emptyButtonText: { ...textStyles.button, color: colors.text.inverse },

  // Submit
  submitBtn: {
    backgroundColor: colors.success.main, borderRadius: borderRadius.md,
    padding: spacing.base, alignItems: 'center', marginTop: spacing.sm, ...shadows.sm,
  },
  submitBtnDisabled: { backgroundColor: colors.success.light },
  submitBtnText: {
    ...textStyles.button, color: colors.text.inverse,
    fontSize: fontSize.h4, fontWeight: fontWeight.bold,
  },
});

export default CriarViagem;
