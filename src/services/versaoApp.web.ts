import type { VersaoInstalada } from './versaoApp';

// Na web não há APK: sem verificação.
export const lerVersaoInstalada = (): VersaoInstalada | null => null;
