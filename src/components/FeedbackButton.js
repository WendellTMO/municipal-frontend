/**
 * Botão flutuante de feedback (círculo dourado com uma exclamação).
 * FeedbackBadge é o mesmo desenho sem posição, usado no aviso beta.
 */
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { PanResponder, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '../theme';
import Icon, { IconNames } from './Icon';
import { assinarPosicao, definirPosicao, lerPosicao } from '../utils/fabStore';
import { useFeedbackPadraoAtual } from './FeedbackPadraoContext';
import {
  decidirPosicao,
  ehArraste,
  encaixar,
  limitarBaixo,
  limitarPonto,
  xDoLado,
} from '../utils/fabPosicao';

const ICON_COLOR = '#0D3B8F';

export const FeedbackBadge = ({ size = 56 }) => (
  <View
    style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2 },
    ]}>
    <Icon
      name={IconNames.priorityHigh}
      size={Math.round(size * 0.55)}
      color={ICON_COLOR}
    />
  </View>
);

// shortcut: sem SafeAreaProvider no app, iOS ganha 34 px fixos embaixo e topo reserva 48 px.
const RODAPE = 24 + (Platform.OS === 'ios' ? 34 : 0);
const TOPO = 48;
const MARGEM = 18;
const TAMANHO = 56;

const FeedbackButton = ({ onPress }) => {
  const { width, height } = useWindowDimensions();
  const padraoTela = useFeedbackPadraoAtual();
  // Posição única compartilhada por todas as instâncias do botão (raiz e Modais).
  const guardada = useSyncExternalStore(assinarPosicao, lerPosicao, lerPosicao);
  const posicao = decidirPosicao({ guardada, padraoTela, altura: height, tamanho: TAMANHO, rodape: RODAPE });
  const [arrasto, setArrasto] = useState(null); // { x, y } em pixels enquanto o dedo move

  // O responder é criado uma vez; este ref entrega a ele os valores mais recentes.
  const atual = useRef({});
  atual.current = { width, height, posicao, onPress };
  const inicio = useRef({ x: 0, y: 0 });
  const moveu = useRef(false);

  const baixoValido = limitarBaixo(posicao.baixo, height, TAMANHO, TOPO, RODAPE);
  const x = xDoLado(posicao.lado, width, TAMANHO, MARGEM);
  const y = height - TAMANHO - baixoValido;

  const posicaoDoToque = g => {
    const { width: w, height: h } = atual.current;
    return limitarPonto({
      x: inicio.current.x + g.dx,
      y: inicio.current.y + g.dy,
      largura: w,
      altura: h,
      tamanho: TAMANHO,
      topo: TOPO,
      rodape: RODAPE,
    });
  };

  const comecar = () => {
    const { width: w, height: h, posicao: p } = atual.current;
    const baixo = limitarBaixo(p.baixo, h, TAMANHO, TOPO, RODAPE);
    inicio.current = { x: xDoLado(p.lado, w, TAMANHO, MARGEM), y: h - TAMANHO - baixo };
    moveu.current = false;
  };

  const mexer = g => {
    if (!moveu.current && !ehArraste(g.dx, g.dy)) return;
    moveu.current = true;
    setArrasto(posicaoDoToque(g));
  };

  const soltar = g => {
    if (!moveu.current) {
      atual.current.onPress();
      return;
    }
    const solto = posicaoDoToque(g);
    const { width: w, height: h } = atual.current;
    definirPosicao(
      encaixar({ x: solto.x, y: solto.y, largura: w, altura: h, tamanho: TAMANHO, topo: TOPO, rodape: RODAPE }),
    );
    setArrasto(null);
  };

  // Nativo: PanResponder.
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: comecar,
      onPanResponderMove: (e, g) => mexer(g),
      onPanResponderRelease: (e, g) => soltar(g),
      onPanResponderTerminate: () => setArrasto(null),
    }),
  ).current;

  // Web: Pointer Events com captura. O ponteiro fica preso ao botão até soltar, então o gesto
  // não se perde ao passar sobre botões, listas e folhas, nem quando o foco, a seleção de texto
  // ou o menu de contexto cancelariam o PanResponder do react-native-web.
  const noRef = useRef(null);
  useEffect(() => {
    const no = noRef.current;
    if (Platform.OS !== 'web' || !no || !no.addEventListener) return undefined;
    let ponteiro = null;
    let origem = { x: 0, y: 0 };
    const deltas = e => ({ dx: e.clientX - origem.x, dy: e.clientY - origem.y });
    const aoDescer = e => {
      if (ponteiro !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      ponteiro = e.pointerId;
      origem = { x: e.clientX, y: e.clientY };
      no.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
      comecar();
    };
    const aoMover = e => {
      if (e.pointerId === ponteiro) mexer(deltas(e));
    };
    const aoSubir = e => {
      if (e.pointerId !== ponteiro) return;
      ponteiro = null;
      soltar(deltas(e));
    };
    const aoCancelar = e => {
      if (e.pointerId !== ponteiro) return;
      ponteiro = null;
      setArrasto(null);
    };
    no.addEventListener('pointerdown', aoDescer);
    no.addEventListener('pointermove', aoMover);
    no.addEventListener('pointerup', aoSubir);
    no.addEventListener('pointercancel', aoCancelar);
    return () => {
      no.removeEventListener('pointerdown', aoDescer);
      no.removeEventListener('pointermove', aoMover);
      no.removeEventListener('pointerup', aoSubir);
      no.removeEventListener('pointercancel', aoCancelar);
    };
  }, []);

  return (
    <View
      style={[styles.container, { left: arrasto ? arrasto.x : x, top: arrasto ? arrasto.y : y }]}
      ref={noRef}
      {...(Platform.OS === 'web' ? null : responder.panHandlers)}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Enviar feedback"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => onPress()}>
      <FeedbackBadge size={TAMANHO} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 50,
    ...(Platform.OS === 'web' ? { touchAction: 'none', cursor: 'grab', userSelect: 'none' } : {}),
  },
  circle: {
    backgroundColor: colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.main,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
});

export default FeedbackButton;
