// "Pegar e segurar": dispara `aoSegurar` se o dedo ficar parado por `esperaMs` sem virar arrasto.
// Soltar antes, ou começar a arrastar, cancela. `segurou()` diz se o disparo já aconteceu, para o
// soltar não repetir a ação.
export const criarSegurar = ({ esperaMs, aoSegurar }) => {
  let timer = null;
  let disparou = false;

  const cancelar = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return {
    iniciar() {
      cancelar();
      disparou = false;
      timer = setTimeout(() => {
        timer = null;
        disparou = true;
        aoSegurar();
      }, esperaMs);
    },
    cancelar,
    segurou: () => disparou,
  };
};
