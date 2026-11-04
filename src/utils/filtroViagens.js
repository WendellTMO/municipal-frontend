import { dataLocal } from './dataLocal';

// Filtro da lista "Minhas Viagens" por situação e por período (de/ate). As finalizadas começam
// escondidas, como no histórico: o que o motorista procura ali é o que ainda vai acontecer ou foi cancelado.
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

export const filtroViagensPadrao = () => ({ aIniciar: true, canceladas: true, finalizadas: false, de: '', ate: '' });

const doisDigitos = n => String(n).padStart(2, '0');
const paraIso = d => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

// Aceita "2026-11-04" (campo de data do navegador) e "04/11/2026" (digitado no celular).
// Devolve a data local à meia-noite, ou null se estiver vazio, incompleto ou for um dia que não existe.
export const lerDataDigitada = texto => {
  const t = String(texto ?? '').trim();
  let partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  let ano, mes, dia;
  if (partes) {
    [, ano, mes, dia] = partes;
  } else {
    partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
    if (!partes) return null;
    [, dia, mes, ano] = partes;
  }
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (data.getDate() !== Number(dia) || data.getMonth() !== Number(mes) - 1) return null;
  return data;
};

// Atalhos de período: hoje, hoje até daqui a 6 dias, primeiro ao último dia do mês.
export const PERIODOS_RAPIDOS = [
  { id: 'hoje', texto: 'Hoje' },
  { id: 'semana', texto: 'Próximos 7 dias' },
  { id: 'mes', texto: 'Este mês' },
];

export const periodoRapido = (id, hoje = new Date()) => {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (id === 'hoje') return { de: paraIso(inicio), ate: paraIso(inicio) };
  if (id === 'semana') return { de: paraIso(inicio), ate: paraIso(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6)) };
  return {
    de: paraIso(new Date(inicio.getFullYear(), inicio.getMonth(), 1)),
    ate: paraIso(new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0)),
  };
};

// Só o período, sem olhar a situação: a contagem dos botões usa isto.
const noPeriodo = (viagens, filtro) => {
  const de = lerDataDigitada(filtro?.de);
  const ate = lerDataDigitada(filtro?.ate);
  if (!de && !ate) return viagens;
  const resultado = [];
  for (const viagem of viagens) {
    const dia = dataLocal(viagem.data);
    if (isNaN(dia.getTime())) continue;
    if (de && dia < de) continue;
    if (ate && dia > ate) continue;
    resultado.push(viagem);
  }
  return resultado;
};

export const filtrarViagens = (viagens, filtro) => {
  const resultado = [];
  for (const viagem of noPeriodo(viagens, filtro)) {
    const grupo = GRUPO_DO_STATUS[viagem.status];
    // Status desconhecido nunca some: melhor mostrar a mais do que esconder uma viagem.
    if (!grupo || filtro[grupo]) resultado.push(viagem);
  }
  return resultado;
};

export const contarViagens = (viagens, filtro) => {
  const total = { aIniciar: 0, canceladas: 0, finalizadas: 0 };
  for (const viagem of noPeriodo(viagens, filtro)) {
    const grupo = GRUPO_DO_STATUS[viagem.status];
    if (grupo) total[grupo] += 1;
  }
  return total;
};

// Verdadeiro quando o filtro difere do padrão: acende a bolinha no funil.
export const filtroAtivo = filtro => {
  const padrao = filtroViagensPadrao();
  for (const chave of Object.keys(padrao)) {
    if (filtro[chave] !== padrao[chave]) return true;
  }
  return false;
};
