import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import {motoristaService} from '../../services/motoristaService';
import pontoService from '../../services/pontoService';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import { ActionTile, Icon, IconNames, LoadingSpinner, TripHeroCard } from '../../components';
import { dayLabel } from '../../utils/dayLabel';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';

const DashboardMotorista = ({navigation}) => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    const roleMap = {
      'aluno': 'Aluno',
      'motorista': 'Motorista',
      'gestor': 'Gestor'
    };
    return roleMap[role] || role;
  };

  const getUserInfo = () => {
    const roleLabel = getRoleLabel(user?.role);
    const municipioInfo = user?.municipio 
      ? `${user.municipio.nome}${user.municipio.uf ? ` - ${user.municipio.uf}` : ''}`
      : '';
    return municipioInfo ? `${roleLabel} • ${municipioInfo}` : roleLabel;
  };

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
            
            let horarioFormatado = '--:--';
            if (proxima.horario_inicio) {
              if (proxima.horario_inicio.includes('T')) {
                horarioFormatado = proxima.horario_inicio.substring(11, 16);
              } else if (proxima.horario_inicio.includes(':')) {
                horarioFormatado = proxima.horario_inicio.substring(0, 5);
              }
            }
            
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>
                Olá, {user?.nome || 'Motorista'}!
              </Text>
              <Text style={styles.subtitle}>
                {getUserInfo()}
              </Text>
            </View>
            <View style={styles.avatarContainer}>
              <Icon name={IconNames.person} size="xl" color={colors.primary.contrast} />
            </View>
          </View>
        </View>

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
            subtitle={proximaViagem.tipo}
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
            <TouchableOpacity
              style={styles.iniciarButton}
              onPress={() =>
                navigation.navigate('InicioFimViagem', {viagem: proximaViagem})
              }>
              <Icon name={IconNames.route} size="md" color={colors.text.inverse} />
              <Text style={styles.iniciarButtonText}>Iniciar Viagem</Text>
            </TouchableOpacity>
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
                <Icon name={IconNames.route} size="xxl" color={colors.neutral[300]} />
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
      </ScrollView>
    </SafeAreaView>
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
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    ...textStyles.h2,
    color: colors.primary.contrast,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.75)',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Próxima Viagem Card - Overlaps header
  proximaViagemCard: {
    margin: spacing.base,
    marginTop: -spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary.lighter,
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
    gap: spacing.sm,
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.md,
    padding: spacing.base,
  },
  iniciarButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
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
    color: colors.text.hint,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  // Botões Rápidos
  botoesRapidos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
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

