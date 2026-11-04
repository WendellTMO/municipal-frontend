import { contarViagens, filtrarViagens, filtroAtivo, filtroViagensPadrao, lerDataDigitada, periodoRapido } from './filtroViagens';

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
  const filtro = { ...filtroViagensPadrao(), aIniciar: false, finalizadas: true };
  expect(filtrarViagens(viagens, filtro).map(v => v.id)).toEqual(['c', 'd', 'e']);
});

test('conta por grupo', () => {
  expect(contarViagens(viagens)).toEqual({ aIniciar: 2, canceladas: 1, finalizadas: 1 });
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
  expect(filtrarViagens(comDatas, filtro).map(v => v.id)).toEqual(['b', 'c']);
});

test('só De ou só Até também funciona e data incompleta é ignorada', () => {
  expect(filtrarViagens(comDatas, { ...filtroViagensPadrao(), ate: '2026-11-03' }).map(v => v.id)).toEqual(['a']);
  expect(filtrarViagens(comDatas, { ...filtroViagensPadrao(), de: '10/1' }).map(v => v.id)).toEqual(['a', 'b', 'c']);
});

test('a contagem dos botões respeita o período', () => {
  const filtro = { ...filtroViagensPadrao(), de: '2026-11-10' };
  expect(contarViagens(comDatas, filtro)).toEqual({ aIniciar: 1, canceladas: 1, finalizadas: 0 });
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
