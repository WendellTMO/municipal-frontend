// Filtro do histórico do motorista. As viagens feitas (com ou sem o app) ficam escondidas por padrão:
// o que o motorista procura ali é o que não foi realizado ou foi cancelado.
const GRUPO_DA_SITUACAO = {
  nao_realizada: 'naoRealizadas',
  cancelada: 'canceladas',
  feita: 'feitas',
  feita_sem_app: 'feitas',
};

export const filtroPadrao = () => ({ naoRealizadas: true, canceladas: true, feitas: false });

export const filtrarHistorico = (itens, filtro) => {
  const resultado = [];
  for (const item of itens) {
    const grupo = GRUPO_DA_SITUACAO[item.situacao];
    if (grupo && filtro[grupo]) resultado.push(item);
  }
  return resultado;
};

export const contarPorGrupo = itens => {
  const total = { naoRealizadas: 0, canceladas: 0, feitas: 0 };
  for (const item of itens) {
    const grupo = GRUPO_DA_SITUACAO[item.situacao];
    if (grupo) total[grupo] += 1;
  }
  return total;
};
