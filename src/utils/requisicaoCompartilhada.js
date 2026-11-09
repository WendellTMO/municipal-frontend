// Pedidos repetidos em pouco tempo (vários cards pedindo os mesmos pontos e o mesmo perfil)
// dividem uma só chamada. A promessa fica guardada por `ttlMs`; se falhar, sai na hora.
const emAndamento = new Map();

export const compartilhar = (chave, buscar, ttlMs = 30000) => {
  const guardada = emAndamento.get(chave);
  if (guardada && Date.now() - guardada.em < ttlMs) return guardada.promessa;
  const promessa = buscar();
  emAndamento.set(chave, { em: Date.now(), promessa });
  promessa.catch(() => {
    if (emAndamento.get(chave)?.promessa === promessa) emAndamento.delete(chave);
  });
  return promessa;
};

// Para dado que o usuário acabou de mudar (por exemplo, o perfil depois de salvar).
export const esquecerCompartilhada = chave => {
  emAndamento.delete(chave);
};
