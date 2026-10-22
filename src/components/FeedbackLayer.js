/**
 * Botão de feedback, janela de envio e aviso beta. Uma única instância, montada
 * por App.tsx só com usuário logado.
 */
import React, { useEffect, useState } from 'react';
import FeedbackButton from './FeedbackButton';
import FeedbackSheet from './FeedbackSheet';
import BetaNoticeModal from './BetaNoticeModal';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { Storage } from '../utils/storage';
import { betaNoticeKey, shouldShowBetaNotice } from '../utils/feedback';
import { getCurrentRouteName } from '../navigation/currentRoute';

const FeedbackLayer = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tela, setTela] = useState(null);
  const [noticeVisible, setNoticeVisible] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelado = false;
    const verificar = async () => {
      let guardado = null;
      try {
        guardado = await Storage.getItem(betaNoticeKey(userId));
      } catch (e) {
        guardado = null; // storage falhou: mostra o aviso de novo
      }
      if (!cancelado) setNoticeVisible(shouldShowBetaNotice(guardado));
    };
    verificar();
    return () => {
      cancelado = true;
    };
  }, [userId]);

  const handleConfirmarAviso = async () => {
    setNoticeVisible(false);
    try {
      await Storage.setItem(betaNoticeKey(userId), '1');
    } catch (e) {
      // sem storage o aviso volta no próximo login
    }
  };

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
      <BetaNoticeModal visible={noticeVisible} onConfirm={handleConfirmarAviso} />
    </>
  );
};

export default FeedbackLayer;
