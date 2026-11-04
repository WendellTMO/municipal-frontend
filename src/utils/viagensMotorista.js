/**
 * Organiza as viagens do motorista na home: qual é a "próxima" e o que vai para o histórico.
 *
 * Próxima: a viagem em andamento; senão a agendada mais perto de agora, para frente ou para trás.
 * Uma viagem que passou do horário e tem outra mais perto de agora sai da frente e vai para o
 * histórico como "não realizada". Feita e cancelada também entram no histórico.
 */

// Início da viagem como Date local (data + horário de saída), ou null se faltar dado.
export const inicioDaViagem = viagem => {
  if (!viagem || !viagem.data) return null;
  const [ano, mes, dia] = String(viagem.data).split('T')[0].split('-').map(Number);
  const bruto = String(viagem.horario_inicio || '00:00');
  const hora = bruto.includes('T') ? bruto.substring(11, 16) : bruto.substring(0, 5);
  const [h, m] = hora.split(':').map(Number);
  const inicio = new Date(ano, mes - 1, dia, h || 0, m || 0);
  return Number.isNaN(inicio.getTime()) ? null : inicio;
};

const situacaoDoHistorico = (viagem, perdida) => {
  if (viagem.status === 'CANCELADA') return 'cancelada';
  if (viagem.status === 'FINALIZADA') return viagem.realizada_sem_app ? 'feita_sem_app' : 'feita';
  return perdida ? 'nao_realizada' : null;
};

// Devolve { proxima, proximas, historico }. `historico` vem do mais recente para o mais antigo.
// `proximas` são as viagens que vêm depois da próxima (agendadas ou canceladas que ainda não
// chegaram na hora), da mais perto para a mais longe: o motorista vê o feriado ou o aviso de antemão.
export const organizarViagens = (viagens, agora = new Date(), limiteHistorico = 15, limiteProximas = 3) => {
  let proxima = null;
  let menorDistancia = Infinity;
  const emAndamento = [];
  const agendadas = [];
  const historico = [];
  const canceladasFuturas = [];

  for (const viagem of viagens || []) {
    const inicio = inicioDaViagem(viagem);
    if (viagem.status === 'EM_ANDAMENTO') {
      emAndamento.push(viagem);
    } else if (viagem.status === 'AGENDADA' && inicio) {
      agendadas.push({ viagem, inicio });
    } else if (viagem.status === 'FINALIZADA' || viagem.status === 'CANCELADA') {
      historico.push({ viagem, inicio, situacao: situacaoDoHistorico(viagem, false) });
      if (viagem.status === 'CANCELADA' && inicio && inicio >= agora) {
        canceladasFuturas.push({ viagem, inicio });
      }
    }
  }

  if (emAndamento.length > 0) {
    proxima = emAndamento[0];
  } else {
    for (const { viagem, inicio } of agendadas) {
      // Empate: vale a que ainda vai acontecer.
      const distancia = Math.abs(inicio - agora) + (inicio < agora ? 1 : 0);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        proxima = viagem;
      }
    }
  }

  for (const { viagem, inicio } of agendadas) {
    if (viagem !== proxima && inicio < agora) {
      historico.push({ viagem, inicio, situacao: 'nao_realizada' });
    }
  }

  const candidatas = [];
  for (const { viagem, inicio } of agendadas) {
    if (viagem !== proxima && inicio >= agora) candidatas.push({ viagem, inicio });
  }
  for (const item of canceladasFuturas) candidatas.push(item);
  candidatas.sort((a, b) => a.inicio - b.inicio);
  const proximas = [];
  for (const { viagem } of candidatas) {
    if (proximas.length < limiteProximas) proximas.push(viagem);
  }

  historico.sort((a, b) => (b.inicio ? b.inicio.getTime() : 0) - (a.inicio ? a.inicio.getTime() : 0));
  return { proxima, proximas, historico: historico.slice(0, limiteHistorico) };
};
