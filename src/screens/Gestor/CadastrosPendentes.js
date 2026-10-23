import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { gestorService } from '../../services/gestorService';
import { unwrapItems } from '../../types';
import { colors, spacing, textStyles, borderRadius } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import SubHeader from '../../components/SubHeader';
import { getErrorMessageFromError } from '../../utils/errors';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import Tappable from '../../components/Tappable';

const CadastrosPendentes = ({ navigation }) => {
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const lista = await gestorService.listarAlunos('PENDING_APPROVAL').then(unwrapItems);
      setAlunos(lista);
    } catch (e) {
      setErro(getErrorMessageFromError(e));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    // No nativo a tela continua montada ao voltar do detalhe; no web ela remonta.
    const parar = navigation?.addListener ? navigation.addListener('focus', carregar) : undefined;
    return parar;
  }, [carregar, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader titulo="Cadastros pendentes" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={withFabSpace(styles.lista)}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar();
            }}
          />
        }>
        {carregando ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary.main} />
        ) : erro ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>{erro}</Text>
            <Tappable onPress={carregar} accessibilityRole="button" accessibilityLabel="Tentar de novo">
              <Icon name={IconNames.refresh} size="lg" color={colors.primary.main} />
            </Tappable>
          </View>
        ) : alunos.length === 0 ? (
          <View style={styles.vazio}>
            <Icon name={IconNames.checkCircle} size="xxl" color={colors.success.main} />
            <Text style={styles.vazioTexto}>Nenhum cadastro aguardando aprovação</Text>
          </View>
        ) : (
          alunos.map(a => (
            <Tappable navega
              key={a.id}
              style={styles.item}
              onPress={() => navigation.navigate('DetalheAlunoGestor', { alunoId: a.id })}
              accessibilityRole="button"
              accessibilityLabel={`Cadastro de ${a.nome}, aguardando aprovação`}>
              <View style={styles.avatar}>
                <Icon name={IconNames.cadastro} size="lg" color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome} numberOfLines={1}>
                  {a.nome}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {a.email}
                </Text>
              </View>
              <Icon name={IconNames.chevronRight} size="md" color={colors.neutral[400]} />
            </Tappable>
          ))
        )}
        <SairDaConta />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  lista: { padding: spacing.base, gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.solid.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { ...textStyles.h5, color: colors.text.primary },
  email: { ...textStyles.bodySmall, color: colors.text.secondary },
  vazio: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  vazioTexto: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center' },
});

export default CadastrosPendentes;
