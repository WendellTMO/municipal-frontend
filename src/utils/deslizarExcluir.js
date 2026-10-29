// Distância (px) que o dedo precisa percorrer para o lado para a exclusão valer.
export const LIMITE_EXCLUIR = 96;

// Só um gesto claramente horizontal vira swipe; o resto fica com a rolagem da lista.
export const ehSwipeHorizontal = (dx, dy) => Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5;

export const deveExcluir = dx => dx <= -LIMITE_EXCLUIR;
