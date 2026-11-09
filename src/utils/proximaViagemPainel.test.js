import { proximaViagemDoPainel, saidaAtrasada } from './proximaViagemPainel';

const agora = new Date(2026, 9, 28, 10, 0); // 28/10/2026 10:00 local
const v = (id, data, hora, status = 'AGENDADA') => ({
  id,
  data,
  horario_inicio: hora,
  status_viagem: status,
});

test('viagem de hoje já passada e agendada continua', () => {
  const passada = v('a', '2026-10-28', '09:30:00');
  expect(proximaViagemDoPainel([passada], agora)).toBe(passada);
  expect(saidaAtrasada(passada, agora)).toBe(true);
});

test('viagem de ontem agendada não entra', () => {
  expect(proximaViagemDoPainel([v('a', '2026-10-27', '09:30:00')], agora)).toBeNull();
});

test('viagem de hoje em andamento, finalizada ou cancelada com horário passado não entra', () => {
  const lista = [
    v('a', '2026-10-28', '08:00:00', 'EM_ANDAMENTO'),
    v('b', '2026-10-28', '07:00:00', 'FINALIZADA'),
    v('c', '2026-10-28', '06:00:00', 'CANCELADA'),
  ];
  expect(proximaViagemDoPainel(lista, agora)).toBeNull();
});

test('viagem futura continua como antes, qualquer status', () => {
  const futura = v('a', '2026-10-28', '11:00:00', 'EM_ANDAMENTO');
  expect(proximaViagemDoPainel([futura], agora)).toBe(futura);
  expect(saidaAtrasada(futura, agora)).toBe(false);
});

test('escolhe a mais próxima na ordem', () => {
  const lista = [
    v('amanha', '2026-10-29', '07:00:00'),
    v('tarde', '2026-10-28', '15:00:00'),
    v('passada', '2026-10-28', '09:00:00'),
  ];
  expect(proximaViagemDoPainel(lista, agora).id).toBe('passada');
  expect(proximaViagemDoPainel(lista.slice(0, 2), agora).id).toBe('tarde');
});

test('viagem sem horário de hoje agendada continua', () => {
  const semHora = v('a', '2026-10-28', null);
  expect(proximaViagemDoPainel([semHora], agora)).toBe(semHora);
});

test('lista vazia', () => {
  expect(proximaViagemDoPainel([], agora)).toBeNull();
});

test('atrasada cede lugar à seguinte depois do ponto médio entre as duas', () => {
  const lista = [v('seis', '2026-10-28', '06:00:00'), v('quatorze', '2026-10-28', '14:00:00')];
  // ponto médio: 10:00
  expect(proximaViagemDoPainel(lista, new Date(2026, 9, 28, 9, 59)).id).toBe('seis');
  expect(proximaViagemDoPainel(lista, new Date(2026, 9, 28, 10, 0)).id).toBe('quatorze');
});

test('sem viagem seguinte a atrasada continua', () => {
  const so = v('seis', '2026-10-28', '06:00:00');
  expect(proximaViagemDoPainel([so], new Date(2026, 9, 28, 20, 0))).toBe(so);
});

test('a seguinte também atrasada pode ceder a uma terceira', () => {
  const lista = [
    v('a', '2026-10-28', '06:00:00'),
    v('b', '2026-10-28', '08:00:00'),
    v('c', '2026-10-29', '07:00:00'),
  ];
  expect(proximaViagemDoPainel(lista, new Date(2026, 9, 28, 7, 30)).id).toBe('b');
  expect(proximaViagemDoPainel(lista, new Date(2026, 9, 28, 20, 0)).id).toBe('c');
});
