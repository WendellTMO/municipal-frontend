import { ehDeHoje } from './viagemPainel';

// Quanto menor o índice, mais relevante para o aluno.
const PRIORIDADE = ['EM_ANDAMENTO', 'AGENDADA', 'CANCELADA', 'FINALIZADA'];

// Viagem de hoje mais relevante, comparando a data no fuso local (não em UTC).
export const escolherViagemDeHoje = (viagens, agora = new Date()) => {
  let escolhida = null;
  for (const v of viagens) {
    if (!ehDeHoje(v, agora)) continue;
    if (!escolhida || PRIORIDADE.indexOf(v.status_viagem) < PRIORIDADE.indexOf(escolhida.status_viagem)) {
      escolhida = v;
    }
  }
  return escolhida;
};
