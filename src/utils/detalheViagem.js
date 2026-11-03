/**
 * Resumo do que aconteceu numa viagem do histórico, a partir do JSON de /viagens/minhas.
 * Horários vêm em ISO e viram HH:MM no fuso do aparelho.
 */

const horaDoIso = iso => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

const minutosEntre = (inicioIso, fimIso) => {
  if (!inicioIso || !fimIso) return null;
  const minutos = Math.round((new Date(fimIso) - new Date(inicioIso)) / 60000);
  return Number.isNaN(minutos) || minutos < 0 ? null : minutos;
};

export const textoDuracao = minutos => {
  if (minutos === null || minutos === undefined) return null;
  if (minutos < 60) return `${minutos} min`;
  const resto = minutos % 60;
  return resto === 0 ? `${Math.floor(minutos / 60)} h` : `${Math.floor(minutos / 60)} h ${resto} min`;
};

// `situacao` vem de organizarViagens: feita, feita_sem_app, cancelada ou nao_realizada.
export const resumoDaViagem = (viagem, situacao) => {
  const registradaNoApp = situacao === 'feita';
  const paradas = [];
  for (const ponto of [...(viagem.pontos || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))) {
    paradas.push({
      ordem: ponto.ordem,
      apelido: ponto.apelido || `Parada ${ponto.ordem}`,
      chegada: ponto.visitado ? horaDoIso(ponto.chegada_real) : null,
      visitada: !!ponto.visitado,
    });
  }
  const km = typeof viagem.km_real === 'number' ? viagem.km_real : null;
  return {
    situacao,
    saida: registradaNoApp ? horaDoIso(viagem.inicio_real) : null,
    fim: registradaNoApp ? horaDoIso(viagem.horario_fim) : null,
    duracao: registradaNoApp ? textoDuracao(minutosEntre(viagem.inicio_real, viagem.horario_fim)) : null,
    km: registradaNoApp && km !== null ? km : null,
    paradas: registradaNoApp ? paradas : [],
    confirmados: viagem.alunos_confirmados_count ?? 0,
    inscritos: viagem.total_alunos ?? 0,
  };
};
