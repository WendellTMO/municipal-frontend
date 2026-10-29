/**
 * Roteiro da viagem em tela cheia: paradas agrupadas em embarque, instituição e desembarque.
 * Aberta pelo navegador (params: viagem, pontosRota, concluidas, instituicoes) ou, durante a
 * viagem, como camada de InicioFimViagem (mesmas informações como props, mais onBack).
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import SubHeader from '../../components/SubHeader';
import RoteiroLista from '../../components/RoteiroLista';
import { colors, spacing } from '../../theme';
import { withFabSpace } from '../../config/feedback';
import { montarParadas } from '../../utils/paradasViagem';
import { montarRoteiro } from '../../utils/roteiroViagem';
import { subtituloRoteiro } from '../../utils/subtituloRoteiro';
import { motoristaService } from '../../services/motoristaService';

const RoteiroViagem = ({ navigation = null, route = null, onBack = null, direita = null, ...props }) => {
  const params = (route && route.params) || {};
  const viagem = props.viagem || params.viagem || {};
  const pontosRota = props.pontosRota || params.pontosRota || [];
  const concluidas = props.concluidas ?? params.concluidas ?? 0;
  const instituicoesRecebidas = props.instituicoes || params.instituicoes;
  const [instituicoesBuscadas, setInstituicoesBuscadas] = useState([]);

  // Aberta sem a lista de instituições (ex.: pelo detalhe da viagem), busca na API.
  useEffect(() => {
    if (instituicoesRecebidas) return;
    motoristaService
      .listarInstituicoes()
      .then(lista => setInstituicoesBuscadas(lista.items || []))
      .catch(() => setInstituicoesBuscadas([]));
  }, [instituicoesRecebidas]);

  const instituicoes = instituicoesRecebidas || instituicoesBuscadas;
  const paradas = montarParadas(pontosRota, concluidas, instituicoes);
  const grupos = montarRoteiro(viagem.tipo, paradas, viagem.alunos);

  return (
    <TelaSegura style={styles.container}>
      <SubHeader
        titulo="Roteiro"
        subtitulo={subtituloRoteiro(viagem)}
        onBack={onBack || (() => navigation.goBack())}
        direita={direita}
      />
      <ScrollView contentContainerStyle={withFabSpace(styles.conteudo)} showsVerticalScrollIndicator={false}>
        <RoteiroLista grupos={grupos} />
      </ScrollView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  conteudo: { padding: spacing.base, paddingBottom: spacing.xxxl },
});

export default RoteiroViagem;
