import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

export interface VersaoInstalada {
  versionCode: number;
  versionName: string;
}

// Só o Android tem APK avulso; no iOS devolve null ("sem verificação"). A web usa versaoApp.web.ts.
export const lerVersaoInstalada = (): VersaoInstalada | null => {
  if (Platform.OS !== 'android') return null;
  const versionCode = parseInt(DeviceInfo.getBuildNumber(), 10);
  if (Number.isNaN(versionCode)) return null;
  return { versionCode, versionName: DeviceInfo.getVersion() };
};
