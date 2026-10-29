import React from 'react';
import {Platform} from 'react-native';
import DashboardAluno from '../screens/Aluno/DashboardAluno';
import SelecaoRotas from '../screens/Aluno/SelecaoRotas';
import RotaAluno from '../screens/Aluno/RotaAluno';
import ConfigNotificacoes from '../screens/ConfigNotificacoes';
import NotificacoesAluno from '../screens/Aluno/NotificacoesAluno';
import DetalheViagem from '../screens/Aluno/DetalheViagem';
import LocalizacaoOnibus from '../screens/Aluno/LocalizacaoOnibus';
import EditarPerfilAluno from '../screens/Aluno/EditarPerfilAluno';
import {
  NavigationProvider,
  Navigator,
  Screen,
} from './SimpleNavigator';

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
    console.log('React Navigation não disponível, usando navegação simples');
  }
}

const AlunoNavigator = () => {
  // Se estiver na web ou React Navigation não estiver disponível, usa navegação simples
  if (isWeb || !createNativeStackNavigator) {
    return (
      <NavigationProvider initialRoute="DashboardAluno">
        <Navigator>
          <Screen name="DashboardAluno" component={DashboardAluno} />
          <Screen name="SelecaoRotas" component={SelecaoRotas} />
          <Screen name="RotaAluno" component={RotaAluno} />
          <Screen name="ConfigNotificacoesAluno" component={ConfigNotificacoes} />
          <Screen name="NotificacoesAluno" component={NotificacoesAluno} />
          <Screen name="DetalheViagem" component={DetalheViagem} />
          <Screen name="LocalizacaoOnibus" component={LocalizacaoOnibus} />
          <Screen name="EditarPerfilAluno" component={EditarPerfilAluno} />
          {/* Telas auxiliares */}
          <Screen name="MinhasRotas" component={RotaAluno} />
          <Screen name="Notificacoes" component={NotificacoesAluno} />
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
      initialRouteName="DashboardAluno"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Stack.Screen name="DashboardAluno" component={DashboardAluno} />
      <Stack.Screen name="SelecaoRotas" component={SelecaoRotas} />
      <Stack.Screen name="RotaAluno" component={RotaAluno} />
      <Stack.Screen name="ConfigNotificacoesAluno" component={ConfigNotificacoes} />
      <Stack.Screen name="NotificacoesAluno" component={NotificacoesAluno} />
      <Stack.Screen name="DetalheViagem" component={DetalheViagem} />
      <Stack.Screen name="LocalizacaoOnibus" component={LocalizacaoOnibus} />
      <Stack.Screen name="EditarPerfilAluno" component={EditarPerfilAluno} />
      {/* Telas auxiliares */}
      <Stack.Screen name="MinhasRotas" component={RotaAluno} />
      <Stack.Screen name="Notificacoes" component={NotificacoesAluno} />
    </Stack.Navigator>
  );
};

export default AlunoNavigator;


