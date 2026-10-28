import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { gestorService } from '../../services/gestorService';
import { colors, spacing, textStyles, borderRadius } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import SubHeader from '../../components/SubHeader';
import { getErrorMessageFromError } from '../../utils/errors';
import { periodoUltimosDias, isoLocal } from '../../utils/saudacao';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';

const ResumoSemana = ({ navigation }) => {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregar = async () => {
      const fim = new Date();
      const inicio = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - 7);
      try {
        setDados(await gestorService.obterRelatorio(isoLocal(inicio), isoLocal(fim)));
      } catch (e) {
        setErro(getErrorMessageFromError(e));
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const km = dados?.km_total_rodado != null ? `${Number(dados.km_total_rodado).toFixed(0)} km` : '—';
  const cartoes = [
    { icone: IconNames.checkCircle, cor: colors.solid.green, nome: 'Viagens realizadas', valor: dados?.viagens_realizadas },
    { icone: IconNames.group, cor: colors.solid.blue, nome: 'Alunos transportados', valor: dados?.alunos_transportados },
    { icone: IconNames.speed, cor: colors.solid.teal, nome: 'Quilômetros rodados', valor: km },
    { icone: IconNames.seat, cor: colors.solid.amber, nome: 'Vagas desperdiçadas', valor: dados?.vagas_desperdicadas },
  ];

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Resumo da semana" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={withFabSpace(styles.conteudo)}>
        <Text style={styles.periodo}>{periodoUltimosDias(7)}</Text>
        {carregando ? (
          <ActivityIndicator color={colors.primary.main} style={{ marginTop: spacing.xl }} />
        ) : erro ? (
          <Text style={styles.erro}>{erro}</Text>
        ) : (
          cartoes.map(c => (
            <View
              key={c.nome}
              style={styles.cartao}
              accessible
              accessibilityLabel={`${c.nome}: ${c.valor ?? 'indisponível'}`}>
              <View style={[styles.quadrado, { backgroundColor: c.cor }]}>
                <Icon name={c.icone} size="lg" color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valor}>{c.valor ?? '—'}</Text>
                <Text style={styles.nome}>{c.nome}</Text>
              </View>
            </View>
          ))
        )}
        <SairDaConta />
      </ScrollView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  conteudo: { padding: spacing.base, gap: spacing.md },
  periodo: { ...textStyles.body, color: colors.text.secondary },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  quadrado: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  valor: { ...textStyles.h2, color: colors.text.primary },
  nome: { ...textStyles.body, color: colors.text.secondary },
  erro: { ...textStyles.body, color: colors.error.main },
});

export default ResumoSemana;
