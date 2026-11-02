export const SENHA_MIN = 8;

// Devolve a mensagem de erro da nova senha, ou '' quando está tudo certo.
export const validarNovaSenha = (senha, confirmar) => {
  if (!senha) return 'Digite a nova senha.';
  if (senha.length < SENHA_MIN) return `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`;
  if (senha !== confirmar) return 'As senhas não conferem.';
  return '';
};
