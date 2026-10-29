import { Alert, Platform } from 'react-native';

/**
 * Alert.alert do react-native-web é um stub vazio e, no Android, abre a janela do sistema.
 * alertar tem a mesma assinatura do Alert.alert e abre sempre o diálogo do app
 * (AlertaProvider). Sem o provider montado cai no alerta do sistema (celular) ou no confirm
 * do navegador (web).
 */
let abrir = null;

export const registrarAlerta = fn => {
  abrir = fn;
  return () => {
    if (abrir === fn) abrir = null;
  };
};

export const alertar = (titulo, mensagem, botoes) => {
  const lista = botoes && botoes.length > 0 ? botoes : [{ text: 'OK' }];
  if (abrir) {
    abrir({ titulo, mensagem, botoes: lista });
    return;
  }
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }
  // Sem o provider montado (testes, tela isolada): confirma pelo navegador.
  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
  const confirmou = typeof window !== 'undefined' ? window.confirm(texto) : true;
  const cancelar = lista.find(b => b.style === 'cancel');
  const acao = lista.find(b => b.style !== 'cancel');
  const escolhido = confirmou ? acao : cancelar;
  if (escolhido && escolhido.onPress) escolhido.onPress();
};
