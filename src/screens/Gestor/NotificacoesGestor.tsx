import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getNotificacoes,
  markNotificacaoAsSent,
} from '../../services/notificacaoService';
import { borderRadius, colors, shadows, spacing, textStyles, fontWeight } from '../../theme';
import { Icon, IconNames, LoadingSpinner, EmptyState } from '../../components';
import type { Notificacao } from '../../types';
import { withFabSpace } from '../../config/feedback';

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

  const unreadCount = notificacoes.filter(n => !n.enviada).length;

  const renderItem = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Icon name={IconNames.arrowBack} size="md" color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} não lida(s)</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

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
    </SafeAreaView>
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
  listContent: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
