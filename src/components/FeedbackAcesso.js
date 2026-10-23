/**
 * Botão de feedback com a janela de envio. Usado na camada da raiz (FeedbackLayer) e
 * dentro de cada Modal (ModalApp), porque na web e no nativo o Modal cobre a raiz.
 */
import React, { useState } from 'react';
import FeedbackButton from './FeedbackButton';
import FeedbackSheet from './FeedbackSheet';
import { useToast } from './Toast';
import { getCurrentRouteName } from '../navigation/currentRoute';

const FeedbackAcesso = () => {
  const toast = useToast();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tela, setTela] = useState(null);

  const abrirSheet = () => {
    setTela(getCurrentRouteName());
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
        onSent={handleEnviado}
      />
    </>
  );
};

export default FeedbackAcesso;
