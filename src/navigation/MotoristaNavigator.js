import React from 'react';
import {Platform} from 'react-native';
import DashboardMotorista from '../screens/Motorista/DashboardMotorista';
import RotaMotorista from '../screens/Motorista/RotaMotorista';
import CriarRota from '../screens/Motorista/CriarRota';
import CriarViagem from '../screens/Motorista/CriarViagem';
import ListaViagens from '../screens/Motorista/ListaViagens';
import DetalheViagemMotorista from '../screens/Motorista/DetalheViagemMotorista';
import ListaAlunosConfirmados from '../screens/Motorista/ListaAlunosConfirmados';
import DefinirPontosRota from '../screens/Motorista/DefinirPontosRota';
import DefinirHorariosRota from '../screens/Motorista/DefinirHorariosRota';
import InicioFimViagem from '../screens/Motorista/InicioFimViagem';
import NotificacoesInbox from '../screens/Aluno/NotificacoesAluno';
import ConfigNotificacoes from '../screens/ConfigNotificacoes';
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

const MotoristaNavigator = () => {
  // Se estiver na web ou React Navigation não estiver disponível, usa navegação simples
  if (isWeb || !createNativeStackNavigator) {
    return (
      <NavigationProvider initialRoute="DashboardMotorista">
        <Navigator>
          <Screen name="DashboardMotorista" component={DashboardMotorista} />
          <Screen name="RotaMotorista" component={RotaMotorista} />
          <Screen name="CriarRota" component={CriarRota} />
          <Screen name="CriarViagem" component={CriarViagem} />
          <Screen name="ListaViagens" component={ListaViagens} />
          <Screen
            name="DetalheViagemMotorista"
            component={DetalheViagemMotorista}
          />
          <Screen
            name="ListaAlunosConfirmados"
            component={ListaAlunosConfirmados}
          />
          <Screen name="DefinirPontosRota" component={DefinirPontosRota} />
          <Screen name="DefinirHorariosRota" component={DefinirHorariosRota} />
          <Screen name="InicioFimViagem" component={InicioFimViagem} />
          <Screen
            name="ConfigNotificacoesMotorista"
            component={ConfigNotificacoes}
          />
          <Screen name="NotificacoesMotorista" component={NotificacoesInbox} />
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
      initialRouteName="DashboardMotorista"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="DashboardMotorista" component={DashboardMotorista} />
      <Stack.Screen name="RotaMotorista" component={RotaMotorista} />
      <Stack.Screen name="CriarRota" component={CriarRota} />
      <Stack.Screen name="CriarViagem" component={CriarViagem} />
      <Stack.Screen name="ListaViagens" component={ListaViagens} />
      <Stack.Screen
        name="DetalheViagemMotorista"
        component={DetalheViagemMotorista}
      />
      <Stack.Screen
        name="ListaAlunosConfirmados"
        component={ListaAlunosConfirmados}
      />
      <Stack.Screen name="DefinirPontosRota" component={DefinirPontosRota} />
      <Stack.Screen name="DefinirHorariosRota" component={DefinirHorariosRota} />
      <Stack.Screen name="InicioFimViagem" component={InicioFimViagem} />
      <Stack.Screen
        name="ConfigNotificacoesMotorista"
        component={ConfigNotificacoes}
      />
      <Stack.Screen name="NotificacoesMotorista" component={NotificacoesInbox} />
    </Stack.Navigator>
  );
};

export default MotoristaNavigator;

