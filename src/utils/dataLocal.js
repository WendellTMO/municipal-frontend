// Data só com dia ("2026-10-28") é local. `new Date("2026-10-28")` seria meia-noite UTC,
// que no Brasil cai no dia anterior. Timestamps completos seguem como o JS interpreta.
const SO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

export const dataLocal = valor => {
  const texto = String(valor ?? '').trim();
  const partes = SO_DIA.exec(texto);
  if (partes) return new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  return new Date(texto);
};

// "2026-10-28" ou timestamp -> "28/10/2026". Vazio se inválida.
export const formatarData = valor => {
  if (!valor) return '';
  const data = dataLocal(valor);
  if (isNaN(data.getTime())) return '';
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
};
