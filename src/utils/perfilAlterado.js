// Assinatura dos campos editáveis do perfil: mudou em relação à última carregada ou salva = há alteração.
export const assinaturaDoPerfil = (form, instituicaoId) =>
  JSON.stringify({ form, instituicaoId });

// `salva` é null enquanto o perfil ainda carrega: nada a avisar.
export const perfilAlterado = (salva, form, instituicaoId) =>
  salva !== null && salva !== assinaturaDoPerfil(form, instituicaoId);
