import { medidasDosBotoes, variantePermitida, ROTULOS_DOS_BOTOES } from './botoesDaViagem';

test('valor desconhecido ou ausente cai na variante B', () => {
  expect(variantePermitida(undefined)).toBe('B');
  expect(variantePermitida(null)).toBe('B');
  expect(variantePermitida('Z')).toBe('B');
  expect(variantePermitida('C')).toBe('C');
});

test('C é mais baixa que B em botão, linha da parada e soma do painel', () => {
  const b = medidasDosBotoes('B');
  const c = medidasDosBotoes('C');
  expect(c.botao).toBeLessThan(b.botao);
  expect(c.iconeProxima).toBeLessThan(b.iconeProxima);
  // Painel (parada + botões + Finalizar), sem o rótulo, que é igual nas duas.
  expect(c.iconeProxima + c.botao + c.finalizar).toBeLessThan(b.iconeProxima + b.botao + b.finalizar);
});

test('os quatro botões têm rótulo curto, que cabe em 84 px', () => {
  for (const rotulo of Object.values(ROTULOS_DOS_BOTOES)) expect(rotulo.length).toBeLessThanOrEqual(8);
});
