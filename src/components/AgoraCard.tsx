/**
 * Card "AGORA" do painel do aluno, mostrado quando o ônibus está rodando.
 * Hierarquia: selo com ponto pulsante, rota em destaque, partida pequena e
 * botão para o mapa. O mapa de prévia entra como filho, entre o texto e o botão.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';

type Props = {
  rotaNome: string;
  hora: string;
  onPress: () => void;
  children?: React.ReactNode;
};

const USA_DRIVER_NATIVO = Platform.OS !== 'web';

const PontoPulsante = () => {
  const opacidade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 0.3, duration: 900, useNativeDriver: USA_DRIVER_NATIVO }),
        Animated.timing(opacidade, { toValue: 1, duration: 900, useNativeDriver: USA_DRIVER_NATIVO }),
      ]),
    );
    animacao.start();
    return () => animacao.stop();
  }, [opacidade]);

  return <Animated.View style={[styles.ponto, { opacity: opacidade }]} />;
};

const AgoraCard = ({ rotaNome, hora, onPress, children }: Props) => (
  <View style={styles.card}>
    <View style={styles.selo}>
      <PontoPulsante />
      <Text style={styles.seloTexto}>Ônibus a caminho</Text>
    </View>
    <Text style={styles.rota}>{rotaNome}</Text>
    <Text style={styles.partida}>Partida {hora}</Text>
    {children}
    <TouchableOpacity
      style={styles.botao}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ver ônibus no mapa">
      <Icon name={IconNames.location} size="lg" color={colors.primary.main} style={undefined} />
      <Text style={styles.botaoTexto}>Ver ônibus no mapa</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    margin: spacing.base,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#0D5BCF',
    borderRadius: 24,
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80' },
  seloTexto: { ...textStyles.caption, color: '#FFFFFF', fontWeight: '700' },
  rota: { ...textStyles.h3, color: '#FFFFFF', marginTop: spacing.md },
  partida: { ...textStyles.bodySmall, color: '#DBEAFE', marginTop: 2 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.base,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  botaoTexto: { ...textStyles.h5, color: colors.primary.main, fontWeight: '800' },
});

export default AgoraCard;
