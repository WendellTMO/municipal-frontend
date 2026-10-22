// Decisões do login por biometria. preferencia: null (nunca perguntou), 'sim' ou 'nao'.

// Pergunta uma vez, depois de um login com senha, se o aparelho tem biometria.
export const deveOferecer = ({ disponivel, preferencia }) => disponivel && preferencia === null;

// Pede a biometria ao abrir o app com sessão salva.
export const deveBloquear = ({ disponivel, preferencia }) => disponivel && preferencia === 'sim';
