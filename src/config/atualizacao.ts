import Config from 'react-native-config';
import { Platform } from 'react-native';

// Builds de loja devem definir ATUALIZACAO_VIA_APK=false (as lojas costumam proibir atualização por fora).
const raw = (Config as unknown as Record<string, string | undefined>).ATUALIZACAO_VIA_APK;

export const ATUALIZACAO_VIA_APK_ATIVA = Platform.OS !== 'web' && raw !== 'false';
