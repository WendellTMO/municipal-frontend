import { canceladaPeloPrazo } from './canceladaPeloPrazo';

const MOTIVO = 'Não realizada: passaram 24 horas da saída sem a viagem começar';

test('reconhece a viagem cancelada pelo servidor depois de 24 horas', () => {
  expect(canceladaPeloPrazo({ status: 'CANCELADA', motivo_cancelamento: MOTIVO })).toBe(true);
});

test('cancelamento de verdade, outro status ou sem viagem não conta', () => {
  expect(canceladaPeloPrazo({ status: 'CANCELADA', motivo_cancelamento: 'Ônibus quebrou' })).toBe(false);
  expect(canceladaPeloPrazo({ status: 'CANCELADA', motivo_cancelamento: null })).toBe(false);
  expect(canceladaPeloPrazo({ status: 'AGENDADA', motivo_cancelamento: MOTIVO })).toBe(false);
  expect(canceladaPeloPrazo(null)).toBe(false);
});
