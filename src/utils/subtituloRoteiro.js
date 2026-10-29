import { formatarSentido } from './formatarSentido';
import { horaCurta } from './viagemPainel';

// "origem → destino · horário"; sem origem e destino, cai no sentido da viagem.
export const subtituloRoteiro = viagem => {
  const hora = horaCurta(viagem.horario_inicio);
  let trecho = formatarSentido(viagem.tipo);
  if (viagem.origem && viagem.destino) trecho = `${viagem.origem} → ${viagem.destino}`;
  if (!hora) return trecho;
  return `${trecho} · ${hora}`;
};
