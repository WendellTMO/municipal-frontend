import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AuthBackground, AuthLogo, Icon} from '../../components';
import Tappable from '../../components/Tappable';
import {colors, spacing, borderRadius, shadows} from '../../theme';

// Moldura das telas de convite: mesmo fundo, logo e cartão branco do CriarConta.
const ConviteShell = ({children}) => (
  <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    <AuthBackground />
    <KeyboardAvoidingView
      style={styles.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthLogo width={150} style={styles.logo} />
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

// Link inválido, vencido, usado ou bloqueado: mesma tela, só muda o texto.
export const ConviteEncerrado = ({texto, onLogin}) => (
  <View style={styles.encerrado}>
    <View style={styles.encerradoIcone}>
      <Icon name="link-off" size="lg" color="#FFFFFF" />
    </View>
    <Text style={styles.title}>Convite indisponível</Text>
    <Text style={[styles.subtitle, {textAlign: 'center'}]}>{texto}</Text>
    <Tappable style={styles.primaryButton} onPress={onLogin} navega>
      <Text style={styles.primaryButtonText}>Ir para o login</Text>
    </Tappable>
  </View>
);

export const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EEF3FB'},
  kav: {flex: 1},
  scrollContent: {flexGrow: 1, paddingBottom: spacing.xl},
  logo: {marginTop: 40},
  card: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: colors.text.primary,
    marginTop: spacing.xl,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.base,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  inputWrapperFocused: {
    borderColor: colors.primary.main,
    backgroundColor: colors.background.paper,
  },
  inputWrapperError: {borderColor: colors.error.main},
  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fieldErrorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.error.main,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.error.main,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.error.dark,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: '#0347D0',
    marginTop: spacing.xl,
    alignSelf: 'stretch',
    ...shadows.sm,
  },
  primaryButtonDisabled: {opacity: 0.65},
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  encerrado: {alignItems: 'center', paddingVertical: spacing.lg},
  encerradoIcone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
});

export default ConviteShell;
