import Config from 'react-native-config';
import { Platform, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

// FEEDBACK_ENABLED=false esconde o botão e o aviso beta. Ligado por padrão.
const raw = Platform.OS === 'web' ? process.env.FEEDBACK_ENABLED : (Config as unknown as Record<string, string | undefined>).FEEDBACK_ENABLED;

export const FEEDBACK_ENABLED = raw !== 'false';

// Espaço no fim das listas rolantes para o botão flutuante não cobrir o conteúdo.
export const FEEDBACK_FAB_SPACE = FEEDBACK_ENABLED ? 88 : 0;

// Mantém o paddingBottom que a tela já tinha quando ele for maior.
export const withFabSpace = (style?: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  const flat = StyleSheet.flatten(style) || {};
  const atual = typeof flat.paddingBottom === 'number' ? flat.paddingBottom : 0;
  return [flat, { paddingBottom: Math.max(atual, FEEDBACK_FAB_SPACE) }];
};
