import React, {useState, useRef, useEffect} from 'react';
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
  Animated,
  StatusBar,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import AuthBackground from '../../components/AuthBackground';
import AuthLogo from '../../components/AuthLogo';
import { api } from '../../api/client';

const RecuperarSenha = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {toValue: 1, duration: 600, delay: 150, useNativeDriver: true}),
      Animated.timing(cardTranslateY, {toValue: 0, duration: 480, delay: 150, useNativeDriver: true}),
    ]).start();
  }, []);

  const handleRecuperarSenha = async () => {
    const emailTrim = email.trim();
    if (!emailTrim) {
      setError('Informe seu e-mail');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', {email: emailTrim.toLowerCase()});
      setEnviado(true);
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Não foi possível enviar o e-mail. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────
  if (enviado) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <AuthBackground />

        <TouchableOpacity
          style={styles.floatingBack}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Icon name={IconNames.back} size="md" color={colors.neutral[700]} />
        </TouchableOpacity>

        <AuthLogo width={150} style={styles.logo} />

        <View style={styles.successCard}>
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Verifique sua caixa de entrada</Text>
            <Text style={styles.successBody}>
              Enviamos um link de recuperação para
            </Text>
            <View style={styles.emailPill}>
              <Icon name="email" size="sm" color="#0347D0" />
              <Text style={styles.emailPillText}>{email}</Text>
            </View>
            <Text style={styles.successHint}>
              Siga as instruções no e-mail para redefinir sua senha. Verifique também a pasta de spam.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.88}
          >
            <Icon name={IconNames.back} size="md" color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Default state ──────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <AuthBackground />

      <TouchableOpacity
        style={styles.floatingBack}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name={IconNames.back} size="md" color={colors.neutral[700]} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthLogo width={150} style={styles.logo} />
          <Animated.View
            style={[styles.card, {opacity: cardOpacity, transform: [{translateY: cardTranslateY}]}]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.lockBadge}>
                <Icon name="lock-reset" size="md" color="#0347D0" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Esqueceu sua senha?</Text>
                <Text style={styles.cardSubtitle}>
                  Informe seu e-mail e enviaremos um link para você criar uma nova senha.
                </Text>
              </View>
            </View>

            {/* Email field */}
            <View style={[
              styles.inputWrapper,
              focused && styles.inputWrapperFocused,
              error ? styles.inputWrapperError : null,
            ]}>
              <Icon
                name="email"
                size="md"
                color={focused ? '#0347D0' : colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                accessibilityLabel="E-mail"
                placeholderTextColor={colors.neutral[400]}
                value={email}
                onChangeText={(text) => { setEmail(text); if (error) setError(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleRecuperarSenha}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="send" size="md" color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Enviar Link de Recuperação</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Back link */}
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Icon name={IconNames.back} size="sm" color="#0347D0" />
              <Text style={styles.backLinkText}>Voltar ao Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF3FB',
  },

  floatingBack: {
    position: 'absolute',
    top: 48,
    left: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    marginTop: 40,
  },

  kav: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  // ── Card ──────────────────────────────────────────
  card: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(3,71,208,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 26,
  },

  cardSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // ── Field ─────────────────────────────────────────
  inputWrapper: {
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

  inputWrapperFocused: {
    borderColor: '#0347D0',
    backgroundColor: colors.background.paper,
  },

  inputWrapperError: {
    borderColor: colors.error.main,
  },

  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },

  // ── Error ─────────────────────────────────────────
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.base,
  },

  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.error.dark,
    flex: 1,
  },

  // ── Primary button ────────────────────────────────
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: '#0347D0',
    marginTop: spacing.xs,
    ...shadows.sm,
  },

  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  primaryButtonDisabled: {
    opacity: 0.65,
  },

  // ── Back link ─────────────────────────────────────
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },

  backLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0347D0',
    fontWeight: '500',
  },

  // ── Success card ──────────────────────────────────
  successCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },

  successContent: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },

  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },

  successBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(3,71,208,0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },

  emailPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#0347D0',
  },

  successHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RecuperarSenha;
