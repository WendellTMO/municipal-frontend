/**
 * Tela "Histórico de viagens" do motorista: feitas, canceladas e as que passaram sem registro
 * (em vermelho, com o botão para marcar como feita).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import SubHeader from '../../components/SubHeader';
import HistoricoViagens from '../../components/HistoricoViagens';
import { useToast } from '../../components/Toast';
import { motoristaService } from '../../services/motoristaService';
import { unwrapItems } from '../../types';
import { organizarViagens } from '../../utils/viagensMotorista';
import { contarPorGrupo, filtrarHistorico, filtroPadrao } from '../../utils/filtroHistorico';
import Tappable from '../../components/Tappable';
import { withFabSpace } from '../../config/feedback';
import { colors, spacing, textStyles } from '../../theme';

// Sobra espaço para o filtro: com as feitas escondidas, as mais antigas não realizadas não podem ser cortadas.
const LIMITE = 200;

const CHIPS = [
  { id: 'naoRealizadas', texto: 'Não realizadas' },
  { id: 'canceladas', texto: 'Canceladas' },
  { id: 'feitas', texto: 'Feitas' },
];

const HistoricoViagensMotorista = ({ navigation }) => {
  const toast = useToast();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtro, setFiltro] = useState(filtroPadrao());
  const contagem = contarPorGrupo(itens);
  const visiveis = filtrarHistorico(itens, filtro);

  const carregar = useCallback(async () => {
    try {
      const viagens = await motoristaService.listarViagens().then(unwrapItems);
      setItens(organizarViagens(viagens, new Date(), LIMITE).historico);
    } catch (e) {
      toast.error('Não foi possível carregar o histórico.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
    // toast muda de identidade a cada render do provider
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O motorista confirma que a viagem passada foi feita, mesmo sem ter registrado pelo app.
  const confirmarFeita = async viagem => {
    try {
      await motoristaService.marcarRealizada(viagem.id);
      toast.success('Viagem marcada como feita.');
      await carregar();
    } catch (e) {
      toast.error(e?.message || 'Não foi possível marcar a viagem agora.');
    }
  };

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Histórico de viagens" onBack={() => navigation.goBack()} />
      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={withFabSpace(styles.conteudo)}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => {
                setAtualizando(true);
                carregar();
              }}
              colors={[colors.primary.main]}
            />
          }>
          {itens.length > 0 ? (
            <View style={styles.filtros} accessibilityRole="toolbar">
              {CHIPS.map(chip => {
                const ligado = filtro[chip.id];
                return (
                  <Tappable
                    key={chip.id}
                    sombra={false}
                    style={[styles.chip, ligado && styles.chipLigado]}
                    onPress={() => setFiltro(atual => ({ ...atual, [chip.id]: !atual[chip.id] }))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ligado }}
                    accessibilityLabel={`${chip.texto}, ${contagem[chip.id]} viagens, ${ligado ? 'mostrando' : 'escondidas'}`}>
                    <Text style={[styles.chipTexto, ligado && styles.chipTextoLigado]}>
                      {chip.texto} ({contagem[chip.id]})
                    </Text>
                  </Tappable>
                );
              })}
            </View>
          ) : null}
          {itens.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma viagem no histórico ainda.</Text>
          ) : visiveis.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma viagem com esses filtros. Toque em Feitas para ver as concluídas.</Text>
          ) : (
            <HistoricoViagens
              itens={visiveis}
              onConfirmarFeita={confirmarFeita}
              onAbrir={(viagem, situacao) => navigation.navigate('DetalheHistoricoViagem', { viagem, situacao })}
            />
          )}
        </ScrollView>
      )}
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: spacing.base },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
  },
  chipLigado: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  chipTexto: { ...textStyles.button, color: colors.text.secondary },
  chipTextoLigado: { color: '#FFFFFF' },
  vazio: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl },
});

export default HistoricoViagensMotorista;
