/**
 * Busca no servidor enquanto o usuário digita: espera uma pausa na digitação, ignora resposta de uma
 * busca que já foi substituída por outra mais nova e avisa o estado (carregando, erro, itens).
 */
export const criarBuscaRemota = ({ buscar, aoMudar, esperaMs = 250 }) => {
  let timer = null;
  let ultima = 0;

  const executar = async termo => {
    const minha = ++ultima;
    aoMudar({ carregando: true, erro: false });
    try {
      const itens = await buscar(termo);
      if (minha === ultima) aoMudar({ carregando: false, erro: false, itens });
    } catch (e) {
      if (minha === ultima) aoMudar({ carregando: false, erro: true });
    }
  };

  return {
    // Digitando: só busca depois de uma pausa.
    digitar: termo => {
      clearTimeout(timer);
      timer = setTimeout(() => executar(termo), esperaMs);
    },
    // Abrir a lista ou tentar de novo: busca já.
    agora: termo => {
      clearTimeout(timer);
      return executar(termo);
    },
    cancelar: () => {
      clearTimeout(timer);
      ultima += 1;
    },
  };
};
