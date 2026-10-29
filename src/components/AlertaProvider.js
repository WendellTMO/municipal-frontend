/**
 * Diálogo do app para a web (substitui o popup do navegador). Monte uma vez na raiz.
 * Mostra um alerta por vez; os seguintes entram na fila.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { colors } from '../theme';
import { registrarAlerta } from '../utils/alerta';
import DialogoConfirmacao from './DialogoConfirmacao';

// Ações primeiro, cancelar por último; destrutiva em vermelho.
const montarBotoes = (botoes, fechar) => {
  const acoes = [];
  const cancelar = [];
  for (const botao of botoes) {
    const visual = { texto: botao.text, cor: colors.primary.main };
    if (botao.style === 'destructive') visual.cor = colors.error.main;
    if (botao.style === 'cancel') {
      visual.cor = colors.neutral[200];
      visual.corTexto = colors.text.primary;
    }
    visual.onPress = () => {
      fechar();
      if (botao.onPress) botao.onPress();
    };
    if (botao.style === 'cancel') cancelar.push(visual);
    else acoes.push(visual);
  }
  return [...acoes, ...cancelar];
};

const AlertaProvider = ({ children }) => {
  const [fila, setFila] = useState([]);

  const empilhar = useCallback(item => setFila(atual => [...atual, item]), []);
  const fechar = useCallback(() => setFila(atual => atual.slice(1)), []);

  useEffect(() => registrarAlerta(empilhar), [empilhar]);

  const atual = fila[0] || null;
  return (
    <>
      {children}
      <DialogoConfirmacao
        visible={!!atual}
        titulo={atual ? atual.titulo : ''}
        resumo={atual ? atual.mensagem : ''}
        onCancelar={fechar}
        botoes={atual ? montarBotoes(atual.botoes, fechar) : []}
      />
    </>
  );
};

export default AlertaProvider;
