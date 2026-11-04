// Filtro da lista "Minhas Viagens" por situação. As finalizadas começam escondidas, como no histórico:
// o que o motorista procura ali é o que ainda vai acontecer ou foi cancelado.
const GRUPO_DO_STATUS = {
  AGENDADA: 'aIniciar',
  EM_ANDAMENTO: 'aIniciar',
  CANCELADA: 'canceladas',
  FINALIZADA: 'finalizadas',
};

export const CHIPS_VIAGENS = [
  { id: 'aIniciar', texto: 'A iniciar' },
  { id: 'canceladas', texto: 'Canceladas' },
  { id: 'finalizadas', texto: 'Finalizadas' },
];

export const filtroViagensPadrao = () => ({ aIniciar: true, canceladas: true, finalizadas: false });

export const filtrarViagens = (viagens, filtro) => {
  const resultado = [];
  for (const viagem of viagens) {
    const grupo = GRUPO_DO_STATUS[viagem.status];
    // Status desconhecido nunca some: melhor mostrar a mais do que esconder uma viagem.
    if (!grupo || filtro[grupo]) resultado.push(viagem);
  }
  return resultado;
};

export const contarViagens = viagens => {
  const total = { aIniciar: 0, canceladas: 0, finalizadas: 0 };
  for (const viagem of viagens) {
    const grupo = GRUPO_DO_STATUS[viagem.status];
    if (grupo) total[grupo] += 1;
  }
  return total;
};
