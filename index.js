import { AppRegistry, Platform } from 'react-native';
import { App } from './App';
import { name as appName } from './app.json';
import { registrarServicoViagem, tratarDemandaComLogin } from './src/services/servicoViagem';

// Serviço em primeiro plano da viagem (Android); no-op nas outras plataformas.
registrarServicoViagem();

// Background/quit-state FCM handler — must be registered before the app renders
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // The OS already shows the system notification automatically.
      // Silent data-only messages: demanda de posição do motorista.
      console.log('[FCM] Background message:', remoteMessage?.messageId);
      await tratarDemandaComLogin(remoteMessage);
    });
  } catch {
    // Firebase not installed
  }
}

AppRegistry.registerComponent(appName, () => App);
