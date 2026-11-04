import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import {motoristaService} from '../../services/motoristaService';
import {useAuth} from '../../contexts/AuthContext';
import { useFetch } from '../../hooks';
import { LoadingView, ErrorView, EmptyView } from '../../components/LoadingState';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';
import { formatarSentido } from '../../utils/formatarSentido';
import { formatarHora } from '../../utils/formatarHora';
import { formatarData, dataLocal } from '../../utils/dataLocal';
import { organizarViagens } from '../../utils/viagensMotorista';
import FolhaFiltroViagens from '../../components/FolhaFiltroViagens';
import { contarViagens, filtrarViagens, filtroAtivo, filtroViagensPadrao } from '../../utils/filtroViagens';

const ListaViagens = ({navigation, route}) => {
  const { user } = useAuth();
  const params = route?.params || {};
  const rotaFiltro = params.rota; // Optional: filter by specific route
  const soProximas = params.soProximas === true; // Só as que ainda vão acontecer, da mais perto para a mais longe
  const isGestor = user?.role?.toLowerCase() === 'gestor';
  
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState(filtroViagensPadrao());
  const [filtroAberto, setFiltroAberto] = useState(false);

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
    
    if (soProximas) {
      const organizadas = organizarViagens(viagensData, new Date(), 0, Infinity);
      return organizadas.proxima ? [organizadas.proxima, ...organizadas.proximas] : organizadas.proximas;
    }

    // Ordenar por data (mais recentes primeiro)
    return (viagensData || []).sort((a, b) => {
      const dataA = dataLocal(a.data);
      const dataB = dataLocal(b.data);
      return dataB - dataA;
    });
  }, [isGestor, rotaFiltro?.id, soProximas]);

  // Use the useFetch hook
  const { data: viagens, isLoading, isError, error, refetch } = useFetch(
    fetchViagens,
    [rotaFiltro?.id, isGestor, soProximas],
    { showErrorToast: true }
  );

  // "Próximas viagens" já é só o que vem pela frente: o filtro por situação não se aplica.
  const comFiltro = !soProximas;
  const contagem = contarViagens(viagens || [], filtro);
  const visiveis = comFiltro ? filtrarViagens(viagens || [], filtro) : viagens || [];
  const temFiltro = comFiltro && filtroAtivo(filtro);

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

  return (
    <TelaSegura style={styles.container}>
      <SubHeader
        titulo={soProximas ? 'Próximas viagens' : rotaFiltro ? 'Viagens' : 'Minhas Viagens'}
        subtitulo={rotaFiltro ? rotaFiltro.nome : undefined}
        onBack={() => navigation.goBack()}
        direita={
          comFiltro && (viagens || []).length > 0 ? (
            <Tappable
              sombra={false}
              style={styles.funil}
              onPress={() => setFiltroAberto(true)}
              accessibilityRole="button"
              accessibilityLabel={temFiltro ? 'Filtros, ativos' : 'Filtros'}>
              <Icon name={IconNames.filter} size="md" color="#FFFFFF" />
              {temFiltro ? <View style={styles.funilAtivo} /> : null}
            </Tappable>
          ) : null
        }
      />

      {isLoading ? (
        <LoadingView message="Carregando viagens..." />
      ) : isError ? (
        <ErrorView 
          message={error?.message || 'Não foi possível carregar as viagens'} 
          onRetry={refetch} 
        />
      ) : (viagens || []).length === 0 ? (
        <EmptyView
          title={soProximas ? 'Nenhuma viagem pela frente' : rotaFiltro ? 'Nenhuma viagem nesta rota' : 'Nenhuma viagem atribuída'}
          message={soProximas
            ? 'Quando o gestor agendar novas viagens, elas aparecem aqui'
            : rotaFiltro
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
            {temFiltro ? (
              <Text style={styles.resumo}>
                Mostrando {visiveis.length} de {viagens.length} viagens. Toque no funil para mudar.
              </Text>
            ) : null}
            {visiveis.length === 0 ? (
              <Text style={styles.semResultado}>Nenhuma viagem com esses filtros. As finalizadas ficam escondidas até você ligar Finalizadas no funil.</Text>
            ) : null}
            {visiveis.map((viagem) => {
              const statusLabel = getStatusLabel(viagem.status);
              const statusColor = getStatusColor(viagem.status);
              return (
                <Tappable navega
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
                        {formatarSentido(viagem.tipo || 'IDA')} - {viagem.rota_nome || 'Rota'}
                      </Text>
                      <Text style={styles.viagemData}>
                        {viagem.data ? formatarData(viagem.data) : 'Data não disponível'}
                      </Text>
                      <Text style={styles.viagemHorario}>
                        {formatarHora(viagem.horario_inicio)}
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
                </Tappable>
              );
            })}
          </View>
        </ScrollView>
      )}
      <FolhaFiltroViagens
        visible={filtroAberto}
        filtro={filtro}
        contagem={contagem}
        quantas={visiveis.length}
        onMudar={setFiltro}
        onFechar={() => setFiltroAberto(false)}
      />
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  funil: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  funilAtivo: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.warning.main,
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  resumo: { ...textStyles.bodySmall, color: colors.text.secondary, marginBottom: spacing.base },
  semResultado: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl },
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

