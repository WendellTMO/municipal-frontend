// Horário do dia para exibição: "07:30:00" ou "2026-10-22T07:30:00" -> "07:30".
// Cronômetros (tempo decorrido) ficam fora daqui e mantêm os segundos.
export const formatarHora = valor => {
  const texto = String(valor || '');
  if (texto.includes('T')) return texto.substring(11, 16);
  return texto.substring(0, 5) || '--:--';
};
