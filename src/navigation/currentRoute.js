import { Platform } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { getActiveWebRoute } from './SimpleNavigator';

// No nativo o NavigationContainer recebe esta ref; no web a navegação é o SimpleNavigator.
export const navigationRef = createNavigationContainerRef();

export const getCurrentRouteName = () => {
  if (Platform.OS === 'web') return getActiveWebRoute() || null;
  return navigationRef.getCurrentRoute()?.name || null;
};
