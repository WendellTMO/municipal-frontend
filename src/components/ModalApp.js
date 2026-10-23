/**
 * Modal do app: igual ao Modal do React Native, mais o botão de feedback por cima
 * (só com usuário logado e FEEDBACK_ENABLED ligado). Sem o botão aqui ele ficaria
 * escondido atrás de toda janela, folha e tela cheia.
 */
import React from 'react';
import { Modal } from 'react-native';
import FeedbackAcesso from './FeedbackAcesso';
import { FEEDBACK_ENABLED } from '../config/feedback';
import { useAuth } from '../contexts/AuthContext';

const ModalApp = ({ children, ...props }) => {
  const { isAuthenticated } = useAuth();
  const comFeedback = FEEDBACK_ENABLED && isAuthenticated;
  return (
    <Modal {...props}>
      {children}
      {comFeedback && props.visible ? <FeedbackAcesso /> : null}
    </Modal>
  );
};

export default ModalApp;
