import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ToastProvider } from './src/components';
import SplashScreen from './src/screens/SplashScreen';
import FeedbackLayer from './src/components/FeedbackLayer';
import BiometriaOferta from './src/components/BiometriaOferta';
import DesbloqueioBiometria from './src/screens/Auth/DesbloqueioBiometria';
import { FeedbackPadraoProvider } from './src/components/FeedbackPadraoContext';
import { FEEDBACK_ENABLED } from './src/config/feedback';
import { navigationRef } from './src/navigation/currentRoute';
import { definirRotaAtual, registrarNavegador } from './src/navigation/rotaAtual';
import BarraGlobal from './src/components/BarraGlobal';
import { Platform, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AvisoAtualizacao from './src/components/AvisoAtualizacao';
import AlertaProvider from './src/components/AlertaProvider';
import { limparUrl } from './src/navigation/rotaDaUrl';

const Root: React.FC = () => {
  const { loading, isAuthenticated, biometria } = useAuth();

  const DEBUG_HOLD_SPLASH = __DEV__ && Platform.OS !== 'web';
  const [released, setReleased] = React.useState(!DEBUG_HOLD_SPLASH);

  // Quem já está logado ao abrir um link de convite cai no painel; a URL é limpa.
  React.useEffect(() => {
    if (isAuthenticated) limparUrl();
  }, [isAuthenticated]);

  if (loading || !released) {
    return <SplashScreen onContinue={() => setReleased(true)} />;
  }

  if (isAuthenticated && biometria.bloqueado) {
    return <DesbloqueioBiometria />;
  }

  return (
    <>
      {/* Android: desenha sob a barra de status; o inset dela vira o topo do cabeçalho. */}
      {isAuthenticated ? <StatusBar translucent backgroundColor="transparent" barStyle="light-content" /> : null}
      {/* A barra inferior é única e fica fora do navegador: só o conteúdo muda por cima. */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <MainNavigator />
        </View>
        {isAuthenticated ? <BarraGlobal /> : null}
      </View>
      {isAuthenticated ? <BiometriaOferta /> : null}
      {isAuthenticated && FEEDBACK_ENABLED ? <FeedbackLayer /> : null}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <SafeAreaProvider>
    <ToastProvider>
      <AuthProvider>
        <FeedbackPadraoProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            registrarNavegador((nome, params) => navigationRef.navigate(nome as never, params as never));
            definirRotaAtual(navigationRef.getCurrentRoute()?.name ?? null);
          }}
          onStateChange={() => definirRotaAtual(navigationRef.getCurrentRoute()?.name ?? null)}
          documentTitle={{
            formatter: (options, route) =>
              `BusKá - ${options?.title ?? route?.name ?? 'Transporte Escolar'}`,
          }}
        >
          <AlertaProvider>
            <Root />
          </AlertaProvider>
          <AvisoAtualizacao />
        </NavigationContainer>
        </FeedbackPadraoProvider>
      </AuthProvider>
    </ToastProvider>
    </SafeAreaProvider>
  );
};