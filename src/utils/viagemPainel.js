// Situação de uma viagem na lista "Hoje" do painel do gestor.
const SEM_MOTORISTA = ['', 'Sem Motorista'];
const SEM_VEICULO = ['', 'Sem Veículo'];

export const hojeLocal = (agora = new Date()) => {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
};

export const ehDeHoje = (viagem, agora = new Date()) =>
  String(viagem?.data || '').split('T')[0] === hojeLocal(agora);

export const situacaoViagem = viagem => {
  const semMotorista = SEM_MOTORISTA.includes(viagem?.motorista_nome || '');
  const semVeiculo = SEM_VEICULO.includes(viagem?.veiculo_placa || '');
  const status = viagem?.status;

  let aviso = null;
  if (status === 'AGENDADA' || status === 'EM_ANDAMENTO') {
    if (semMotorista) aviso = 'Sem motorista';
    else if (semVeiculo) aviso = 'Sem veículo';
  }
  if (aviso) return { selo: 'Atenção', tom: 'vermelho', aviso };
  if (status === 'EM_ANDAMENTO') return { selo: 'Em andamento', tom: 'verde', aviso: null };
  if (status === 'AGENDADA') return { selo: 'Agendada', tom: 'azul', aviso: null };
  if (status === 'FINALIZADA') return { selo: 'Concluída', tom: 'cinza', aviso: null };
  if (status === 'CANCELADA') return { selo: 'Cancelada', tom: 'cinza', aviso: null };
  return { selo: '', tom: 'cinza', aviso: null };
};

// "07:30:00" ou "2026-10-22T07:30:00" -> "07:30"
export const horaCurta = valor => {
  const texto = String(valor || '');
  if (texto.includes('T')) return texto.substring(11, 16);
  return texto.substring(0, 5) || '--:--';
};

export const ordenarPorHorario = viagens =>
  [...viagens].sort((a, b) => horaCurta(a.horario_inicio).localeCompare(horaCurta(b.horario_inicio)));
