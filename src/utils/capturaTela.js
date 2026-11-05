// Imagem da tela para anexar ao relato (Android e iOS). Devolve JPEG em base64, ou null se não der.
// O servidor aceita até 400 KB de imagem, que em base64 são cerca de 533 mil caracteres.
import { Dimensions } from 'react-native';

export const LIMITE_BASE64 = 530000;
const LARGURA_SAIDA = 540;

export const tamanhoDaTela = () => {
  const { width, height } = Dimensions.get('window');
  return `${Math.round(width)}x${Math.round(height)}`;
};

export const capturarTela = async () => {
  try {
    const { captureScreen } = require('react-native-view-shot');
    const { width, height } = Dimensions.get('window');
    const base64 = await captureScreen({
      format: 'jpg',
      quality: 0.6,
      result: 'base64',
      width: LARGURA_SAIDA,
      height: Math.round((LARGURA_SAIDA * height) / width),
    });
    return base64 && base64.length <= LIMITE_BASE64 ? base64 : null;
  } catch {
    return null;
  }
};
