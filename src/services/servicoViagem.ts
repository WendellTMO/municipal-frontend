/**
 * Serviço em primeiro plano do Android: mantém o app vivo durante a viagem para o envio
 * de posição continuar com a tela apagada. iOS tem desenho próprio depois (no-op aqui).
 */
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { aguardarCondicao } from '../utils/aguardarCondicao';
import { tratarMensagemDemanda } from '../utils/demandaLocalizacao';
import { Storage, STORAGE_KEYS } from '../utils/storage';

let resolverServico: (() => void) | null = null;
// Muda a cada início ou parada: uma espera pela permissão que ficou para trás desiste sozinha.
let geracao = 0;

const ESPERA_PERMISSAO_MS = 1000;
const TENTATIVAS_PERMISSAO = 60;

// No Android 14 o serviço do tipo localização só pode iniciar com a permissão de localização já
// concedida; sem ela o sistema derruba o app e o try/catch do JS não pega. Quem pede a permissão é
// o mapa da tela da viagem, então aqui só se espera ela ser concedida (sem abrir um segundo pedido).
const temPermissaoDeLocalizacao = async (): Promise<boolean> => {
  const fina = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  if (fina) return true;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
};

// Chamar uma vez em index.js, antes de registrar o componente.
export function registrarServicoViagem(): void {
  if (Platform.OS !== 'android') return;
  const notifee = require('@notifee/react-native').default;
  notifee.registerForegroundService(
    () =>
      new Promise<void>((resolve) => {
        resolverServico = resolve;
      }),
  );
}

// Como terminou a tentativa de iniciar o serviço: o app mostra um aviso quando não deu certo,
// porque sem o serviço o Android pode parar o envio da posição com a tela bloqueada.
export type ResultadoServico = 'ok' | 'sem-localizacao' | 'erro';

// Chamar com o app visível (iniciar viagem).
export async function iniciarServicoViagem(): Promise<ResultadoServico> {
  if (Platform.OS !== 'android' || resolverServico) return 'ok';
  geracao += 1;
  const minhaGeracao = geracao;
  try {
    const liberada = await aguardarCondicao({
      verificar: temPermissaoDeLocalizacao,
      tentativas: TENTATIVAS_PERMISSAO,
      esperaMs: ESPERA_PERMISSAO_MS,
      cancelado: () => minhaGeracao !== geracao,
    });
    if (!liberada) return 'sem-localizacao';
    const { default: notifee, AndroidImportance, AndroidForegroundServiceType } = require('@notifee/react-native');
    // Pede a permissão, mas não desiste se for negada: no Android 13 ou mais novo o serviço de
    // localização roda mesmo sem a notificação aparecer, e é ele que mantém o envio com a tela bloqueada.
    await notifee.requestPermission();
    const canalId = await notifee.createChannel({
      id: 'viagem_em_andamento',
      name: 'Viagem em andamento',
      importance: AndroidImportance.LOW,
      vibration: false,
    });
    await notifee.displayNotification({
      id: 'viagem_em_andamento',
      title: 'Viagem em andamento',
      android: {
        channelId: canalId,
        asForegroundService: true,
        ongoing: true,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [{ title: 'Abrir', pressAction: { id: 'abrir', launchActivity: 'default' } }],
      },
    });
    return 'ok';
  } catch {
    // Sem serviço o envio normal segue funcionando.
    return 'erro';
  }
}

// Android com economia de bateria ligada para o app: com a tela bloqueada o sistema pode parar o envio.
export async function bateriaRestringida(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const notifee = require('@notifee/react-native').default;
    return !!(await notifee.isBatteryOptimizationEnabled());
  } catch {
    return false;
  }
}

export async function abrirAjustesDeBateria(): Promise<void> {
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.openBatteryOptimizationSettings();
  } catch {
    Linking.openSettings();
  }
}

export function abrirAjustesDoApp(): void {
  Linking.openSettings();
}

export async function pararServicoViagem(): Promise<void> {
  if (Platform.OS !== 'android') return;
  geracao += 1;
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.stopForegroundService();
    await notifee.cancelNotification('viagem_em_andamento');
  } catch {
    // nada a parar
  }
  if (resolverServico) {
    resolverServico();
    resolverServico = null;
  }
}

// Push de demanda: só envia se a mensagem, a viagem e o login conferirem.
export async function tratarDemandaComLogin(mensagem: { data?: Record<string, string> }): Promise<void> {
  try {
    const logado = !!(await Storage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
    await tratarMensagemDemanda(mensagem, logado);
  } catch {
    // O intervalo adaptativo cobre a falha.
  }
}

// Devolve a função que cancela a escuta (primeiro plano); o segundo plano fica em index.js.
export function escutarDemandaPrimeiroPlano(): () => void {
  if (Platform.OS !== 'android') return () => {};
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    return messaging().onMessage(tratarDemandaComLogin);
  } catch {
    return () => {}; // sem Firebase o intervalo adaptativo segue sozinho
  }
}
