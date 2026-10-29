import { formatarHora } from './formatarHora';
import { hojeLocal } from './viagemPainel';

// Chave "AAAA-MM-DD HH:MM" comparável como texto, sem criar Date (evita UTC).
const chaveDaViagem = viagem => {
  const dia = String(viagem?.data || '').split('T')[0];
  const hora = viagem?.horario_inicio ? formatarHora(viagem.horario_inicio) : '00:00';
  return `${dia} ${hora}`;
};

const chaveDeAgora = agora => {
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  return `${hojeLocal(agora)} ${hora}:${minuto}`;
};

// Saída prevista de hoje já passou e o motorista ainda não iniciou.
export const saidaAtrasada = (viagem, agora = new Date()) =>
  viagem?.status_viagem === 'AGENDADA' && chaveDaViagem(viagem) < chaveDeAgora(agora);

// Próxima viagem do painel do aluno: futuras, mais as de hoje ainda AGENDADAS
// (horário passou, motorista não iniciou). Dias anteriores nunca entram.
export const proximaViagemDoPainel = (viagens, agora = new Date()) => {
  const agoraChave = chaveDeAgora(agora);
  const hoje = hojeLocal(agora);
  let escolhida = null;
  let escolhidaChave = '';
  for (const v of viagens) {
    const chave = chaveDaViagem(v);
    const dia = chave.split(' ')[0];
    const futura = chave >= agoraChave;
    const atrasadaDeHoje = dia === hoje && v.status_viagem === 'AGENDADA';
    if (!futura && !atrasadaDeHoje) continue;
    if (escolhida === null || chave < escolhidaChave) {
      escolhida = v;
      escolhidaChave = chave;
    }
  }
  return escolhida;
};
