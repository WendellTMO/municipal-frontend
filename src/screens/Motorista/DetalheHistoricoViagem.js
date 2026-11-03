/**
 * Detalhes de uma viagem do histórico: o que aconteceu (horários, distância, paradas) e, quando não houve
 * registro no app, uma explicação do porquê de faltarem esses dados.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import SubHeader from '../../components/SubHeader';
import { colors, borderRadius, spacing, textStyles } from '../../theme';
import { withFabSpace } from '../../config/feedback';
import { formatarData } from '../../utils/dataLocal';
import { formatarHora } from '../../utils/formatarHora';
import { formatarSentido } from '../../utils/formatarSentido';
import { resumoDaViagem } from '../../utils/detalheViagem';
import { SITUACAO } from '../../components/HistoricoViagens';

const EXPLICACAO = {
  feita_sem_app: 'O motorista confirmou depois que esta viagem foi feita. Ela não foi registrada pelo app, então não há horários, distância nem paradas.',
  cancelada: 'Esta viagem foi cancelada.',
  nao_realizada: 'Não há registro de que esta viagem foi feita. Se ela aconteceu, volte ao histórico e toque em "Marcar como feita".',
};

const Linha = ({ rotulo, valor }) => (
  <View style={styles.linha}>
    <Text style={styles.rotulo}>{rotulo}</Text>
    <Text style={styles.valor}>{valor}</Text>
  </View>
);

const DetalheHistoricoViagem = ({ navigation, route }) => {
  const viagem = route?.params?.viagem ?? {};
  const situacao = route?.params?.situacao;
  const info = SITUACAO[situacao] ?? SITUACAO.feita;
  const resumo = resumoDaViagem(viagem, situacao);

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Detalhes da viagem" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={withFabSpace(styles.conteudo)}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>
            {formatarData(viagem.data)} às {formatarHora(viagem.horario_inicio)}
          </Text>
          {viagem.rota_nome ? <Text style={styles.sub}>{viagem.rota_nome}</Text> : null}
          <Text style={[styles.situacao, { color: info.cor }]}>{info.texto}</Text>
          {viagem.tipo ? <Linha rotulo="Sentido" valor={formatarSentido(viagem.tipo)} /> : null}
          {viagem.veiculo_placa ? <Linha rotulo="Veículo" valor={viagem.veiculo_placa} /> : null}
        </View>

        {EXPLICACAO[situacao] ? (
          <View style={styles.cartao}>
            <Text style={styles.sub}>{EXPLICACAO[situacao]}</Text>
          </View>
        ) : null}

        {situacao === 'feita' ? (
          <View style={styles.cartao}>
            <Text style={styles.secao}>O que aconteceu</Text>
            {resumo.saida ? <Linha rotulo="Saída" valor={resumo.saida} /> : null}
            {resumo.fim ? <Linha rotulo="Fim" valor={resumo.fim} /> : null}
            {resumo.duracao ? <Linha rotulo="Duração" valor={resumo.duracao} /> : null}
            {resumo.km !== null ? <Linha rotulo="Distância" valor={`${resumo.km.toFixed(1).replace('.', ',')} km`} /> : null}
            <Linha rotulo="Alunos" valor={`${resumo.confirmados} confirmados de ${resumo.inscritos} inscritos`} />
          </View>
        ) : null}

        {resumo.paradas.length > 0 ? (
          <View style={styles.cartao}>
            <Text style={styles.secao}>Paradas</Text>
            {resumo.paradas.map(parada => (
              <View key={parada.ordem} style={styles.linha}>
                <Text style={styles.valor}>
                  {parada.ordem}. {parada.apelido}
                </Text>
                <Text style={[styles.rotulo, !parada.visitada && styles.semRegistro]}>
                  {parada.visitada ? (parada.chegada ? `chegou às ${parada.chegada}` : 'passou') : 'sem registro'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  conteudo: { padding: spacing.base, gap: spacing.md },
  cartao: { padding: spacing.base, borderRadius: borderRadius.lg, backgroundColor: colors.background.paper, gap: spacing.sm },
  titulo: { ...textStyles.h3, color: colors.text.primary },
  sub: { ...textStyles.body, color: colors.text.secondary },
  situacao: { ...textStyles.body, fontWeight: '700' },
  secao: { ...textStyles.h4, color: colors.text.primary },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rotulo: { ...textStyles.body, color: colors.text.secondary },
  valor: { ...textStyles.body, flexShrink: 1, color: colors.text.primary, fontWeight: '600' },
  semRegistro: { color: colors.error.main },
});

export default DetalheHistoricoViagem;
