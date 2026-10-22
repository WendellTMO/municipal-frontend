import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {motoristaService} from '../../services/motoristaService';
import {useAuth} from '../../contexts/AuthContext';
import { useFetch } from '../../hooks';
import { LoadingView, ErrorView, EmptyView } from '../../components/LoadingState';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';

const ListaViagens = ({navigation, route}) => {
  const { user } = useAuth();
  const params = route?.params || {};
  const rotaFiltro = params.rota; // Optional: filter by specific route
  const isGestor = user?.role?.toLowerCase() === 'gestor';
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch function
  const fetchViagens = useCallback(async () => {
    let viagensData;
    if (isGestor) {
      // Gestor uses the full trips endpoint with optional filters
      const filters = rotaFiltro?.id ? { rota_id: rotaFiltro.id } : {};
      viagensData = await motoristaService.listarTodasViagens(filters).then(unwrapItems);
    } else {
      // Motorista uses /viagens/minhas
      viagensData = await motoristaService.listarViagens().then(unwrapItems);
      // Filter by route if specified (client-side for motorista)
      if (rotaFiltro?.id) {
        viagensData = (viagensData || []).filter(v => v.rota_id === rotaFiltro.id);
      }
    }
    
    // Ordenar por data (mais recentes primeiro)
    return (viagensData || []).sort((a, b) => {
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);
      return dataB - dataA;
    });
  }, [isGestor, rotaFiltro?.id]);

  // Use the useFetch hook
  const { data: viagens, isLoading, isError, error, refetch } = useFetch(
    fetchViagens,
    [rotaFiltro?.id, isGestor],
    { showErrorToast: true }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'AGENDADA': 'A iniciar',
      'EM_ANDAMENTO': 'Em andamento',
      'FINALIZADA': 'Finalizada',
      'CANCELADA': 'Cancelada',
    };
    return statusMap[status] || status || 'Desconhecido';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AGENDADA':
        return colors.warning.main;
      case 'EM_ANDAMENTO':
        return colors.primary.dark;
      case 'FINALIZADA':
        return colors.success.main;
      case 'CANCELADA':
        return colors.error.main;
      default:
        return colors.text.hint;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name={IconNames.back} size="md" color={colors.primary.contrast} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>
              {rotaFiltro ? `Viagens` : 'Minhas Viagens'}
            </Text>
            {rotaFiltro && (
              <Text style={styles.subtitle}>{rotaFiltro.nome}</Text>
            )}
          </View>
          <View style={styles.headerIcon}>
            <Icon name={IconNames.route} size="lg" color={colors.primary.contrast} />
          </View>
        </View>
      </View>

      {isLoading ? (
        <LoadingView message="Carregando viagens..." />
      ) : isError ? (
        <ErrorView 
          message={error?.message || 'Não foi possível carregar as viagens'} 
          onRetry={refetch} 
        />
      ) : (viagens || []).length === 0 ? (
        <EmptyView
          title={rotaFiltro ? 'Nenhuma viagem nesta rota' : 'Nenhuma viagem atribuída'}
          message={rotaFiltro 
            ? 'Crie uma viagem para esta rota' 
            : 'O gestor precisa atribuir viagens para você'}
          icon={IconNames.route}
        />
      ) : (
        <ScrollView
          contentContainerStyle={withFabSpace()}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.primary.dark]}
              tintColor={colors.primary.dark}
            />
          }>
          <View style={styles.content}>
            {(viagens || []).map((viagem) => {
              const statusLabel = getStatusLabel(viagem.status);
              const statusColor = getStatusColor(viagem.status);
              return (
                <TouchableOpacity
                  key={viagem.id}
                  style={styles.viagemCard}
                  onPress={() =>
                    navigation.navigate('DetalheViagemMotorista', {
                      viagem,
                    })
                  }>
                  <View style={styles.viagemHeader}>
                    <View style={styles.viagemInfo}>
                      <Text style={styles.viagemTipo}>
                        {viagem.tipo || 'IDA'} - {viagem.rota_nome || 'Rota'}
                      </Text>
                      <Text style={styles.viagemData}>
                        {viagem.data ? formatDate(viagem.data) : 'Data não disponível'}
                      </Text>
                      <Text style={styles.viagemHorario}>
                        {viagem.horario_inicio ? formatTime(viagem.horario_inicio) : '--:--'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {backgroundColor: statusColor + '20'},
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          {color: statusColor},
                        ]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                  {viagem.origem && viagem.destino && (
                    <Text style={styles.rotaInfo}>
                      {viagem.origem} → {viagem.destino}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
  subtitle: {
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
  viagemCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  viagemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  viagemInfo: {
    flex: 1,
  },
  viagemTipo: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  viagemData: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  viagemHorario: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: fontWeight.semiBold,
  },
  rotaInfo: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});

export default ListaViagens;

