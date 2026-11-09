/**
 * Botão de feedback com a janela de envio. Usado na camada da raiz (FeedbackLayer) e
 * dentro de cada Modal (ModalApp), porque na web e no nativo o Modal cobre a raiz.
 */
import React, { useState } from 'react';
import { capturarTela } from '../utils/capturaTela';
import { registrarAcao } from '../utils/telemetriaFila';
import FeedbackButton from './FeedbackButton';
import FeedbackSheet from './FeedbackSheet';
import { useToast } from './Toast';
import { getCurrentRouteName } from '../navigation/currentRoute';

const FeedbackAcesso = () => {
  const toast = useToast();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tela, setTela] = useState(null);
  // Promessa da imagem da tela. Começa antes da janela subir, para a imagem mostrar a página
  // de onde o relato saiu, e a janela abre na hora sem esperar a captura terminar.
  const [captura, setCaptura] = useState(null);

  const abrirSheet = () => {
    setTela(getCurrentRouteName());
    registrarAcao('feedback_abrir', { tela: String(getCurrentRouteName() || '') });
    setCaptura(capturarTela());
    setSheetVisible(true);
  };

  const handleEnviado = () => {
    setSheetVisible(false);
    toast.success('Obrigado! Seu relato foi enviado.');
  };

  return (
    <>
      <FeedbackButton onPress={abrirSheet} />
      <FeedbackSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        tela={tela}
        captura={captura}
        onSent={handleEnviado}
      />
    </>
  );
};

export default FeedbackAcesso;
