import { contarViagens, filtrarViagens, filtroViagensPadrao } from './filtroViagens';

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

test('desligar A iniciar esconde agendadas e em andamento', () => {
  const filtro = { aIniciar: false, canceladas: true, finalizadas: true };
  expect(filtrarViagens(viagens, filtro).map(v => v.id)).toEqual(['c', 'd', 'e']);
});

test('conta por grupo', () => {
  expect(contarViagens(viagens)).toEqual({ aIniciar: 2, canceladas: 1, finalizadas: 1 });
});
