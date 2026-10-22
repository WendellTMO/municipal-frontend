/**
 * Padrão de posição do botão de feedback por tela. Uma tela chama
 * useFeedbackPadrao('topo') enquanto estiver montada e o padrão volta ao normal
 * ao sair. A posição que o usuário salvou ao arrastar sempre vence.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const Contexto = createContext({ padrao: null, setPadrao: () => {} });

export const FeedbackPadraoProvider = ({ children }) => {
  const [padrao, setPadrao] = useState(null);
  return <Contexto.Provider value={{ padrao, setPadrao }}>{children}</Contexto.Provider>;
};

export const useFeedbackPadraoAtual = () => useContext(Contexto).padrao;

export const useFeedbackPadrao = nome => {
  const { setPadrao } = useContext(Contexto);
  useEffect(() => {
    setPadrao(nome);
    return () => setPadrao(null);
  }, [nome, setPadrao]);
};
