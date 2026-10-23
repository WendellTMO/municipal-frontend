// Lógica do feedback de toque (Tappable). Funções puras para poderem ser testadas.

export const ESCALA_PRESSIONADO = 0.97;
export const ATRASO_NAVEGACAO_MS = 100;

// Só toques que navegam esperam um instante, para o feedback ser percebido. Ações de
// envio ou destrutivas disparam na hora. Com "reduzir movimento" também não há espera.
export const atrasoDoToque = ({ navega, reduzirMovimento }) => {
  if (!navega || reduzirMovimento) return 0;
  return ATRASO_NAVEGACAO_MS;
};

export const escalaPressionado = reduzirMovimento => (reduzirMovimento ? 1 : ESCALA_PRESSIONADO);
