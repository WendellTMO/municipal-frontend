import { dataLocal } from './dataLocal';
import { inicioDaViagem } from './viagensMotorista';

// Filtro da lista "Minhas Viagens": busca, situação, período (de/ate), sentido (tipo), rota, motorista,
// veículo, alunos confirmados e ordem. As finalizadas começam escondidas, como no histórico: o que se
// procura ali é o que ainda vai acontecer, atrasou ou foi cancelado.
const GRUPO_DO_STATUS = {
  EM_ANDAMENTO: 'emAndamento',
  CANCELADA: 'canceladas',
  FINALIZADA: 'finalizadas',
};

export const CHIPS_VIAGENS = [
  { id: 'aIniciar', texto: 'A iniciar' },
  { id: 'emAndamento', texto: 'Em andamento' },
  { id: 'naoRealizadas', texto: 'Não realizadas' },
  { id: 'canceladas', texto: 'Canceladas' },
  { id: 'finalizadas', texto: 'Finalizadas' },
];

// Agendada que ainda vai sair é "a iniciar". Agendada cujo horário já passou sem ninguém iniciar é "não realizada".
// Status que o app não conhece fica sem grupo e nunca é escondido.
const grupoDaViagem = (viagem, agora) => {
  if (viagem.status === 'AGENDADA') {
    const inicio = inicioDaViagem(viagem);
    return inicio && inicio < agora ? 'naoRealizadas' : 'aIniciar';
  }
  return GRUPO_DO_STATUS[viagem.status] || '';
};

export const ALUNOS_VIAGEM = [
  { id: 'qualquer', texto: 'Qualquer' },
  { id: 'nenhum', texto: 'Nenhum confirmado' },
  { id: 'algum', texto: '1 ou mais' },
  { id: 'muitos', texto: '10 ou mais' },
];

const ALUNOS_MINIMO = { qualquer: 0, nenhum: 0, algum: 1, muitos: 10 };

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
  { id: 'alunos', texto: 'Mais alunos' },
];

export const filtroViagensPadrao = () => ({
  aIniciar: true,
  emAndamento: true,
  naoRealizadas: true,
  canceladas: true,
  finalizadas: false,
  busca: '',
  de: '',
  ate: '',
  tipo: 'todos',
  rota: '',
  motorista: '',
  veiculo: '',
  alunos: 'qualquer',
  ordem: 'recentes',
});

// "São João" -> "sao joao": a busca ignora maiúsculas e acentos.
const semAcento = texto => String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const SEM_MOTORISTA = 'Sem Motorista';
export const SEM_VEICULO = 'Sem Veículo';
const motoristaDa = viagem => viagem.motorista_nome || SEM_MOTORISTA;
const veiculoDa = viagem => viagem.veiculo_placa || SEM_VEICULO;

// Tudo em que a busca olha: rota, trajeto, motorista, placa e o motivo do cancelamento.
const textoDaViagem = viagem =>
  semAcento(
    [viagem.rota_nome, viagem.origem, viagem.destino, viagem.motorista_nome, viagem.veiculo_placa, viagem.motivo_cancelamento].join(' '),
  );

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
  { id: 'mesPassado', texto: 'Mês passado' },
];

export const periodoRapido = (id, hoje = new Date()) => {
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (id === 'hoje') return { de: paraIso(inicio), ate: paraIso(inicio) };
  if (id === 'semana') return { de: paraIso(inicio), ate: paraIso(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6)) };
  const deslocamento = id === 'mesPassado' ? -1 : 0;
  return {
    de: paraIso(new Date(inicio.getFullYear(), inicio.getMonth() + deslocamento, 1)),
    ate: paraIso(new Date(inicio.getFullYear(), inicio.getMonth() + deslocamento + 1, 0)),
  };
};

// Tudo menos a situação (busca, período, sentido, rota, motorista, veículo e alunos): a contagem dos
// botões de situação usa isto.
const foraDaSituacao = (viagens, filtro) => {
  const busca = semAcento(filtro?.busca).trim();
  const de = lerDataDigitada(filtro?.de);
  const ate = lerDataDigitada(filtro?.ate);
  const tipo = filtro?.tipo && filtro.tipo !== 'todos' ? filtro.tipo : '';
  const rota = filtro?.rota || '';
  const motorista = filtro?.motorista || '';
  const veiculo = filtro?.veiculo || '';
  const alunos = filtro?.alunos || 'qualquer';
  const resultado = [];
  for (const viagem of viagens) {
    if (busca && !textoDaViagem(viagem).includes(busca)) continue;
    if (tipo && String(viagem.tipo || '').toUpperCase() !== tipo) continue;
    if (rota && viagem.rota_id !== rota) continue;
    if (motorista && motoristaDa(viagem) !== motorista) continue;
    if (veiculo && veiculoDa(viagem) !== veiculo) continue;
    if (alunos !== 'qualquer') {
      const confirmados = viagem.alunos_confirmados_count || 0;
      if (alunos === 'nenhum' ? confirmados !== 0 : confirmados < ALUNOS_MINIMO[alunos]) continue;
    }
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
  if (ordem === 'alunos') {
    return copia.sort((a, b) => {
      const dif = (b.alunos_confirmados_count || 0) - (a.alunos_confirmados_count || 0);
      return dif !== 0 ? dif : quandoComecou(b) - quandoComecou(a);
    });
  }
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

// Valores que aparecem na lista, para os filtros de rota, motorista e veículo: [{ id, texto }] em ordem alfabética.
const opcoesUnicas = (viagens, idDe, textoDe) => {
  const vistas = {};
  for (const viagem of viagens) {
    const id = idDe(viagem);
    if (id && !vistas[id]) vistas[id] = textoDe(viagem);
  }
  const lista = Object.keys(vistas).map(id => ({ id, texto: vistas[id] }));
  return lista.sort((a, b) => a.texto.localeCompare(b.texto, 'pt-BR'));
};

export const opcoesDasViagens = viagens => ({
  rotas: opcoesUnicas(viagens, v => v.rota_id, v => v.rota_nome || 'Rota'),
  motoristas: opcoesUnicas(viagens, motoristaDa, motoristaDa),
  veiculos: opcoesUnicas(viagens, veiculoDa, veiculoDa),
});

export const filtrarViagens = (viagens, filtro, agora = new Date()) => {
  const resultado = [];
  for (const viagem of foraDaSituacao(viagens, filtro)) {
    const grupo = grupoDaViagem(viagem, agora);
    // Status desconhecido nunca some: melhor mostrar a mais do que esconder uma viagem.
    if (!grupo || filtro[grupo]) resultado.push(viagem);
  }
  return ordenarViagens(resultado, filtro.ordem);
};

export const contarViagens = (viagens, filtro, agora = new Date()) => {
  const total = { aIniciar: 0, emAndamento: 0, naoRealizadas: 0, canceladas: 0, finalizadas: 0 };
  for (const viagem of foraDaSituacao(viagens, filtro)) {
    const grupo = grupoDaViagem(viagem, agora);
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
