// Ponto de embarque usado ao confirmar presença: o do aluno nesta viagem ou, sem ele, o
// primeiro ponto da rota. Devolve null quando não há nenhum dos dois.
export const escolherPontoEmbarque = (viagem, pontosRota) => {
  if (viagem && viagem.ponto_embarque_id) return viagem.ponto_embarque_id;
  if (pontosRota && pontosRota.length > 0 && pontosRota[0].id) return pontosRota[0].id;
  return null;
};

// Só viagens agendadas ou em andamento aceitam confirmar ou cancelar presença.
export const aceitaPresenca = statusViagem =>
  statusViagem === 'AGENDADA' || statusViagem === 'EM_ANDAMENTO';

export const MSG_SEM_PONTO =
  'Seu ponto de embarque ainda não está definido e a rota não tem pontos. Fale com o gestor.';
