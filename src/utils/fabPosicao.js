// Lógica pura do botão flutuante arrastável. A posição guardada é o lado da tela
// ('esq' ou 'dir') e a distância até o rodapé, que sobrevive a mudança de tamanho da janela.

export const LIMIAR_ARRASTE = 6;

export const ehArraste = (dx, dy) => Math.abs(dx) > LIMIAR_ARRASTE || Math.abs(dy) > LIMIAR_ARRASTE;

const limitar = (valor, minimo, maximo) => {
  if (valor < minimo) return minimo;
  if (valor > maximo) return maximo;
  return valor;
};

// Distância ao rodapé que mantém o botão inteiro visível entre o topo e o rodapé reservados.
export const limitarBaixo = (baixo, altura, tamanho, topo, rodape) =>
  limitar(baixo, rodape, Math.max(rodape, altura - tamanho - topo));

export const xDoLado = (lado, largura, tamanho, margem) =>
  lado === 'esq' ? margem : largura - tamanho - margem;

export const ladoMaisProximo = (xCentro, largura) => (xCentro < largura / 2 ? 'esq' : 'dir');

// Aceita só o formato que este módulo grava; qualquer outra coisa volta ao padrão.
export const posicaoGuardada = valor => {
  if (!valor || (valor.lado !== 'esq' && valor.lado !== 'dir')) return null;
  if (typeof valor.baixo !== 'number' || !isFinite(valor.baixo)) return null;
  return { lado: valor.lado, baixo: valor.baixo };
};
