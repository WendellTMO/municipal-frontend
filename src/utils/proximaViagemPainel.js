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

// "AAAA-MM-DD HH:MM" em milissegundos locais, para tirar o ponto médio entre duas viagens.
const instanteDaChave = chave => {
  const [dia, hora] = chave.split(' ');
  const [ano, mes, diaDoMes] = dia.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, diaDoMes, h, min).getTime();
};

// Próxima viagem do painel do aluno: futuras, mais as de hoje ainda AGENDADAS
// (horário passou, motorista não iniciou). Dias anteriores nunca entram.
// A atrasada só fica até o ponto médio entre ela e a viagem seguinte; depois disso
// vale a seguinte, para a tela não ficar presa numa viagem que não vai acontecer.
export const proximaViagemDoPainel = (viagens, agora = new Date()) => {
  const agoraChave = chaveDeAgora(agora);
  const hoje = hojeLocal(agora);
  const candidatas = [];
  for (const v of viagens) {
    const chave = chaveDaViagem(v);
    const dia = chave.split(' ')[0];
    const futura = chave >= agoraChave;
    const atrasadaDeHoje = dia === hoje && v.status_viagem === 'AGENDADA';
    if (futura || atrasadaDeHoje) candidatas.push({ v, chave });
  }
  // Ordem estável: viagens no mesmo horário mantêm a ordem em que vieram.
  candidatas.sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0));

  let posicao = 0;
  while (posicao + 1 < candidatas.length) {
    const atual = candidatas[posicao];
    const seguinte = candidatas[posicao + 1];
    if (atual.chave >= agoraChave) break; // ainda não passou: é a mais próxima
    const meio = (instanteDaChave(atual.chave) + instanteDaChave(seguinte.chave)) / 2;
    if (agora.getTime() < meio) break;
    posicao += 1;
  }
  return candidatas.length > 0 ? candidatas[posicao].v : null;
};
