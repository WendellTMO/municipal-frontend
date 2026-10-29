import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { AuthBackground, AuthLogo } from '../components';
import { colors, spacing, textStyles } from '../theme';

type SplashScreenProps = {
  onContinue: () => void;
};

const CORES_PONTOS = [colors.primary.main, colors.accent.main, colors.primary.main];
const ATRASO_PONTO_MS = 160;

const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const pontos = useRef(CORES_PONTOS.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
    ]).start();

    const animacoes = pontos.map((ponto, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * ATRASO_PONTO_MS),
          Animated.timing(ponto, {
            toValue: 1,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ponto, {
            toValue: 0.3,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((CORES_PONTOS.length - 1 - i) * ATRASO_PONTO_MS),
        ]),
      ),
    );
    animacoes.forEach(a => a.start());
    return () => animacoes.forEach(a => a.stop());
  }, [opacity, scale, pontos]);

  return (
    <Pressable style={styles.pressable} onPress={onContinue}>
      <View style={styles.container}>
        <StatusBar backgroundColor={colors.background.paper} barStyle="dark-content" />
        <AuthBackground />

        <Animated.View style={[styles.centro, { opacity, transform: [{ scale }] }]}>
          <AuthLogo width={230} />
        </Animated.View>

        <View style={styles.carregando} pointerEvents="none">
          <View style={styles.pontos}>
            {pontos.map((ponto, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.ponto,
                  {
                    backgroundColor: CORES_PONTOS[i],
                    opacity: ponto,
                    transform: [{ scale: ponto }],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.texto}>Preparando sua rota</Text>
        </View>

        {__DEV__ && (
          <View pointerEvents="none" style={styles.devHint}>
            <Text style={styles.devHintText}>Tap anywhere to continue</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centro: { alignItems: 'center', marginBottom: spacing.xxl },
  carregando: {
    position: 'absolute',
    bottom: 96,
    alignItems: 'center',
    gap: spacing.md,
  },
  pontos: { flexDirection: 'row', gap: spacing.sm },
  ponto: { width: 12, height: 12, borderRadius: 6 },
  texto: { ...textStyles.bodySmall, color: colors.text.secondary },
  devHint: {
    position: 'absolute',
    top: spacing.xl,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  devHintText: {
    ...textStyles.caption,
    color: '#FFFFFFE6',
    letterSpacing: 0.4,
  },
});

export default SplashScreen;
