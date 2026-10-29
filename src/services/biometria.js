/**
 * Biometria no app nativo (digital, rosto). A biometria só libera a sessão que já
 * está no aparelho: nenhuma senha é guardada. Na web existe biometria.web.js, que
 * não faz nada.
 */
import ReactNativeBiometrics from 'react-native-biometrics';
import { Storage } from '../utils/storage';
import { rotuloBiometria } from '../utils/biometriaFluxo';

const CHAVE = 'biometria_preferencia';
const criarLeitor = () => new ReactNativeBiometrics();

// Guarda o tipo que o aparelho informou em biometriaDisponivel, que roda antes de qualquer tela.
let tipoAtual = null;
export const rotuloAtual = () => rotuloBiometria(tipoAtual);

export const biometriaDisponivel = async () => {
  try {
    const resposta = await criarLeitor().isSensorAvailable();
    tipoAtual = resposta.biometryType || null;
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
