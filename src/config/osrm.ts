import Config from 'react-native-config';
import { Platform } from 'react-native';

// OSRM_BASE_URL aponta para outro servidor OSRM. O padrao e o servidor publico.
const raw = Platform.OS === 'web' ? process.env.OSRM_BASE_URL : (Config as unknown as Record<string, string | undefined>).OSRM_BASE_URL;

export const OSRM_BASE_URL = raw && raw !== 'undefined' ? raw : 'https://router.project-osrm.org';
