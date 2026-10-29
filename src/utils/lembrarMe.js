// "Lembrar-me" do login. Desmarcado, a sessão vale só até o app ser fechado: ao abrir de novo,
// o app pede o login (e a senha) em vez de entrar sozinho.

// Chamado ao abrir o app: encerra a sessão guardada se ela foi aberta sem "Lembrar-me".
export const deveEncerrarSessao = ({ temToken, sessaoTemporaria }) =>
  Boolean(temToken) && sessaoTemporaria === true;
