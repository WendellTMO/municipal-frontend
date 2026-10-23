import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { gestorService } from '../../services/gestorService';
import { unwrapItems } from '../../types';
import { useFetch } from '../../hooks';
import { borderRadius, colors, fontWeight, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { formatPlaca, onlyDigits } from '../../utils/masks';
import { LoadingView, ErrorView } from '../../components/LoadingState';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';

const GESTOR_COLOR = colors.roles.gestor;
const INFO_COLOR = colors.info.main;

const FrotaGestor = ({ navigation }) => {
  const toast = useToast();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ placa: '', modelo: '', capacidade: '' });

  const [form, setForm] = useState({
    placa: '', modelo: '', capacidade: '',
  });

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setEditField = (field, value) => setEditForm(prev => ({ ...prev, [field]: value }));

  const abrirEdicao = (onibusItem) => {
    setEditandoId(onibusItem.id);
    setEditForm({
      placa: formatPlaca(onibusItem.placa ?? ''),
      modelo: onibusItem.modelo ?? '',
      capacidade: String(onibusItem.capacidade ?? ''),
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditForm({ placa: '', modelo: '', capacidade: '' });
  };

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchOnibus = useCallback(async () => {
    const data = await gestorService.listarOnibus().then(unwrapItems);
    return data ?? [];
  }, []);

  const { data: onibus, isLoading, isError, error, refetch } = useFetch(
    fetchOnibus,
    [],
    { showErrorToast: true },
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // ─── Create ──────────────────────────────────────────────────────────────

  const handleCriarOnibus = async () => {
    if (!form.placa.trim() || !form.modelo.trim()) {
      toast.error('Preencha placa e modelo.');
      return;
    }
    const capacidade = parseInt(form.capacidade, 10);
    if (form.capacidade && isNaN(capacidade)) {
      toast.error('Capacidade deve ser um número.');
      return;
    }

    try {
      setSalvando(true);
      await gestorService.criarOnibus({
        placa: form.placa.trim().toUpperCase(),
        modelo: form.modelo.trim(),
        capacidade: capacidade || undefined,
      });
      toast.success('Ônibus cadastrado!');
      setForm({ placa: '', modelo: '', capacidade: '' });
      setMostrarForm(false);
      await refetch();
    } catch (e) {
      toast.error(e?.message ?? 'Erro ao cadastrar ônibus.');
    } finally {
      setSalvando(false);
    }
  };

  // ─── Update ──────────────────────────────────────────────────────────────

  const handleAtualizarOnibus = async () => {
    if (!editForm.placa.trim() || !editForm.modelo.trim()) {
      toast.error('Preencha placa e modelo.');
      return;
    }
    const capacidade = parseInt(editForm.capacidade, 10);
    if (editForm.capacidade && isNaN(capacidade)) {
      toast.error('Capacidade deve ser um número.');
      return;
    }

    try {
      setSalvando(true);
      await gestorService.atualizarOnibus(editandoId, {
        placa: editForm.placa.trim().toUpperCase(),
        modelo: editForm.modelo.trim(),
        capacidade: capacidade || undefined,
      });
      toast.success('Ônibus atualizado!');
      cancelarEdicao();
      await refetch();
    } catch (e) {
      toast.error(e?.message ?? 'Erro ao atualizar ônibus.');
    } finally {
      setSalvando(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleExcluir = (onibusItem) => {
    Alert.alert(
      'Remover Ônibus',
      `Deseja remover o ônibus ${onibusItem.placa}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setExcluindo(onibusItem.id);
              await gestorService.excluirOnibus(String(onibusItem.id));
              toast.info('Ônibus removido.');
              await refetch();
            } catch (e) {
              toast.error(e?.message ?? 'Erro ao remover ônibus.');
            } finally {
              setExcluindo(null);
            }
          },
        },
      ],
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <SubHeader
          titulo="Frota"
          subtitulo={`${(onibus ?? []).length} ônibus cadastrado(s)`}
          onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
          direita={
            <Tappable
              style={styles.addButton}
              onPress={() => setMostrarForm(!mostrarForm)}
              accessibilityRole="button"
              accessibilityLabel={mostrarForm ? 'Fechar formulário' : 'Adicionar ônibus'}>
              <Icon name={mostrarForm ? IconNames.close : IconNames.add} size="md" color="#FFFFFF" />
            </Tappable>
          }
        />

        {/* Form */}
        {mostrarForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Adicionar Ônibus</Text>

            <View style={styles.formRow}>
              <TextInput
                style={[styles.formInput, styles.formInputHalf]}
                placeholder="Placa *"
                placeholderTextColor={colors.text.hint}
                value={form.placa}
                onChangeText={v => setField('placa', formatPlaca(v))}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
              />
              <TextInput
                style={[styles.formInput, styles.formInputHalf]}
                placeholder="Capacidade"
                placeholderTextColor={colors.text.hint}
                value={form.capacidade}
                onChangeText={v => setField('capacidade', onlyDigits(v))}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <TextInput
              style={styles.formInput}
              placeholder="Modelo *"
              placeholderTextColor={colors.text.hint}
              value={form.modelo}
              onChangeText={v => setField('modelo', v)}
            />

            <Tappable
              style={[styles.formBtn, salvando && styles.formBtnDisabled]}
              onPress={handleCriarOnibus}
              disabled={salvando}>
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name={IconNames.add} size="sm" color="#FFFFFF" />
                  <Text style={styles.formBtnText}>Adicionar à Frota</Text>
                </>
              )}
            </Tappable>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <LoadingView message="Carregando frota..." />
        ) : isError ? (
          <ErrorView message={error?.message ?? 'Erro ao carregar frota'} onRetry={refetch} />
        ) : (onibus ?? []).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name={IconNames.bus} size="huge" color={colors.neutral[300]} />
            <Text style={styles.emptyText}>Nenhum ônibus cadastrado</Text>
            <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
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
              {(onibus ?? []).map(o => (
                <View key={o.id}>
                  <View style={styles.card}>
                    <View style={[styles.cardIconWrap, { backgroundColor: INFO_COLOR + '18' }]}>
                      <Icon name={IconNames.bus} size="lg" color={INFO_COLOR} />
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardPlaca}>{o.placa}</Text>
                      <Text style={styles.cardModelo}>{o.modelo ?? '—'}</Text>
                      {o.capacidade != null && (
                        <View style={styles.capacidadeRow}>
                          <Icon name={IconNames.group} size="xs" color={colors.text.secondary} />
                          <Text style={styles.capacidadeText}>{o.capacidade} passageiros</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardActions}>
                      <Tappable
                        style={styles.editBtn}
                        onPress={() => editandoId === o.id ? cancelarEdicao() : abrirEdicao(o)}>
                        <Icon
                          name={editandoId === o.id ? IconNames.close : IconNames.edit}
                          size="sm"
                          color={GESTOR_COLOR}
                        />
                      </Tappable>
                      <Tappable
                        style={styles.deleteBtn}
                        onPress={() => handleExcluir(o)}
                        disabled={excluindo === o.id}>
                        {excluindo === o.id ? (
                          <ActivityIndicator size="small" color={colors.error.main} />
                        ) : (
                          <Icon name={IconNames.delete} size="sm" color={colors.error.main} />
                        )}
                      </Tappable>
                    </View>
                  </View>

                  {editandoId === o.id && (
                    <View style={styles.editCard}>
                      <Text style={styles.editTitle}>Editar Ônibus</Text>
                      <View style={styles.formRow}>
                        <TextInput
                          style={[styles.formInput, styles.formInputHalf]}
                          placeholder="Placa *"
                          placeholderTextColor={colors.text.hint}
                          value={editForm.placa}
                          onChangeText={v => setEditField('placa', formatPlaca(v))}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          maxLength={7}
                        />
                        <TextInput
                          style={[styles.formInput, styles.formInputHalf]}
                          placeholder="Capacidade"
                          placeholderTextColor={colors.text.hint}
                          value={editForm.capacidade}
                          onChangeText={v => setEditField('capacidade', onlyDigits(v))}
                          keyboardType="number-pad"
                          maxLength={3}
                        />
                      </View>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Modelo *"
                        placeholderTextColor={colors.text.hint}
                        value={editForm.modelo}
                        onChangeText={v => setEditField('modelo', v)}
                      />
                      <Tappable
                        style={[styles.formBtn, salvando && styles.formBtnDisabled]}
                        onPress={handleAtualizarOnibus}
                        disabled={salvando}>
                        {salvando ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Icon name={IconNames.edit} size="sm" color="#FFFFFF" />
                            <Text style={styles.formBtnText}>Salvar Alterações</Text>
                          </>
                        )}
                      </Tappable>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <SairDaConta />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: colors.background.paper,
    margin: spacing.base,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: GESTOR_COLOR + '40',
    ...shadows.sm,
  },
  formTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 0,
  },
  formInput: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  formInputHalf: {
    flex: 1,
  },
  formBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  formBtnDisabled: { opacity: 0.6 },
  formBtnText: {
    ...textStyles.button,
    color: '#FFFFFF',
  },
  list: { flex: 1 },
  listContent: {
    padding: spacing.base,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.xs,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardPlaca: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  cardModelo: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  capacidadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  capacidadeText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: GESTOR_COLOR + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error.light ?? '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCard: {
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.base,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: GESTOR_COLOR + '40',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    ...shadows.sm,
  },
  editTitle: {
    ...textStyles.caption,
    color: GESTOR_COLOR,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
});

export default FrotaGestor;
