/**
 * Tela exibida ao abrir o app com sessão salva e biometria ativada. Pede a
 * biometria logo ao abrir. Falhou ou cancelou: Tentar de novo ou Entrar com senha
 * (que faz logout e volta ao login). Nunca prende o usuário.
 * O Android abre o painel da biometria sobre a metade de baixo da tela, então todo o conteúdo
 * fica na metade de cima.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../../theme';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { iconeAtual, rotuloAtual } from '../../services/biometria';

const DesbloqueioBiometria = () => {
  const { biometria, logout } = useAuth();
  const [falhou, setFalhou] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const tentar = useCallback(async () => {
    setVerificando(true);
    setFalhou(false);
    const ok = await biometria.desbloquear();
    setVerificando(false);
    if (!ok) setFalhou(true);
  }, [biometria]);

  useEffect(() => {
    tentar();
    // Só na primeira abertura; depois o usuário decide pelos botões.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
      <View style={styles.centro}>
        <View style={styles.icone}>
          <Icon name={iconeAtual()} size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.titulo}>Confirme que é você</Text>
        <Text style={styles.texto}>
          {falhou
            ? 'Não foi possível confirmar. Tente de novo ou entre com a senha.'
            : `Use ${rotuloAtual()} para abrir o BusKá.`}
        </Text>
      </View>
      <View style={styles.botoes}>
        <TouchableOpacity
          style={[styles.primario, verificando && styles.desabilitado]}
          onPress={tentar}
          disabled={verificando}
          accessibilityRole="button"
          accessibilityLabel="Tentar de novo">
          <Text style={styles.primarioTexto}>Tentar de novo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secundario}
          onPress={() => logout()}
          accessibilityRole="button"
          accessibilityLabel="Entrar com senha">
          <Text style={styles.secundarioTexto}>Entrar com senha</Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  conteudo: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  centro: { alignItems: 'center', gap: spacing.sm },
  icone: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: { ...textStyles.h3, color: colors.text.primary, textAlign: 'center' },
  texto: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center' },
  botoes: { gap: spacing.sm, marginTop: spacing.lg },
  primario: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desabilitado: { opacity: 0.5 },
  primarioTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secundario: { height: 56, alignItems: 'center', justifyContent: 'center' },
  secundarioTexto: { ...textStyles.body, color: colors.primary.main, fontWeight: '700' },
});

export default DesbloqueioBiometria;
