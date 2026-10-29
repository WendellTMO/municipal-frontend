// Decisões do login por biometria. preferencia: null (nunca perguntou), 'sim' ou 'nao'.

// Pergunta uma vez, depois de um login com senha, se o aparelho tem biometria.
export const deveOferecer = ({ disponivel, preferencia }) => disponivel && preferencia === null;

// Pede a biometria ao abrir o app com sessão salva.
export const deveBloquear = ({ disponivel, preferencia }) => disponivel && preferencia === 'sim';

// Nome que o aparelho dá à biometria. O iOS informa Face ID ou Touch ID; o Android informa
// só "Biometrics" (digital, rosto ou íris), então o texto fica genérico.
export const rotuloBiometria = tipo => {
  if (tipo === 'FaceID') return 'Face ID';
  if (tipo === 'TouchID') return 'Touch ID';
  return 'a biometria do aparelho';
};
