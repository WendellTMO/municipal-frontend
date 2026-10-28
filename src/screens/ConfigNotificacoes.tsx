import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import TelaSegura from '../components/TelaSegura';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { useToast } from '../components/Toast';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, lineHeight } from '../theme';
import Icon, { IconNames } from '../components/Icon';
import { withFabSpace } from '../config/feedback';
import SubHeader from '../components/SubHeader';

const roleLabel = (role?: string) => {
  const map: Record<string, string> = {
    aluno: 'Aluno',
    motorista: 'Motorista',
    gestor: 'Gestor',
  };

  return map[role?.toLowerCase() ?? ''] ?? role ?? '—';
};

const ConfigNotificacoes = ({ navigation }) => {
  const { user, logout, refreshUser, biometria } = useAuth() as any;
  const toast = useToast();
  const role = user?.role?.toLowerCase();

  const isAluno = role === 'aluno';
  const isMotorista = role === 'motorista';

  const [receberNotificacoes, setReceberNotificacoes] = useState<boolean>(
    user?.receber_notificacoes !== false,
  );
  const [salvandoPrefs, setSalvandoPrefs] = useState(false);

  const headerSubtitle = useMemo(() => {
    if (isAluno) return 'Perfil e notificações';
    return 'Notificações e conta';
  }, [isAluno]);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const shouldLogout = window.confirm('Tem certeza que deseja sair?');
      if (shouldLogout) {
        await performLogout();
      }
      return;
    }

    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja encerrar a sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: performLogout },
      ],
      { cancelable: true }
    );
  };

  const performLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    }
  };

  const handleSalvarPreferencias = async () => {
    try {
      setSalvandoPrefs(true);
      await userService.updateProfile({ receber_notificacoes: receberNotificacoes });
      if (refreshUser) await refreshUser();
      toast.success('Preferências salvas!');
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao salvar preferências.');
    } finally {
      setSalvandoPrefs(false);
    }
  };

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Configurações" subtitulo={headerSubtitle} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={withFabSpace(styles.content)}>
        <AccountSection user={user} showProfileCard={isAluno} />

        {isAluno && (
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditarPerfilAluno')}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil">
            <Icon name={IconNames.edit} size="md" color={colors.primary.dark} />
            <Text style={styles.editProfileBtnText}>Editar meus dados</Text>
            <Icon name={IconNames.chevronRight} size="sm" color={colors.text.secondary} />
          </TouchableOpacity>
        )}

        <SectionHeader title="Notificações" />

        <NotificacoesSection
          receberNotificacoes={receberNotificacoes}
          onToggle={setReceberNotificacoes}
          onSave={handleSalvarPreferencias}
          salvando={salvandoPrefs}
          role={role}
        />

        {biometria.disponivel && (
          <>
            <SectionHeader title="Segurança" />
            <View style={styles.section}>
              <View style={styles.settingRowTopAligned}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Entrar com biometria</Text>
                  <Text style={styles.settingDescription}>
                    Use digital ou rosto para abrir o app. Sua senha não é guardada.
                  </Text>
                </View>
                <Switch
                  value={biometria.ativa}
                  onValueChange={(ligar) => void biometria.alternar(ligar)}
                  trackColor={{ false: colors.border.light, true: colors.primary.dark }}
                  thumbColor={colors.background.paper}
                  accessibilityLabel="Entrar com biometria"
                  accessibilityRole="switch"
                />
              </View>
            </View>
          </>
        )}

        <SectionHeader title="Conta" />

        <AccountInfoSection user={user} role={role} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name={IconNames.logout} size="md" color={colors.error.main} />
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </TelaSegura>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const AccountSection = ({ user, showProfileCard }: { user: any; showProfileCard: boolean }) => {
  if (!showProfileCard) return null;

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarCircle}>
        <Icon name={IconNames.person} size="xl" color={colors.primary.dark} />
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.profileName} numberOfLines={1}>
          {user?.nome ?? '—'}
        </Text>
        <Text style={styles.profileEmail} numberOfLines={1}>
          {user?.email ?? '—'}
        </Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{roleLabel(user?.role)}</Text>
        </View>
      </View>
    </View>
  );
};

const AlunoNotificationSection = ({ user }: { user: any }) => {
  const notificationsEnabled = user?.receber_notificacoes !== false;

  return (
    <View style={styles.section}>
      <View style={styles.settingRow}>
        <View
          style={[
            styles.settingIconContainer,
            { backgroundColor: colors.primary.lighter },
          ]}
        >
          <Icon name={IconNames.notifications} size="md" color={colors.primary.dark} />
        </View>

        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Lembretes de viagem</Text>
          <Text style={styles.settingDescription}>
            {notificationsEnabled
              ? 'Ativado — recebes avisos 24 h e 10 min antes da partida'
              : 'Desativado — não recebes lembretes de viagem'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            notificationsEnabled ? styles.statusOn : styles.statusOff,
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {notificationsEnabled ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={[styles.settingRow, styles.settingRowDisabled]}>
        <View
          style={[
            styles.settingIconContainer,
            { backgroundColor: colors.neutral[100] },
          ]}
        >
          <Icon name={IconNames.myLocation} size="md" color={colors.neutral[400]} />
        </View>

        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, styles.settingTitleDisabled]}>
            Notificação de aproximação
          </Text>
          <Text style={styles.settingDescription}>
            Aviso quando o ônibus estiver próximo de ti
          </Text>
        </View>

        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>Em breve</Text>
        </View>
      </View>
    </View>
  );
};

const NotificacoesSection = ({
  receberNotificacoes,
  onToggle,
  onSave,
  salvando,
  role,
}: {
  receberNotificacoes: boolean;
  onToggle: (v: boolean) => void;
  onSave: () => void;
  salvando: boolean;
  role?: string;
}) => {
  const description =
    role === 'motorista'
      ? 'Receber avisos do gestor, confirmações de alunos e alertas da rota'
      : role === 'gestor'
      ? 'Receber ocorrências, relatórios e alertas do sistema'
      : 'Receber lembretes de viagem, avisos do motorista e atualizações de rota';

  return (
    <View style={styles.section}>
      <View style={styles.settingRowTopAligned}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Receber notificações</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
        <Switch
          value={receberNotificacoes}
          onValueChange={onToggle}
          trackColor={{ false: colors.border.light, true: colors.primary.dark }}
          thumbColor={colors.background.paper}
          accessibilityLabel="Receber notificações"
          accessibilityRole="switch"
        />
      </View>
      <TouchableOpacity
        style={[styles.saveButton, salvando && { opacity: 0.6 }]}
        onPress={onSave}
        disabled={salvando}>
        {salvando ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Preferências</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const AccountInfoSection = ({
  user,
  role,
}: {
  user: any;
  role?: string;
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.infoRow}>
        <Icon name={IconNames.person} size="md" color={colors.text.secondary} />
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>Nome</Text>
          <Text style={styles.infoValue}>{user?.nome ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Icon name={IconNames.badge} size="md" color={colors.text.secondary} />
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>
            {role === 'aluno' ? 'Matrícula' : 'Perfil'}
          </Text>
          <Text style={styles.infoValue}>
            {role === 'aluno' ? user?.matricula ?? '—' : roleLabel(user?.role)}
          </Text>
        </View>
      </View>

      {!!user?.email && (
        <>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Icon name={IconNames.notifications} size="md" color={colors.text.secondary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
        </>
      )}

      {!!user?.instituicao?.nome && (
        <>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Icon name={IconNames.home} size="md" color={colors.text.secondary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Instituição</Text>
              <Text style={styles.infoValue}>{user.instituicao.nome}</Text>
            </View>
          </View>
        </>
      )}
    </View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.primary.contrast,
  },
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

  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  profileEmail: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    ...textStyles.caption,
    color: colors.primary.contrast,
    fontWeight: '600',
  },

  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...textStyles.h5,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowTopAligned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  settingTitle: {
    ...textStyles.inputLabel,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingTitleDisabled: {
    color: colors.text.secondary,
  },
  settingDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: fontSize.bodySmall * lineHeight.relaxed,
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusOn: {
    backgroundColor: colors.success.light ?? '#e6f4ea',
  },
  statusOff: {
    backgroundColor: colors.neutral[100],
  },
  statusBadgeText: {
    ...textStyles.caption,
    fontWeight: '700',
    color: colors.success.dark ?? colors.text.primary,
  },
  soonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
  },
  soonBadgeText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  infoValue: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  saveButton: {
    backgroundColor: colors.primary.dark,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  saveButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  logoutButtonText: {
    ...textStyles.button,
    color: colors.error.main,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  editProfileBtnText: {
    ...textStyles.body,
    color: colors.primary.dark,
    flex: 1,
    fontWeight: '600' as const,
  },
});

export default ConfigNotificacoes;