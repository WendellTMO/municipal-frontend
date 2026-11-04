import {
  contarViagens,
  duracaoDaViagem,
  filtrarViagens,
  filtroAtivo,
  filtroViagensPadrao,
  formatarDuracao,
  lerDataDigitada,
  ordenarViagens,
  periodoRapido,
  opcoesDasViagens,
} from './filtroViagens';

const viagens = [
  { id: 'a', status: 'AGENDADA' },
  { id: 'b', status: 'EM_ANDAMENTO' },
  { id: 'c', status: 'CANCELADA' },
  { id: 'd', status: 'FINALIZADA' },
  { id: 'e', status: 'OUTRA' },
];

test('por padrão as finalizadas ficam escondidas e a ordem se mantém', () => {
  expect(filtrarViagens(viagens, filtroViagensPadrao()).map(v => v.id)).toEqual(['a', 'b', 'c', 'e']);
});

test('ligar Finalizadas traz todas', () => {
  const filtro = { ...filtroViagensPadrao(), finalizadas: true };
  expect(filtrarViagens(viagens, filtro).map(v => v.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('desligar A iniciar esconde só as agendadas que ainda vão sair', () => {
  const filtro = { ...filtroViagensPadrao(), aIniciar: false, finalizadas: true };
  expect(filtrarViagens(viagens, filtro).map(v => v.id)).toEqual(['b', 'c', 'd', 'e']);
});

test('conta por grupo', () => {
  expect(contarViagens(viagens)).toEqual({ aIniciar: 1, emAndamento: 1, naoRealizadas: 0, canceladas: 1, finalizadas: 1 });
});

const comDatas = [
  { id: 'a', status: 'AGENDADA', data: '2026-11-03' },
  { id: 'b', status: 'AGENDADA', data: '2026-11-10' },
  { id: 'c', status: 'CANCELADA', data: '2026-11-20' },
];

test('lê data do navegador e data digitada, e recusa dia que não existe', () => {
  expect(lerDataDigitada('2026-11-04').getDate()).toBe(4);
  expect(lerDataDigitada('04/11/2026').getMonth()).toBe(10);
  expect(lerDataDigitada('31/02/2026')).toBeNull();
  expect(lerDataDigitada('04/11')).toBeNull();
  expect(lerDataDigitada('')).toBeNull();
});

test('período De e Até inclui os dois dias das pontas', () => {
  const filtro = { ...filtroViagensPadrao(), de: '2026-11-10', ate: '20/11/2026' };
  expect(filtrarViagens(comDatas, filtro).map(v => v.id)).toEqual(['c', 'b']);
});

test('só De ou só Até também funciona e data incompleta é ignorada', () => {
  expect(filtrarViagens(comDatas, { ...filtroViagensPadrao(), ate: '2026-11-03' }).map(v => v.id)).toEqual(['a']);
  expect(filtrarViagens(comDatas, { ...filtroViagensPadrao(), de: '10/1' }).map(v => v.id)).toEqual(['c', 'b', 'a']);
});

test('a contagem dos botões respeita o período', () => {
  const filtro = { ...filtroViagensPadrao(), de: '2026-11-10' };
  expect(contarViagens(comDatas, filtro, new Date(2026, 10, 4))).toEqual({ aIniciar: 1, emAndamento: 0, naoRealizadas: 0, canceladas: 1, finalizadas: 0 });
});

test('atalhos de período', () => {
  const hoje = new Date(2026, 10, 4);
  expect(periodoRapido('hoje', hoje)).toEqual({ de: '2026-11-04', ate: '2026-11-04' });
  expect(periodoRapido('semana', hoje)).toEqual({ de: '2026-11-04', ate: '2026-11-10' });
  expect(periodoRapido('mes', hoje)).toEqual({ de: '2026-11-01', ate: '2026-11-30' });
});

test('filtro ativo só quando difere do padrão', () => {
  expect(filtroAtivo(filtroViagensPadrao())).toBe(false);
  expect(filtroAtivo({ ...filtroViagensPadrao(), de: '2026-11-01' })).toBe(true);
  expect(filtroAtivo({ ...filtroViagensPadrao(), finalizadas: true })).toBe(true);
});

const completas = [
  { id: 'a', status: 'FINALIZADA', tipo: 'IDA', rota_id: 'r1', rota_nome: 'Galante', data: '2026-11-01', horario_inicio: '07:00', inicio_real: '2026-11-01T10:00:00Z', horario_fim: '2026-11-01T10:40:00Z' },
  { id: 'b', status: 'FINALIZADA', tipo: 'VOLTA', rota_id: 'r1', rota_nome: 'Galante', data: '2026-11-02', horario_inicio: '17:00', inicio_real: '2026-11-02T20:00:00Z', horario_fim: '2026-11-02T21:05:00Z' },
  { id: 'c', status: 'AGENDADA', tipo: 'IDA', rota_id: 'r2', rota_nome: 'Centro', data: '2026-11-03', horario_inicio: '07:00' },
];
const todas = { ...filtroViagensPadrao(), finalizadas: true };

test('filtra por sentido', () => {
  expect(filtrarViagens(completas, { ...todas, tipo: 'VOLTA' }).map(v => v.id)).toEqual(['b']);
  expect(filtrarViagens(completas, { ...todas, tipo: 'IDA' }).map(v => v.id)).toEqual(['c', 'a']);
});

test('filtra por rota e a contagem acompanha', () => {
  expect(filtrarViagens(completas, { ...todas, rota: 'r2' }).map(v => v.id)).toEqual(['c']);
  expect(contarViagens(completas, { ...todas, rota: 'r1' }, new Date(2026, 10, 4))).toEqual({ aIniciar: 0, emAndamento: 0, naoRealizadas: 0, canceladas: 0, finalizadas: 2 });
});

test('ordena por data e pela duração medida, sem duração vai para o fim', () => {
  expect(ordenarViagens(completas, 'recentes').map(v => v.id)).toEqual(['c', 'b', 'a']);
  expect(ordenarViagens(completas, 'antigas').map(v => v.id)).toEqual(['a', 'b', 'c']);
  expect(ordenarViagens(completas, 'longas').map(v => v.id)).toEqual(['b', 'a', 'c']);
  expect(ordenarViagens(completas, 'curtas').map(v => v.id)).toEqual(['a', 'b', 'c']);
});

test('duração: só com início e fim reais, e texto em minutos ou horas', () => {
  expect(duracaoDaViagem(completas[0])).toBe(40 * 60000);
  expect(duracaoDaViagem(completas[2])).toBeNull();
  expect(formatarDuracao(40 * 60000)).toBe('40 min');
  expect(formatarDuracao(65 * 60000)).toBe('1 h 05 min');
});

test('lista as rotas sem repetir', () => {
  expect(opcoesDasViagens(completas).rotas).toEqual([{ id: 'r2', texto: 'Centro' }, { id: 'r1', texto: 'Galante' }]);
});

test('sentido, rota e ordem acendem o funil', () => {
  expect(filtroAtivo({ ...filtroViagensPadrao(), tipo: 'IDA' })).toBe(true);
  expect(filtroAtivo({ ...filtroViagensPadrao(), rota: 'r1' })).toBe(true);
  expect(filtroAtivo({ ...filtroViagensPadrao(), ordem: 'longas' })).toBe(true);
});

const agora = new Date(2026, 10, 4, 12, 0);
const doDia = [
  { id: 'x', status: 'AGENDADA', data: '2026-11-04', horario_inicio: '07:00', motorista_nome: 'João da Silva', veiculo_placa: 'ABC1D23', alunos_confirmados_count: 0, total_alunos: 5, rota_nome: 'São José' },
  { id: 'y', status: 'AGENDADA', data: '2026-11-04', horario_inicio: '18:00', motorista_nome: 'Maria', veiculo_placa: 'XYZ9K88', alunos_confirmados_count: 12, total_alunos: 20, rota_nome: 'Centro' },
  { id: 'z', status: 'CANCELADA', data: '2026-11-05', horario_inicio: '07:00', motorista_nome: 'Maria', veiculo_placa: 'XYZ9K88', alunos_confirmados_count: 3, total_alunos: 20, rota_nome: 'Centro', motivo_cancelamento: 'Ônibus quebrou' },
];

test('agendada que já passou do horário vira não realizada', () => {
  expect(contarViagens(doDia, filtroViagensPadrao(), agora)).toEqual({ aIniciar: 1, emAndamento: 0, naoRealizadas: 1, canceladas: 1, finalizadas: 0 });
  const semAtrasadas = { ...filtroViagensPadrao(), naoRealizadas: false };
  expect(filtrarViagens(doDia, semAtrasadas, agora).map(v => v.id)).toEqual(['z', 'y']);
});

test('busca ignora acento e maiúscula e olha rota, motorista, placa e motivo', () => {
  const com = busca => filtrarViagens(doDia, { ...filtroViagensPadrao(), busca }, agora).map(v => v.id);
  expect(com('sao jose')).toEqual(['x']);
  expect(com('JOAO')).toEqual(['x']);
  expect(com('xyz9')).toEqual(['z', 'y']);
  expect(com('quebrou')).toEqual(['z']);
  expect(com('zzz')).toEqual([]);
});

test('filtra por motorista, veículo e alunos confirmados', () => {
  const com = parcial => filtrarViagens(doDia, { ...filtroViagensPadrao(), ...parcial }, agora).map(v => v.id);
  expect(com({ motorista: 'Maria' })).toEqual(['z', 'y']);
  expect(com({ veiculo: 'ABC1D23' })).toEqual(['x']);
  expect(com({ alunos: 'nenhum' })).toEqual(['x']);
  expect(com({ alunos: 'algum' })).toEqual(['z', 'y']);
  expect(com({ alunos: 'muitos' })).toEqual(['y']);
});

test('ordena por mais alunos confirmados', () => {
  expect(ordenarViagens(doDia, 'alunos').map(v => v.id)).toEqual(['y', 'z', 'x']);
});

test('viagem sem motorista entra como Sem Motorista nas opções', () => {
  const opcoes = opcoesDasViagens([{ id: 'a', status: 'AGENDADA' }, ...doDia]);
  expect(opcoes.motoristas.map(o => o.id)).toEqual(['João da Silva', 'Maria', 'Sem Motorista']);
});

test('mês passado no atalho de período', () => {
  expect(periodoRapido('mesPassado', new Date(2026, 0, 15))).toEqual({ de: '2025-12-01', ate: '2025-12-31' });
});
