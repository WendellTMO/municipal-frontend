// Retorno tátil do app: uma vibração curta em toques, avisos e gestos. No Android usa o toque
// háptico do sistema e respeita a configuração "vibrar ao tocar" do aparelho. Web e sistemas sem
// o módulo nativo não fazem nada.
import { Platform } from 'react-native';

export const TIPOS_HAPTICOS = {
  toque: 'impactLight', // botões e itens
  pegar: 'impactMedium', // pegar o botão de feedback, passar do limite de um gesto
  selecao: 'selection', // marcar uma opção
  sucesso: 'notificationSuccess',
  erro: 'notificationError',
};

let modulo = null;
if (Platform.OS !== 'web') {
  try {
    modulo = require('react-native-haptic-feedback').default;
  } catch {
    modulo = null;
  }
}

const OPCOES = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

export const haptico = (tipo = 'toque') => {
  if (!modulo) return;
  try {
    modulo.trigger(TIPOS_HAPTICOS[tipo] || TIPOS_HAPTICOS.toque, OPCOES);
  } catch {
    // vibração é só um complemento
  }
};
