/**
 * Toque único do app, no lugar de TouchableOpacity: ao pressionar o fundo escurece de
 * leve e o item encolhe para 0.97 em 80 ms. Com navega, o onPress espera ~100 ms para o
 * feedback ser percebido; envio e ações destrutivas não usam navega. Respeita "reduzir
 * movimento" (sistema no nativo, prefers-reduced-motion na web).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { atrasoDoToque, escalaPressionado } from '../utils/toque';
import { haptico } from '../utils/haptico';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

const useReduzirMovimento = () => {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(valor => {
        if (ativo) setReduzir(!!valor);
      })
      .catch(() => {});
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => {
      ativo = false;
      assinatura?.remove?.();
    };
  }, []);
  return reduzir;
};

const Tappable = ({
  onPress,
  navega = false,
  disabled = false,
  style,
  children,
  accessibilityRole = 'button',
  activeOpacity, // do TouchableOpacity antigo; o feedback agora é escala e sombra
  sombra = true, // false quando o item não tem cantos arredondados próprios (ex.: ActionTile)
  tato = true, // false para tirar a vibração curta do toque
  ...resto
}) => {
  const reduzirMovimento = useReduzirMovimento();
  const escala = useRef(new Animated.Value(1)).current;
  const [pressionado, setPressionado] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const animar = valor => {
    Animated.timing(escala, {
      toValue: valor,
      duration: 80,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const aoPressionar = () => {
    setPressionado(true);
    animar(escalaPressionado(reduzirMovimento));
  };
  const aoSoltar = () => {
    setPressionado(false);
    animar(1);
  };
  const aoTocar = evento => {
    if (!onPress) return;
    if (tato) haptico('toque');
    const atraso = atrasoDoToque({ navega, reduzirMovimento });
    if (!atraso) {
      onPress(evento);
      return;
    }
    timer.current = setTimeout(() => onPress(evento), atraso);
  };

  const raio = StyleSheet.flatten(style)?.borderRadius;

  return (
    <PressableAnimado
      {...resto}
      onPress={aoTocar}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      style={[style, { transform: [{ scale: escala }] }]}>
      {children}
      {sombra && pressionado && !disabled ? (
        <View pointerEvents="none" style={[styles.sombra, raio != null && { borderRadius: raio }]} />
      ) : null}
    </PressableAnimado>
  );
};

const styles = StyleSheet.create({
  sombra: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.08)' },
});

export default Tappable;
