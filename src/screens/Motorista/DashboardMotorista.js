import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { useAuth } from '../../contexts/AuthContext';
import {motoristaService} from '../../services/motoristaService';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import { ActionTile, Icon, IconNames, LoadingSpinner, PainelHeader, TripHeroCard } from '../../components';
import { getNotificacoes } from '../../services/notificacaoService';
import { dayLabel } from '../../utils/dayLabel';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import ProximasViagens from '../../components/ProximasViagens';
import Tappable from '../../components/Tappable';
import { formatarSentido } from '../../utils/formatarSentido';
import { formatarHora } from '../../utils/formatarHora';
import { organizarViagens } from '../../utils/viagensMotorista';
import { chaveDoCache, guardarCache, lerCache } from '../../utils/cacheTela';

const DashboardMotorista = ({navigation}) => {
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  const carregarNaoLidas = useCallback(async () => {
    try {
      const notifs = await getNotificacoes();
      setUnreadCount(notifs.filter((n) => !n.enviada).length);
    } catch (e) {
      // o contador é secundário
    }
  }, []);

  // Último dado da home: aparece na hora ao voltar a ela, enquanto o novo é buscado por trás.
  const chavePainel = chaveDoCache(user?.id, 'painel-motorista');
  const emCache = lerCache(chavePainel);
  const [proximaViagem, setProximaViagem] = useState(emCache ? emCache.proximaViagem : null);
  const [proximas, setProximas] = useState(emCache ? emCache.proximas : []);
  const [loadingViagem, setLoadingViagem] = useState(!emCache);
  const [alunosInfo, setAlunosInfo] = useState({
    totalAlunos: 0,
    alunosConfirmados: 0,
  });
  // loadingAlunos removed - data comes from viagem object directly

  const loadProximaViagem = useCallback(async () => {
    {
      try {
        const viagens = await motoristaService.listarViagens().then(unwrapItems);
        
        if (viagens && viagens.length > 0) {
          // A próxima é a mais perto de agora; as que passaram sem registro vão para o histórico.
          const organizadas = organizarViagens(viagens, new Date());
          setProximas(organizadas.proximas);

          if (organizadas.proxima) {
            const proxima = organizadas.proxima;
            let origem = 'N/A';
            let destino = 'N/A';

            // Uma só busca dos pontos: serve ao detalhe da viagem e a origem e destino do cartão.
            try {
              const pontos = await motoristaService.listarPontosRota(proxima.rota_id).then(unwrapItems);
              proxima.pontos = pontos;
              if (pontos && pontos.length > 0) {
                origem = pontos[0].nome || 'N/A';
                destino = pontos.length > 1 ? pontos[pontos.length - 1].nome || 'N/A' : origem;
              }
            } catch (e) {
              // Silent fail - use default values
            }

            const horarioFormatado = formatarHora(proxima.horario_inicio);

            // Map backend status to display status
            const statusMap = {
              'AGENDADA': 'A iniciar',
              'EM_ANDAMENTO': 'Em andamento',
              'FINALIZADA': 'Finalizada',
              'CANCELADA': 'Cancelada',
            };

            const nova = {
              ...proxima, // Keep all original data including 'alunos' array
              horario: horarioFormatado,
              status: statusMap[proxima.status] || 'A iniciar',
              statusApi: proxima.status,
              origem: proxima.origem || origem,
              destino: proxima.destino || destino,
            };
            setProximaViagem(nova);
            guardarCache(chavePainel, { proximaViagem: nova, proximas: organizadas.proximas });
          } else {
            setProximaViagem(null);
            guardarCache(chavePainel, { proximaViagem: null, proximas: organizadas.proximas });
          }
        } else {
          setProximaViagem(null);
          setProximas([]);
          guardarCache(chavePainel, { proximaViagem: null, proximas: [] });
        }
      } catch (error) {
        // Sem rede, quem já tem dado na tela fica com ele.
        if (!lerCache(chavePainel)) {
          setProximaViagem(null);
          setProximas([]);
        }
      } finally {
        setLoadingViagem(false);
      }
    }
  }, [chavePainel]);

  // Recarrega ao abrir, ao voltar para a tela e ao arrastar para baixo, para o contador do sino
  // e o botão Iniciar/Continuar viagem não ficarem com dados velhos.
  const [refreshing, setRefreshing] = useState(false);
  const carregandoRef = useRef(false);
  const recarregar = useCallback(async () => {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    try {
      await Promise.all([carregarNaoLidas(), loadProximaViagem()]);
    } finally {
      carregandoRef.current = false;
    }
  }, [carregarNaoLidas, loadProximaViagem]);

  useEffect(() => {
    recarregar();
    return navigation?.addListener ? navigation.addListener('focus', recarregar) : undefined;
  }, [navigation, recarregar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await recarregar();
    setRefreshing(false);
  };

  // Atualizar informações de alunos a partir da próxima viagem
  useEffect(() => {
    if (!proximaViagem) {
      setAlunosInfo({
        totalAlunos: 0,
        alunosConfirmados: 0,
      });
      return;
    }
    
    // Use data directly from the viagem object (from /viagens/minhas endpoint)
    setAlunosInfo({
      totalAlunos: proximaViagem.total_alunos || 0,
      alunosConfirmados: proximaViagem.alunos_confirmados_count || 0,
    });
  }, [proximaViagem]);

  const emAndamento = proximaViagem?.status === 'Em andamento';
  const cancelada = proximaViagem?.statusApi === 'CANCELADA';
  const ehGestor = user?.role?.toLowerCase() === 'gestor';

  return (
    <TelaSegura style={styles.container}>
      <ScrollView
        contentContainerStyle={withFabSpace()}
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <PainelHeader
          perfil="Motorista"
          unreadCount={unreadCount}
          onBellPress={() => navigation.navigate('NotificacoesMotorista')}
          onOpenConfig={() => navigation.navigate('ConfigNotificacoesMotorista')}
        />

        {/* Próxima Viagem */}
        {proximaViagem ? (
          <TripHeroCard
            dayLabel={dayLabel(proximaViagem.data)}
            time={proximaViagem.horario}
            statusLabel={proximaViagem.status}
            statusColor={
              cancelada
                ? colors.error.dark
                : proximaViagem.status === 'Em andamento'
                ? colors.success.main
                : colors.warning.main
            }
            statusIcon={
              cancelada
                ? IconNames.error
                : proximaViagem.status === 'Em andamento'
                ? IconNames.route
                : IconNames.schedule
            }
            fundo={cancelada ? '#9F1D1D' : undefined}
            title={`${proximaViagem.origem || 'Origem'} → ${proximaViagem.destino || 'Destino'}`}
            subtitle={
              cancelada && proximaViagem.motivo_cancelamento
                ? `${formatarSentido(proximaViagem.tipo)} · Cancelada: ${proximaViagem.motivo_cancelamento}`
                : formatarSentido(proximaViagem.tipo)
            }
            accessibilityLabel={`Ver detalhes da próxima viagem, ${dayLabel(proximaViagem.data)} às ${proximaViagem.horario}, ${proximaViagem.origem || 'origem'} para ${proximaViagem.destino || 'destino'}, ${proximaViagem.status}`}
            onPress={() =>
              // O detalhe espera o status da API (AGENDADA...), não o texto do cartão.
              navigation.navigate('DetalheViagemMotorista', {
                viagem: { ...proximaViagem, status: proximaViagem.statusApi },
              })
            }>
            <View style={styles.alunosLinha}>
              <Icon name={IconNames.group} size="sm" color="#FFFFFF" />
              <Text style={styles.alunosTexto}>
                {alunosInfo.totalAlunos > 0
                  ? `${alunosInfo.alunosConfirmados} de ${alunosInfo.totalAlunos} alunos confirmados`
                  : 'Nenhum aluno inscrito nesta rota'}
              </Text>
            </View>
            {cancelada ? (
              <Text style={styles.avisoRetomar}>Se o ônibus ficar pronto, iniciar desfaz o cancelamento e avisa os alunos.</Text>
            ) : null}
            <Tappable navega
              style={[
                styles.iniciarButton,
                emAndamento ? styles.continuarButton : null,
              ]}
              onPress={() =>
                navigation.navigate('InicioFimViagem', {viagem: proximaViagem})
              }
              accessibilityRole="button"
              accessibilityLabel={emAndamento ? 'Continuar viagem' : 'Iniciar viagem'}>
              <Icon name={IconNames.play} size={30} color="#FFFFFF" />
              <Text style={styles.iniciarButtonText}>
                {emAndamento ? 'Continuar viagem' : 'Iniciar viagem'}
              </Text>
            </Tappable>
          </TripHeroCard>
        ) : (
          <View style={styles.proximaViagemCard}>
            <View style={styles.cardHeader}>
              <Icon name={IconNames.schedule} size="md" color={colors.primary.dark} />
              <Text style={styles.cardTitle}>Próxima Viagem</Text>
            </View>
            {loadingViagem ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary.dark} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name={IconNames.route} size="xxl" color={colors.neutral[400]} />
                <Text style={styles.emptyText}>Nenhuma viagem agendada</Text>
                <Text style={styles.emptySubtext}>Aguarde o gestor atribuir viagens para você</Text>
              </View>
            )}
          </View>
        )}

        <ProximasViagens
          viagens={proximas}
          onAbrir={viagem => navigation.navigate('DetalheViagemMotorista', { viagem })}
          onVerTodas={() => navigation.navigate('ListaViagens', { soProximas: true })}
        />

        <Tappable
          style={styles.historicoEntrada}
          onPress={() => navigation.navigate('HistoricoViagensMotorista')}
          accessibilityRole="button"
          accessibilityLabel="Histórico de viagens">
          <Icon name={IconNames.schedule} size="md" color={colors.primary.dark} />
          <Text style={styles.historicoTitulo}>Histórico de viagens</Text>
          <Icon name={IconNames.chevronRight} size="md" color={colors.neutral[400]} />
        </Tappable>

        {/* Ações rápidas */}
        {ehGestor ? (
        <View style={styles.botoesRapidos}>
          <ActionTile
            icon={IconNames.bus}
            label="Rotas"
            accessibilityLabel="Minhas Rotas"
            color={colors.solid.blue}
            onPress={() => navigation.navigate('RotaMotorista')}
          />
          <ActionTile
            icon={IconNames.route}
            label="Viagens"
            accessibilityLabel="Minhas Viagens"
            color={colors.solid.teal}
            onPress={() => navigation.navigate('ListaViagens')}
          />
          {/* Gestor-only buttons */}
          {user?.role?.toLowerCase() === 'gestor' && (
            <>
              <ActionTile
                icon={IconNames.add}
                label="Nova rota"
                accessibilityLabel="Criar Rota"
                color={colors.solid.green}
                onPress={() => navigation.navigate('CriarRota')}
              />
              <ActionTile
                icon={IconNames.editCalendar}
                label="Nova viagem"
                accessibilityLabel="Criar Viagem"
                color={colors.solid.amber}
                onPress={() => navigation.navigate('CriarViagem')}
              />
            </>
          )}
          <ActionTile
            icon={IconNames.settings}
            label="Ajustes"
            accessibilityLabel="Configurações"
            color={colors.neutral[600]}
            onPress={() => navigation.navigate('ConfigNotificacoesMotorista')}
          />
        </View>
        ) : null}

        {ehGestor ? <SairDaConta /> : null}
      </ScrollView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  historicoEntrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.paper,
  },
  historicoTitulo: { ...textStyles.body, flex: 1, fontWeight: '700', color: colors.text.primary },
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  
  // Header - Styled like DashboardAluno
  
  // Próxima Viagem Card - Overlaps header
  proximaViagemCard: {
    margin: spacing.base,
    marginTop: spacing.lg,
    padding: spacing.lg,
    // Fundo branco sólido como os demais cards; o azul claro deixava o texto cinza ilegível.
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  
  // Alunos Info
  
  // Action Buttons
  avisoRetomar: { ...textStyles.bodySmall, color: '#FFE4E4', marginBottom: spacing.sm },
  iniciarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 14,
    elevation: 6,
  },
  continuarButton: {
    backgroundColor: colors.solid.blue,
    shadowColor: colors.solid.blue,
  },
  iniciarButtonText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  // Empty State
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.h4,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  // Botões Rápidos
  botoesRapidos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    rowGap: spacing.lg,
  },
  alunosLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  alunosTexto: {
    ...textStyles.bodySmall,
    color: '#FFFFFF',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
});

export default DashboardMotorista;

