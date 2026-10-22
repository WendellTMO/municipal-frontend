import {
  onlyDigits,
  formatCpf,
  formatPhone,
  formatCep,
  formatDate,
  formatPlaca,
  formatTime,
} from './masks';

test('onlyDigits', () => {
  expect(onlyDigits('(83) 99999-9999')).toBe('83999999999');
  expect(onlyDigits(undefined)).toBe('');
});

test('formatCpf', () => {
  expect(formatCpf('123')).toBe('123');
  expect(formatCpf('1234')).toBe('123.4');
  expect(formatCpf('1234567')).toBe('123.456.7');
  expect(formatCpf('12345678901')).toBe('123.456.789-01');
  expect(formatCpf('123456789012345')).toBe('123.456.789-01');
  expect(formatCpf('123.456.789-01')).toBe('123.456.789-01');
});

test('formatPhone', () => {
  expect(formatPhone('8')).toBe('8');
  expect(formatPhone('83999')).toBe('(83) 999');
  expect(formatPhone('8399999999')).toBe('(83) 9999-9999');
  expect(formatPhone('83999999999')).toBe('(83) 99999-9999');
  expect(formatPhone('839999999999999')).toBe('(83) 99999-9999');
});

test('formatCep', () => {
  expect(formatCep('58100')).toBe('58100');
  expect(formatCep('58100001')).toBe('58100-001');
  expect(formatCep('581000019')).toBe('58100-001');
});

test('formatDate', () => {
  expect(formatDate('1')).toBe('1');
  expect(formatDate('0105')).toBe('01/05');
  expect(formatDate('01052000')).toBe('01/05/2000');
});

test('formatPlaca', () => {
  expect(formatPlaca('abc-1d23')).toBe('ABC1D23');
  expect(formatPlaca('abc1234567')).toBe('ABC1234');
});

test('formatTime', () => {
  expect(formatTime('0')).toBe('0');
  expect(formatTime('063')).toBe('06:3');
  expect(formatTime('0630')).toBe('06:30');
  expect(formatTime('06:30')).toBe('06:30');
});
