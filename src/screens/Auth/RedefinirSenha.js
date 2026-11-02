/**
 * Tela aberta pelo link do e-mail de recuperação (/redefinir-senha/<token>): o usuário digita a
 * nova senha duas vezes e o app envia ao servidor junto com o token do link.
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {colors, spacing, borderRadius} from '../../theme';
import Icon, {IconNames} from '../../components/Icon';
import AuthBackground from '../../components/AuthBackground';
import AuthLogo from '../../components/AuthLogo';
import {api} from '../../api/client';
import {getErrorMessageFromError} from '../../utils/errors';
import {validarNovaSenha} from '../../utils/senha';
import {confirmarFormularioDeLogin} from '../../utils/autofill';

const RedefinirSenha = ({navigation, route}) => {
  const token = route?.params?.token;
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);

  const limparErro = () => {
    if (erro) setErro('');
  };

  const enviar = async () => {
    const problema = validarNovaSenha(senha, confirmar);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: senha,
        confirm_password: confirmar,
      });
      confirmarFormularioDeLogin();
      setConcluido(true);
    } catch (e) {
      setErro(getErrorMessageFromError(e));
    } finally {
      setLoading(false);
    }
  };

  const irParaLogin = () => navigation.navigate('Login');

  if (concluido) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <AuthBackground />
        <AuthLogo width={150} style={styles.logo} />
        <View style={styles.card}>
          <Text style={styles.titulo}>Senha redefinida</Text>
          <Text style={styles.subtitulo}>Agora é só entrar com a nova senha.</Text>
          <TouchableOpacity style={styles.botao} onPress={irParaLogin} activeOpacity={0.88}>
            <Text style={styles.botaoTexto}>Ir para o login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AuthBackground />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AuthLogo width={150} style={styles.logo} />
          <View style={styles.card}>
            <Text style={styles.titulo} accessibilityRole="header">
              Criar nova senha
            </Text>
            <Text style={styles.subtitulo}>Use pelo menos 8 caracteres.</Text>

            <View style={styles.campo}>
              <Icon name="lock" size="md" color={colors.neutral[400]} />
              <TextInput
                style={styles.input}
                placeholder="Nova senha"
                accessibilityLabel="Nova senha"
                placeholderTextColor={colors.neutral[400]}
                value={senha}
                onChangeText={(texto) => {
                  setSenha(texto);
                  limparErro();
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="yes"
                editable={!loading}
              />
            </View>

            <View style={styles.campo}>
              <Icon name="lock" size="md" color={colors.neutral[400]} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nova senha"
                accessibilityLabel="Confirmar nova senha"
                placeholderTextColor={colors.neutral[400]}
                value={confirmar}
                onChangeText={(texto) => {
                  setConfirmar(texto);
                  limparErro();
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="yes"
                editable={!loading}
                onSubmitEditing={enviar}
              />
            </View>

            {erro ? (
              <View style={styles.erroBox}>
                <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.botao, loading && styles.botaoDesativado]}
              onPress={enviar}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Redefinir senha"
              activeOpacity={0.88}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoTexto}>Redefinir senha</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('RecuperarSenha')} activeOpacity={0.8}>
              <Text style={styles.linkTexto}>Link expirado? Pedir um novo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEF3FB'},
  kav: {flex: 1},
  scrollContent: {flexGrow: 1, paddingBottom: spacing.xl},
  logo: {marginTop: 40},
  card: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  titulo: {fontFamily: 'Inter-Bold', fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs},
  subtitulo: {fontFamily: 'Inter-Regular', fontSize: 14, color: colors.text.secondary, marginBottom: spacing.xl},
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  input: {flex: 1, height: '100%', color: colors.text.primary, fontSize: 16, fontFamily: 'Inter-Regular', paddingVertical: 0},
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.base,
  },
  erroTexto: {flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: colors.error.dark},
  botao: {
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: '#0347D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesativado: {opacity: 0.6},
  botaoTexto: {fontFamily: 'Inter-Bold', fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
  link: {alignItems: 'center', paddingVertical: spacing.base},
  linkTexto: {fontFamily: 'Inter-Regular', fontSize: 14, color: '#0347D0'},
});

export default RedefinirSenha;
