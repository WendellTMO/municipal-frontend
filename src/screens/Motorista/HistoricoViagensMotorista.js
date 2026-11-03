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
import { withFabSpace } from '../../config/feedback';
import { colors, spacing, textStyles } from '../../theme';

const LIMITE = 50;

const HistoricoViagensMotorista = ({ navigation }) => {
  const toast = useToast();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

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
          {itens.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma viagem no histórico ainda.</Text>
          ) : (
            <HistoricoViagens itens={itens} onConfirmarFeita={confirmarFeita} />
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
  vazio: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl },
});

export default HistoricoViagensMotorista;
