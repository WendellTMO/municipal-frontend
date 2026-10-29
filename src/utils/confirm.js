import { alertar } from './alerta';

/**
 * Confirmação com dois botões. No celular é o alerta do sistema; na web é o diálogo do app.
 */
export const confirmAction = ({
  title,
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  alertar(title, message, [
    { text: cancelText, style: 'cancel', onPress: () => onCancel?.() },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => onConfirm?.() },
  ]);
};

export default confirmAction;
