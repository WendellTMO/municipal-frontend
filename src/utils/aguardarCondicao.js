// Verifica `verificar()` até dar verdadeiro, no máximo `tentativas` vezes, esperando `esperaMs` entre elas.
// Desiste cedo se `cancelado()` ficar verdadeiro. Devolve true só se a condição foi atendida.
export const aguardarCondicao = async ({
  verificar,
  tentativas,
  esperaMs,
  cancelado = () => false,
  dormir = ms => new Promise(resolve => setTimeout(resolve, ms)),
}) => {
  for (let i = 0; i < tentativas; i++) {
    if (cancelado()) return false;
    if (await verificar()) return true;
    await dormir(esperaMs);
  }
  return false;
};
