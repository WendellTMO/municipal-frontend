import { formatarSentido } from './formatarSentido';

test('normaliza as formas conhecidas', () => {
  expect(formatarSentido('IDA')).toBe('Ida');
  expect(formatarSentido('VOLTA')).toBe('Volta');
  expect(formatarSentido('SentidoViagem.IDA')).toBe('Ida');
  expect(formatarSentido('SentidoViagem.VOLTA')).toBe('Volta');
  expect(formatarSentido('ida')).toBe('Ida');
  expect(formatarSentido(' volta ')).toBe('Volta');
  expect(formatarSentido('CIRCULAR')).toBe('Circular');
});

test('outro valor volta como veio e vazio vira texto vazio', () => {
  expect(formatarSentido('Especial')).toBe('Especial');
  expect(formatarSentido(null)).toBe('');
  expect(formatarSentido(undefined)).toBe('');
});
