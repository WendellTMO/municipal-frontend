import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ToastProvider } from './src/components';
import SplashScreen from './src/screens/SplashScreen';
import FeedbackLayer from './src/components/FeedbackLayer';
import BiometriaOferta from './src/components/BiometriaOferta';
import DesbloqueioBiometria from './src/screens/Auth/DesbloqueioBiometria';
import { FEEDBACK_ENABLED } from './src/config/feedback';
import { navigationRef } from './src/navigation/currentRoute';
import { Platform } from 'react-native';

const Root: React.FC = () => {
  const { loading, isAuthenticated, biometria } = useAuth();

  const DEBUG_HOLD_SPLASH = __DEV__ && Platform.OS !== 'web';
  const [released, setReleased] = React.useState(!DEBUG_HOLD_SPLASH);

  if (loading || !released) {
    return <SplashScreen onContinue={() => setReleased(true)} />;
  }

  if (isAuthenticated && biometria.bloqueado) {
    return <DesbloqueioBiometria />;
  }

  return (
    <>
      <MainNavigator />
      {isAuthenticated ? <BiometriaOferta /> : null}
      {isAuthenticated && FEEDBACK_ENABLED ? <FeedbackLayer /> : null}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <NavigationContainer
          ref={navigationRef}
          documentTitle={{
            formatter: (options, route) =>
              `BusKá - ${options?.title ?? route?.name ?? 'Transporte Escolar'}`,
          }}
        >
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </ToastProvider>
  );
};