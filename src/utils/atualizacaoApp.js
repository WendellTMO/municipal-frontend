/**
 * Decisão de atualização do app avulso (APK). Funções puras: nenhuma lança erro,
 * qualquer dado incompleto ou inválido resulta em "nenhuma".
 */

export const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;

// Aceita inteiro ou texto numérico ("12"). Qualquer outra coisa vira null.
const paraInteiro = valor => {
  if (typeof valor === 'number' && Number.isInteger(valor)) return valor;
  if (typeof valor === 'string' && /^\d+$/.test(valor.trim())) return parseInt(valor.trim(), 10);
  return null;
};

// instalado: versionCode instalado (número ou texto). remoto: JSON do servidor.
export const decidirAtualizacao = (instalado, remoto) => {
  const atual = paraInteiro(instalado);
  if (atual === null || !remoto || typeof remoto !== 'object') return 'nenhuma';

  const minimo = paraInteiro(remoto.minVersionCode);
  if (minimo !== null && atual < minimo) return 'obrigatoria';

  const novo = paraInteiro(remoto.versionCode);
  if (novo !== null && novo > atual) return 'opcional';

  return 'nenhuma';
};

// Só abre endereço https vindo do servidor.
export const apkUrlSegura = remoto => {
  const url = remoto && remoto.apkUrl;
  return typeof url === 'string' && /^https:\/\/\S+$/.test(url) ? url : null;
};

// Até 5 notas, só textos não vazios.
export const notasDaVersao = remoto => {
  const notas = remoto && remoto.notas;
  const resultado = [];
  if (!Array.isArray(notas)) return resultado;
  for (const nota of notas) {
    if (typeof nota === 'string' && nota.trim() !== '' && resultado.length < 5) {
      resultado.push(nota.trim());
    }
  }
  return resultado;
};

// Origem da API: o API_URL sem a barra final e sem o /v1.
export const urlArquivoVersao = baseUrl => {
  const origem = String(baseUrl).replace(/\/+$/, '').replace(/\/v1$/, '');
  return `${origem}/app-version.json`;
};

// Consulta no máximo a cada 6 h, exceto quando a última resposta foi obrigatória.
export const deveConsultar = (ultima, agora) => {
  if (!ultima || typeof ultima.em !== 'number') return true;
  if (ultima.decisao === 'obrigatoria') return true;
  const passou = agora - ultima.em;
  return passou < 0 || passou >= SEIS_HORAS_MS;
};
