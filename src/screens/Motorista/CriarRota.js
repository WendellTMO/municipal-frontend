import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { motoristaService } from '../../services/motoristaService';
import { gestorService } from '../../services/gestorService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';

const SelectorCard = ({ item, selected, onPress, label, sublabel }) => (
  <TouchableOpacity
    style={[styles.selectorCard, selected && styles.selectorCardSelected]}
    onPress={onPress}>
    <View style={styles.selectorCardContent}>
      <Text
        style={[styles.selectorCardLabel, selected && styles.selectorCardLabelSelected]}
        numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text
          style={[styles.selectorCardSub, selected && styles.selectorCardSubSelected]}
          numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </View>
    {selected && (
      <View style={styles.selectorCheck}>
        <Icon name={IconNames.check} size="sm" color={colors.primary.dark} />
      </View>
    )}
  </TouchableOpacity>
);

const CriarRota = ({ navigation }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [nomeRota, setNomeRota] = useState('');
  const [motoristas, setMotoristas] = useState([]);
  const [onibus, setOnibus] = useState([]);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState(null);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOpcoes = async () => {
      try {
        const [motData, onibusData] = await Promise.all([
          motoristaService.listarMotoristas().then(unwrapItems).catch(() => []),
          gestorService.listarOnibus().then(unwrapItems).catch(() => []),
        ]);
        setMotoristas(motData || []);
        setOnibus(onibusData || []);
      } finally {
        setLoadingOpcoes(false);
      }
    };
    loadOpcoes();
  }, []);

  const handleCriarRota = () => {
    if (!nomeRota.trim()) {
      toast.error('Por favor, informe o nome da rota');
      return;
    }
    if (!user?.prefeitura_id) {
      toast.error('Você não possui um município cadastrado. Entre em contato com o gestor.');
      return;
    }

    navigation.navigate('DefinirPontosRota', {
      rota: { nome: nomeRota.trim() },
      isNovaRota: true,
      motorista_padrao_id: motoristaSelecionado,
      veiculo_padrao_id: veiculoSelecionado,
    });
  };

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Nova Rota" subtitulo="Configure sua nova rota" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.infoBox}>
            <Icon name={IconNames.info} size="md" color={colors.info.main} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Defina o nome da rota e, opcionalmente, o motorista e veículo padrão. Você
              adicionará os pontos de parada e horários nos próximos passos.
            </Text>
          </View>

          {/* Nome da Rota */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificação</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Rota *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Galante → UFCG (Manhã)"
                  placeholderTextColor={colors.text.hint}
                  value={nomeRota}
                  onChangeText={setNomeRota}
                  editable={!loading}
                />
                <Text style={styles.helperText}>
                  Escolha um nome descritivo que identifique origem, destino e turno
                </Text>
              </View>

              {user?.prefeitura_id && (
                <View style={styles.municipioRow}>
                  <Icon name={IconNames.location} size="sm" color={colors.text.secondary} />
                  <Text style={styles.municipioText}>
                    {user.municipio_nome || user.prefeitura_nome || 'Município configurado'}
                    {user.municipio_uf ? ` · ${user.municipio_uf}` : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Motorista */}
          {loadingOpcoes ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary.dark} />
              <Text style={styles.loadingText}>Carregando motoristas e veículos...</Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Motorista Padrão</Text>
                  <Text style={styles.sectionBadge}>Opcional</Text>
                </View>
                <Text style={styles.sectionHint}>
                  Motorista responsável por esta rota. Pode ser alterado depois.
                </Text>

                {motoristas.length === 0 ? (
                  <View style={styles.emptyOption}>
                    <Text style={styles.emptyOptionText}>Nenhum motorista cadastrado</Text>
                  </View>
                ) : (
                  <View style={styles.selectorList}>
                    {motoristaSelecionado !== null && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setMotoristaSelecionado(null)}>
                        <Icon name={IconNames.close} size="sm" color={colors.text.secondary} />
                        <Text style={styles.clearButtonText}>Nenhum (remover seleção)</Text>
                      </TouchableOpacity>
                    )}
                    {motoristas.map(mot => (
                      <SelectorCard
                        key={mot.id}
                        item={mot}
                        selected={motoristaSelecionado === mot.id}
                        onPress={() =>
                          setMotoristaSelecionado(
                            motoristaSelecionado === mot.id ? null : mot.id,
                          )
                        }
                        label={mot.nome}
                        sublabel={mot.cnh ? `CNH: ${mot.cnh}` : mot.email}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Veículo */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Veículo Padrão</Text>
                  <Text style={styles.sectionBadge}>Opcional</Text>
                </View>
                <Text style={styles.sectionHint}>
                  Ônibus utilizado nesta rota por padrão.
                </Text>

                {onibus.length === 0 ? (
                  <View style={styles.emptyOption}>
                    <Text style={styles.emptyOptionText}>Nenhum veículo cadastrado na frota</Text>
                  </View>
                ) : (
                  <View style={styles.selectorList}>
                    {veiculoSelecionado !== null && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setVeiculoSelecionado(null)}>
                        <Icon name={IconNames.close} size="sm" color={colors.text.secondary} />
                        <Text style={styles.clearButtonText}>Nenhum (remover seleção)</Text>
                      </TouchableOpacity>
                    )}
                    {onibus.map(bus => (
                      <SelectorCard
                        key={bus.id}
                        item={bus}
                        selected={veiculoSelecionado === bus.id}
                        onPress={() =>
                          setVeiculoSelecionado(
                            veiculoSelecionado === bus.id ? null : bus.id,
                          )
                        }
                        label={`${bus.placa}${bus.modelo ? ` · ${bus.modelo}` : ''}`}
                        sublabel={bus.capacidade ? `${bus.capacidade} passageiros` : undefined}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.criarButton, (!nomeRota.trim() || loading) && styles.criarButtonDisabled]}
            onPress={handleCriarRota}
            disabled={!nomeRota.trim() || loading || loadingOpcoes}>
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Text style={styles.criarButtonText}>Próximo: Pontos de Parada</Text>
                <Icon name={IconNames.forward} size="md" color={colors.text.inverse} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TelaSegura>
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
    paddingBottom: spacing.xxxl,
  },
  infoBox: {
    backgroundColor: colors.info.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info.main,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    ...textStyles.bodySmall,
    color: colors.info.dark,
    flex: 1,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionBadge: {
    ...textStyles.caption,
    color: colors.text.secondary,
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  sectionHint: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  inputGroup: {
    marginBottom: spacing.md,
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
  helperText: {
    ...textStyles.inputHelper,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  municipioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  municipioText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  loadingText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  selectorList: {
    gap: spacing.sm,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.xs,
  },
  selectorCardSelected: {
    borderColor: colors.primary.dark,
    backgroundColor: colors.info.light,
  },
  selectorCardContent: {
    flex: 1,
  },
  selectorCardLabel: {
    ...textStyles.body,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  selectorCardLabelSelected: {
    color: colors.primary.dark,
    fontWeight: fontWeight.semiBold,
  },
  selectorCardSub: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  selectorCardSubSelected: {
    color: colors.primary.main,
  },
  selectorCheck: {
    marginLeft: spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  clearButtonText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  emptyOption: {
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  emptyOptionText: {
    ...textStyles.bodySmall,
    color: colors.text.hint,
  },
  criarButton: {
    backgroundColor: colors.primary.dark,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  criarButtonDisabled: {
    backgroundColor: colors.border.light,
  },
  criarButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
});

export default CriarRota;
