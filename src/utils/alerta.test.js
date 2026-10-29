import { Alert, Platform } from 'react-native';
import { alertar, registrarAlerta } from './alerta';

jest.mock('react-native', () => ({ Alert: { alert: jest.fn() }, Platform: { OS: 'ios' } }));

const plataformaOriginal = Platform.OS;
afterEach(() => {
  Platform.OS = plataformaOriginal;
  jest.clearAllMocks();
});

test('no celular usa o alerta do sistema', () => {
  Platform.OS = 'android';
  const espiao = Alert.alert;
  const botoes = [{ text: 'OK' }];
  alertar('Titulo', 'Mensagem', botoes);
  expect(espiao).toHaveBeenCalledWith('Titulo', 'Mensagem', botoes);
});

test('na web abre o diálogo do app com os botões', () => {
  Platform.OS = 'web';
  const abrir = jest.fn();
  const desfazer = registrarAlerta(abrir);
  const botoes = [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive' }];
  alertar('Sair da conta', 'Tem certeza?', botoes);
  expect(abrir).toHaveBeenCalledWith({ titulo: 'Sair da conta', mensagem: 'Tem certeza?', botoes });
  desfazer();
});

test('na web sem botões mostra só OK', () => {
  Platform.OS = 'web';
  const abrir = jest.fn();
  const desfazer = registrarAlerta(abrir);
  alertar('Erro', 'Falhou');
  expect(abrir.mock.calls[0][0].botoes).toEqual([{ text: 'OK' }]);
  desfazer();
});

test('na web sem provider cai no confirm do navegador e chama a ação escolhida', () => {
  Platform.OS = 'web';
  global.window = { confirm: jest.fn(() => true) };
  const sair = jest.fn();
  const cancelar = jest.fn();
  alertar('Sair', 'Certeza?', [{ text: 'Cancelar', style: 'cancel', onPress: cancelar }, { text: 'Sair', onPress: sair }]);
  expect(sair).toHaveBeenCalled();
  expect(cancelar).not.toHaveBeenCalled();
  delete global.window;
});
