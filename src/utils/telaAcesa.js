import { NativeModules, Platform } from 'react-native';

// Mantém a tela acesa enquanto o motorista acompanha a viagem. Devolve a função que solta a tela.
// Android: FLAG_KEEP_SCREEN_ON (módulo TelaAcesa). Web: Wake Lock API, que o navegador solta sozinho
// ao esconder a aba, então pedimos de novo quando a aba volta a ficar visível.
// shortcut: iOS nativo não tem módulo, o app de iOS ainda não é publicado.
export const manterTelaAcesa = () => {
  if (Platform.OS === 'android') {
    const modulo = NativeModules.TelaAcesa;
    if (modulo) modulo.definir(true);
    return () => {
      if (modulo) modulo.definir(false);
    };
  }
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.wakeLock) return () => {};

  let trava = null;
  let ativo = true;
  const pedir = async () => {
    if (!ativo || document.visibilityState !== 'visible') return;
    try {
      trava = await navigator.wakeLock.request('screen');
    } catch {
      trava = null; // bateria fraca ou economia de energia: segue sem a trava
    }
  };
  document.addEventListener('visibilitychange', pedir);
  pedir();
  return () => {
    ativo = false;
    document.removeEventListener('visibilitychange', pedir);
    if (trava) trava.release().catch(() => {});
  };
};
