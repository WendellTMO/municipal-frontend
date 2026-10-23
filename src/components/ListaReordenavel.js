/**
 * Lista que o usuário reordena arrastando, como a fila do Spotify.
 * Toque e segure uma linha (ou arraste pela alça) para ela descolar; as outras abrem espaço.
 * Soltar fixa a posição e chama onMudar com a nova lista. Funciona com mouse e toque (PanResponder).
 * onArrastando(true/false) deixa a tela pai desligar a rolagem durante o gesto.
 * shortcut: não rola sozinha quando o dedo chega à borda, serve para listas curtas.
 */
import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';
import Icon, { IconNames } from './Icon';
import { colors, spacing } from '../theme';
import { moverItem } from '../utils/ordemInstituicoes';

const ESPACO = spacing.md;
const ESPERA_MS = 350;
const TOLERANCIA_PX = 10;

// O react-native-web cancela o gesto se o foco sair de um ancestral para fora do nó tocado;
// tabIndex -1 faz o próprio nó receber o foco no clique.
const FOCAVEL_WEB = Platform.OS === 'web' ? { tabIndex: -1 } : {};

const impedirRolagemWeb = e => {
  if (e.cancelable) e.preventDefault();
};

const ListaReordenavel = ({ itens, chaveDe, onMudar, renderItem, onArrastando }) => {
  const [chaveArrastada, setChaveArrastada] = useState(null);
  const itensRef = useRef(itens);
  itensRef.current = itens;
  const alturas = useRef({});
  const valores = useRef({});
  const estado = useRef({ ativo: false, chave: null, indice: 0, destino: 0, timer: null });
  const callbacks = useRef({});
  callbacks.current = { chaveDe, onMudar, onArrastando };

  const valorDe = chave => {
    if (!valores.current[chave]) valores.current[chave] = new Animated.Value(0);
    return valores.current[chave];
  };

  const passoDe = indice => {
    const chave = callbacks.current.chaveDe(itensRef.current[indice]);
    return (alturas.current[chave] || 0) + ESPACO;
  };

  const iniciar = chave => {
    const lista = itensRef.current;
    let indice = 0;
    for (let i = 0; i < lista.length; i++) {
      if (callbacks.current.chaveDe(lista[i]) === chave) indice = i;
    }
    estado.current.ativo = true;
    estado.current.chave = chave;
    estado.current.indice = indice;
    estado.current.destino = indice;
    setChaveArrastada(chave);
    if (callbacks.current.onArrastando) callbacks.current.onArrastando(true);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('touchmove', impedirRolagemWeb, { passive: false });
    }
  };

  const mover = dy => {
    const lista = itensRef.current;
    const origem = estado.current.indice;
    let topo = 0;
    for (let i = 0; i < origem; i++) topo += passoDe(i);
    const centro = topo + (passoDe(origem) - ESPACO) / 2 + dy;

    let destino = lista.length - 1;
    let acumulado = 0;
    for (let j = 0; j < lista.length; j++) {
      acumulado += passoDe(j);
      if (centro < acumulado) {
        destino = j;
        break;
      }
    }
    estado.current.destino = destino;

    valorDe(estado.current.chave).setValue(dy);
    const passoOrigem = passoDe(origem);
    for (let k = 0; k < lista.length; k++) {
      if (k === origem) continue;
      let deslocamento = 0;
      if (origem < destino && k > origem && k <= destino) deslocamento = -passoOrigem;
      if (origem > destino && k < origem && k >= destino) deslocamento = passoOrigem;
      Animated.timing(valorDe(callbacks.current.chaveDe(lista[k])), {
        toValue: deslocamento,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const soltar = () => {
    const { chave, indice, destino } = estado.current;
    const lista = itensRef.current;
    // Posição final da linha solta: soma dos passos das linhas que ela atravessou.
    let alvo = 0;
    if (destino > indice) {
      for (let k = indice + 1; k <= destino; k++) alvo += passoDe(k);
    }
    if (destino < indice) {
      for (let k = destino; k < indice; k++) alvo -= passoDe(k);
    }
    Animated.timing(valorDe(chave), { toValue: alvo, duration: 120, useNativeDriver: false }).start(() => {
      const novaLista = moverItem(lista, indice, destino);
      for (const c of Object.keys(valores.current)) valores.current[c].setValue(0);
      estado.current.ativo = false;
      estado.current.chave = null;
      setChaveArrastada(null);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('touchmove', impedirRolagemWeb);
      }
      if (callbacks.current.onArrastando) callbacks.current.onArrastando(false);
      if (destino !== indice) callbacks.current.onMudar(novaLista);
    });
  };

  const cancelarEspera = () => {
    if (estado.current.timer) clearTimeout(estado.current.timer);
    estado.current.timer = null;
  };

  const criarPan = (chave, imediato) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (imediato) {
          iniciar(chave);
          return;
        }
        estado.current.timer = setTimeout(() => {
          estado.current.timer = null;
          iniciar(chave);
        }, ESPERA_MS);
      },
      onPanResponderMove: (_, g) => {
        if (estado.current.ativo) {
          mover(g.dy);
          return;
        }
        if (Math.abs(g.dy) > TOLERANCIA_PX || Math.abs(g.dx) > TOLERANCIA_PX) cancelarEspera();
      },
      onPanResponderTerminationRequest: () => !estado.current.ativo,
      onPanResponderRelease: () => {
        cancelarEspera();
        if (estado.current.ativo) soltar();
      },
      onPanResponderTerminate: () => {
        cancelarEspera();
        if (estado.current.ativo) soltar();
      },
    });

  // Um PanResponder por chave e por modo, guardados para não recriar a cada render.
  const pans = useRef({});
  const panDe = (chave, imediato) => {
    const id = chave + (imediato ? '#alca' : '#linha');
    if (!pans.current[id]) pans.current[id] = criarPan(chave, imediato);
    return pans.current[id];
  };

  const linhas = [];
  for (const item of itens) {
    const chave = chaveDe(item);
    const arrastando = chaveArrastada === chave;
    linhas.push(
      <Animated.View
        key={chave}
        onLayout={e => {
          alturas.current[chave] = e.nativeEvent.layout.height;
        }}
        {...panDe(chave, false).panHandlers}
        {...FOCAVEL_WEB}
        style={[
          styles.linha,
          arrastando && styles.linhaSolta,
          { transform: [{ translateY: valorDe(chave) }, { scale: arrastando ? 1.03 : 1 }] },
        ]}>
        {renderItem(item)}
        <View
          {...panDe(chave, true).panHandlers}
          {...FOCAVEL_WEB}
          style={styles.alca}
          accessibilityRole="button"
          accessibilityLabel="Arrastar para mudar a ordem">
          <Icon name={IconNames.menu} size="lg" color={colors.text.secondary} />
        </View>
      </Animated.View>,
    );
  }

  return <View>{linhas}</View>;
};

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ESPACO,
    backgroundColor: colors.background.paper,
    borderRadius: 18,
    paddingRight: spacing.xs,
    ...(Platform.OS === 'web' ? { userSelect: 'none', cursor: 'grab', outlineStyle: 'none' } : null),
  },
  linhaSolta: {
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  alca: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { touchAction: 'none', cursor: 'grab', outlineStyle: 'none' } : null),
  },
});

export default ListaReordenavel;
