import { inicioDaViagem, organizarViagens } from './viagensMotorista';

const viagem = (id, data, horario, status = 'AGENDADA', extra = {}) => ({ id, data, horario_inicio: horario, status, ...extra });
const agora = new Date(2026, 10, 3, 12, 0); // 3/nov 12:00

test('inicio junta data e horário, com horário simples ou ISO', () => {
  expect(inicioDaViagem(viagem('a', '2026-11-03', '06:00:00'))).toEqual(new Date(2026, 10, 3, 6, 0));
  expect(inicioDaViagem(viagem('a', '2026-11-03T00:00:00', '2026-11-03T06:30:00'))).toEqual(new Date(2026, 10, 3, 6, 30));
  expect(inicioDaViagem({ id: 'x' })).toBeNull();
});

test('a viagem das 6h não feita some quando a próxima está mais perto e vai para o histórico', () => {
  const seis = viagem('6h', '2026-11-03', '06:00:00');
  const treze = viagem('13h', '2026-11-03', '13:00:00');
  const { proxima, historico } = organizarViagens([seis, treze], agora);
  expect(proxima.id).toBe('13h');
  expect(historico.map(h => [h.viagem.id, h.situacao])).toEqual([['6h', 'nao_realizada']]);
});

test('sem outra mais perto, a viagem passada continua sendo a próxima', () => {
  const onze = viagem('11h', '2026-11-03', '11:30:00');
  const amanha = viagem('amanha', '2026-11-04', '06:00:00');
  const { proxima, historico } = organizarViagens([onze, amanha], agora);
  expect(proxima.id).toBe('11h');
  expect(historico).toEqual([]);
});

test('viagem em andamento é sempre a próxima', () => {
  const andamento = viagem('em', '2026-11-03', '05:00:00', 'EM_ANDAMENTO');
  const treze = viagem('13h', '2026-11-03', '13:00:00');
  expect(organizarViagens([treze, andamento], agora).proxima.id).toBe('em');
});

test('feita, feita sem app e cancelada entram no histórico, do mais recente ao mais antigo', () => {
  const lista = [
    viagem('f1', '2026-11-01', '07:00:00', 'FINALIZADA'),
    viagem('f2', '2026-11-02', '07:00:00', 'FINALIZADA', { realizada_sem_app: true }),
    viagem('c1', '2026-10-30', '07:00:00', 'CANCELADA'),
  ];
  const { proxima, historico } = organizarViagens(lista, agora);
  expect(proxima).toBeNull();
  expect(historico.map(h => [h.viagem.id, h.situacao])).toEqual([
    ['f2', 'feita_sem_app'],
    ['f1', 'feita'],
    ['c1', 'cancelada'],
  ]);
});

test('o histórico respeita o limite', () => {
  const lista = [];
  for (let i = 1; i <= 20; i++) lista.push(viagem('v' + i, '2026-10-' + String(i).padStart(2, '0'), '07:00:00', 'FINALIZADA'));
  expect(organizarViagens(lista, agora, 5).historico).toHaveLength(5);
});

test('proximas traz até 3 viagens depois da próxima, incluindo cancelada que ainda vai chegar', () => {
  const lista = [
    viagem('13h', '2026-11-03', '13:00:00'),
    viagem('17h', '2026-11-03', '17:30:00'),
    viagem('amanha', '2026-11-04', '06:00:00', 'CANCELADA'),
    viagem('depois', '2026-11-05', '06:00:00'),
    viagem('longe', '2026-11-10', '06:00:00'),
    viagem('6h', '2026-11-03', '06:00:00'),
    viagem('ontem', '2026-11-02', '06:00:00', 'CANCELADA'),
  ];
  const { proxima, proximas } = organizarViagens(lista, agora);
  expect(proxima.id).toBe('13h');
  expect(proximas.map(v => v.id)).toEqual(['17h', 'amanha', 'depois']);
});

test('proximas fica vazia quando só existe a próxima', () => {
  expect(organizarViagens([viagem('13h', '2026-11-03', '13:00:00')], agora).proximas).toEqual([]);
});
