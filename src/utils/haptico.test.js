jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
const mockTrigger = jest.fn();
jest.mock('react-native-haptic-feedback', () => ({ __esModule: true, default: { trigger: (...a) => mockTrigger(...a) } }), { virtual: true });

const { haptico } = require('./haptico');

afterEach(() => mockTrigger.mockClear());

test('toque dispara o impacto leve respeitando o sistema', () => {
  haptico('toque');
  expect(mockTrigger).toHaveBeenCalledWith('impactLight', { enableVibrateFallback: true, ignoreAndroidSystemSettings: false });
});

test('tipos de aviso usam as notificações do sistema', () => {
  haptico('sucesso');
  haptico('erro');
  expect(mockTrigger.mock.calls[0][0]).toBe('notificationSuccess');
  expect(mockTrigger.mock.calls[1][0]).toBe('notificationError');
});

test('tipo desconhecido cai no toque leve', () => {
  haptico('qualquer');
  expect(mockTrigger.mock.calls[0][0]).toBe('impactLight');
});
