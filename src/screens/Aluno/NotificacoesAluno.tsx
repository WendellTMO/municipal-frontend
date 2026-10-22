import React, { useCallback, useEffect, useState } from 'react';
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
import { borderRadius, colors, shadows, spacing, textStyles } from '../../theme';
import { Icon, IconNames, LoadingSpinner, EmptyState } from '../../components';
import type { Notificacao } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';

type Props = { navigation: NativeStackNavigationProp<Record<string, object | undefined>> };

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr === 'None') return '';
  try {
    const normalized = dateStr.replace(' ', 'T');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const NotificacoesAluno: React.FC<Props> = ({ navigation }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const unreadCount = notificacoes.filter((n) => !n.enviada).length;

  const loadNotificacoes = useCallback(async () => {
    setError(false);
    try {
      const data = await getNotificacoes();
      setNotificacoes(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotificacoes();
  }, [loadNotificacoes]);

  const handleMarkAsRead = async (notificacao: Notificacao) => {
    if (notificacao.enviada) return;
    try {
      await markNotificacaoAsSent(notificacao.id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === notificacao.id ? { ...n, enviada: true } : n)),
      );
    } catch {
      // non-fatal
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notificacoes.filter((n) => !n.enviada);
    await Promise.allSettled(unread.map((n) => markNotificacaoAsSent(n.id)));
    setNotificacoes((prev) => prev.map((n) => ({ ...n, enviada: true })));
  };

  const renderItem = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
      style={[styles.card, !item.enviada && styles.cardUnread]}
      onPress={() => handleMarkAsRead(item)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.titulo}${!item.enviada ? ', não lida' : ''}`}
      accessibilityState={{ selected: !item.enviada }}>
      <View style={[styles.cardDot, !item.enviada && styles.cardDotUnread]} accessibilityElementsHidden />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.data_envio)}</Text>
        </View>
        <Text style={styles.cardMessage}>{item.mensagem}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner
          fullScreen
          message="Carregando notificações..."
          color={colors.primary.main}
          accessibilityLabel="Carregando notificações"
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar">
              <Icon name={IconNames.back} size="md" color={colors.primary.contrast} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Notificações</Text>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon name={IconNames.error} size="xl" color={colors.error.main} />
          <Text style={styles.errorTitle}>Não foi possível carregar</Text>
          <Text style={styles.errorMessage}>
            Verifique a sua ligação e tente novamente.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadNotificacoes();
            }}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente">
            <Icon name={IconNames.refresh} size="md" color={colors.primary.contrast} />
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Voltar">
            <Icon name={IconNames.back} size="md" color={colors.primary.contrast} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title} accessibilityRole="header">
              Notificações
            </Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              accessibilityRole="button"
              accessibilityLabel={`Marcar todas as ${unreadCount} notificações como lidas`}>
              <Icon name={IconNames.checkCircle} size="md" color={colors.primary.contrast} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notificacoes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={withFabSpace([
          styles.listContent,
          notificacoes.length === 0 && styles.emptyContent,
        ])}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotificacoes();
            }}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={IconNames.notifications}
            title="Sem notificações"
            message="Quando houver avisos sobre as suas viagens eles aparecerão aqui."
          />
        }
        ListFooterComponent={<SairDaConta />}
        accessibilityLabel="Lista de notificações"
      />
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
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: spacing.md },
  title: { ...textStyles.h3, color: colors.primary.contrast },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  emptyContent: { flex: 1, justifyContent: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    marginTop: 6,
    marginRight: spacing.sm,
  },
  cardDotUnread: { backgroundColor: colors.primary.main },
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  cardTitle: { ...textStyles.h5, color: colors.text.primary, flex: 1 },
  cardDate: { ...textStyles.caption, color: colors.text.secondary, flexShrink: 0 },
  cardMessage: { ...textStyles.body, color: colors.text.secondary, lineHeight: 20 },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorTitle: { ...textStyles.h4, color: colors.text.primary, textAlign: 'center' },
  errorMessage: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    minHeight: 48,
    ...shadows.sm,
  },
  retryButtonText: { ...textStyles.button, color: colors.primary.contrast },
});

export default NotificacoesAluno;
