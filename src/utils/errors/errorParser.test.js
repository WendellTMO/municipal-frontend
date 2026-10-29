import { parseApiError } from './errorParser';

const semResposta = (extra = {}) => ({ message: 'Network Error', ...extra });

const navegadorOriginal = global.navigator;

afterEach(() => {
  global.navigator = navegadorOriginal;
});

test('sem resposta e sem informação de rede diz que não conectou ao servidor', () => {
  expect(parseApiError(semResposta()).message).toMatch(/conectar ao servidor/);
});

test('sem resposta com aparelho online não diz sem internet', () => {
  global.navigator = { onLine: true };
  expect(parseApiError(semResposta()).message).not.toMatch(/internet/i);
});

test('sem resposta com aparelho offline diz sem internet', () => {
  global.navigator = { onLine: false };
  expect(parseApiError(semResposta()).message).toMatch(/Sem conexão com a internet/);
});

test('login recusado pelo servidor mostra e-mail ou senha incorretos', () => {
  const erro = { response: { status: 401, data: { error: { code: 'UNAUTHORIZED', message: 'Credenciais inválidas' } } } };
  expect(parseApiError(erro).message).toBe('E-mail ou senha incorretos.');
});
