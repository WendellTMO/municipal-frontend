// Token de acesso no cofre do sistema (Keystore no Android, Keychain no iOS).
// Na web existe tokenSeguro.web.js, que usa o armazenamento do navegador.
import * as Keychain from 'react-native-keychain';
import { Storage, STORAGE_KEYS } from './storage';

const SERVICO = 'buska.token';

export async function gravarToken(token) {
  try {
    await Keychain.setGenericPassword('buska', token, { service: SERVICO });
    await Storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (e) {
    // shortcut: aparelho sem cofre funcionando guarda em texto puro, melhor que login quebrado. Revisar se aparecer em campo.
    console.error('Cofre indisponível, token guardado no armazenamento comum:', e);
    await Storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }
}

export async function lerToken() {
  try {
    const guardado = await Keychain.getGenericPassword({ service: SERVICO });
    if (guardado) return guardado.password;
  } catch (e) {
    console.error('Erro ao ler o cofre:', e);
  }
  // Sessões de versões antigas ainda estão no armazenamento comum: passa para o cofre.
  const antigo = await Storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (antigo) await gravarToken(antigo);
  return antigo;
}

export async function temSessao() {
  return !!(await lerToken());
}

export async function apagarToken() {
  try {
    await Keychain.resetGenericPassword({ service: SERVICO });
  } catch (e) {
    console.error('Erro ao apagar do cofre:', e);
  }
  await Storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
}
