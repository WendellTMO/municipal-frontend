import { formatarSentido } from './formatarSentido';
import { horaCurta } from './viagemPainel';

// Título do cabeçalho do Roteiro: "Ida · 06:35". Sem horário, só o sentido.
export const tituloRoteiro = viagem => {
  const sentido = formatarSentido(viagem.tipo);
  if (!viagem.horario_inicio) return sentido;
  return `${sentido} · ${horaCurta(viagem.horario_inicio)}`;
};

// Subtítulo: "origem → destino". Sem os dois, não mostra subtítulo.
export const subtituloRoteiro = viagem => {
  if (viagem.origem && viagem.destino) return `${viagem.origem} → ${viagem.destino}`;
  return null;
};
