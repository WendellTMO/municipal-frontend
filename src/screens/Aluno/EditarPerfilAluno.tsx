import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { alunoService } from '../../services/alunoService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { borderRadius, colors, fontWeight, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { confirmAction } from '../../utils/confirm';
import { formatPhone, formatCep, formatCpf, onlyDigits } from '../../utils/masks';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import SubHeader from '../../components/SubHeader';

type Props = { navigation: NativeStackNavigationProp<Record<string, object | undefined>> };

type FormState = {
  nome: string;
  telefone: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento: string;
};

const ALUNO_COLOR = colors.roles?.aluno ?? colors.primary.main;

const EditarPerfilAluno: React.FC<Props> = ({ navigation }) => {
  const { user, refreshUser, logout } = useAuth() as {
    user: Record<string, unknown>;
    refreshUser?: () => Promise<void>;
    logout: () => Promise<void>;
  };
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    nome: '',
    telefone: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    complemento: '',
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;
    const base = {
      nome: (user.nome as string) ?? '',
      telefone: formatPhone((user.telefone as string) ?? ''),
    };
    setForm(prev => ({ ...prev, ...base }));

    const carregarEndereco = async () => {
      try {
        const perfil = await alunoService.obterPerfil();
        const e = perfil.endereco;
        if (cancelado || !e) return;
        setForm(prev => ({
          ...prev,
          logradouro: e.logradouro ?? '',
          numero: e.numero ?? '',
          bairro: e.bairro ?? '',
          cidade: e.cidade ?? '',
          estado: e.estado ?? '',
          cep: formatCep(e.cep ?? ''),
          complemento: e.complemento ?? '',
        }));
      } catch {
        if (!cancelado) toast.error('Não foi possível carregar seu endereço. Tente novamente mais tarde.');
      }
    };
    carregarEndereco();

    return () => {
      cancelado = true;
    };
    // toast muda de identidade a cada render do provider; só recarrega quando o usuário muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setField = useCallback(
    (field: keyof FormState, value: string) =>
      setForm(prev => ({ ...prev, [field]: value })),
    [],
  );

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório.');
      return;
    }

    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      telefone: onlyDigits(form.telefone) || undefined,
    };

    const temEndereco =
      form.logradouro.trim() ||
      form.numero.trim() ||
      form.bairro.trim() ||
      form.cidade.trim() ||
      form.estado.trim() ||
      form.cep.trim() ||
      form.complemento.trim();

    if (temEndereco) {
      const obrigatorios = [form.logradouro, form.numero, form.bairro, form.cidade, form.estado, form.cep];
      for (const valor of obrigatorios) {
        if (!valor.trim()) {
          toast.error('Preencha rua, número, bairro, cidade, UF e CEP, ou deixe o endereço todo em branco.');
          return;
        }
      }
      if (onlyDigits(form.cep).length !== 8) {
        toast.error('CEP deve ter 8 dígitos.');
        return;
      }
      payload.endereco = {
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        cep: onlyDigits(form.cep),
        complemento: form.complemento.trim() || undefined,
      };
    }

    try {
      setSalvando(true);
      await alunoService.atualizarPerfil(payload as Parameters<typeof alunoService.atualizarPerfil>[0]);
      if (refreshUser) await refreshUser();
      toast.success('Perfil atualizado com sucesso!');
      navigation.goBack();
    } catch (e: unknown) {
      const err = e as { message?: string; statusCode?: number };
      if (err?.statusCode === 400 || err?.statusCode === 422) {
        toast.error(err.message || 'Confira os dados do endereço e tente novamente.');
      } else {
        toast.error('Não foi possível salvar seu perfil agora. Tente novamente em instantes.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleSair = () => {
    confirmAction({
      title: 'Sair da conta',
      message: 'Deseja encerrar sua sessão?',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      destructive: true,
      onConfirm: () => logout(),
      onCancel: undefined,
    });
  };

  const handleAlterarSenha = () => {
    Alert.alert(
      'Alterar Senha',
      'Para alterar sua senha, acesse a tela de configurações.',
    );
  };

  return (
    <TelaSegura style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <SubHeader titulo="Editar Perfil" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={withFabSpace(styles.scrollContent)}
          keyboardShouldPersistTaps="handled">

          {/* Dados pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados Pessoais</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome completo *</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={v => setField('nome', v)}
                placeholder="Seu nome"
                placeholderTextColor={colors.text.hint}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                accessibilityLabel="Nome completo"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={form.telefone}
                onChangeText={v => setField('telefone', formatPhone(v))}
                placeholder="(83) 99999-9999"
                placeholderTextColor={colors.text.hint}
                keyboardType="phone-pad"
                maxLength={15}
                autoComplete="tel"
                textContentType="telephoneNumber"
                accessibilityLabel="Telefone"
              />
            </View>

            <View style={styles.readOnlyGroup}>
              <Text style={styles.label}>E-mail (não editável)</Text>
              <Text style={styles.readOnlyText}>{(user?.email as string) ?? '—'}</Text>
            </View>

            <View style={styles.readOnlyGroup}>
              <Text style={styles.label}>CPF (não editável)</Text>
              <Text style={styles.readOnlyText}>{user?.cpf ? formatCpf(user.cpf as string) : '—'}</Text>
            </View>
          </View>

          {/* Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Logradouro</Text>
              <TextInput
                style={styles.input}
                value={form.logradouro}
                onChangeText={v => setField('logradouro', v)}
                placeholder="Rua, Av., Travessa..."
                placeholderTextColor={colors.text.hint}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Número</Text>
                <TextInput
                  style={styles.input}
                  value={form.numero}
                  onChangeText={v => setField('numero', v)}
                  placeholder="123"
                  placeholderTextColor={colors.text.hint}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 2, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Bairro</Text>
                <TextInput
                  style={styles.input}
                  value={form.bairro}
                  onChangeText={v => setField('bairro', v)}
                  placeholder="Seu bairro"
                  placeholderTextColor={colors.text.hint}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 2 }]}>
                <Text style={styles.label}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  value={form.cidade}
                  onChangeText={v => setField('cidade', v)}
                  placeholder="Campina Grande"
                  placeholderTextColor={colors.text.hint}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>CEP</Text>
                <TextInput
                  style={styles.input}
                  value={form.cep}
                  onChangeText={v => setField('cep', formatCep(v))}
                  placeholder="58100-001"
                  placeholderTextColor={colors.text.hint}
                  keyboardType="number-pad"
                  maxLength={9}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>UF</Text>
                <TextInput
                  style={styles.input}
                  value={form.estado}
                  onChangeText={v => setField('estado', v.replace(/[^A-Za-z]/g, '').toUpperCase())}
                  placeholder="PB"
                  placeholderTextColor={colors.text.hint}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 2, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  value={form.complemento}
                  onChangeText={v => setField('complemento', v)}
                  placeholder="Apto, bloco, referência"
                  placeholderTextColor={colors.text.hint}
                />
              </View>
            </View>
          </View>

          {/* Segurança */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Segurança</Text>
            <TouchableOpacity
              style={styles.changePasswordBtn}
              onPress={handleAlterarSenha}
              accessibilityRole="button">
              <Icon name={IconNames.lock} size="sm" color={ALUNO_COLOR} />
              <Text style={styles.changePasswordText}>Alterar senha</Text>
              <Icon name={IconNames.chevronRight} size="sm" color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changePasswordBtn}
              onPress={handleSair}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta">
              <Icon name={IconNames.logout} size="sm" color={colors.error.main} style={undefined} />
              <Text style={styles.sairText}>Sair da conta</Text>
              <Icon name={IconNames.chevronRight} size="sm" color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, salvando && styles.saveBtnDisabled]}
            onPress={handleSalvar}
            disabled={salvando}
            accessibilityRole="button"
            accessibilityLabel="Salvar alterações">
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name={IconNames.checkCircle} size="md" color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
          <SairDaConta />
        </ScrollView>
      </KeyboardAvoidingView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  sairText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.error.main,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold as 'bold',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  section: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold as 'bold',
    marginBottom: spacing.md,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium as 'bold',
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  readOnlyGroup: {
    marginBottom: spacing.md,
  },
  readOnlyText: {
    ...textStyles.body,
    color: colors.text.hint,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.md,
  },
  changePasswordText: {
    ...textStyles.body,
    color: ALUNO_COLOR,
    flex: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ALUNO_COLOR,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...textStyles.button,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold as 'bold',
  },
});

export default EditarPerfilAluno;
