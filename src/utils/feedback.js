// Sem imports de react-native: mantém a lógica testável no jest.

export const MENSAGEM_MIN = 10;
export const MENSAGEM_MAX = 2000;
export const TELA_MAX = 100;
export const VERSAO_MAX = 30;

export const TIPOS_FEEDBACK = [
  { tipo: 'BUG', label: 'Bug' },
  { tipo: 'SUGESTAO', label: 'Sugestão' },
  { tipo: 'DUVIDA', label: 'Dúvida' },
];

export const APP_VERSION = require('../../package.json').version;

export const isMensagemValida = texto => {
  const tamanho = (texto || '').trim().length;
  return tamanho >= MENSAGEM_MIN && tamanho <= MENSAGEM_MAX;
};

// "1.0.4-beta (29888779)": o versionCode distingue duas builds com o mesmo nome de versão.
export const textoDaVersao = (nome, versionCode) => {
  if (!nome) return null;
  if (!versionCode) return String(nome);
  return `${nome} (${versionCode})`;
};

export const buildFeedbackPayload = ({ tipo, mensagem, tela, plataforma, versionCode }) => {
  const versao = textoDaVersao(APP_VERSION, versionCode);
  return {
    tipo,
    mensagem: (mensagem || '').trim(),
    tela: tela ? String(tela).slice(0, TELA_MAX) : null,
    versao_app: versao ? versao.slice(0, VERSAO_MAX) : null,
    plataforma,
  };
};

// O aviso aparece quando não há registro de que o usuário já o viu.
export const shouldShowBetaNotice = valorGuardado => !valorGuardado;

export const betaNoticeKey = userId => `beta_notice_visto:${userId}`;
