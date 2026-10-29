import { Alert, Platform } from 'react-native';

/**
 * Alert.alert do react-native-web é um stub vazio: na web a confirmação nunca aparecia.
 * alertar tem a mesma assinatura do Alert.alert. No celular usa o alerta do sistema; na
 * web abre o diálogo do app (AlertaProvider), sem o popup do navegador.
 */
let abrir = null;

export const registrarAlerta = fn => {
  abrir = fn;
  return () => {
    if (abrir === fn) abrir = null;
  };
};

export const alertar = (titulo, mensagem, botoes) => {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }
  const lista = botoes && botoes.length > 0 ? botoes : [{ text: 'OK' }];
  if (abrir) {
    abrir({ titulo, mensagem, botoes: lista });
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
