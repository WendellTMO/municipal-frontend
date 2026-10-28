import React, {useState} from 'react';
import {Platform} from 'react-native';
import Login from '../screens/Auth/Login';
import CriarConta from '../screens/Auth/CriarConta';
import RecuperarSenha from '../screens/Auth/RecuperarSenha';
import ConsentimentoResponsavel from '../screens/Auth/ConsentimentoResponsavel';
import {
  NavigationProvider,
  Navigator,
  Screen,
} from './SimpleNavigator';
import {lerRotaDaUrl, limparUrl} from './rotaDaUrl';

// Detecta se está na web
const isWeb = Platform.OS === 'web';

// Para mobile, tenta usar React Navigation
let NativeStackNavigator = null;
let createNativeStackNavigator = null;

if (!isWeb) {
  try {
    const ReactNavigation = require('@react-navigation/native-stack');
    createNativeStackNavigator = ReactNavigation.createNativeStackNavigator;
  } catch (e) {
    // Se não conseguir carregar, usa navegação simples
    console.log('React Navigation não disponível, usando navegação simples');
  }
}

const AuthNavigator = () => {
  // Lido uma vez só: o link vira a rota inicial e a URL é limpa.
  const [entrada] = useState(() => {
    const rota = lerRotaDaUrl();
    if (rota) limparUrl();
    return rota;
  });

  // Se estiver na web ou React Navigation não estiver disponível, usa navegação simples
  if (isWeb || !createNativeStackNavigator) {
    return (
      <NavigationProvider
        initialRoute={entrada ? entrada.route : 'Login'}
        initialParams={entrada ? entrada.params : {}}>
        <Navigator>
          <Screen name="Login" component={Login} />
          <Screen name="CriarConta" component={CriarConta} />
          <Screen name="RecuperarSenha" component={RecuperarSenha} />
          <Screen name="ConsentimentoResponsavel" component={ConsentimentoResponsavel} />
        </Navigator>
      </NavigationProvider>
    );
  }

  // Para mobile, usa React Navigation
  if (!NativeStackNavigator && createNativeStackNavigator) {
    NativeStackNavigator = createNativeStackNavigator();
  }

  const Stack = NativeStackNavigator;

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="CriarConta" component={CriarConta} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenha} />
      <Stack.Screen name="ConsentimentoResponsavel" component={ConsentimentoResponsavel} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

