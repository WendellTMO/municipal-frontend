import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { gestorService } from '../../services/gestorService';
import { unwrapItems } from '../../types';
import { useFetch } from '../../hooks';
import { borderRadius, colors, fontWeight, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { formatCpf, onlyDigits } from '../../utils/masks';
import { LoadingView, ErrorView } from '../../components/LoadingState';
import { api } from '../../api/client';
import { agruparAlunos, filtrarPorInstituicao, instituicaoDoAlunoGestor } from '../../utils/alunosInstituicao';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';
import { alertar } from '../../utils/alerta';

const GESTOR_COLOR = colors.roles.gestor;
const SEGMENT = { MOTORISTAS: 0, ALUNOS: 1 };

// ─── Avatar ────────────────────────────────────────────────────────────────

const Avatar = ({ name, color }) => {
  const initials = (name ?? '')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';
  return (
    <View style={[avatarStyles.wrap, { backgroundColor: (color ?? GESTOR_COLOR) + '20' }]}>
      <Text style={[avatarStyles.text, { color: color ?? GESTOR_COLOR }]}>{initials}</Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...textStyles.body,
    fontWeight: fontWeight.bold,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

const EquipeGestor = ({ navigation }) => {
  const toast = useToast();
  const [segmento, setSegmento] = useState(SEGMENT.MOTORISTAS);
  const [busca, setBusca] = useState('');
  const [agrupar, setAgrupar] = useState(false);
  const [filtroInst, setFiltroInst] = useState(null);
  const [recolhidas, setRecolhidas] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aprovandoId, setAprovandoId] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  // Form state
  const [form, setForm] = useState({
    nome: '', email: '', password: '', cpf: '', cnh: '',
  });

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchMotoristas = useCallback(async () => {
    const data = await gestorService.listarMotoristas().then(unwrapItems);
    return data ?? [];
  }, []);

  const fetchAlunos = useCallback(async () => {
    const data = await gestorService.listarAlunos().then(unwrapItems);
    return data ?? [];
  }, []);

  const {
    data: motoristas, isLoading: loadingM, isError: errorM, error: errM, refetch: refetchM,
  } = useFetch(fetchMotoristas, [], { showErrorToast: true });

  const {
    data: alunos, isLoading: loadingA, isError: errorA, error: errA, refetch: refetchA,
  } = useFetch(fetchAlunos, [], { showErrorToast: true });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchM(), refetchA()]);
    setRefreshing(false);
  };

  // ─── Filtered lists ──────────────────────────────────────────────────────

  const motoristasFiltered = useMemo(() => {
    const q = busca.toLowerCase();
    return (motoristas ?? []).filter(
      m => m.nome?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
    );
  }, [motoristas, busca]);

  const alunosFiltered = useMemo(() => {
    const q = busca.toLowerCase();
    const porBusca = (alunos ?? []).filter(
      a => a.nome?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q),
    );
    return filtrarPorInstituicao(porBusca, filtroInst, instituicaoDoAlunoGestor);
  }, [alunos, busca, filtroInst]);

  // Chips de filtro rápido e seções do agrupamento por instituição.
  const secoesTodas = useMemo(() => agruparAlunos(alunos ?? [], instituicaoDoAlunoGestor), [alunos]);
  const secoes = useMemo(() => agruparAlunos(alunosFiltered, instituicaoDoAlunoGestor), [alunosFiltered]);

  const pendingApprovalCount = useMemo(
    () => (alunos ?? []).filter(a => a.status === 'PENDING_APPROVAL').length,
    [alunos],
  );

  // ─── Approve aluno ───────────────────────────────────────────────────────

  const handleAprovar = async (alunoId) => {
    setAprovandoId(alunoId);
    try {
      await api.post(`/alunos/${alunoId}/aprovar`);
      toast.success('Aluno aprovado!');
      await refetchA();
    } catch (e) {
      toast.error(e?.message ?? 'Não foi possível aprovar o aluno.');
    } finally {
      setAprovandoId(null);
    }
  };

  // ─── Delete motorista ────────────────────────────────────────────────────

  const handleExcluirMotorista = (motorista) => {
    alertar(
      'Remover Motorista',
      `Deseja remover ${motorista.nome} da equipe? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setExcluindoId(motorista.id);
              await gestorService.deletarMotorista(String(motorista.id));
              toast.info('Motorista removido.');
              await refetchM();
            } catch (e) {
              toast.error(e?.message ?? 'Erro ao remover motorista.');
            } finally {
              setExcluindoId(null);
            }
          },
        },
      ],
    );
  };

  // ─── Create motorista ────────────────────────────────────────────────────

  const handleCriarMotorista = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.password.trim() || !form.cpf.trim() || !form.cnh.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    try {
      setSalvando(true);
      await gestorService.criarMotorista({
        nome: form.nome.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        cpf: onlyDigits(form.cpf),
        cnh: onlyDigits(form.cnh),
      });
      toast.success('Motorista cadastrado com sucesso!');
      setForm({ nome: '', email: '', password: '', cpf: '', cnh: '' });
      setMostrarForm(false);
      await refetchM();
    } catch (e) {
      toast.error(e?.message ?? 'Erro ao cadastrar motorista.');
    } finally {
      setSalvando(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const renderAluno = a => (
      <View key={a.id}>
        <PessoaCard
          nome={a.nome}
          detalhe={a.email}
          color={a.status === 'PENDING_APPROVAL' ? colors.warning.main : colors.success.main}
          statusLabel={a.status === 'PENDING_APPROVAL' ? 'Aguardando aprovação' : undefined}
          guardianConsentedAt={a.guardian_consented_at}
          isMinor={a.is_minor}
          onViewDetail={() => navigation?.navigate?.('DetalheAlunoGestor', { alunoId: a.id })}
        />
        {a.status === 'PENDING_APPROVAL' && (
          <View style={styles.alunoActions}>
            <Tappable navega
              style={styles.detailBtn}
              onPress={() => navigation?.navigate?.('DetalheAlunoGestor', { alunoId: a.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ver detalhes de ${a.nome}`}>
              <Icon name="info-outline" size="sm" color={GESTOR_COLOR} />
              <Text style={styles.detailBtnText}>Ver detalhes</Text>
            </Tappable>
            <Tappable
              style={[styles.aprovarBtn, aprovandoId === a.id && styles.formBtnDisabled]}
              onPress={() => handleAprovar(a.id)}
              disabled={aprovandoId === a.id}
              accessibilityRole="button"
              accessibilityLabel={`Aprovar cadastro de ${a.nome}`}>
              {aprovandoId === a.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name={IconNames.checkCircle} size="sm" color="#FFFFFF" />
                  <Text style={styles.aprovarBtnText}>Aprovar cadastro</Text>
                </>
              )}
            </Tappable>
          </View>
        )}
      </View>
  );

  const isLoading = segmento === SEGMENT.MOTORISTAS ? loadingM : loadingA;
  const isError = segmento === SEGMENT.MOTORISTAS ? errorM : errorA;
  const errMsg = segmento === SEGMENT.MOTORISTAS ? errM?.message : errA?.message;
  const onRetry = segmento === SEGMENT.MOTORISTAS ? refetchM : refetchA;
  const total = segmento === SEGMENT.MOTORISTAS ? (motoristas ?? []).length : (alunos ?? []).length;

  return (
    <TelaSegura style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <SubHeader
          titulo="Equipe"
          subtitulo={`${total} ${segmento === SEGMENT.MOTORISTAS ? 'motorista(s)' : 'aluno(s)'}`}
          onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
          direita={
            segmento === SEGMENT.MOTORISTAS ? (
              <Tappable
                style={styles.addButton}
                onPress={() => setMostrarForm(!mostrarForm)}
                accessibilityRole="button"
                accessibilityLabel={mostrarForm ? 'Fechar formulário' : 'Adicionar motorista'}>
                <Icon name={mostrarForm ? IconNames.close : IconNames.add} size="md" color="#FFFFFF" />
              </Tappable>
            ) : null
          }
        />

        {/* Segment + Search */}
        <View style={styles.controls}>
          <View style={styles.segment}>
            {[{ id: SEGMENT.MOTORISTAS, label: 'Motoristas' }, { id: SEGMENT.ALUNOS, label: 'Alunos' }].map(s => (
              <Tappable
                key={s.id}
                style={[styles.segBtn, segmento === s.id && styles.segBtnActive]}
                onPress={() => { setSegmento(s.id); setBusca(''); setMostrarForm(false); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: segmento === s.id }}
                accessibilityLabel={s.label + (s.id === SEGMENT.ALUNOS && pendingApprovalCount > 0 ? `, ${pendingApprovalCount} aguardando aprovação` : '')}>
                <View style={styles.segBtnInner}>
                  <Text style={[styles.segBtnText, segmento === s.id && styles.segBtnTextActive]}>
                    {s.label}
                  </Text>
                  {s.id === SEGMENT.ALUNOS && pendingApprovalCount > 0 && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{pendingApprovalCount}</Text>
                    </View>
                  )}
                </View>
              </Tappable>
            ))}
          </View>

          <View style={styles.searchRow}>
            <Icon name={IconNames.search} size="sm" color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Buscar ${segmento === SEGMENT.MOTORISTAS ? 'motorista' : 'aluno'}...`}
              placeholderTextColor={colors.text.hint}
              value={busca}
              onChangeText={setBusca}
            />
            {busca.length > 0 && (
              <Tappable onPress={() => setBusca('')}>
                <Icon name={IconNames.close} size="sm" color={colors.text.secondary} />
              </Tappable>
            )}
          </View>

          {segmento === SEGMENT.ALUNOS && (
            <View>
              <View style={styles.agruparRow}>
                <Text style={styles.agruparTexto}>Agrupar por instituição</Text>
                <Switch
                  value={agrupar}
                  onValueChange={setAgrupar}
                  trackColor={{ false: colors.border.light, true: GESTOR_COLOR }}
                  thumbColor={colors.background.paper}
                  accessibilityRole="switch"
                  accessibilityLabel="Agrupar por instituição"
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsInst}>
                {[{ chave: null, nome: 'Todas', quantidade: (alunos ?? []).length }]
                  .concat(secoesTodas.map(sec => ({ chave: sec.chave === null ? '__sem__' : sec.chave, nome: sec.nome, quantidade: sec.alunos.length })))
                  .map(c => (
                    <Tappable
                      key={String(c.chave)}
                      style={[styles.chipInst, filtroInst === c.chave && styles.chipInstAtivo]}
                      onPress={() => setFiltroInst(c.chave)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: filtroInst === c.chave }}
                      accessibilityLabel={`Filtrar por ${c.nome}, ${c.quantidade} alunos`}>
                      <Text style={[styles.chipInstTexto, filtroInst === c.chave && styles.chipInstTextoAtivo]} numberOfLines={1}>
                        {c.nome} · {c.quantidade}
                      </Text>
                    </Tappable>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Create form */}
        {mostrarForm && segmento === SEGMENT.MOTORISTAS && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Cadastrar Motorista</Text>
            {[
              { field: 'nome', placeholder: 'Nome completo *', keyboardType: 'default' },
              { field: 'email', placeholder: 'E-mail *', keyboardType: 'email-address' },
              { field: 'password', placeholder: 'Senha *', secure: true },
              { field: 'cpf', placeholder: 'CPF *', keyboardType: 'number-pad' },
              { field: 'cnh', placeholder: 'CNH *', keyboardType: 'number-pad' },
            ].map(({ field, placeholder, keyboardType, secure }) => (
              <TextInput
                key={field}
                style={styles.formInput}
                placeholder={placeholder}
                placeholderTextColor={colors.text.hint}
                value={form[field]}
                onChangeText={v => {
                  if (field === 'cpf') setField(field, formatCpf(v));
                  else if (field === 'cnh') setField(field, onlyDigits(v).slice(0, 11));
                  else setField(field, v);
                }}
                keyboardType={keyboardType}
                secureTextEntry={secure}
                autoCapitalize={field === 'nome' ? 'words' : 'none'}
                autoCorrect={field === 'nome'}
                autoComplete={field === 'nome' ? 'name' : undefined}
                textContentType={field === 'nome' ? 'name' : undefined}
                maxLength={field === 'cpf' ? 14 : field === 'cnh' ? 11 : undefined}
              />
            ))}
            <Tappable
              style={[styles.formBtn, salvando && styles.formBtnDisabled]}
              onPress={handleCriarMotorista}
              disabled={salvando}>
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name={IconNames.checkCircle} size="sm" color="#FFFFFF" />
                  <Text style={styles.formBtnText}>Cadastrar</Text>
                </>
              )}
            </Tappable>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <LoadingView message="Carregando..." />
        ) : isError ? (
          <ErrorView message={errMsg ?? 'Erro ao carregar'} onRetry={onRetry} />
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
              {segmento === SEGMENT.MOTORISTAS
                ? motoristasFiltered.length === 0
                  ? <EmptyState label="motoristas" busca={busca} />
                  : motoristasFiltered.map(m => (
                    <PessoaCard
                      key={m.id}
                      nome={m.nome}
                      detalhe={m.email}
                      extra={m.cnh ? `CNH: ${m.cnh}` : undefined}
                      color={GESTOR_COLOR}
                      onDelete={() => handleExcluirMotorista(m)}
                      deleting={excluindoId === m.id}
                    />
                  ))
                : alunosFiltered.length === 0
                  ? <EmptyState label="alunos" busca={busca} />
                  : agrupar
                    ? secoes.map(sec => (
                      <View key={String(sec.chave)} style={styles.secaoInst}>
                        <Tappable
                          style={styles.secaoCabecalho}
                          onPress={() => setRecolhidas(r => ({ ...r, [sec.chave]: !r[sec.chave] }))}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: !recolhidas[sec.chave] }}
                          accessibilityLabel={`${sec.nome}, ${sec.alunos.length} alunos`}>
                          <Icon name={IconNames.school} size="md" color={GESTOR_COLOR} />
                          <Text style={styles.secaoNome} numberOfLines={2}>{sec.nome}</Text>
                          <Text style={styles.secaoQtd}>{sec.alunos.length}</Text>
                          <Icon name={recolhidas[sec.chave] ? IconNames.expandMore : IconNames.expandLess} size="md" color={colors.text.secondary} />
                        </Tappable>
                        {!recolhidas[sec.chave] && sec.alunos.map(renderAluno)}
                      </View>
                    ))
                    : alunosFiltered.map(renderAluno)
              }
            </View>
            <SairDaConta />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </TelaSegura>
  );
};

const PessoaCard = ({ nome, detalhe, extra, color, statusLabel, onDelete, deleting, guardianConsentedAt, isMinor, onViewDetail }) => {
  const fmtDatetime = iso => {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <View style={[cardStyles.card, statusLabel && cardStyles.cardPending]}>
      <Avatar name={nome} color={color} />
      <View style={cardStyles.info}>
        <Text style={cardStyles.nome} numberOfLines={1}>{nome ?? '—'}</Text>
        {detalhe && <Text style={cardStyles.detalhe} numberOfLines={1}>{detalhe}</Text>}
        {extra && <Text style={cardStyles.extra} numberOfLines={1}>{extra}</Text>}
        {statusLabel && (
          <View style={cardStyles.statusBadge}>
            <Icon name={IconNames.schedule} size="xs" color={colors.warning.dark} />
            <Text style={cardStyles.statusBadgeText}>{statusLabel}</Text>
          </View>
        )}
        {isMinor && guardianConsentedAt && (
          <View style={cardStyles.consentBadge}>
            <Icon name="verified-user" size="xs" color={colors.success?.main ?? '#22c55e'} />
            <Text style={cardStyles.consentBadgeText}>
              Resp. autorizou em {fmtDatetime(guardianConsentedAt)}
            </Text>
          </View>
        )}
      </View>
      {onDelete && (
        <Tappable
          style={cardStyles.deleteBtn}
          onPress={onDelete}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${nome}`}>
          {deleting ? (
            <ActivityIndicator size="small" color={colors.error.main} />
          ) : (
            <Icon name={IconNames.delete} size="sm" color={colors.error.main} />
          )}
        </Tappable>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xxs,
    gap: spacing.md,
    ...shadows.xs,
  },
  cardPending: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning.main,
  },
  info: { flex: 1 },
  nome: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold,
  },
  detalhe: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  extra: {
    ...textStyles.caption,
    color: colors.text.hint,
    marginTop: spacing.xxs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  statusBadgeText: {
    ...textStyles.caption,
    color: colors.warning.dark,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error.light ?? '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  consentBadgeText: {
    ...textStyles.caption,
    color: colors.success?.main ?? '#22c55e',
    fontWeight: '600',
    fontSize: 11,
  },
});

const EmptyState = ({ label, busca }) => (
  <View style={emptyStyles.wrap}>
    <Icon name={IconNames.group} size="huge" color={colors.neutral[300]} />
    <Text style={emptyStyles.text}>
      {busca ? `Nenhum ${label} encontrado` : `Nenhum ${label} cadastrado`}
    </Text>
  </View>
);

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  text: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

const styles = StyleSheet.create({
  agruparRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  agruparTexto: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  chipsInst: { gap: 8, paddingVertical: 8 },
  chipInst: {
    maxWidth: 220,
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  chipInstAtivo: { backgroundColor: GESTOR_COLOR, borderColor: GESTOR_COLOR },
  chipInstTexto: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  chipInstTextoAtivo: { color: '#FFFFFF' },
  secaoInst: { marginBottom: 12 },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background.paper,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  secaoNome: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text.primary },
  secaoQtd: { fontSize: 15, fontWeight: '800', color: GESTOR_COLOR },
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
  controls: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.xs,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    padding: 3,
    marginBottom: spacing.md,
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  segBtnActive: {
    backgroundColor: GESTOR_COLOR,
  },
  segBtnText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  segBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: fontWeight.semiBold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...textStyles.body,
    color: colors.text.primary,
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
  segBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pendingBadge: {
    backgroundColor: colors.warning.main,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pendingBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  alunoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.md + 44,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: GESTOR_COLOR,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 36,
    flex: 1,
  },
  detailBtnText: {
    ...textStyles.caption,
    color: GESTOR_COLOR,
    fontWeight: '700',
  },
  aprovarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 36,
    flex: 1,
  },
  aprovarBtnText: {
    ...textStyles.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default EquipeGestor;
