import {
  isMensagemValida,
  buildFeedbackPayload,
  shouldShowBetaNotice,
  betaNoticeKey,
  textoDaVersao,
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

test('a versão do feedback leva o versionCode quando existe', () => {
  expect(textoDaVersao('1.0.4-beta', 29888779)).toBe('1.0.4-beta (29888779)');
  expect(textoDaVersao('1.0.4-beta', undefined)).toBe('1.0.4-beta');
  expect(textoDaVersao('', 5)).toBeNull();
  const payload = buildFeedbackPayload({ tipo: 'BUG', mensagem: 'a', tela: '', versionCode: 29888779 });
  expect(payload.versao_app).toMatch(/ \(29888779\)$/);
  expect(payload.versao_app.length).toBeLessThanOrEqual(30);
});

test('shouldShowBetaNotice e a chave por usuário', () => {
  expect(shouldShowBetaNotice(null)).toBe(true);
  expect(shouldShowBetaNotice('1')).toBe(false);
  expect(betaNoticeKey('abc')).toBe('beta_notice_visto:abc');
});

test('o aparelho vai no payload e some quando não há dados', () => {
  const com = buildFeedbackPayload({ tipo: 'BUG', mensagem: 'a', tela: '', aparelho: { dispositivo: 'samsung SM-S911B', versao_so: 'Android 14' } });
  expect(com.dispositivo).toBe('samsung SM-S911B');
  expect(com.versao_so).toBe('Android 14');
  const sem = buildFeedbackPayload({ tipo: 'BUG', mensagem: 'a', tela: '' });
  expect(sem.dispositivo).toBeNull();
  expect(sem.versao_so).toBeNull();
});
