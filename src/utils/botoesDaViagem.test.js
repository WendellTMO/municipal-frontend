import { MEDIDAS_DOS_BOTOES, ROTULOS_DOS_BOTOES } from './botoesDaViagem';

test('os quatro botões têm rótulo curto, que cabe em 84 px', () => {
  expect(Object.keys(ROTULOS_DOS_BOTOES)).toHaveLength(4);
  for (const rotulo of Object.values(ROTULOS_DOS_BOTOES)) expect(rotulo.length).toBeLessThanOrEqual(8);
});

test('botão de 52 px e Finalizar de 68 px, o maior botão da tela', () => {
  expect(MEDIDAS_DOS_BOTOES.botao).toBe(52);
  expect(MEDIDAS_DOS_BOTOES.finalizar).toBeGreaterThan(MEDIDAS_DOS_BOTOES.botao);
});
