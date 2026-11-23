import {
  LEITURA_VALIDADE_MS,
  avisoSemCompartilhamento,
  corpoDoRelato,
  deveParar,
  leituraDeveSerEnviada,
} from './colaborativa';

test('erros de viagem e permissão encerram, erro de rede e de servidor não', () => {
  expect(deveParar(400)).toBe(true);
  expect(deveParar(403)).toBe(true);
  expect(deveParar(404)).toBe(true);
  expect(deveParar(500)).toBe(false);
  expect(deveParar(null)).toBe(false);
});

test('leitura velha ou ausente não é enviada', () => {
  expect(leituraDeveSerEnviada(null, 1000)).toBe(false);
  expect(leituraDeveSerEnviada({ em: 1000 }, 1000 + LEITURA_VALIDADE_MS)).toBe(true);
  expect(leituraDeveSerEnviada({ em: 1000 }, 1001 + LEITURA_VALIDADE_MS)).toBe(false);
});

test('o corpo do relato leva só posição e precisão', () => {
  const leitura = { latitude: -7.2, longitude: -35.9, precisao: 12, em: 5 };
  expect(corpoDoRelato(leitura)).toEqual({ latitude: -7.2, longitude: -35.9, precisao: 12 });
});

test('avisa que ninguém compartilha só quando não há ninguém nem sinal recente', () => {
  const base = { ativa: true, compartilhando: 0, eu_compartilhando: false, sinal_ha_segundos: null };
  expect(avisoSemCompartilhamento(base)).toMatch(/Ninguém/);
  expect(avisoSemCompartilhamento({ ...base, compartilhando: 2 })).toBe('');
  expect(avisoSemCompartilhamento({ ...base, eu_compartilhando: true })).toBe('');
  expect(avisoSemCompartilhamento({ ...base, sinal_ha_segundos: 30 })).toBe('');
  expect(avisoSemCompartilhamento({ ...base, sinal_ha_segundos: 300 })).toMatch(/Ninguém/);
  expect(avisoSemCompartilhamento({ ativa: false })).toBe('');
  expect(avisoSemCompartilhamento(null)).toBe('');
});
