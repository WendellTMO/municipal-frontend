import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { useAuth } from '../../contexts/AuthContext';
import {motoristaService} from '../../services/motoristaService';
import pontoService from '../../services/pontoService';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import { ActionTile, Icon, IconNames, LoadingSpinner, PainelHeader, TripHeroCard } from '../../components';
import { getNotificacoes } from '../../services/notificacaoService';
import { dayLabel } from '../../utils/dayLabel';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import Tappable from '../../components/Tappable';
import { formatarSentido } from '../../utils/formatarSentido';
import { formatarHora } from '../../utils/formatarHora';

const DashboardMotorista = ({navigation}) => {
  const { user } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const carregarNaoLidas = async () => {
      try {
        const notifs = await getNotificacoes();
        setUnreadCount(notifs.filter((n) => !n.enviada).length);
      } catch (e) {
        // o contador é secundário
      }
    };
    carregarNaoLidas();
  }, []);

  const [proximaViagem, setProximaViagem] = useState(null);
  const [loadingViagem, setLoadingViagem] = useState(true);
  const [alunosInfo, setAlunosInfo] = useState({
    totalAlunos: 0,
    alunosConfirmados: 0,
  });
  // loadingAlunos removed - data comes from viagem object directly

  useEffect(() => {
    const loadProximaViagem = async () => {
      try {
        const viagens = await motoristaService.listarViagens().then(unwrapItems);
        
        if (viagens && viagens.length > 0) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          const viagensFuturas = viagens
            .filter((v) => {
              // Exclude finished and cancelled trips
              if (v.status === 'FINALIZADA' || v.status === 'CANCELADA') {
                return false;
              }
              
              const viagemDateStr = v.data.split('T')[0];
              const [year, month, day] = viagemDateStr.split('-').map(Number);
              const viagemDate = new Date(year, month - 1, day);
              
              if (v.horario_fim) {
                const horarioFimStr = v.horario_fim.includes('T') 
                  ? v.horario_fim.substring(11, 16) 
                  : v.horario_fim.substring(0, 5);
                const [horasFim, minutosFim] = horarioFimStr.split(':').map(Number);
                const fimViagem = new Date(year, month - 1, day, horasFim, minutosFim);
                
                if (fimViagem < new Date()) {
                  return false;
                }
              }
              
              return viagemDate >= now;
            })
            .sort((a, b) => {
              const horarioA = a.horario_inicio || '00:00';
              const horarioB = b.horario_inicio || '00:00';
              const dateA = new Date(`${a.data}T${horarioA}`);
              const dateB = new Date(`${b.data}T${horarioB}`);
              return dateA - dateB;
            });

          if (viagensFuturas.length > 0) {
            const proxima = viagensFuturas[0];
            const pontos = await pontoService.getPontosByRota(proxima.rota_id).then(unwrapItems);
            proxima.pontos = pontos;
            
            let origem = 'N/A';
            let destino = 'N/A';
            
            try {
              const pontos = await motoristaService.listarPontosRota(proxima.rota_id).then(unwrapItems);
              if (pontos && pontos.length > 0) {
                origem = pontos[0].nome || 'N/A';
                if (pontos.length > 1) {
                  destino = pontos[pontos.length - 1].nome || 'N/A';
                } else {
                  destino = origem;
                }
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
            
            setProximaViagem({
              ...proxima, // Keep all original data including 'alunos' array
              horario: horarioFormatado,
              status: statusMap[proxima.status] || 'A iniciar',
              origem: proxima.origem || origem,
              destino: proxima.destino || destino,
            });
          } else {
            setProximaViagem(null);
          }
        } else {
          setProximaViagem(null);
        }
      } catch (error) {
        setProximaViagem(null);
      } finally {
        setLoadingViagem(false);
      }
    };

    loadProximaViagem();
  }, []);

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

  return (
    <TelaSegura style={styles.container}>
      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView}>
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
              proximaViagem.status === 'Em andamento' ? colors.success.main : colors.warning.main
            }
            statusIcon={
              proximaViagem.status === 'Em andamento' ? IconNames.route : IconNames.schedule
            }
            title={`${proximaViagem.origem || 'Origem'} → ${proximaViagem.destino || 'Destino'}`}
            subtitle={formatarSentido(proximaViagem.tipo)}
            accessibilityLabel={`Ver detalhes da próxima viagem, ${dayLabel(proximaViagem.data)} às ${proximaViagem.horario}, ${proximaViagem.origem || 'origem'} para ${proximaViagem.destino || 'destino'}, ${proximaViagem.status}`}
            onPress={() =>
              navigation.navigate('DetalheViagemMotorista', {
                viagem: proximaViagem,
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

        {/* Ações rápidas */}
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

        <SairDaConta />
      </ScrollView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
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

