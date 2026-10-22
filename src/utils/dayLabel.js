const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const pad2 = n => String(n).padStart(2, '0');

// "2026-10-27" ou "2026-10-27T08:00:00" -> HOJE, AMANHÃ ou "SEG 27/10".
export const dayLabel = (dateStr, now = new Date()) => {
  if (!dateStr) return '';
  const [ano, mes, dia] = String(dateStr).split('T')[0].split('-').map(Number);
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diferencaDias = Math.round((alvo - hoje) / 86400000);
  if (diferencaDias === 0) return 'HOJE';
  if (diferencaDias === 1) return 'AMANHÃ';
  return `${DIAS[alvo.getDay()]} ${pad2(dia)}/${pad2(mes)}`;
};
