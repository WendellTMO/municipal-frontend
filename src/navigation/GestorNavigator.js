import React from 'react';
import { Platform } from 'react-native';

// Gestor screens
import DashboardGestor from '../screens/Gestor/DashboardGestor';
import ViagensList from '../screens/Gestor/ViagensList';
import EquipeGestor from '../screens/Gestor/EquipeGestor';
import FrotaGestor from '../screens/Gestor/FrotaGestor';
import NotificacoesGestor from '../screens/Gestor/NotificacoesGestor';
import DetalheAlunoGestor from '../screens/Gestor/DetalheAlunoGestor';
import OcorrenciasGestor from '../screens/Gestor/OcorrenciasGestor';
import CadastrosPendentes from '../screens/Gestor/CadastrosPendentes';
import ResumoSemana from '../screens/Gestor/ResumoSemana';

// Shared screens (reused from Motorista)
import RotaMotorista from '../screens/Motorista/RotaMotorista';
import CriarRota from '../screens/Motorista/CriarRota';
import CriarViagem from '../screens/Motorista/CriarViagem';
import DetalheViagemMotorista from '../screens/Motorista/DetalheViagemMotorista';
import ListaAlunosConfirmados from '../screens/Motorista/ListaAlunosConfirmados';
import ListaViagensMotorista from '../screens/Motorista/ListaViagens';
import DefinirPontosRota from '../screens/Motorista/DefinirPontosRota';
import DefinirHorariosRota from '../screens/Motorista/DefinirHorariosRota';
import ConfigNotificacoes from '../screens/ConfigNotificacoes';

import { colors, spacing } from '../theme';
import Icon from '../components/Icon';

const isWeb = Platform.OS === 'web';

let createBottomTabNavigator = null;
let createNativeStackNavigator = null;

if (!isWeb) {
  try {
    const bottomTabs = require('@react-navigation/bottom-tabs');
    createBottomTabNavigator = bottomTabs.createBottomTabNavigator;
  } catch (e) {
    console.warn('bottom-tabs not available');
  }
  try {
    const nativeStack = require('@react-navigation/native-stack');
    createNativeStackNavigator = nativeStack.createNativeStackNavigator;
  } catch (e) {
    console.warn('native-stack not available');
  }
}

const GESTOR_COLOR = colors.roles.gestor;

const TAB_ICON_MAP = {
  InicioTab: 'home',
  ViagensTab: 'directions-bus',
  RotasTab: 'route',
  EquipeTab: 'people',
  FrotaTab: 'commute',
  PerfilTab: 'settings',
};

const TAB_LABEL_MAP = {
  InicioTab: 'Início',
  ViagensTab: 'Viagens',
  RotasTab: 'Rotas',
  EquipeTab: 'Equipe',
  FrotaTab: 'Frota',
  PerfilTab: 'Perfil',
};

// ─── Stacks aninhados por domínio ─────────────────────────────────────────────

let ViagensStackNavigator = null;
let RotasStackNavigator = null;
let EquipeStackNavigator = null;
let PerfilStackNavigator = null;

function ViagensStack() {
  if (!ViagensStackNavigator && createNativeStackNavigator) {
    ViagensStackNavigator = createNativeStackNavigator();
  }
  const Stack = ViagensStackNavigator;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="ViagensList" component={ViagensList} />
      <Stack.Screen name="DetalheViagemMotorista" component={DetalheViagemMotorista} />
      <Stack.Screen name="ListaAlunosConfirmados" component={ListaAlunosConfirmados} />
      <Stack.Screen name="CriarViagem" component={CriarViagem} />
    </Stack.Navigator>
  );
}

function RotasStack() {
  if (!RotasStackNavigator && createNativeStackNavigator) {
    RotasStackNavigator = createNativeStackNavigator();
  }
  const Stack = RotasStackNavigator;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="RotaMotorista" component={RotaMotorista} />
      <Stack.Screen name="CriarRota" component={CriarRota} />
      <Stack.Screen name="DefinirPontosRota" component={DefinirPontosRota} />
      <Stack.Screen name="DefinirHorariosRota" component={DefinirHorariosRota} />
      <Stack.Screen name="CriarViagem" component={CriarViagem} />
      {/* RotaMotorista navigates here when the gestor taps "Ver Viagens" */}
      <Stack.Screen name="ListaViagens" component={ListaViagensMotorista} />
      <Stack.Screen name="DetalheViagemMotorista" component={DetalheViagemMotorista} />
      <Stack.Screen name="ListaAlunosConfirmados" component={ListaAlunosConfirmados} />
    </Stack.Navigator>
  );
}

function EquipeStack() {
  if (!EquipeStackNavigator && createNativeStackNavigator) {
    EquipeStackNavigator = createNativeStackNavigator();
  }
  const Stack = EquipeStackNavigator;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="EquipeGestor" component={EquipeGestor} />
      <Stack.Screen name="DetalheAlunoGestor" component={DetalheAlunoGestor} />
      <Stack.Screen name="CadastrosPendentes" component={CadastrosPendentes} />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  if (!PerfilStackNavigator && createNativeStackNavigator) {
    PerfilStackNavigator = createNativeStackNavigator();
  }
  const Stack = PerfilStackNavigator;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="ConfigNotificacoesGestor" component={ConfigNotificacoes} />
      <Stack.Screen name="NotificacoesGestor" component={NotificacoesGestor} />
      <Stack.Screen name="OcorrenciasGestor" component={OcorrenciasGestor} />
      <Stack.Screen name="ResumoSemana" component={ResumoSemana} />
    </Stack.Navigator>
  );
}

// ─── Tab Navigator ─────────────────────────────────────────────────────────────

let TabNavigatorInstance = null;

const GestorNavigator = () => {
  if (isWeb || !createBottomTabNavigator || !createNativeStackNavigator) {
    // Fallback: usar SimpleNavigator para web
    const { NavigationProvider, Navigator, Screen } = require('./SimpleNavigator');
    return (
      <NavigationProvider initialRoute="DashboardGestor">
        <Navigator>
          <Screen name="DashboardGestor" component={DashboardGestor} />
          <Screen name="ViagensList" component={ViagensList} />
          <Screen name="DetalheViagemMotorista" component={DetalheViagemMotorista} />
          <Screen name="ListaAlunosConfirmados" component={ListaAlunosConfirmados} />
          <Screen name="CriarViagem" component={CriarViagem} />
          <Screen name="RotaMotorista" component={RotaMotorista} />
          <Screen name="CriarRota" component={CriarRota} />
          <Screen name="DefinirPontosRota" component={DefinirPontosRota} />
          <Screen name="DefinirHorariosRota" component={DefinirHorariosRota} />
          <Screen name="ListaViagens" component={ListaViagensMotorista} />
          <Screen name="EquipeGestor" component={EquipeGestor} />
          <Screen name="DetalheAlunoGestor" component={DetalheAlunoGestor} />
          <Screen name="FrotaGestor" component={FrotaGestor} />
          <Screen name="ConfigNotificacoesGestor" component={ConfigNotificacoes} />
          <Screen name="NotificacoesGestor" component={NotificacoesGestor} />
          <Screen name="OcorrenciasGestor" component={OcorrenciasGestor} />
          <Screen name="CadastrosPendentes" component={CadastrosPendentes} />
          <Screen name="ResumoSemana" component={ResumoSemana} />
        </Navigator>
      </NavigationProvider>
    );
  }

  if (!TabNavigatorInstance) {
    TabNavigatorInstance = createBottomTabNavigator();
  }
  const Tab = TabNavigatorInstance;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICON_MAP[route.name]} size={size} color={color} />
        ),
        tabBarLabel: TAB_LABEL_MAP[route.name] ?? route.name,
        tabBarActiveTintColor: GESTOR_COLOR,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.paper,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          height: 64,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
          elevation: 8,
          shadowColor: colors.primary.main,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}>
      <Tab.Screen name="InicioTab" component={DashboardGestor} />
      <Tab.Screen name="ViagensTab" component={ViagensStack} />
      <Tab.Screen name="RotasTab" component={RotasStack} />
      <Tab.Screen name="EquipeTab" component={EquipeStack} />
      <Tab.Screen name="FrotaTab" component={FrotaGestor} />
      <Tab.Screen name="PerfilTab" component={PerfilStack} />
    </Tab.Navigator>
  );
};

export default GestorNavigator;
