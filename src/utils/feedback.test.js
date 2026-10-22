import {
  isMensagemValida,
  buildFeedbackPayload,
  shouldShowBetaNotice,
  betaNoticeKey,
} from './feedback';

test('isMensagemValida usa o tamanho depois do trim', () => {
  expect(isMensagemValida('curto')).toBe(false);
  expect(isMensagemValida('   123456789   ')).toBe(false);
  expect(isMensagemValida('1234567890')).toBe(true);
  expect(isMensagemValida('a'.repeat(2000))).toBe(true);
  expect(isMensagemValida('a'.repeat(2001))).toBe(false);
  expect(isMensagemValida(undefined)).toBe(false);
});

test('buildFeedbackPayload limpa e limita os campos', () => {
  const payload = buildFeedbackPayload({
    tipo: 'BUG',
    mensagem: '  texto longo o bastante  ',
    tela: 'x'.repeat(150),
    plataforma: 'web',
  });
  expect(payload.plataforma).toBe('web');
  expect(payload.mensagem).toBe('texto longo o bastante');
  expect(payload.tela).toHaveLength(100);
  expect(payload.tipo).toBe('BUG');
  expect(typeof payload.versao_app).toBe('string');
  expect(buildFeedbackPayload({ tipo: 'DUVIDA', mensagem: 'a', tela: '' }).tela).toBeNull();
});

test('shouldShowBetaNotice e a chave por usuário', () => {
  expect(shouldShowBetaNotice(null)).toBe(true);
  expect(shouldShowBetaNotice('1')).toBe(false);
  expect(betaNoticeKey('abc')).toBe('beta_notice_visto:abc');
});
