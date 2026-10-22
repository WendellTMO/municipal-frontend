/**
 * Biometria no app nativo (digital, rosto). A biometria só libera a sessão que já
 * está no aparelho: nenhuma senha é guardada. Na web existe biometria.web.js, que
 * não faz nada.
 */
import ReactNativeBiometrics from 'react-native-biometrics';
import { Storage } from '../utils/storage';

const CHAVE = 'biometria_preferencia';
const criarLeitor = () => new ReactNativeBiometrics();

export const biometriaDisponivel = async () => {
  try {
    const resposta = await criarLeitor().isSensorAvailable();
    return !!resposta.available;
  } catch (e) {
    return false;
  }
};

export const pedirBiometria = async mensagem => {
  try {
    const resposta = await criarLeitor().simplePrompt({
      promptMessage: mensagem,
      cancelButtonText: 'Cancelar',
    });
    return !!resposta.success;
  } catch (e) {
    return false;
  }
};

export const lerPreferencia = async () => {
  const valor = await Storage.getItem(CHAVE);
  if (valor === 'sim' || valor === 'nao') return valor;
  return null;
};

export const gravarPreferencia = valor => Storage.setItem(CHAVE, valor);

// Sair da conta desliga a biometria. O "Agora não" fica guardado para não perguntar de novo.
export const desligarNoLogout = async () => {
  const valor = await lerPreferencia();
  if (valor === 'sim') await Storage.removeItem(CHAVE);
};
