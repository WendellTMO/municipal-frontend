import { NativeModules, Platform } from 'react-native';

// Android: diz ao gerenciador de senhas que o login deu certo, para ele oferecer salvar a senha.
// Nas outras plataformas não faz nada (o iOS salva pelo textContentType do campo).
export const confirmarFormularioDeLogin = () => {
  if (Platform.OS !== 'android') return;
  const modulo = NativeModules.AutofillCommit;
  if (modulo) modulo.commit();
};
