import { dataLocal } from './dataLocal';
import { inicioDaViagem } from './viagensMotorista';

// Filtro da lista "Minhas Viagens": situação, período (de/ate), sentido (tipo), rota e ordem. As finalizadas começam
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

export const TIPOS_VIAGEM = [
  { id: 'todos', texto: 'Todas' },
  { id: 'IDA', texto: 'Ida' },
  { id: 'VOLTA', texto: 'Volta' },
];

export const ORDENS_VIAGEM = [
  { id: 'recentes', texto: 'Mais recentes' },
  { id: 'antigas', texto: 'Mais antigas' },
  { id: 'longas', texto: 'Mais longas' },
  { id: 'curtas', texto: 'Mais curtas' },
];

export const filtroViagensPadrao = () => ({
  aIniciar: true,
  canceladas: true,
  finalizadas: false,
  de: '',
  ate: '',
  tipo: 'todos',
  rota: '',
  ordem: 'recentes',
});

// Quanto a viagem durou de verdade, em milissegundos. Só existe para viagem que começou e terminou pelo app.
export const duracaoDaViagem = viagem => {
  if (!viagem?.inicio_real || !viagem?.horario_fim) return null;
  const ms = new Date(viagem.horario_fim) - new Date(viagem.inicio_real);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
};

// 2520000 -> "42 min"; 3900000 -> "1 h 05 min".
export const formatarDuracao = ms => {
  const minutos = Math.max(1, Math.round(ms / 60000));
  if (minutos < 60) return `${minutos} min`;
  return `${Math.floor(minutos / 60)} h ${doisDigitos(minutos % 60)} min`;
};

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

// Tudo menos a situação (período, sentido e rota): a contagem dos botões de situação usa isto.
const foraDaSituacao = (viagens, filtro) => {
  const de = lerDataDigitada(filtro?.de);
  const ate = lerDataDigitada(filtro?.ate);
  const tipo = filtro?.tipo && filtro.tipo !== 'todos' ? filtro.tipo : '';
  const rota = filtro?.rota || '';
  if (!de && !ate && !tipo && !rota) return viagens;
  const resultado = [];
  for (const viagem of viagens) {
    if (tipo && String(viagem.tipo || '').toUpperCase() !== tipo) continue;
    if (rota && viagem.rota_id !== rota) continue;
    if (de || ate) {
      const dia = dataLocal(viagem.data);
      if (isNaN(dia.getTime())) continue;
      if (de && dia < de) continue;
      if (ate && dia > ate) continue;
    }
    resultado.push(viagem);
  }
  return resultado;
};

const quandoComecou = viagem => inicioDaViagem(viagem)?.getTime() ?? 0;

// Devolve uma cópia ordenada. Nas ordens por duração, quem não tem duração medida vai para o fim.
export const ordenarViagens = (viagens, ordem) => {
  const copia = [...viagens];
  if (ordem === 'antigas') return copia.sort((a, b) => quandoComecou(a) - quandoComecou(b));
  if (ordem === 'longas' || ordem === 'curtas') {
    const sinal = ordem === 'longas' ? -1 : 1;
    return copia.sort((a, b) => {
      const da = duracaoDaViagem(a);
      const db = duracaoDaViagem(b);
      if (da === null && db === null) return quandoComecou(b) - quandoComecou(a);
      if (da === null) return 1;
      if (db === null) return -1;
      return sinal * (da - db);
    });
  }
  return copia.sort((a, b) => quandoComecou(b) - quandoComecou(a));
};

// Rotas que aparecem na lista, para o filtro por rota: [{ id, texto }] em ordem alfabética.
export const rotasDasViagens = viagens => {
  const vistas = {};
  for (const viagem of viagens) {
    if (viagem.rota_id && !vistas[viagem.rota_id]) vistas[viagem.rota_id] = viagem.rota_nome || 'Rota';
  }
  const lista = Object.keys(vistas).map(id => ({ id, texto: vistas[id] }));
  return lista.sort((a, b) => a.texto.localeCompare(b.texto, 'pt-BR'));
};

export const filtrarViagens = (viagens, filtro) => {
  const resultado = [];
  for (const viagem of foraDaSituacao(viagens, filtro)) {
    const grupo = GRUPO_DO_STATUS[viagem.status];
    // Status desconhecido nunca some: melhor mostrar a mais do que esconder uma viagem.
    if (!grupo || filtro[grupo]) resultado.push(viagem);
  }
  return ordenarViagens(resultado, filtro.ordem);
};

export const contarViagens = (viagens, filtro) => {
  const total = { aIniciar: 0, canceladas: 0, finalizadas: 0 };
  for (const viagem of foraDaSituacao(viagens, filtro)) {
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
