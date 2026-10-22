/**
 * Máscaras de campos de formulário. Todas aceitam texto qualquer e devolvem só o que
 * cabe no formato, então servem direto em onChangeText.
 */

export const onlyDigits = text => (text || '').replace(/\D/g, '');

// 000.000.000-00
export const formatCpf = text => {
  const digits = onlyDigits(text);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9, 11)}`;
};

// (83) 9999-9999 com 10 dígitos, (83) 99999-9999 com 11
export const formatPhone = text => {
  const digits = onlyDigits(text).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// 00000-000
export const formatCep = text => {
  const digits = onlyDigits(text).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// dd/mm/aaaa
export const formatDate = text => {
  const digits = onlyDigits(text).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

// ABC1D23: maiúsculas, sem símbolos, até 7 caracteres
export const formatPlaca = text =>
  (text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

// HH:mm
export const formatTime = text => {
  const digits = onlyDigits(text).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};
