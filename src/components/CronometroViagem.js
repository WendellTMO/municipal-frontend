/**
 * Tempo decorrido da viagem. O relógio vive neste componente: assim só ele refaz a tela a cada
 * segundo, e não a tela inteira da viagem (mapa, roteiro e botões), que travava as transições.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon, { IconNames } from './Icon';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import { formatarTempo } from '../utils/formatarTempo';

const CronometroViagem = ({ inicioMs = null }) => {
  const montadoEm = useRef(Date.now());
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const base = inicioMs === null ? montadoEm.current : inicioMs;
  const texto = formatarTempo(Math.max(0, Math.floor((agora - base) / 1000)));

  return (
    <View style={styles.chip}>
      <Icon name={IconNames.schedule} size="sm" color={colors.success.contrast} />
      <Text style={styles.texto} accessibilityLabel={`Tempo decorrido: ${texto}`}>
        {texto}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  texto: { ...textStyles.body, color: '#fff', fontWeight: '700', fontFamily: 'monospace' },
});

export default CronometroViagem;
