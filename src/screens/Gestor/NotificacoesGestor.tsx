import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  deleteNotificacao,
  deleteTodasNotificacoes,
  getNotificacoes,
  markNotificacaoAsSent,
} from '../../services/notificacaoService';
import { borderRadius, colors, shadows, spacing, textStyles, fontWeight } from '../../theme';
import { Icon, IconNames, LoadingSpinner, EmptyState } from '../../components';
import type { Notificacao } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';
import { confirmAction } from '../../utils/confirm';
import DeslizarParaExcluir from '../../components/DeslizarParaExcluir';

type Props = { navigation: NativeStackNavigationProp<Record<string, object | undefined>> };

const GESTOR_COLOR = colors.roles.gestor;

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === 'None') return '';
  try {
    const normalized = dateStr.replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const NotificacoesGestor: React.FC<Props> = ({ navigation }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getNotificacoes();
      setNotificacoes(data ?? []);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (n: Notificacao) => {
    if (n.enviada) return;
    try {
      await markNotificacaoAsSent(String(n.id));
      setNotificacoes(prev =>
        prev.map(item => (item.id === n.id ? { ...item, enviada: true } : item)),
      );
    } catch {
      // non-blocking
    }
  };

  const handleExcluir = async (n: Notificacao) => {
    const anteriores = notificacoes;
    setNotificacoes(prev => prev.filter(item => item.id !== n.id));
    try {
      await deleteNotificacao(String(n.id));
    } catch {
      setNotificacoes(anteriores);
    }
  };

  const limparTudo = async () => {
    const anteriores = notificacoes;
    setNotificacoes([]);
    try {
      await deleteTodasNotificacoes();
    } catch {
      setNotificacoes(anteriores);
    }
  };

  const handleLimparTudo = () => {
    confirmAction({
      title: 'Limpar notificações',
      message: 'Excluir todas as notificações? Isso não pode ser desfeito.',
      confirmText: 'Limpar tudo',
      destructive: true,
      onConfirm: limparTudo,
      onCancel: undefined,
    });
  };

  const unreadCount = notificacoes.filter(n => !n.enviada).length;

  const renderItem = ({ item }: { item: Notificacao }) => (
    <DeslizarParaExcluir onExcluir={() => handleExcluir(item)}>
    <Tappable
      style={[styles.card, !item.enviada && styles.cardUnread]}
      onPress={() => handleMarkRead(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.titulo}. ${item.enviada ? 'Lida' : 'Não lida'}`}>
      <View style={[styles.dot, item.enviada && styles.dotRead]} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !item.enviada && styles.cardTitleUnread]} numberOfLines={2}>
          {item.titulo}
        </Text>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.mensagem}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.data_envio)}</Text>
      </View>
    </Tappable>
    </DeslizarParaExcluir>
  );

  return (
    <TelaSegura style={styles.container}>
      <SubHeader
        titulo="Notificações"
        subtitulo={unreadCount > 0 ? `${unreadCount} não lida(s)` : undefined}
        onBack={() => navigation.goBack()}
        direita={
          notificacoes.length > 0 ? (
            <Tappable
              style={styles.limparBtn}
              onPress={handleLimparTudo}
              accessibilityRole="button"
              accessibilityLabel="Limpar todas as notificações">
              <Icon name={IconNames.delete} size="md" color={colors.primary.contrast} />
            </Tappable>
          ) : null
        }
      />

      {loading ? (
        <LoadingSpinner message="Carregando notificações..." />
      ) : notificacoes.length === 0 ? (
        <EmptyState
          icon={IconNames.notifications}
          title="Nenhuma notificação"
          description="Suas notificações aparecerão aqui."
        />
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={withFabSpace(styles.listContent)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              colors={[GESTOR_COLOR]}
              tintColor={GESTOR_COLOR}
            />
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
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
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: '#FFFFFF',
    fontWeight: fontWeight.bold as 'bold',
  },
  headerSub: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  limparBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.xs,
    gap: spacing.sm,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: GESTOR_COLOR,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GESTOR_COLOR,
    marginTop: 6,
    flexShrink: 0,
  },
  dotRead: {
    backgroundColor: colors.neutral[300],
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  cardTitleUnread: {
    color: colors.text.primary,
    fontWeight: fontWeight.semiBold as 'bold',
  },
  cardBody: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardDate: {
    ...textStyles.caption,
    color: colors.text.hint,
  },
});

export default NotificacoesGestor;
