// Arrays em português: Intl não é confiável no Hermes.
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Bom dia até 11:59, Boa tarde até 17:59, Boa noite depois.
export const saudacao = (agora = new Date()) => {
  const hora = agora.getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const primeiroNome = nome => {
  const partes = (nome || '').trim().split(/\s+/);
  return partes[0] || '';
};

// Primeira letra do primeiro e do último nome: "Ana Carla Bezerra" -> "AB".
export const iniciais = nome => {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

// "qua, 22 out"
export const dataCurta = (agora = new Date()) =>
  `${DIAS[agora.getDay()]}, ${agora.getDate()} ${MESES[agora.getMonth()]}`;

// "Gestor · Campina Grande · qua, 22 out" (município só quando existir)
export const linhaPerfil = ({ perfil, municipio, agora = new Date() }) => {
  const partes = [perfil];
  if (municipio) partes.push(municipio);
  partes.push(dataCurta(agora));
  return partes.join(' · ');
};

const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// "22 de outubro de 2026"
export const dataPorExtenso = data =>
  `${data.getDate()} de ${MESES_LONGOS[data.getMonth()]} de ${data.getFullYear()}`;

// Últimos 7 dias, por extenso: "De 15 de outubro a 22 de outubro de 2026"
export const periodoUltimosDias = (dias = 7, agora = new Date()) => {
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - dias);
  const fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const mesmoAno = inicio.getFullYear() === fim.getFullYear();
  const textoInicio = mesmoAno
    ? `${inicio.getDate()} de ${MESES_LONGOS[inicio.getMonth()]}`
    : dataPorExtenso(inicio);
  return `De ${textoInicio} a ${dataPorExtenso(fim)}`;
};

// "2026-10-22" para a API
export const isoLocal = data => {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
};
