// O servidor cancela sozinho a viagem agendada que passou 24 horas sem começar, com este motivo
// (MOTIVO_NAO_REALIZADA em app/tasks/expiracao_tasks.py). Para o motorista ela continua sendo uma
// viagem "não realizada" que ele pode marcar como feita, e não um cancelamento de verdade.
const INICIO_DO_MOTIVO = 'Não realizada: passaram 24 horas';

export const canceladaPeloPrazo = viagem =>
  !!viagem && viagem.status === 'CANCELADA' && String(viagem.motivo_cancelamento || '').startsWith(INICIO_DO_MOTIVO);
