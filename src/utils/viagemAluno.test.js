import { escolherViagemDeHoje, textoSaida } from './viagemAluno';

const agora = new Date(2026, 9, 22, 23, 30); // 22/10/2026 23:30 local, já é dia 23 em UTC
const hoje = '2026-10-22';

test('escolhe a viagem em andamento de hoje mesmo à noite (fuso local)', () => {
  const lista = [
    { id: 'a', data: hoje, status_viagem: 'AGENDADA' },
    { id: 'b', data: hoje, status_viagem: 'EM_ANDAMENTO' },
    { id: 'c', data: '2026-10-23', status_viagem: 'EM_ANDAMENTO' },
  ];
  expect(escolherViagemDeHoje(lista, agora).id).toBe('b');
});

test('finalizada e cancelada perdem para agendada', () => {
  const lista = [
    { id: 'a', data: hoje, status_viagem: 'FINALIZADA' },
    { id: 'b', data: hoje, status_viagem: 'AGENDADA' },
  ];
  expect(escolherViagemDeHoje(lista, agora).id).toBe('b');
  expect(escolherViagemDeHoje([lista[0]], agora).status_viagem).toBe('FINALIZADA');
});

test('sem viagem de hoje devolve null', () => {
  expect(escolherViagemDeHoje([{ data: '2026-10-21', status_viagem: 'AGENDADA' }], agora)).toBeNull();
  expect(escolherViagemDeHoje([], agora)).toBeNull();
});

test('texto de saída usa a hora de início', () => {
  expect(textoSaida({ horario_inicio: '06:32:00' })).toBe('Saiu 06:32');
});
