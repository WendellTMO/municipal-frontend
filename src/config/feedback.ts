import Config from 'react-native-config';
import { Platform } from 'react-native';

// FEEDBACK_ENABLED=false esconde o botão e o aviso beta. Ligado por padrão.
const raw = Platform.OS === 'web' ? process.env.FEEDBACK_ENABLED : (Config as unknown as Record<string, string | undefined>).FEEDBACK_ENABLED;

export const FEEDBACK_ENABLED = raw !== 'false';
