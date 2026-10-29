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

// Tamanho em que o botão se posiciona: o do container que o contém (na web de computador é a
// moldura do celular, bem menor que a janela). Sem medida confiável usa a janela.
export const TAMANHO_MINIMO_AREA = 200;

export const tamanhoDaArea = (area, janela) => {
  if (area && area.width >= TAMANHO_MINIMO_AREA && area.height >= TAMANHO_MINIMO_AREA) {
    return { width: area.width, height: area.height };
  }
  return { width: janela.width, height: janela.height };
};

// Altura do cabeçalho azul (SubHeader) mais uma folga: o botão por tela fica logo abaixo
// da seta de voltar (canto superior esquerdo), longe dos botões + e - do mapa, à direita.
export const ABAIXO_DO_CABECALHO = 121;

// Distância ao rodapé que deixa o botão logo acima da barra grande Iniciar viagem.
export const ACIMA_DA_BARRA = 124;

// A posição salva pelo usuário sempre vence. Sem ela, vale o padrão da tela ('topo' ou 'barra')
// e, sem padrão de tela, o canto de baixo à direita.
export const decidirPosicao = ({ guardada, padraoTela, altura, tamanho, rodape }) => {
  if (guardada) return guardada;
  if (padraoTela === 'topo') {
    return { lado: 'esq', baixo: altura - tamanho - ABAIXO_DO_CABECALHO };
  }
  if (padraoTela === 'barra') {
    return { lado: 'dir', baixo: ACIMA_DA_BARRA };
  }
  return { lado: 'dir', baixo: rodape };
};

// Soltou o botão em (x, y) de tela: encaixa na borda mais próxima e limita a altura.
export const encaixar = ({ x, y, largura, altura, tamanho, topo, rodape }) => ({
  lado: ladoMaisProximo(x + tamanho / 2, largura),
  baixo: limitarBaixo(altura - tamanho - y, altura, tamanho, topo, rodape),
});

// Ponto (x, y) de tela do botão durante o arraste, limitado à janela e à faixa vertical permitida.
export const limitarPonto = ({ x, y, largura, altura, tamanho, topo, rodape }) => {
  const yMin = altura - tamanho - limitarBaixo(altura, altura, tamanho, topo, rodape);
  const yMax = altura - tamanho - rodape;
  return {
    x: limitar(x, 0, largura - tamanho),
    y: limitar(y, yMin, yMax),
  };
};
