import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { alunoService } from '../../services';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { unwrapItems } from '../../types';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import Tappable from '../../components/Tappable';
import { alertar } from '../../utils/alerta';
import { useAuth } from '../../contexts/AuthContext';

const POR_PAGINA = 20;

const SelecaoRotas = ({navigation}) => {
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const buscaAtual = useRef(0);
  const [rotasDisponiveis, setRotasDisponiveis] = useState([]);
  const [rotasInscritas, setRotasInscritas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState(null);
  const [unsubscribing, setUnsubscribing] = useState(null);

  // Primeira página da busca (nome da rota ou do município; outros municípios só se o aluno pedir).
  const loadRotas = async (texto = busca) => {
    const minha = ++buscaAtual.current;
    try {
      const [rotas, rotasInscritasData] = await Promise.all([
        alunoService.listarRotas({ limit: POR_PAGINA, q: texto.trim(), incluirOutras: true }).then(unwrapItems),
        alunoService.listarMinhasRotas().then(unwrapItems),
      ]);
      if (minha !== buscaAtual.current) return; // chegou uma busca mais nova
      setRotasDisponiveis(rotas);
      setTemMais(rotas.length >= POR_PAGINA);
      setRotasInscritas(rotasInscritasData);
    } catch (error) {
      console.error('Error loading routes:', error);
      alertar('Erro', 'Não foi possível carregar as rotas. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Digitou: busca de novo depois de uma pausa curta.
  useEffect(() => {
    const espera = setTimeout(() => loadRotas(busca), 250);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const carregarMais = async () => {
    if (carregandoMais) return;
    setCarregandoMais(true);
    try {
      const proxima = await alunoService
        .listarRotas({ limit: POR_PAGINA, offset: rotasDisponiveis.length, q: busca.trim(), incluirOutras: true })
        .then(unwrapItems);
      const vistas = new Set(rotasDisponiveis.map((r) => r.id));
      setRotasDisponiveis((atuais) => [...atuais, ...proxima.filter((r) => !vistas.has(r.id))]);
      setTemMais(proxima.length >= POR_PAGINA);
    } catch (error) {
      alertar('Erro', 'Não foi possível carregar mais rotas.');
    } finally {
      setCarregandoMais(false);
    }
  };

  const rotasIdsInscritas = rotasInscritas.map((r) => r.id);
  const rotasDisponiveisFiltradas = rotasDisponiveis.filter(
    (rota) => !rotasIdsInscritas.includes(rota.id),
  );

  // A busca já vem filtrada do servidor.
  const rotasFiltradas = rotasDisponiveisFiltradas;
  const deOutroMunicipio = (rota) => !!user?.prefeitura_id && rota.prefeitura_id !== user.prefeitura_id;

  const handleCadastrar = async (rota) => {
    try {
      setSubscribing(rota.id);
      await alunoService.gerenciarInscricaoRota(rota.id, 'inscrever');
      const rotasInscritasAtualizadas = await alunoService.listarMinhasRotas().then(unwrapItems);
      setRotasInscritas(rotasInscritasAtualizadas || []);
      setRotasDisponiveis(rotasDisponiveis.filter((r) => r.id !== rota.id));
      alertar('Sucesso', 'Você foi cadastrado nesta rota!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error subscribing to route:', error);
      alertar('Erro', error?.message || 'Não foi possível cadastrar na rota. Tente novamente.');
    } finally {
      setSubscribing(null);
    }
  };

  const handleSairDaRota = (rota) => {
    alertar(
      'Sair da rota',
      `Deseja sair da rota "${rota.nome}"? Você poderá se inscrever novamente depois.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnsubscribing(rota.id);
              await alunoService.gerenciarInscricaoRota(rota.id, 'desinscrever');
              setRotasInscritas(prev => prev.filter(r => r.id !== rota.id));
              setRotasDisponiveis(prev => [...prev, rota]);
              alertar('Pronto', 'Você saiu da rota com sucesso.');
            } catch (error) {
              alertar('Erro', error?.message || 'Não foi possível sair da rota.');
            } finally {
              setUnsubscribing(null);
            }
          },
        },
      ],
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRotas();
  };

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Rotas" subtitulo="Encontre sua rota escolar" onBack={() => navigation.goBack()} />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name={IconNames.search} size="md" color={colors.text.hint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar rota ou município..."
            placeholderTextColor={colors.text.hint}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <Tappable onPress={() => setBusca('')}>
              <Icon name={IconNames.close} size="md" color={colors.text.hint} />
            </Tappable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary.main} />
          <Text style={styles.loadingText}>Carregando rotas...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={withFabSpace()}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.secondary.main]}
              tintColor={colors.secondary.main}
            />
          }>
          <View style={styles.content}>
            {/* Minhas Rotas Cadastradas */}
            {rotasInscritas.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Minhas Rotas ({rotasInscritas.length})
                </Text>
                {rotasInscritas.map((rota) => (
                  <View key={rota.id} style={[styles.rotaCard, styles.rotaCardInscrita]}>
                    <Tappable navega
                      style={styles.rotaHeader}
                      onPress={() => navigation.navigate('RotaAluno', { rota })}>
                      <View style={[styles.rotaIconContainer, { backgroundColor: colors.success.light }]}>
                        <Icon name={IconNames.checkCircle} size="lg" color={colors.success.main} />
                      </View>
                      <View style={styles.rotaInfo}>
                        <Text style={styles.rotaNome}>{rota.nome}</Text>
                        <View style={styles.rotaMeta}>
                          <Icon name={IconNames.location} size="sm" color={colors.text.secondary} />
                          <Text style={styles.rotaBairro}>
                            {rota.municipio_nome 
                              ? `${rota.municipio_nome}${rota.municipio_uf ? ` - ${rota.municipio_uf}` : ''}`
                              : 'Município não informado'}
                          </Text>
                        </View>
                      </View>
                      <Icon name={IconNames.chevronRight} size="md" color={colors.text.secondary} />
                    </Tappable>
                    <Tappable
                      style={styles.sairRotaButton}
                      onPress={() => handleSairDaRota(rota)}
                      disabled={unsubscribing === rota.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Sair da rota ${rota.nome}`}>
                      {unsubscribing === rota.id ? (
                        <ActivityIndicator size="small" color={colors.error.main} />
                      ) : (
                        <>
                          <Icon name={IconNames.delete} size="sm" color={colors.error.main} />
                          <Text style={styles.sairRotaButtonText}>Sair da rota</Text>
                        </>
                      )}
                    </Tappable>
                  </View>
                ))}
              </>
            )}

            {/* Rotas Disponíveis para Inscrição */}
            <Text style={[styles.sectionTitle, rotasInscritas.length > 0 && { marginTop: spacing.lg }]}>
              Rotas Disponíveis ({rotasFiltradas.length})
            </Text>

            {rotasFiltradas.map((rota) => {
              const isSubscribing = subscribing === rota.id;
              return (
                <View key={rota.id} style={styles.rotaCard}>
                  <View style={styles.rotaHeader}>
                    <View style={styles.rotaIconContainer}>
                      <Icon name={IconNames.route} size="lg" color={colors.secondary.main} />
                    </View>
                    <View style={styles.rotaInfo}>
                      <Text style={styles.rotaNome}>{rota.nome}</Text>
                      <View style={styles.rotaMeta}>
                        <Icon name={IconNames.location} size="sm" color={colors.text.secondary} />
                        <Text style={styles.rotaBairro}>
                          {rota.municipio_nome 
                            ? `${rota.municipio_nome}${rota.municipio_uf ? ` - ${rota.municipio_uf}` : ''}`
                            : 'Município não informado'}
                          {deOutroMunicipio(rota) ? '  ·  outro município' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Tappable
                    style={[styles.cadastrarButton, isSubscribing && styles.cadastrarButtonDisabled]}
                    onPress={() => handleCadastrar(rota)}
                    disabled={isSubscribing}>
                    {isSubscribing ? (
                      <ActivityIndicator color={colors.primary.contrast} />
                    ) : (
                      <>
                        <Icon name={IconNames.add} size="md" color={colors.primary.contrast} />
                        <Text style={styles.cadastrarButtonText}>Cadastrar nesta rota</Text>
                      </>
                    )}
                  </Tappable>
                </View>
              );
            })}

            {temMais ? (
              <Tappable
                style={styles.verMais}
                onPress={carregarMais}
                disabled={carregandoMais}
                sombra={false}
                accessibilityLabel="Ver mais rotas">
                {carregandoMais ? (
                  <ActivityIndicator color={colors.secondary.main} />
                ) : (
                  <Text style={styles.verMaisTexto}>Ver mais rotas</Text>
                )}
              </Tappable>
            ) : null}

            {rotasFiltradas.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Icon name={IconNames.search} size="huge" color={colors.neutral[300]} />
                </View>
                <Text style={styles.emptyStateTitle}>Nenhuma rota encontrada</Text>
                <Text style={styles.emptyStateText}>Tente buscar com outros termos</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  verMais: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.secondary.main,
  },
  verMaisTexto: { ...textStyles.body, color: colors.secondary.main, fontWeight: '700' },
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.secondary.main,
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
    backgroundColor: colors.secondary.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.secondary.contrast,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: colors.secondary.light,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.base,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  rotaCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  rotaCardInscrita: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success.main,
  },
  rotaHeader: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  rotaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary.lighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rotaInfo: {
    flex: 1,
  },
  rotaNome: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  rotaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rotaBairro: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  cadastrarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.xs,
  },
  cadastrarButtonDisabled: {
    opacity: 0.6,
  },
  cadastrarButtonText: {
    ...textStyles.button,
    color: colors.primary.contrast,
  },
  sairRotaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.error.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  sairRotaButtonText: {
    ...textStyles.caption,
    color: colors.error.main,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyIconContainer: {
    marginBottom: spacing.base,
  },
  emptyStateTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
});

export default SelecaoRotas;
