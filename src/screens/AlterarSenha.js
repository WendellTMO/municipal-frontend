/**
 * Troca de senha de quem já está logado: senha atual, nova senha e confirmação. Serve aluno,
 * motorista e gestor. O servidor derruba as outras sessões e devolve um token novo para este aparelho.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TelaSegura from '../components/TelaSegura';
import SubHeader from '../components/SubHeader';
import Icon, { IconNames } from '../components/Icon';
import { useToast } from '../components/Toast';
import { userService } from '../services/userService';
import { getErrorMessageFromError } from '../utils/errors';
import { SENHA_MIN, validarTrocaDeSenha } from '../utils/senha';
import { withFabSpace } from '../config/feedback';
import { registrarAcao } from '../utils/telemetriaFila';
import { borderRadius, colors, spacing, textStyles } from '../theme';

const Campo = ({ rotulo, valor, onChange, autoComplete, textContentType, desabilitado, onEnviar }) => {
  const [visivel, setVisivel] = useState(false);
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View style={styles.campo}>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={onChange}
          secureTextEntry={!visivel}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          importantForAutofill="yes"
          editable={!desabilitado}
          onSubmitEditing={onEnviar}
          accessibilityLabel={rotulo}
        />
        <TouchableOpacity
          onPress={() => setVisivel(atual => !atual)}
          style={styles.olho}
          accessibilityRole="button"
          accessibilityLabel={visivel ? `Esconder ${rotulo.toLowerCase()}` : `Mostrar ${rotulo.toLowerCase()}`}>
          <Icon name={visivel ? IconNames.visibilityOff : IconNames.visibility} size="md" color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AlterarSenha = ({ navigation }) => {
  const toast = useToast();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const limpar = () => {
    if (erro) setErro('');
  };

  const enviar = async () => {
    if (loading) return;
    const problema = validarTrocaDeSenha(atual, nova, confirmar);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro('');
    setLoading(true);
    try {
      await userService.changePassword(atual, nova, confirmar);
      registrarAcao('senha_alterar_ok');
      toast.success('Senha alterada. Enviamos um aviso para o seu e-mail.');
      navigation.goBack();
    } catch (e) {
      registrarAcao('senha_alterar_falha');
      setErro(getErrorMessageFromError(e));
      setLoading(false);
    }
  };

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Alterar senha" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={withFabSpace(styles.conteudo)} keyboardShouldPersistTaps="handled">
          <Text style={styles.dica}>
            Use {SENHA_MIN} ou mais caracteres. Uma frase longa é mais segura que uma senha curta cheia de símbolos.
            Ao trocar, os outros aparelhos saem da sua conta.
          </Text>

          <Campo
            rotulo="Senha atual"
            valor={atual}
            onChange={t => {
              setAtual(t);
              limpar();
            }}
            autoComplete="current-password"
            textContentType="password"
            desabilitado={loading}
          />
          <Campo
            rotulo="Nova senha"
            valor={nova}
            onChange={t => {
              setNova(t);
              limpar();
            }}
            autoComplete="new-password"
            textContentType="newPassword"
            desabilitado={loading}
          />
          <Campo
            rotulo="Repita a nova senha"
            valor={confirmar}
            onChange={t => {
              setConfirmar(t);
              limpar();
            }}
            autoComplete="new-password"
            textContentType="newPassword"
            desabilitado={loading}
            onEnviar={enviar}
          />

          {erro ? (
            <View style={styles.erroBox} accessibilityRole="alert">
              <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.botao, loading && styles.botaoDesativado]}
            onPress={enviar}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Salvar nova senha">
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoTexto}>Salvar nova senha</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  flex: { flex: 1 },
  conteudo: { padding: spacing.base, gap: spacing.md },
  dica: { ...textStyles.bodySmall, color: colors.text.secondary },
  grupo: { gap: spacing.xs },
  rotulo: { ...textStyles.inputLabel, color: colors.text.primary },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  input: { flex: 1, paddingHorizontal: spacing.md, ...textStyles.body, color: colors.text.primary },
  olho: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.error.lighter,
  },
  erroTexto: { ...textStyles.bodySmall, flex: 1, color: colors.error.dark },
  botao: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.main,
  },
  botaoDesativado: { opacity: 0.6 },
  botaoTexto: { ...textStyles.button, color: '#FFFFFF' },
});

export default AlterarSenha;
