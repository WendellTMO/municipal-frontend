import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { motoristaService } from '../../services/motoristaService';
import { gestorService } from '../../services/gestorService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, spacing, borderRadius, shadows, textStyles, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';

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

const DiaChip = ({ dia, active }) => (
  <View style={[chipStyles.chip, active ? chipStyles.chipActive : chipStyles.chipInactive]}>
    <Text style={[chipStyles.chipText, active ? chipStyles.chipTextActive : chipStyles.chipTextInactive]}>
      {DIAS_SHORT[dia] || dia}
    </Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 3,
  },
  chipActive: { backgroundColor: colors.primary.dark },
  chipInactive: { backgroundColor: colors.background.default, borderWidth: 1, borderColor: colors.border.light },
  chipText: { fontSize: 10, fontWeight: '600' },
  chipTextActive: { color: colors.primary.contrast },
  chipTextInactive: { color: colors.text.hint },
});

const RotaMotorista = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();
  const isGestor = user?.role?.toLowerCase() === 'gestor';

  const [rotas, setRotas] = useState([]);
  const [motoristasMap, setMotoristasMap] = useState({});
  const [onibusMap, setOnibusMap] = useState({});
  const [horariosMap, setHorariosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assignment modal state
  const [modalRota, setModalRota] = useState(null);
  const [modalMotorista, setModalMotorista] = useState(null);
  const [modalVeiculo, setModalVeiculo] = useState(null);
  const [allMotoristas, setAllMotoristas] = useState([]);
  const [allOnibus, setAllOnibus] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [rotasData, motoristasData, onibusData] = await Promise.all([
        motoristaService.listarRotas().then(unwrapItems),
        motoristaService.listarMotoristas().then(unwrapItems).catch(() => []),
        isGestor ? gestorService.listarOnibus().then(unwrapItems).catch(() => []) : Promise.resolve([]),
      ]);

      const rotasList = rotasData || [];
      setRotas(rotasList);

      const mMap = Object.fromEntries((motoristasData || []).map(m => [m.id, m]));
      const oMap = Object.fromEntries((onibusData || []).map(o => [o.id, o]));
      setMotoristasMap(mMap);
      setOnibusMap(oMap);
      setAllMotoristas(motoristasData || []);
      setAllOnibus(onibusData || []);

      if (rotasList.length > 0) {
        const entries = await Promise.all(
          rotasList.map(async (r) => {
            try {
              const hrs = await motoristaService.listarHorariosRota(r.id).then(unwrapItems);
              return [r.id, hrs || []];
            } catch {
              return [r.id, []];
            }
          }),
        );
        setHorariosMap(Object.fromEntries(entries));
      }
    } catch {
      toast.error('Não foi possível carregar as rotas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGestor]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const openModal = (rota) => {
    setModalRota(rota);
    setModalMotorista(rota.motorista_id || null);
    setModalVeiculo(rota.veiculo_id || null);
  };

  const handleSalvarAtribuicao = async () => {
    if (!modalRota) return;
    setSaving(true);
    try {
      await motoristaService.atualizarRota(modalRota.id, {
        nome: modalRota.nome,
        motorista_padrao_id: modalMotorista,
        veiculo_padrao_id: modalVeiculo,
      });
      toast.success('Atribuições salvas!');
      setModalRota(null);
      loadData();
    } catch (e) {
      toast.error(e?.message || 'Erro ao salvar atribuições.');
    } finally {
      setSaving(false);
    }
  };

  const renderHorarios = (rotaId) => {
    const horarios = horariosMap[rotaId] || [];
    if (horarios.length === 0) {
      return (
        <View style={styles.noHorarios}>
          <Icon name={IconNames.info} size="sm" color={colors.text.hint} />
          <Text style={styles.noHorariosText}>Sem horários definidos</Text>
        </View>
      );
    }

    return horarios.map((h, i) => {
      const dias = (h.dias || []).map(d => (typeof d === 'object' ? d.dia : d));
      const allDays = DIAS_ORDER;
      return (
        <View key={h.id || i} style={styles.horarioRow}>
          <View style={[styles.sentidoDot, { backgroundColor: SENTIDO_COLOR[h.sentido] || colors.neutral[400] }]} />
          <Text style={styles.horarioTime}>{h.horario_saida}</Text>
          <View style={[styles.sentidoBadge, { backgroundColor: SENTIDO_COLOR[h.sentido] || colors.neutral[300] }]}>
            <Text style={styles.sentidoBadgeText}>{SENTIDO_LABEL[h.sentido] || h.sentido}</Text>
          </View>
          <View style={styles.diasChips}>
            {allDays.map(d => (
              <DiaChip key={d} dia={d} active={dias.includes(d)} />
            ))}
          </View>
        </View>
      );
    });
  };

  const renderRotaCard = (rota) => {
    const motorista = motoristasMap[rota.motorista_id];
    const veiculo = onibusMap[rota.veiculo_id];

    return (
      <View key={rota.id} style={styles.rotaCard}>
        {/* Card Header */}
        <View style={styles.rotaCardHeader}>
          <View style={styles.rotaCardTitleRow}>
            <View style={styles.rotaIconBadge}>
              <Icon name={IconNames.route} size="sm" color={colors.primary.dark} />
            </View>
            <Text style={styles.rotaNome} numberOfLines={2}>{rota.nome}</Text>
          </View>
          {isGestor && (
            <TouchableOpacity style={styles.editButton} onPress={() => openModal(rota)}>
              <Icon name={IconNames.edit} size="sm" color={colors.primary.dark} />
            </TouchableOpacity>
          )}
        </View>

        {/* Motorista + Veículo row */}
        <View style={styles.assignmentRow}>
          <View style={styles.assignmentItem}>
            <Icon name={IconNames.person} size="sm" color={colors.text.secondary} />
            {motorista ? (
              <Text style={styles.assignmentText} numberOfLines={1}>{motorista.nome}</Text>
            ) : (
              <Text style={styles.assignmentEmpty}>Sem motorista</Text>
            )}
          </View>
          <View style={styles.assignmentDivider} />
          <View style={styles.assignmentItem}>
            <Icon name={IconNames.bus} size="sm" color={colors.text.secondary} />
            {veiculo ? (
              <Text style={styles.assignmentText} numberOfLines={1}>
                {veiculo.placa}{veiculo.modelo ? ` · ${veiculo.modelo}` : ''}
              </Text>
            ) : (
              <Text style={styles.assignmentEmpty}>Sem veículo</Text>
            )}
          </View>
        </View>

        {/* Horários */}
        <View style={styles.horariosSection}>
          <Text style={styles.horariosSectionTitle}>Horários de Operação</Text>
          {renderHorarios(rota.id)}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ListaViagens', { rota })}>
            <Icon name={IconNames.schedule} size="sm" color={colors.text.inverse} />
            <Text style={styles.actionBtnText}>Viagens</Text>
          </TouchableOpacity>

          {isGestor && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => navigation.navigate('DefinirPontosRota', { rota, isNovaRota: false })}>
                <Icon name={IconNames.location} size="sm" color={colors.text.inverse} />
                <Text style={styles.actionBtnText}>Pontos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnTertiary]}
                onPress={() => navigation.navigate('DefinirHorariosRota', { rota, isNovaRota: false })}>
                <Icon name={IconNames.schedule} size="sm" color={colors.text.inverse} />
                <Text style={styles.actionBtnText}>Horários</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSuccess]}
                onPress={() => navigation.navigate('CriarViagem', { rota })}>
                <Icon name={IconNames.add} size="sm" color={colors.text.inverse} />
                <Text style={styles.actionBtnText}>Nova Viagem</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // ── Assignment Modal ──────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal
      visible={!!modalRota}
      transparent
      animationType="slide"
      onRequestClose={() => setModalRota(null)}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Atribuições</Text>
          <Text style={modalStyles.subtitle} numberOfLines={1}>{modalRota?.nome}</Text>

          <ScrollView style={modalStyles.scroll} keyboardShouldPersistTaps="handled">
            {/* Motorista picker */}
            <Text style={modalStyles.sectionLabel}>Motorista Responsável</Text>
            <TouchableOpacity
              style={[modalStyles.optionItem, modalMotorista === null && modalStyles.optionItemSelected]}
              onPress={() => setModalMotorista(null)}>
              <Text style={[modalStyles.optionText, modalMotorista === null && modalStyles.optionTextSelected]}>
                Nenhum
              </Text>
              {modalMotorista === null && <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />}
            </TouchableOpacity>
            {allMotoristas.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[modalStyles.optionItem, modalMotorista === m.id && modalStyles.optionItemSelected]}
                onPress={() => setModalMotorista(m.id)}>
                <View style={modalStyles.optionContent}>
                  <Text style={[modalStyles.optionText, modalMotorista === m.id && modalStyles.optionTextSelected]}>
                    {m.nome}
                  </Text>
                  {m.cnh && <Text style={modalStyles.optionSub}>CNH {m.cnh}</Text>}
                </View>
                {modalMotorista === m.id && <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />}
              </TouchableOpacity>
            ))}

            {/* Veículo picker */}
            <Text style={[modalStyles.sectionLabel, { marginTop: spacing.lg }]}>Veículo Padrão</Text>
            <TouchableOpacity
              style={[modalStyles.optionItem, modalVeiculo === null && modalStyles.optionItemSelected]}
              onPress={() => setModalVeiculo(null)}>
              <Text style={[modalStyles.optionText, modalVeiculo === null && modalStyles.optionTextSelected]}>
                Nenhum
              </Text>
              {modalVeiculo === null && <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />}
            </TouchableOpacity>
            {allOnibus.map(o => (
              <TouchableOpacity
                key={o.id}
                style={[modalStyles.optionItem, modalVeiculo === o.id && modalStyles.optionItemSelected]}
                onPress={() => setModalVeiculo(o.id)}>
                <View style={modalStyles.optionContent}>
                  <Text style={[modalStyles.optionText, modalVeiculo === o.id && modalStyles.optionTextSelected]}>
                    {o.placa}{o.modelo ? ` · ${o.modelo}` : ''}
                  </Text>
                  {o.capacidade && <Text style={modalStyles.optionSub}>{o.capacidade} passageiros</Text>}
                </View>
                {modalVeiculo === o.id && <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={() => setModalRota(null)}
              disabled={saving}>
              <Text style={modalStyles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.saveBtn}
              onPress={handleSalvarAtribuicao}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Text style={modalStyles.saveBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader
        titulo="Minhas Rotas"
        subtitulo={loading ? '...' : `${rotas.length} rota${rotas.length !== 1 ? 's' : ''} cadastrada${rotas.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}>
        {isGestor && (
          <TouchableOpacity
            style={styles.criarRotaButton}
            onPress={() => navigation.navigate('CriarRota')}>
            <Icon name={IconNames.add} size="sm" color={colors.text.inverse} />
            <Text style={styles.criarRotaButtonText}>Nova Rota</Text>
          </TouchableOpacity>
        )}
      </SubHeader>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.dark} />
          <Text style={styles.loadingText}>Carregando rotas...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={withFabSpace()}
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.content}>
            {rotas.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name={IconNames.route} size="huge" color={colors.neutral[300]} />
                <Text style={styles.emptyText}>Nenhuma rota cadastrada ainda</Text>
                <Text style={styles.emptySubtext}>Crie sua primeira rota para começar</Text>
                {isGestor && (
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => navigation.navigate('CriarRota')}>
                    <Text style={styles.emptyButtonText}>Criar Primeira Rota</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              rotas.map(rota => renderRotaCard(rota))
            )}
          </View>
        </ScrollView>
      )}

      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
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
  criarRotaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.success.main,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: borderRadius.md, marginTop: spacing.md, ...shadows.sm,
  },
  criarRotaButtonText: { ...textStyles.button, color: colors.text.inverse },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { ...textStyles.bodySmall, color: colors.text.secondary },
  scrollView: { flex: 1 },
  content: { padding: spacing.base },

  // Route card
  rotaCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    ...shadows.sm,
  },
  rotaCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rotaCardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rotaIconBadge: {
    width: 32, height: 32, borderRadius: borderRadius.sm,
    backgroundColor: colors.info.light, justifyContent: 'center', alignItems: 'center',
  },
  rotaNome: { ...textStyles.h4, color: colors.text.primary, flex: 1 },
  editButton: {
    width: 32, height: 32, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border.light,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background.default,
  },

  // Assignment info
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
  },
  assignmentItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  assignmentDivider: {
    width: 1, height: 18, backgroundColor: colors.border.light, marginHorizontal: spacing.sm,
  },
  assignmentText: { ...textStyles.bodySmall, color: colors.text.primary, fontWeight: fontWeight.medium, flex: 1 },
  assignmentEmpty: { ...textStyles.bodySmall, color: colors.text.hint, fontStyle: 'italic', flex: 1 },

  // Horarios section
  horariosSection: {
    padding: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  horariosSectionTitle: { ...textStyles.caption, color: colors.text.secondary, fontWeight: fontWeight.semiBold, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  horarioRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm,
  },
  sentidoDot: { width: 8, height: 8, borderRadius: 4 },
  horarioTime: { ...textStyles.body, fontWeight: fontWeight.bold, color: colors.text.primary, minWidth: 44 },
  sentidoBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  sentidoBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  diasChips: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  noHorarios: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm,
    backgroundColor: colors.background.default, borderRadius: borderRadius.sm,
  },
  noHorariosText: { ...textStyles.caption, color: colors.text.hint },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.base,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, ...shadows.xs,
  },
  actionBtnSecondary: { backgroundColor: colors.info.main },
  actionBtnTertiary: { backgroundColor: colors.warning.main },
  actionBtnSuccess: { backgroundColor: colors.success.main },
  actionBtnText: { ...textStyles.caption, color: colors.text.inverse, fontWeight: fontWeight.semiBold },

  // Empty state
  emptyState: { padding: spacing.xxxl, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...textStyles.h4, color: colors.text.secondary },
  emptySubtext: { ...textStyles.bodySmall, color: colors.text.hint },
  emptyButton: {
    backgroundColor: colors.primary.dark, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md, ...shadows.xs,
  },
  emptyButtonText: { ...textStyles.button, color: colors.text.inverse },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxxl,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border.main,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: { ...textStyles.h3, color: colors.text.primary, textAlign: 'center' },
  subtitle: { ...textStyles.bodySmall, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  scroll: { maxHeight: 400 },
  sectionLabel: {
    ...textStyles.caption, color: colors.text.secondary,
    fontWeight: fontWeight.semiBold, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.md,
    marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  optionItemSelected: {
    borderColor: colors.primary.dark, backgroundColor: colors.info.light,
  },
  optionContent: { flex: 1 },
  optionText: { ...textStyles.body, color: colors.text.primary, flex: 1 },
  optionTextSelected: { color: colors.primary.dark, fontWeight: fontWeight.semiBold },
  optionSub: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  footer: {
    flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border.main, alignItems: 'center',
  },
  cancelBtnText: { ...textStyles.button, color: colors.text.secondary },
  saveBtn: {
    flex: 2, padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.primary.dark, alignItems: 'center',
  },
  saveBtnText: { ...textStyles.button, color: colors.text.inverse },
});

export default RotaMotorista;
