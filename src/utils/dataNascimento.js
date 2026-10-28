// Idade em anos a partir de "dd/mm/aaaa" (ou só dígitos). null se incompleta ou inválida.
export const calcAge = rawDate => {
  const digits = rawDate.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10) - 1;
  const year = parseInt(digits.slice(4, 8), 10);
  const birth = new Date(year, month, day);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
};

// "dd/mm/aaaa" para "aaaa-mm-dd". null se incompleta.
export const toIsoDate = rawDate => {
  const digits = rawDate.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
};
