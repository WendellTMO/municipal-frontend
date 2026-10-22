import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { motoristaService } from '../../services/motoristaService';
import { useToast } from '../../components/Toast';
import { colors, spacing, borderRadius, shadows, textStyles, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { formatTime } from '../../utils/masks';

const DIAS_SEMANA = [
  { id: 'SEG', label: 'Seg' },
  { id: 'TER', label: 'Ter' },
  { id: 'QUA', label: 'Qua' },
  { id: 'QUI', label: 'Qui' },
  { id: 'SEX', label: 'Sex' },
  { id: 'SAB', label: 'Sáb' },
  { id: 'DOM', label: 'Dom' },
];

const SENTIDOS = [
  { id: 'IDA', label: 'Ida', icon: IconNames.route },
  { id: 'VOLTA', label: 'Volta', icon: IconNames.route },
  { id: 'CIRCULAR', label: 'Circular', icon: IconNames.route },
];

const DefinirHorariosRota = ({ navigation, route }) => {
  const params = route?.params || {};
  const { rota, isNovaRota } = params;
  const rotaId = rota?.id;
  const rotaNome = rota?.nome || 'Rota';
  const pontosRota = rota?.pontos || [];
  const motoristaPadraoId = params.motorista_padrao_id || null;
  const veiculoPadraoId = params.veiculo_padrao_id || null;

  const toast = useToast();

  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Form state for new schedule
  const [novoHorario, setNovoHorario] = useState('');
  const [novoSentido, setNovoSentido] = useState('IDA');
  const [novosDias, setNovosDias] = useState(['SEG', 'TER', 'QUA', 'QUI', 'SEX']);

  useEffect(() => {
    const loadHorarios = async () => {
      if (!rotaId) {
        setLoading(false);
        return;
      }

      try {
        const data = await motoristaService.listarHorariosRota(rotaId).then(unwrapItems);
        setHorarios(data || []);
      } catch (error) {
        console.error('Error loading schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHorarios();
  }, [rotaId]);

  const toggleDia = (diaId) => {
    setNovosDias(prev => 
      prev.includes(diaId) 
        ? prev.filter(d => d !== diaId)
        : [...prev, diaId]
    );
  };

  const handleAdicionarHorario = async () => {
    if (!novoHorario.trim()) {
      toast.error('Informe o horário (ex: 06:30)');
      return;
    }

    // Validate time format HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(novoHorario)) {
      toast.error('Formato inválido. Use HH:MM (ex: 06:30)');
      return;
    }

    if (novosDias.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    try {
      setHorarios([...horarios, {
        horario_saida: novoHorario,
        sentido: novoSentido,
        dias: novosDias,
      }]);
      
      // Reset form
      setNovoHorario('');
      setNovoSentido('IDA');
      setNovosDias(['SEG', 'TER', 'QUA', 'QUI', 'SEX']);
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error(error?.message || 'Erro ao adicionar horário');
    } finally {
      setSalvando(false);
    }
  };

  const handleConcluir = async () => {
    if (horarios.length === 0) {
      toast.warning('Adicione pelo menos um horário antes de concluir');
      return;
    }
    toast.success('Rota configurada com sucesso!');
    if(isNovaRota) {
      await motoristaService.criarRota({
        nome: rotaNome,
        pontos: pontosRota.map(p => ({
          ponto_id: p.id,
          ordem: p.ordem,
        })),
        horarios: horarios,
        motorista_padrao_id: motoristaPadraoId,
        veiculo_padrao_id: veiculoPadraoId,
      });
    } else {
      await motoristaService.adicionarHorarioRota(rotaId, horarios);
    }
    navigation.popToTop();
  };

  const formatDias = (dias) => {
    if (!dias || dias.length === 0) return '-';
    if (dias.length === 7) return 'Todos os dias';
    if (dias.length === 5 && !dias.includes('SAB') && !dias.includes('DOM')) {
      return 'Seg a Sex';
    }
    return dias.join(', ');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name={IconNames.back} size="md" color={colors.primary.contrast} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Horários</Text>
            <Text style={styles.headerSubtitle}>{rotaNome}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Icon name={IconNames.schedule} size="lg" color={colors.primary.contrast} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Existing Schedules */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Horários Cadastrados</Text>
            
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary.dark} />
            ) : horarios.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name={IconNames.schedule} size="xl" color={colors.neutral[300]} />
                <Text style={styles.emptyStateText}>Nenhum horário cadastrado</Text>
              </View>
            ) : (
              horarios.map((horario, index) => (
                <View key={horario.id || index} style={styles.horarioItem}>
                  <View style={styles.horarioInfo}>
                    <Text style={styles.horarioTime}>{horario.horario_saida}</Text>
                    <View style={styles.horarioMeta}>
                      <View style={[
                        styles.sentidoBadge,
                        horario.sentido === 'IDA' && styles.sentidoIda,
                        horario.sentido === 'VOLTA' && styles.sentidoVolta,
                        horario.sentido === 'CIRCULAR' && styles.sentidoCircular,
                      ]}>
                        <Text style={styles.sentidoText}>{horario.sentido}</Text>
                      </View>
                      <Text style={styles.diasText}>
                        {formatDias(horario.dias?.map(d => d.dia || d))}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Add New Schedule Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Adicionar Novo Horário</Text>

            {/* Time Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Horário de Saída</Text>
              <TextInput
                style={styles.input}
                placeholder="06:30"
                placeholderTextColor={colors.text.hint}
                value={novoHorario}
                onChangeText={v => setNovoHorario(formatTime(v))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            {/* Sentido Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sentido</Text>
              <View style={styles.sentidoGrid}>
                {SENTIDOS.map(sentido => (
                  <TouchableOpacity
                    key={sentido.id}
                    style={[
                      styles.sentidoOption,
                      novoSentido === sentido.id && styles.sentidoOptionSelected,
                    ]}
                    onPress={() => setNovoSentido(sentido.id)}
                  >
                    <Text style={[
                      styles.sentidoOptionText,
                      novoSentido === sentido.id && styles.sentidoOptionTextSelected,
                    ]}>
                      {sentido.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Days Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dias de Operação</Text>
              <View style={styles.diasGrid}>
                {DIAS_SEMANA.map(dia => (
                  <TouchableOpacity
                    key={dia.id}
                    style={[
                      styles.diaChip,
                      novosDias.includes(dia.id) && styles.diaChipSelected,
                    ]}
                    onPress={() => toggleDia(dia.id)}
                  >
                    <Text style={[
                      styles.diaChipText,
                      novosDias.includes(dia.id) && styles.diaChipTextSelected,
                    ]}>
                      {dia.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Add Button */}
            <TouchableOpacity
              style={[styles.addButton, salvando && styles.buttonDisabled]}
              onPress={handleAdicionarHorario}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Icon name={IconNames.add} size="sm" color={colors.text.inverse} />
                  <Text style={styles.addButtonText}>Adicionar Horário</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.concluirButton}
          onPress={handleConcluir}
        >
          <Icon name={IconNames.checkCircle} size="md" color={colors.text.inverse} />
          <Text style={styles.concluirButtonText}>Concluir Configuração</Text>
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  cardTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyContainerText: {
    ...textStyles.h4,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...textStyles.bodySmall,
    color: colors.text.hint,
    marginTop: spacing.sm,
  },
  horarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  horarioInfo: {
    flex: 1,
  },
  horarioTime: {
    ...textStyles.h3,
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
  },
  horarioMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sentidoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[200],
  },
  sentidoIda: {
    backgroundColor: colors.success.light,
  },
  sentidoVolta: {
    backgroundColor: colors.warning.light,
  },
  sentidoCircular: {
    backgroundColor: colors.info.light,
  },
  sentidoText: {
    ...textStyles.caption,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
  },
  diasText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.inputLabel,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.inputText,
    borderWidth: 1,
    borderColor: colors.border.light,
    color: colors.text.primary,
  },
  sentidoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sentidoOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  sentidoOptionSelected: {
    borderColor: colors.primary.dark,
    backgroundColor: colors.primary.lighter,
  },
  sentidoOptionText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  sentidoOptionTextSelected: {
    color: colors.primary.dark,
  },
  diasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  diaChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  diaChipSelected: {
    borderColor: colors.primary.dark,
    backgroundColor: colors.primary.dark,
  },
  diaChipText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  diaChipTextSelected: {
    color: colors.text.inverse,
  },
  addButton: {
    backgroundColor: colors.primary.dark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  addButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    backgroundColor: colors.background.paper,
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.sm,
  },
  concluirButton: {
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  concluirButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
});

export default DefinirHorariosRota;
