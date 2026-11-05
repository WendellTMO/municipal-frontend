export const SENHA_MIN = 8;

// Devolve a mensagem de erro da nova senha, ou '' quando está tudo certo.
export const validarNovaSenha = (senha, confirmar) => {
  if (!senha) return 'Digite a nova senha.';
  if (senha.length < SENHA_MIN) return `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`;
  if (senha !== confirmar) return 'As senhas não conferem.';
  return '';
};

export const SENHA_MAX = 128;

// Confere os três campos da tela de trocar senha antes de enviar. O servidor repete e reforça as
// regras (senha comum, vazada, ligada ao e-mail); aqui só evita a ida e volta com erro óbvio.
export const validarTrocaDeSenha = (atual, nova, confirmar) => {
  if (!atual) return 'Digite a senha atual.';
  if (!nova) return 'Digite a nova senha.';
  if (nova.length < SENHA_MIN) return `A nova senha deve ter pelo menos ${SENHA_MIN} caracteres.`;
  if (nova.length > SENHA_MAX) return `A nova senha deve ter no máximo ${SENHA_MAX} caracteres.`;
  if (nova === atual) return 'A nova senha precisa ser diferente da atual.';
  if (nova !== confirmar) return 'As senhas não conferem.';
  return '';
};
