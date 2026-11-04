import { contarPorGrupo, filtrarHistorico, filtroPadrao } from './filtroHistorico';

const itens = [
  { viagem: { id: 'a' }, situacao: 'feita' },
  { viagem: { id: 'b' }, situacao: 'feita_sem_app' },
  { viagem: { id: 'c' }, situacao: 'cancelada' },
  { viagem: { id: 'd' }, situacao: 'nao_realizada' },
];

test('por padrão as viagens feitas ficam escondidas', () => {
  expect(filtrarHistorico(itens, filtroPadrao()).map(i => i.viagem.id)).toEqual(['c', 'd']);
});

test('ligar Feitas traz as feitas e as feitas sem o app, na mesma ordem', () => {
  const filtro = { ...filtroPadrao(), feitas: true };
  expect(filtrarHistorico(itens, filtro).map(i => i.viagem.id)).toEqual(['a', 'b', 'c', 'd']);
});

test('tudo desligado não mostra nada', () => {
  expect(filtrarHistorico(itens, { naoRealizadas: false, canceladas: false, feitas: false })).toEqual([]);
});

test('conta por grupo', () => {
  expect(contarPorGrupo(itens)).toEqual({ naoRealizadas: 1, canceladas: 1, feitas: 2 });
});
