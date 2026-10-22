import {
  saudacao,
  primeiroNome,
  iniciais,
  dataCurta,
  linhaPerfil,
  periodoUltimosDias,
  isoLocal,
} from './saudacao';

const em = (h, min = 0) => new Date(2026, 9, 22, h, min); // quinta, 22/10/2026

test('saudação muda às 12:00 e às 18:00', () => {
  expect(saudacao(em(0, 0))).toBe('Bom dia');
  expect(saudacao(em(11, 59))).toBe('Bom dia');
  expect(saudacao(em(12, 0))).toBe('Boa tarde');
  expect(saudacao(em(17, 59))).toBe('Boa tarde');
  expect(saudacao(em(18, 0))).toBe('Boa noite');
  expect(saudacao(em(23, 59))).toBe('Boa noite');
});

test('primeiro nome e iniciais', () => {
  expect(primeiroNome('  Maria das Dores  ')).toBe('Maria');
  expect(primeiroNome('')).toBe('');
  expect(primeiroNome(undefined)).toBe('');
  expect(iniciais('Maria Dias')).toBe('MD');
  expect(iniciais('Ana Carla Bezerra')).toBe('AB');
  expect(iniciais('carlos')).toBe('C');
  expect(iniciais('')).toBe('?');
});

test('data curta em português', () => {
  expect(dataCurta(em(9))).toBe('qui, 22 out');
  expect(dataCurta(new Date(2026, 0, 3))).toBe('sáb, 3 jan');
});

test('linha de perfil com e sem município', () => {
  expect(linhaPerfil({ perfil: 'Gestor', municipio: 'Campina Grande', agora: em(9) })).toBe(
    'Gestor · Campina Grande · qui, 22 out',
  );
  expect(linhaPerfil({ perfil: 'Aluno', municipio: '', agora: em(9) })).toBe('Aluno · qui, 22 out');
});

test('período dos últimos 7 dias por extenso', () => {
  expect(periodoUltimosDias(7, new Date(2026, 9, 22))).toBe('De 15 de outubro a 22 de outubro de 2026');
  expect(periodoUltimosDias(7, new Date(2026, 0, 3))).toBe('De 27 de dezembro de 2025 a 3 de janeiro de 2026');
  expect(isoLocal(new Date(2026, 9, 5))).toBe('2026-10-05');
});
