/**
 * Tela "Histórico de viagens" do motorista: feitas, canceladas e as que passaram sem registro
 * (em vermelho, com o botão para marcar como feita).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import SubHeader from '../../components/SubHeader';
import HistoricoViagens from '../../components/HistoricoViagens';
import { useToast } from '../../components/Toast';
import { motoristaService } from '../../services/motoristaService';
import { unwrapItems } from '../../types';
import { itensDoHistorico } from '../../utils/viagensMotorista';
import { contarPorGrupo, filtrarHistorico, filtroPadrao } from '../../utils/filtroHistorico';
import ChipsFiltro from '../../components/ChipsFiltro';
import { withFabSpace } from '../../config/feedback';
import Tappable from '../../components/Tappable';
import { borderRadius, colors, spacing, textStyles } from '../../theme';

// Sobra espaço para o filtro: com as feitas escondidas, as mais antigas não realizadas não podem ser cortadas.
const POR_PAGINA = 10;

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

  const [temMais, setTemMais] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const quantidadeRef = useRef(0);

  // Recarregar (depois de marcar como feita, ao puxar) mantém as páginas já abertas.
  const carregar = useCallback(async () => {
    try {
      const limit = Math.min(100, Math.max(POR_PAGINA, quantidadeRef.current));
      const viagens = await motoristaService.listarViagens({ periodo: 'historico', limit }).then(unwrapItems);
      quantidadeRef.current = viagens.length;
      setTemMais(viagens.length >= limit);
      setItens(itensDoHistorico(viagens));
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

  const carregarMais = async () => {
    if (carregandoMais) return;
    setCarregandoMais(true);
    try {
      const proxima = await motoristaService
        .listarViagens({ periodo: 'historico', limit: POR_PAGINA, offset: quantidadeRef.current })
        .then(unwrapItems);
      quantidadeRef.current += proxima.length;
      setTemMais(proxima.length >= POR_PAGINA);
      setItens(atuais => [...atuais, ...itensDoHistorico(proxima)]);
    } catch (e) {
      toast.error('Não foi possível carregar mais viagens.');
    } finally {
      setCarregandoMais(false);
    }
  };

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
            <ChipsFiltro
              chips={CHIPS}
              filtro={filtro}
              contagem={contagem}
              onAlternar={id => setFiltro(atual => ({ ...atual, [id]: !atual[id] }))}
            />
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
          {temMais ? (
            <Tappable
              style={styles.verMais}
              onPress={carregarMais}
              disabled={carregandoMais}
              sombra={false}
              accessibilityLabel="Ver mais viagens">
              {carregandoMais ? (
                <ActivityIndicator color={colors.primary.main} />
              ) : (
                <Text style={styles.verMaisTexto}>Ver mais viagens</Text>
              )}
            </Tappable>
          ) : null}
        </ScrollView>
      )}
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: spacing.base },
  verMais: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  verMaisTexto: { ...textStyles.body, color: colors.primary.main, fontWeight: '700' },
  vazio: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl },
});

export default HistoricoViagensMotorista;
